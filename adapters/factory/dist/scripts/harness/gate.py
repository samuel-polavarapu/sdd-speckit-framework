#!/usr/bin/env python3
"""The harness gate runner. One implementation for the assistant hooks and for CI.

  gate.py hook pre|post                 reads a tool-hook payload on stdin
  gate.py ci --base REF [--head REF]    checks the commits and the diff of a pull request
  gate.py status [--json]               prints each gate's mode and the active spec

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
/sdd-speckit-constitution in GitHub Copilot and Factory Droid. That phase bumps the version,
records the change in Article V, and reports which existing artifacts the amendment now
conflicts with.

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


def gate_secrets_hook(ctx):
    found = []
    for rel in ctx["rels"]:
        if secret_path(rel, ctx["cfg"]):
            found.append("%s is a credential file by name" % rel)
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
    ("secrets-scan", gate_secrets_hook),
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
    if not parsed["writes"] or not parsed["paths"]:
        return 0

    root = find_root(os.environ.get("CLAUDE_PROJECT_DIR") or parsed["base"])
    cfg = load_config(root)
    rels = [r for r in (relative(root, p) for p in parsed["paths"]) if r]
    if not rels:
        return 0
    parts = [([r for r in (relative(root, p) for p in paths) if r], content)
             for paths, content in parsed.get("parts") or [(parsed["paths"], parsed["content"])]]
    ctx = {"root": root, "cfg": cfg, "rels": rels, "content": parsed["content"], "parts": parts,
           "source": [r for r in rels if classify(r, cfg) == "source"]}

    blocks, warns = [], []
    for gid, fn in (PRE_GATES if stage == "pre" else POST_GATES):
        mode = cfg["gates"].get(gid, "off")
        if mode == "off":
            continue
        message = fn(ctx)
        if not message:
            continue
        (blocks if mode == "block" else warns).append((gid, message))
        log_finding(root, {"gate": gid, "mode": mode, "where": "hook:" + stage, "paths": rels,
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
    if as_json:
        print(json.dumps({"root": root, "gates": cfg["gates"], "configured": cfg["configured"], "activeSpec": spec,
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
    args = ap.parse_args(argv)

    if args.cmd == "hook":
        try:
            return run_hook(args.stage)
        except Exception as err:  # a hook must fail open
            print("sdd-speckit gate runner error (tool call allowed): %s" % err, file=sys.stderr)
            return 0
    if args.cmd == "ci":
        return run_ci(args.base, args.head)
    return run_status(args.json)


if __name__ == "__main__":
    sys.exit(main())
