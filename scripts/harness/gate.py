#!/usr/bin/env python3
"""The harness gate runner. One implementation for the assistant hooks and for CI.

  gate.py hook pre|post                 reads a tool-hook payload on stdin
  gate.py ci --base REF [--head REF]    checks the commits and the diff of a pull request
  gate.py status [--json]               prints each gate's mode, the active spec and its phases
  gate.py approve PHASE --approver NAME [--spec ID] [--notes TEXT]
                                        a person approves the artifact a phase starts from

Each gate has a mode in .specify/sdd-speckit.json -> harness.gates: off, warn or block.
  warn   reports and lets the change through
  block  refuses the tool call (hook) or fails the job (ci)

A hook never blocks on something it cannot read: a bad payload, a missing config or an internal
error lets the tool call through. These gates catch accidents. They are not a security boundary.
Reference: docs/HARNESS.md.
"""
import sys

sys.dont_write_bytecode = True  # a __pycache__ inside the vendored copy would look like drift

import argparse
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMEWORK = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "hooks"))

CONFIG = ".specify/sdd-speckit.json"
CONSTITUTION = ".specify/memory/constitution.md"
UNLOCK = ".specify/.constitution-unlock"
ACTIVE_SPEC = ".specify/.active-spec"
LOG = ".specify/harness-log.jsonl"
PRAGMA = "sdd-allow-secret"
SPEC_DIR = re.compile(r"^\d{3}-[a-z0-9][a-z0-9-]*$")
TASK_ROW = re.compile(r"^\|\s*T\d{3}\s*\|", re.MULTILINE)

CONSTITUTION_HELP = """\
That file is the project constitution. Every other phase is checked against it, so a direct edit
would change the rules with no version bump and no amendment-log entry.

Amend it through the constitution phase: /sdd-speckit:speckit.constitution in Claude Code, or
/sdd-speckit-constitution in GitHub Copilot. That phase bumps the version, records the change in
Article V, and reports which existing artifacts the amendment now conflicts with.

The phase takes the unlock marker itself:
  mkdir -p .specify/memory && touch .specify/.constitution-unlock
  # write the file
  rm -f .specify/.constitution-unlock"""


# ----------------------------------------------------------------- config

def read_json(path, fallback=None):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return fallback


DEFS = read_json(os.path.join(HERE, "gates.json"), {}) or {}
GATE_IDS = [g["id"] for g in DEFS.get("gates", [])]


def find_root(start):
    """The nearest ancestor that holds .specify/ or .git; the start directory when none does."""
    cur = os.path.abspath(start)
    while True:
        if os.path.isdir(os.path.join(cur, ".specify")) or os.path.exists(os.path.join(cur, ".git")):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return os.path.abspath(start)
        cur = parent


def load_config(root):
    """-> the harness block, with every default filled in. A project that never chose gates gets
    the 0.2 behaviour: the constitution guard, and nothing else."""
    record = read_json(os.path.join(root, CONFIG), {}) or {}
    harness = record.get("harness") or {}
    globs = DEFS.get("globs", {})
    gates = dict(DEFS.get("defaults", {}).get("migrated", {}))
    for gid, mode in (harness.get("gates") or {}).items():
        if gid in GATE_IDS and mode in DEFS.get("modes", []):
            gates[gid] = mode
    sensitive = []
    industry = record.get("industry")
    if industry and industry != "none":
        profile = read_json(os.path.join(FRAMEWORK, "profiles", "industries", industry, "profile.json"), {}) or {}
        sensitive = (profile.get("harness") or {}).get("sensitivePatterns", [])
    return {
        "gates": gates,
        "configured": bool(harness.get("gates")),
        "sourceGlobs": harness.get("sourceGlobs") or globs.get("source", []),
        "testGlobs": harness.get("testGlobs") or globs.get("test", []),
        "exemptGlobs": harness.get("exemptGlobs") or globs.get("exempt", []),
        "commands": harness.get("commands") or {},
        "secretsAllow": harness.get("secretsAllow") or [],
        "destructiveAllow": harness.get("destructiveAllow") or [],
        "gitleaks": harness.get("gitleaks") if harness.get("gitleaks") in DEFS.get("gitleaksModes", []) else "auto",
        "patterns": list(DEFS.get("secretPatterns", [])) + list(sensitive),
        "industry": industry or "none",
    }


# ------------------------------------------------------------------ globs

_GLOB_CACHE = {}


def glob_regex(glob):
    if glob not in _GLOB_CACHE:
        out, i = [], 0
        while i < len(glob):
            if glob.startswith("**/", i):
                out.append("(?:.*/)?")
                i += 3
            elif glob.startswith("**", i):
                out.append(".*")
                i += 2
            elif glob[i] == "*":
                out.append("[^/]*")
                i += 1
            elif glob[i] == "?":
                out.append("[^/]")
                i += 1
            else:
                out.append(re.escape(glob[i]))
                i += 1
        _GLOB_CACHE[glob] = re.compile("^" + "".join(out) + "$")
    return _GLOB_CACHE[glob]


def matches(rel, globs):
    return any(glob_regex(g).match(rel) for g in globs)


def classify(rel, cfg):
    """-> "test", "exempt", "source" or "other" for a repository-relative posix path."""
    if matches(rel, cfg["testGlobs"]):
        return "test"
    if matches(rel, cfg["exemptGlobs"]):
        return "exempt"
    if matches(rel, cfg["sourceGlobs"]):
        return "source"
    return "other"


def relative(root, path):
    """Repository-relative posix path, or None when the path is outside the project."""
    try:
        rel = os.path.relpath(os.path.realpath(path), os.path.realpath(root))
    except ValueError:
        return None
    if rel.startswith(".."):
        return None
    return rel.replace(os.sep, "/")


# -------------------------------------------------------------------- git

def git(root, *args, timeout=10):
    # core.quotePath=false keeps non-ASCII names unquoted in --name-only lists and diff headers.
    try:
        r = subprocess.run(["git", "-C", root, "-c", "core.quotePath=false", *args], capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.SubprocessError):
        return None
    return r.stdout if r.returncode == 0 else None


def default_base(root):
    for ref in ("origin/HEAD", "origin/main", "origin/master", "main", "master"):
        if git(root, "rev-parse", "--verify", "--quiet", ref) is not None:
            base = git(root, "merge-base", "HEAD", ref)
            if base:
                return base.strip()
    return None


def lines(text):
    return [l for l in (text or "").split("\n") if l.strip()]


# ------------------------------------------------------------ active spec

def spec_from_name(root, name):
    name = (name or "").strip().strip("/")
    if name.startswith("specs/"):
        name = name[len("specs/"):]
    name = name.split("/")[-1]
    if SPEC_DIR.match(name) and os.path.isdir(os.path.join(root, "specs", name)):
        return name
    return None


def active_spec(root, changed=None, base=None, head="HEAD"):
    """-> (spec directory name or None, how it was found).

    There is no "newest spec" fallback on purpose: it would pass every edit after the first spec.
    specs/_baseline/ never counts, because a baseline describes code that already exists.
    """
    try:
        with open(os.path.join(root, ACTIVE_SPEC), encoding="utf-8") as fh:
            found = spec_from_name(root, fh.read())
        if found:
            return found, ACTIVE_SPEC
    except OSError:
        pass

    for source, name in (("GITHUB_HEAD_REF", os.environ.get("GITHUB_HEAD_REF")),
                         ("git branch", (git(root, "rev-parse", "--abbrev-ref", "HEAD") or "").strip())):
        found = spec_from_name(root, name)
        if found:
            return found, source

    touched = sorted({p.split("/")[1] for p in (changed or []) if p.startswith("specs/") and p.count("/") >= 2})
    touched = [t for t in touched if spec_from_name(root, t)]
    if len(touched) == 1:
        return touched[0], "the one spec directory this change touches"

    if base:
        log = git(root, "log", "--format=%B", "%s..%s" % (base, head)) or ""
        for m in re.finditer(r"^Spec:\s*(\S+)\s*$", log, re.MULTILINE):
            found = spec_from_name(root, m.group(1))
            if found:
                return found, "a Spec: commit trailer"
    return None, None


def spec_gap(root, spec, need):
    """-> the files in `need` that the spec directory lacks."""
    return [f for f in need if not os.path.isfile(os.path.join(root, "specs", spec, f))]


NO_SPEC = ("Start one with the specify phase, or name it: "
           "`echo NNN-feature-slug > .specify/.active-spec`, a branch named NNN-feature-slug, "
           "or a `Spec: NNN-feature-slug` commit trailer.")


# ---------------------------------------------------------------- secrets

def secret_hits(text, cfg, rel=None):
    """-> [pattern id]. The matched text is never returned, so it is never logged or echoed."""
    allow = set(cfg["secretsAllow"])
    if rel and matches(rel, [a for a in allow if "/" in a or "*" in a or "." in a]):
        return []
    hits = []
    for pat in cfg["patterns"]:
        if pat.get("id") in allow:
            continue
        try:
            rx = re.compile(pat["regex"])
        except (re.error, KeyError):
            continue
        for line in text.split("\n"):
            if PRAGMA not in line and rx.search(line):
                hits.append(pat["id"])
                break
    return hits


def secret_path(rel, cfg):
    name = rel.split("/")[-1]
    if matches(rel, DEFS.get("secretPathsAllowed", [])) or matches(name, DEFS.get("secretPathsAllowed", [])):
        return False
    if matches(rel, [a for a in cfg["secretsAllow"]]):
        return False
    return matches(rel, DEFS.get("secretPaths", [])) or matches(name, [g for g in DEFS.get("secretPaths", []) if "/" not in g])


def gitleaks_findings(root, cfg, base, head):
    """-> ([message], note). Runs gitleaks over the commits of the pull request when it is
    installed. It adds to the pattern scan; it never replaces it. harness.gitleaks: auto (use it
    when present), off, or required (a missing gitleaks is a finding). Values are redacted."""
    mode = cfg.get("gitleaks", "auto")
    if mode == "off":
        return [], "gitleaks: off"
    exe = shutil.which("gitleaks")
    if not exe:
        if mode == "required":
            return ["gitleaks is required (harness.gitleaks) but is not on PATH."], "gitleaks: missing"
        return [], "gitleaks: not installed; pattern scan only"
    handle, report = tempfile.mkstemp(prefix="sdd-gitleaks-", suffix=".json")
    os.close(handle)
    common = ["--log-opts=%s..%s" % (base, head), "--report-format", "json", "--report-path", report,
              "--redact", "--no-banner", "--exit-code", "0"]
    ran, error = False, ""
    try:
        # `gitleaks git` is the current form; `gitleaks detect` is what releases before 8.19 take.
        for command in ([exe, "git"] + common + ["."], [exe, "detect", "--source", "."] + common):
            try:
                r = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=900)
            except (OSError, subprocess.SubprocessError) as err:
                error = str(err)
                continue
            if r.returncode == 0:
                ran = True
                break
            error = (r.stderr or r.stdout).strip().split("\n")[-1] if (r.stderr or r.stdout).strip() else "exit %d" % r.returncode
        leaks = read_json(report, []) if ran else []
    finally:
        try:
            os.remove(report)
        except OSError:
            pass
    if not ran:
        message = "gitleaks could not run: %s" % error
        return ([message] if mode == "required" else []), message
    allow = set(cfg["secretsAllow"])
    path_allow = [a for a in allow if "/" in a or "*" in a or "." in a]
    by_file = {}
    for leak in leaks if isinstance(leaks, list) else []:
        rel, rule = str(leak.get("File") or "?"), str(leak.get("RuleID") or "unknown-rule")
        if rule in allow or matches(rel, path_allow) or matches(rel, DEFS.get("secretPathsAllowed", [])):
            continue
        by_file.setdefault(rel, set()).add(rule)
    out = ["%s: gitleaks rule %s." % (rel, ", ".join(sorted(rules))) for rel, rules in sorted(by_file.items())]
    return out, "gitleaks: %d finding(s)" % len(out)


# -------------------------------------------------------------- approvals

APPROVAL_DIR = "approvals"
# The approve subcommand however it is spelled: gate.py approve, gate.py "approve", or gate.main(["approve", ...]).
APPROVE_COMMAND = re.compile(r"\bgate\b.*\bapprove\b|\brun_approve\b", re.IGNORECASE | re.DOTALL)
# A command that names an approval record under specs/.
APPROVAL_PATH = re.compile(r"specs/[^\s\"']*\bapprovals\b", re.IGNORECASE)
# Commands that only look at an approval record, never change it.
APPROVAL_READ_ONLY = {"cat", "less", "more", "head", "tail", "ls", "grep", "rg", "jq", "diff", "stat", "wc", "file"}
APPROVAL_READ_ONLY_GIT = {"status", "diff", "log", "show", "add", "commit", "ls-files", "blame"}
TICKED = re.compile(r"\[[xX]\]")


def approval_defs():
    return {a["phase"]: a for a in DEFS.get("approvals", [])}


def approval_fingerprint(root, spec, files):
    """-> sha256 over the approved files, or None when one is missing. A ticked task box counts
    as unticked, so that doing the approved tasks does not undo their approval."""
    digest = hashlib.sha256()
    for name in files:
        try:
            with open(os.path.join(root, "specs", spec, name), encoding="utf-8") as fh:
                text = fh.read()
        except OSError:
            return None
        text = TICKED.sub("[ ]", text.replace("\r\n", "\n"))
        digest.update(name.encode() + b"\0" + text.encode() + b"\0")
    return digest.hexdigest()


def approval_path(root, spec, phase):
    return os.path.join(root, "specs", spec, APPROVAL_DIR, "%s.json" % phase)


def approval_status(root, spec, phase):
    """-> (status, reason). status: valid, missing, stale, insufficient, or not-ready (the
    artifact to approve does not exist yet)."""
    rule = approval_defs().get(phase)
    if not rule:
        return "valid", "not a gated phase"
    what = " and ".join(rule["approves"])
    current = approval_fingerprint(root, spec, rule["approves"])
    if current is None:
        return "not-ready", "specs/%s/%s does not exist yet" % (spec, what)
    record = read_json(approval_path(root, spec, phase))
    if not isinstance(record, dict):
        return "missing", "no person has approved %s" % what
    if record.get("fingerprint") != current:
        return "stale", "%s changed after %s approved it" % (what, record.get("approver") or "someone")
    if not str(record.get("approver") or "").strip():
        return "insufficient", "the approval record names no approver"
    return "valid", "approved by %s" % record["approver"]


def approve_help(spec, phase):
    return ("A person records it, after reading the artifact:\n"
            "  python3 .specify/sdd-speckit/scripts/harness/gate.py approve %s --spec %s --approver \"<name>\"\n"
            "The assistant never records an approval." % (phase, spec))


def run_approve(phase, spec, approver, notes):
    root = find_root(os.getcwd())
    rule = approval_defs().get(phase)
    if not rule:
        print("approve: '%s' is not a gated phase. Choose from: %s" % (phase, ", ".join(approval_defs())), file=sys.stderr)
        return 2
    if not str(approver or "").strip():
        print("approve: --approver \"<your name>\" is required.", file=sys.stderr)
        return 2
    found = spec_from_name(root, spec) if spec else active_spec(root)[0]
    if not found:
        print("approve: no feature resolved. Pass --spec NNN-feature-slug.", file=sys.stderr)
        return 2
    fingerprint = approval_fingerprint(root, found, rule["approves"])
    if fingerprint is None:
        print("approve: specs/%s/%s does not exist yet, so there is nothing to approve." % (found, " and ".join(rule["approves"])), file=sys.stderr)
        return 1
    record = {"phase": phase, "spec": found, "approves": rule["approves"], "fingerprint": fingerprint,
              "approver": approver.strip(), "notes": notes or None,
              "approvedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    path = approval_path(root, found, phase)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(record, indent=2) + "\n")
    os.replace(tmp, path)
    log_finding(root, {"gate": "human-approval", "mode": "record", "where": "approve", "paths": [relative(root, path)],
                       "message": "%s approved %s of %s" % (record["approver"], " and ".join(rule["approves"]), found)})
    print("Recorded: %s approved %s for specs/%s/. The %s phase may start." % (
        record["approver"], " and ".join(rule["approves"]), found, phase))
    print("Commit %s so that CI sees the approval." % relative(root, path))
    return 0


def feature_phases(root, spec):
    """-> [{phase, artifact, exists, approval, reason}] in order, for status and resume."""
    rows = [{"phase": "specify", "artifact": "spec.md"}, {"phase": "plan", "artifact": "plan.md"},
            {"phase": "tasks", "artifact": "tasks.md"}, {"phase": "implement", "artifact": "implementation-log.md"},
            {"phase": "converge", "artifact": "converge-report.md"}]
    for row in rows:
        row["exists"] = os.path.isfile(os.path.join(root, "specs", spec, row["artifact"]))
        if row["phase"] in approval_defs():
            row["approval"], row["reason"] = approval_status(root, spec, row["phase"])
    return rows


def next_step(rows, gate_mode):
    for row in rows:
        gated = gate_mode != "off" and row.get("approval") in ("missing", "stale", "insufficient")
        if not row["exists"]:
            if gated:
                return "a person approves before the %s phase (%s)" % (row["phase"], row["reason"])
            return "run the %s phase" % row["phase"]
        if gated and row["phase"] == "implement":
            return "a person approves again before more code changes (%s)" % row["reason"]
    return "every phase has written its artifact"


# ------------------------------------------------------------- hook gates
# Each gate returns a message when it has a finding, and None when it has none.

def gate_constitution_hook(ctx):
    # Compared without case: on macOS and Windows, Constitution.md is the same file.
    if not any(r.lower() == CONSTITUTION.lower() for r in ctx["rels"]):
        return None
    if os.path.isfile(os.path.join(ctx["root"], UNLOCK)):
        return None
    return ".specify/memory/constitution.md is governed.\n\n" + CONSTITUTION_HELP


def gate_spec_hook(ctx):
    if not ctx["source"]:
        return None
    spec, _ = active_spec(ctx["root"])
    if not spec:
        return "%s is source code, and no feature is active. %s" % (ctx["source"][0], NO_SPEC)
    gap = spec_gap(ctx["root"], spec, ("spec.md", "plan.md"))
    if gap:
        return "%s is source code, but specs/%s/ has no %s. Run the %s phase first." % (
            ctx["source"][0], spec, " or ".join(gap), "specify" if "spec.md" in gap else "plan")
    return None


def gate_tasks_hook(ctx):
    if not ctx["source"]:
        return None
    spec, _ = active_spec(ctx["root"])
    if not spec:
        return None if ctx["cfg"]["gates"].get("spec-before-code") != "off" else (
            "%s is source code, and no feature is active. %s" % (ctx["source"][0], NO_SPEC))
    path = os.path.join(ctx["root"], "specs", spec, "tasks.md")
    try:
        with open(path, encoding="utf-8") as fh:
            if TASK_ROW.search(fh.read()):
                return None
    except OSError:
        pass
    return "%s is source code, but specs/%s/tasks.md has no task rows. Run the tasks phase first." % (ctx["source"][0], spec)


def gate_test_first_hook(ctx):
    if not ctx["source"]:
        return None
    root, cfg = ctx["root"], ctx["cfg"]
    status = git(root, "status", "--porcelain", "--untracked-files=all")
    if status is None:
        return None  # not a git repository: nothing to compare against
    changed = [l[3:].split(" -> ")[-1].strip('"') for l in lines(status)]
    base = default_base(root)
    if base:
        changed += lines(git(root, "diff", "--name-only", base, "HEAD"))
    if any(classify(p, cfg) == "test" for p in changed):
        return None
    return ("%s is source code, and this branch has no test change yet. Write the failing test first "
            "(constitution gate N1), then the code." % ctx["source"][0])


COMMAND_TOKEN = re.compile(r"[^\s\"'<>|;&=()`]+")
STATEMENT_SPLIT = re.compile(r"&&|\|\||[;|\n]")
RM = re.compile(r"(?:^|[\s/\\])rm\s+(.*)$")
# A command that puts a file's contents in the conversation. Naming a credential file in any other
# command (echo .env >> .gitignore, git rm --cached .env, cp .env.example .env) is routine.
READS_CONTENT = re.compile(
    r"(?:^|[\s;(`'\"/])(?:cat|tac|less|more|head|tail|nl|bat|grep|egrep|fgrep|rg|ag|awk|sed|cut|sort|uniq|"
    r"strings|xxd|od|hexdump|base64|jq|yq|openssl|source|python3?|node|ruby|perl|curl|wget|scp|rsync)\b"
    r"|(?:^|\s)\.\s|<\s*\S")
# Global options that may stand between a tool and its subcommand: git -C dir push, kubectl -n ns delete.
GLOBAL_OPTIONS = [
    (re.compile(r"\bgit((?:\s+(?:-[Cc]\s+\S+|--(?:git-dir|work-tree|namespace|exec-path)\s+\S+|-\S+))+)(?=\s)"), "git"),
    (re.compile(r"\b(terraform|tofu)((?:\s+-\S+)+)(?=\s)"), None),
    (re.compile(r"\bkubectl((?:\s+(?:-n|--namespace|--context|--cluster|-s|--server|--kubeconfig)\s+\S+|\s+-\S+)+)(?=\s)"), "kubectl"),
]


def normalise_statement(statement):
    """The statement as the destructive-command rules read it: quotes dropped, and the global
    options between a tool and its subcommand removed."""
    out = statement.replace('"', "").replace("'", "")
    for pattern, name in GLOBAL_OPTIONS:
        out = pattern.sub(lambda m: name or m.group(1), out)
    return out


def command_words(statement):
    """-> the words of a statement after any VAR=value, sudo, env, command or time prefix."""
    words = statement.replace('"', " ").replace("'", " ").split()
    while words and (re.match(r"^\w+=", words[0]) or words[0] in ("sudo", "env", "command", "time", "nohup", "exec")):
        words = words[1:]
    return words


def gate_secrets_hook(ctx):
    found = []
    for rel in ctx["rels"]:
        if secret_path(rel, ctx["cfg"]):
            found.append("%s is a credential file by name" % rel)
    # Reading a credential file puts its contents in the conversation, so a read counts too.
    for rel in ctx["touched"]:
        if rel not in ctx["rels"] and secret_path(rel, ctx["cfg"]):
            found.append("%s is a credential file by name, and the tool would read it" % rel)
    for command in ctx["commands"]:
        reading = [st for st in STATEMENT_SPLIT.split(command) if READS_CONTENT.search(st)]
        for token in COMMAND_TOKEN.findall("\n".join(reading)):
            name = token[2:] if token.startswith("~/") else token
            while name.startswith("./"):
                name = name[2:]
            name = name.lstrip("/")
            if name and secret_path(name, ctx["cfg"]):
                found.append("the command names the credential file %s" % token)
                break
        in_command = secret_hits(command, ctx["cfg"])
        if in_command:
            found.append("the command text matches: %s" % ", ".join(in_command))
    hits = []
    for rels, content in ctx["parts"]:
        # Each call's text is checked against its own path, so one allowlisted path in a batch
        # does not exempt the other calls.
        for h in (secret_hits(content, ctx["cfg"], rels[0] if rels else None) if content else []):
            if h not in hits:
                hits.append(h)
    if hits:
        found.append("the text matches: %s" % ", ".join(hits))
    if not found:
        return None
    return ("Possible secret or sensitive value: %s. Keep it out of the repository and read it from the "
            "environment. For a deliberate test value, add `%s` on the same line." % ("; ".join(found), PRAGMA))


def delete_target(token):
    """./.git/, .git/* and ".git" all name .git; / and /* both name the root."""
    t = token.strip("\"'").rstrip("&")
    while t.startswith("./") and len(t) > 2:
        t = t[2:]
    if t.endswith("/*") and len(t) > 2:
        t = t[:-2]
    while t.endswith("/") and len(t) > 1:
        t = t[:-1]
    return "." if t in ("./", "") else t


def destructive_delete(arguments):
    flags, targets = set(), []
    for token in arguments.split():
        if token.startswith("--"):
            flags.add({"--recursive": "r", "--force": "f"}.get(token, token))
        elif token.startswith("-") and len(token) > 1:
            flags.update(token[1:])
        else:
            targets.append(delete_target(token))
    protected = {delete_target(t) for t in DEFS.get("protectedDeleteTargets", [])}
    return bool(flags & {"r", "R"}) and "f" in flags and any(t in protected for t in targets)


def gate_destructive_hook(ctx):
    allow = set(ctx["cfg"].get("destructiveAllow") or [])
    for command in ctx["commands"]:
        # One statement at a time, so that a harmless statement cannot excuse the one beside it.
        for statement in STATEMENT_SPLIT.split(command):
            m = RM.search(statement)
            if m and "recursive-delete" not in allow and destructive_delete(m.group(1)):
                return ("`%s` is a recursive forced delete of a protected path. Ask the person to run it "
                        "if it is intended." % statement.strip())
            plain = normalise_statement(statement)
            for rule in DEFS.get("destructiveCommands", []):
                if rule.get("id") in allow:
                    continue
                try:
                    hit = re.search(rule["regex"], plain, re.IGNORECASE)
                except (re.error, KeyError):
                    continue
                if hit:
                    return ("`%s` is a %s. The assistant does not run it. Ask the person to run it "
                            "if it is intended." % (statement.strip(), rule.get("label", rule.get("id"))))
    return None


def gate_approval_hook(ctx):
    root = ctx["root"]
    for command in ctx["commands"]:
        if APPROVE_COMMAND.search(command):
            return "An approval is a person's decision. Ask the person to run the approve command themselves."
        for statement in STATEMENT_SPLIT.split(command):
            if not APPROVAL_PATH.search(statement):
                continue
            words = command_words(statement)
            first = os.path.basename(words[0]) if words else ""
            read_only = (first in APPROVAL_READ_ONLY or (first == "git" and len(words) > 1 and words[1] in APPROVAL_READ_ONLY_GIT))
            if not read_only or ">" in statement:
                return ("`%s` touches an approval record. An approval is a person's decision: the assistant "
                        "never writes one." % statement.strip())
    needed = []  # (spec, phase, what is about to change)
    for rel in ctx["rels"]:
        # Compared without case: on macOS and Windows, Approvals/ is the same directory.
        parts = rel.lower().split("/")
        if len(parts) >= 3 and parts[0] == "specs" and SPEC_DIR.match(parts[1]):
            if parts[2] == APPROVAL_DIR:
                return ("%s is an approval record. An approval is a person's decision: the assistant "
                        "never writes one." % rel)
            if len(parts) == 3 and parts[2] == "plan.md":
                needed.append((rel.split("/")[1], "plan", rel))
            if len(parts) == 3 and parts[2] == "tasks.md":
                needed.append((rel.split("/")[1], "tasks", rel))
    if ctx["source"]:
        spec, _ = active_spec(root)
        if spec:
            needed.append((spec, "implement", ctx["source"][0]))
    for spec, phase, rel in needed:
        status, reason = approval_status(root, spec, phase)
        if status in ("missing", "stale", "insufficient"):
            return "%s cannot change yet: %s (approval %s). %s" % (rel, reason, status, approve_help(spec, phase))
    return None


def gate_lint_hook(ctx):
    command = (ctx["cfg"]["commands"] or {}).get("lintFile")
    if not command:
        return None
    out = []
    for rel in ctx["rels"]:
        if classify(rel, ctx["cfg"]) not in ("source", "test") or not os.path.isfile(os.path.join(ctx["root"], rel)):
            continue
        try:
            r = subprocess.run(command.replace("{file}", shell_quote(rel)), shell=True, cwd=ctx["root"],
                               capture_output=True, text=True, timeout=20)
        except (OSError, subprocess.SubprocessError):
            continue  # a slow or missing linter never blocks an edit
        if r.returncode != 0:
            tail = "\n".join((r.stdout + r.stderr).strip().split("\n")[-20:])
            out.append("Lint failed for %s:\n%s" % (rel, tail))
    return "\n\n".join(out) or None


def shell_quote(s):
    return "'" + s.replace("'", "'\\''") + "'"


PRE_GATES = [
    ("constitution-guard", gate_constitution_hook),
    ("destructive-commands", gate_destructive_hook),
    ("secrets-scan", gate_secrets_hook),
    ("human-approval", gate_approval_hook),
    ("spec-before-code", gate_spec_hook),
    ("tasks-before-implement", gate_tasks_hook),
    ("test-first", gate_test_first_hook),
]
POST_GATES = [("lint-format", gate_lint_hook)]


def log_finding(root, entry):
    if not os.path.isdir(os.path.join(root, ".specify")):
        return
    try:
        entry["at"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(os.path.join(root, LOG), "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, sort_keys=True) + "\n")
    except OSError:
        pass


def run_hook(stage):
    import _payload

    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    if not isinstance(payload, dict):
        return 0
    parsed = _payload.parse(payload)
    writes = parsed["writes"] and bool(parsed["paths"])
    if stage == "post" and not writes:
        return 0
    if not (writes or parsed["commands"] or parsed["touched"]):
        return 0

    root = find_root(os.environ.get("CLAUDE_PROJECT_DIR") or parsed["base"])
    cfg = load_config(root)
    rels = [r for r in (relative(root, p) for p in parsed["paths"]) if r] if writes else []
    # A path outside the project is kept without its leading slash, so a name glob still matches.
    touched = [relative(root, p) or p.lstrip("/") for p in parsed["touched"]]
    if not (rels or parsed["commands"] or touched):
        return 0
    parts = [([r for r in (relative(root, p) for p in paths) if r], content)
             for paths, content in parsed.get("parts") or [(parsed["paths"], parsed["content"])]]
    ctx = {"root": root, "cfg": cfg, "rels": rels, "content": parsed["content"], "parts": parts, "touched": touched,
           "commands": parsed["commands"], "source": [r for r in rels if classify(r, cfg) == "source"]}

    blocks, warns = [], []
    for gid, fn in (PRE_GATES if stage == "pre" else POST_GATES):
        mode = cfg["gates"].get(gid, "off")
        if mode == "off":
            continue
        message = fn(ctx)
        if not message:
            continue
        (blocks if mode == "block" else warns).append((gid, message))
        log_finding(root, {"gate": gid, "mode": mode, "where": "hook:" + stage, "paths": rels or touched,
                           "message": message.split("\n")[0]})

    is_claude = "hook_event_name" in payload
    if blocks:
        text = "\n\n".join("Blocked by the %s gate: %s" % (g, m) for g, m in blocks)
        if warns:
            text += "\n\n" + "\n\n".join("Warning from the %s gate: %s" % (g, m) for g, m in warns)
        if stage == "pre":
            # Copilot reads a permission decision from stdout. Claude Code ignores stdout on
            # exit 2 and feeds stderr back to the model. Exit 2 denies in both.
            print(json.dumps({"permissionDecision": "deny", "permissionDecisionReason": text.split("\n\n")[0]}))
        print(text, file=sys.stderr)
        return 2
    if warns:
        text = "\n\n".join("Warning from the %s gate (mode: warn): %s" % (g, m) for g, m in warns)
        if is_claude:
            print(json.dumps({"systemMessage": text}))
        else:
            print(text, file=sys.stderr)
    return 0


# --------------------------------------------------------------------- ci

def ci_findings(root, cfg, base, head):
    """-> [(gate id, message)] for every gate that is not off."""
    span = "%s...%s" % (base, head)
    changed = lines(git(root, "diff", "--name-only", "--diff-filter=ACMR", span, timeout=60))
    kinds = {p: classify(p, cfg) for p in changed}
    source = [p for p in changed if kinds[p] == "source"]
    tests = [p for p in changed if kinds[p] == "test"]
    on = lambda gid: cfg["gates"].get(gid, "off") != "off"
    out, scanner = [], None

    if on("constitution-guard"):
        # --diff-filter=ACMR leaves out a deleted constitution, and lists only the new name of a
        # renamed one, so removal is checked separately.
        status = lines(git(root, "diff", "--name-status", "-M", span, "--", CONSTITUTION, timeout=60))
        if any(l.split("\t")[0][:1] in ("D", "R") for l in status):
            out.append(("constitution-guard", "%s was deleted or renamed. Amend it instead (Article V)." % CONSTITUTION))

    if on("constitution-guard") and CONSTITUTION in changed:
        diff = git(root, "diff", "-U0", span, "--", CONSTITUTION, timeout=60) or ""
        added = [l[1:] for l in diff.split("\n") if l.startswith("+") and not l.startswith("+++")]
        is_new = git(root, "cat-file", "-e", "%s:%s" % (base, CONSTITUTION)) is None
        if not is_new:
            missing = []
            if not any("**Version:**" in l for l in added):
                missing.append("a changed **Version:** line")
            if not any(re.match(r"^\|\s*\d+\.\d+\.\d+\s*\|", l) for l in added):
                missing.append("a new row in the Article V amendment log")
            if missing:
                out.append(("constitution-guard", "The constitution changed without %s." % " and ".join(missing)))

    spec, how = active_spec(root, changed, base, head)
    if source and on("spec-before-code"):
        if not spec:
            out.append(("spec-before-code", "%d source file(s) changed (first: %s), and no feature could be resolved. %s"
                        % (len(source), source[0], NO_SPEC)))
        else:
            gap = spec_gap(root, spec, ("spec.md", "plan.md"))
            if gap:
                out.append(("spec-before-code", "Source changed for specs/%s/ (found by %s), which has no %s."
                            % (spec, how, " or ".join(gap))))
    if source and on("tasks-before-implement") and spec:
        try:
            with open(os.path.join(root, "specs", spec, "tasks.md"), encoding="utf-8") as fh:
                has_tasks = bool(TASK_ROW.search(fh.read()))
        except OSError:
            has_tasks = False
        if not has_tasks:
            out.append(("tasks-before-implement", "Source changed for specs/%s/, whose tasks.md has no task rows." % spec))
    elif source and on("tasks-before-implement") and not on("spec-before-code"):
        out.append(("tasks-before-implement", "Source changed, and no feature could be resolved. " + NO_SPEC))

    if source and on("test-first"):
        if not tests:
            out.append(("test-first", "%d source file(s) changed (first: %s) with no test change." % (len(source), source[0])))
        else:
            log = git(root, "log", "--reverse", "--format=@%H", "--name-only", "%s..%s" % (base, head), timeout=60) or ""
            first_source = first_test = None
            index = -1
            for line in log.split("\n"):
                if line.startswith("@"):
                    index += 1
                elif line.strip():
                    kind = classify(line.strip(), cfg)
                    if kind == "source" and first_source is None:
                        first_source = index
                    if kind == "test" and first_test is None:
                        first_test = index
            if first_source is not None and first_test is not None and first_test > first_source:
                out.append(("test-first", "The first source commit comes before the first test commit. "
                                          "Commit the failing test with, or before, the code it covers."))

    if on("secrets-scan"):
        diff = git(root, "diff", "-U0", "--diff-filter=ACMR", span, timeout=120) or ""
        current, added, in_header = None, {}, False
        for line in diff.split("\n"):
            if line.startswith("diff --git "):
                in_header = True
            elif in_header and line.startswith("+++ "):
                # A header line, not an added line that begins with "++ ".
                current = line[6:] if line.startswith("+++ b/") else None
                in_header = False
            elif line.startswith("@@"):
                in_header = False
            elif line.startswith("+") and current and not in_header:
                added.setdefault(current, []).append(line[1:])
        for rel in changed:
            if secret_path(rel, cfg):
                out.append(("secrets-scan", "%s is a credential file by name." % rel))
        for rel, body in sorted(added.items()):
            hits = secret_hits("\n".join(body), cfg, rel)
            if hits:
                out.append(("secrets-scan", "%s: added lines match %s." % (rel, ", ".join(hits))))
        leaks, scanner = gitleaks_findings(root, cfg, base, head)
        out.extend(("secrets-scan", m) for m in leaks)

    if on("human-approval") and spec:
        wanted = [phase for phase, rel in (("plan", "specs/%s/plan.md" % spec), ("tasks", "specs/%s/tasks.md" % spec))
                  if rel in changed] + (["implement"] if source else [])
        for phase in wanted:
            status, reason = approval_status(root, spec, phase)
            if status in ("missing", "stale", "insufficient"):
                out.append(("human-approval", "The %s phase of specs/%s/ ran without a current approval: %s (%s)."
                            % (phase, spec, reason, status)))

    if on("lint-format"):
        for key in ("lint", "format"):
            command = (cfg["commands"] or {}).get(key)
            if not command:
                continue
            try:
                r = subprocess.run(command, shell=True, cwd=root, capture_output=True, text=True, timeout=1800)
            except (OSError, subprocess.SubprocessError) as err:
                out.append(("lint-format", "`%s` could not run: %s" % (command, err)))
                continue
            if r.returncode != 0:
                tail = "\n".join((r.stdout + r.stderr).strip().split("\n")[-15:])
                out.append(("lint-format", "`%s` exited %d:\n%s" % (command, r.returncode, tail)))
    return out, {"changed": len(changed), "source": len(source), "tests": len(tests), "spec": spec,
                 "specFoundBy": how, "scanner": scanner}


def run_ci(base, head):
    root = find_root(os.getcwd())
    cfg = load_config(root)
    if git(root, "rev-parse", "--verify", "--quiet", base) is None:
        print("::error::gate.py ci: base ref %s does not resolve. Check out with fetch-depth: 0." % base)
        return 1
    findings, facts = ci_findings(root, cfg, base, head)
    by_gate = {}
    for gid, message in findings:
        by_gate.setdefault(gid, []).append(message)

    failed = False
    rows = []
    for gid in GATE_IDS:
        mode = cfg["gates"].get(gid, "off")
        messages = by_gate.get(gid, [])
        if mode == "off":
            result = "off"
        elif not messages:
            result = "pass"
        elif mode == "block":
            result, failed = "FAIL", True
        else:
            result = "warn"
        rows.append((gid, mode, result, messages))
        for m in messages:
            first = m.split("\n")[0]
            print("::%s title=sdd gate %s::%s" % ("error" if mode == "block" else "warning", gid, first))

    width = max(len(g) for g in GATE_IDS)
    print("\nSDD gates (%d changed files: %d source, %d test; feature: %s)" % (
        facts["changed"], facts["source"], facts["tests"], facts["spec"] or "none resolved"))
    for gid, mode, result, messages in rows:
        print("  %-*s  %-5s  %s" % (width, gid, mode, result))
        for m in messages:
            print("      " + m.replace("\n", "\n      "))

    if facts.get("scanner"):
        print("  secrets-scan also ran: %s" % facts["scanner"])

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        try:
            with open(summary, "a", encoding="utf-8") as fh:
                fh.write("### SDD gates\n\n| Gate | Mode | Result | Finding |\n|---|---|---|---|\n")
                for gid, mode, result, messages in rows:
                    fh.write("| %s | %s | %s | %s |\n" % (gid, mode, result,
                             "<br>".join(m.split("\n")[0].replace("|", "\\|") for m in messages) or "—"))
        except OSError:
            pass
    return 1 if failed else 0


# ----------------------------------------------------------------- status

def run_status(as_json):
    root = find_root(os.getcwd())
    cfg = load_config(root)
    spec, how = active_spec(root)
    phases = feature_phases(root, spec) if spec else []
    step = next_step(phases, cfg["gates"].get("human-approval", "off")) if spec else "run the specify phase"
    if as_json:
        print(json.dumps({"phases": phases, "next": step, "root": root, "gates": cfg["gates"], "configured": cfg["configured"], "activeSpec": spec,
                          "activeSpecFoundBy": how, "sourceGlobs": cfg["sourceGlobs"], "testGlobs": cfg["testGlobs"],
                          "exemptGlobs": cfg["exemptGlobs"], "commands": cfg["commands"], "industry": cfg["industry"], "gitleaks": cfg["gitleaks"],
                          "gitleaksInstalled": bool(shutil.which("gitleaks"))}, indent=2))
        return 0
    print("Project: %s" % root)
    if not cfg["configured"]:
        print("No harness.gates in %s: only the constitution guard runs. Set the gates with the setup phase." % CONFIG)
    width = max(len(g) for g in GATE_IDS)
    for gid in GATE_IDS:
        print("  %-*s  %s" % (width, gid, cfg["gates"].get(gid, "off")))
    print("Active feature: %s" % ("specs/%s/ (from %s)" % (spec, how) if spec else "none"))
    for row in phases:
        approval = ("approval %s: %s" % (row["approval"], row["reason"])) if row.get("approval") else ""
        print("  %-9s  %-24s %-8s %s" % (row["phase"], row["artifact"], "written" if row["exists"] else "-", approval))
    print("Next: %s" % step)
    print("Source globs: %s" % ", ".join(cfg["sourceGlobs"]))
    print("Test globs:   %s" % ", ".join(cfg["testGlobs"]))
    print("gitleaks (CI secrets scan): %s, %s" % (cfg["gitleaks"], "installed" if shutil.which("gitleaks") else "not installed"))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="sdd-speckit harness gate runner")
    sub = ap.add_subparsers(dest="cmd", required=True)
    hook = sub.add_parser("hook")
    hook.add_argument("stage", choices=["pre", "post"])
    ci = sub.add_parser("ci")
    ci.add_argument("--base", required=True)
    ci.add_argument("--head", default="HEAD")
    status = sub.add_parser("status")
    status.add_argument("--json", action="store_true")
    approve = sub.add_parser("approve", help="a person records the approval that lets a phase start")
    approve.add_argument("phase")
    approve.add_argument("--spec")
    approve.add_argument("--approver")
    approve.add_argument("--notes")
    args = ap.parse_args(argv)

    if args.cmd == "hook":
        try:
            return run_hook(args.stage)
        except Exception as err:  # a hook must fail open
            print("sdd-speckit gate runner error (tool call allowed): %s" % err, file=sys.stderr)
            return 0
    if args.cmd == "ci":
        return run_ci(args.base, args.head)
    if args.cmd == "approve":
        return run_approve(args.phase, args.spec, args.approver, args.notes)
    return run_status(args.json)


if __name__ == "__main__":
    sys.exit(main())
