#!/usr/bin/env python3
"""Onboards a project to the framework's templates and harness. Safe to run again.

  onboard-project.py --project DIR [--mode greenfield|brownfield|auto] [--industry ID]
                     [--stack ID|auto] [--targets claude,copilot]
                     [--gates default|off|warn|block] [--gate ID=MODE ...]
                     [--dry-run] [--force] [--json]

It does four things, in this order:
  1. Pins the framework's templates, profiles and harness scripts in .specify/sdd-speckit/, so CI
     and the hooks run the same version with no plugin installed.
  2. Composes the templates for the chosen industry and stack (scripts/compose-templates.py).
  3. Merges permission rules and the gate hooks into .claude/settings.json (Claude Code target).
  4. Records mode, industry, stack and the harness settings in .specify/sdd-speckit.json.

Both installers call it, and so do the setup and onboard phases, so every path gives the same
result. An answer already in the record is kept unless a flag replaces it. Standard library only.
"""
import sys

sys.dont_write_bytecode = True

import argparse
import importlib.util
import json
import os
import shutil
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SUPPORT = ".specify/sdd-speckit"
CONFIG = ".specify/sdd-speckit.json"
CONFIG_VERSION = 3
RUNNER = SUPPORT + "/scripts/harness/gate.py"
# What a project needs with no plugin installed. adapters/copilot/adapter.json -> supportCopy must
# contain every entry, because the Copilot render owns this directory when Copilot is a target.
VENDOR = [
    "templates",
    "profiles",
    "scripts/compose-templates.py",
    "scripts/onboard-project.py",
    "scripts/discover-scan.py",
    "scripts/harness",
    "scripts/hooks/_payload.py",
]
MODES = ("greenfield", "brownfield")


def read_json(path, fallback=None):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return fallback


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(data, indent=2) + "\n")


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def union(*lists):
    out = []
    for items in lists:
        for item in items or []:
            if item not in out:
                out.append(item)
    return out


def scan(project):
    """The brief repository scan; an empty result when the scanner cannot run."""
    try:
        r = subprocess.run([sys.executable, os.path.join(HERE, "discover-scan.py"), project, "--brief"],
                           capture_output=True, text=True, timeout=120)
        return json.loads(r.stdout) if r.returncode == 0 else {}
    except (OSError, ValueError, subprocess.SubprocessError):
        return {}


# ------------------------------------------------------------------ steps

def resolve(project, args, defs):
    """-> (record to write, facts for the report). Reads only."""
    record = read_json(os.path.join(project, CONFIG), {}) or {}
    had_harness = bool((record.get("harness") or {}).get("gates"))
    was_configured = bool(record)
    found = None

    mode = args.mode or record.get("mode") or "auto"
    if mode == "auto":
        found = scan(project)
        mode = found.get("mode", "greenfield")
    if mode not in MODES:
        raise SystemExit('--mode must be greenfield, brownfield or auto, got "%s"' % mode)

    stack = args.stack or record.get("stack") or "custom"
    if stack == "auto":
        found = found or scan(project)
        stack = found.get("stack", "custom")
    industry = args.industry or record.get("industry") or "none"

    for folder, label, pid, none in (("industries", "industry", industry, "none"), ("stacks", "stack", stack, "custom")):
        base = os.path.join(ROOT, "profiles", folder)
        if pid != none and not os.path.isfile(os.path.join(base, pid, "profile.json")):
            known = sorted(os.listdir(base)) if os.path.isdir(base) else []
            raise SystemExit('"%s" is not a known %s profile. Choose: %s' % (pid, label, " | ".join([none] + known)))

    targets = (args.targets.split(",") if args.targets else (record.get("assistant") or {}).get("targets")) or ["claude"]

    # Gates: a flag wins, then what the record holds, then the default for the mode. A record
    # written before 0.3.0 has no gates; it keeps its old behaviour until a mode is chosen.
    harness = dict(record.get("harness") or {})
    defaults = defs["defaults"]
    if args.gates in defs["modes"]:
        gates = {g["id"]: args.gates for g in defs["gates"]}
    elif args.gates == "default" or not had_harness:
        base = "migrated" if (was_configured and not had_harness and not args.mode and args.gates != "default") else mode
        gates = dict(defaults[base])
    else:
        gates = {**defaults[mode], **{k: v for k, v in harness["gates"].items() if v in defs["modes"]}}
    for spec in args.gate or []:
        gid, _, value = spec.partition("=")
        if gid not in gates or value not in defs["modes"]:
            raise SystemExit('--gate="%s" must be <%s>=<%s>' % (spec, "|".join(gates), "|".join(defs["modes"])))
        gates[gid] = value

    profile = read_json(os.path.join(ROOT, "profiles", "stacks", stack, "profile.json"), {}) or {}
    from_stack = profile.get("harness") or {}
    proposed = {}
    if mode == "brownfield":
        found = found or scan(project)
        proposed = found.get("proposed") or {}
    # An existing repository is the authority on its own layout; a new one follows the stack.
    order = (proposed, from_stack) if mode == "brownfield" else (from_stack, proposed)

    def pick(key, proposed_key, fallback):
        if harness.get(key):
            return harness[key]
        for source in order:
            value = source.get(proposed_key if source is proposed else key)
            if value:
                return value
        return fallback

    commands = dict(harness.get("commands") or {})
    if not any(commands.values()):
        for source in reversed(order):
            for k, v in (source.get("commands") or {}).items():
                if v:
                    commands[k] = v
    for key in ("test", "lint", "format", "lintFile"):
        commands.setdefault(key, "")

    record.update({
        "configVersion": CONFIG_VERSION,
        "mode": mode,
        "industry": industry,
        "stack": stack,
        "harness": {
            "gates": gates,
            "sourceGlobs": pick("sourceGlobs", "sourceGlobs", defs["globs"]["source"]),
            "testGlobs": pick("testGlobs", "testGlobs", defs["globs"]["test"]),
            "exemptGlobs": harness.get("exemptGlobs") or defs["globs"]["exempt"],
            "commands": commands,
            "secretsAllow": harness.get("secretsAllow") or [],
            "gitleaks": harness.get("gitleaks") if harness.get("gitleaks") in defs.get("gitleaksModes", []) else "auto",
        },
        "checklistKinds": checklist_kinds(industry),
    })
    record.setdefault("generatedBy", "onboard-project.py")
    assistant = dict(record.get("assistant") or {})
    assistant.setdefault("targets", targets)
    record["assistant"] = assistant
    return record, {"mode": mode, "industry": industry, "stack": stack, "targets": targets,
                    "stackPermissions": (profile.get("permissions") or {}).get("allow", []), "scan": found}


def vendor(project, targets, dry_run):
    """Copies the support files. Skipped when the Copilot render owns the directory."""
    dest = os.path.join(project, SUPPORT)
    if os.path.realpath(ROOT) == os.path.realpath(dest):
        return ["support files: already running from %s/" % SUPPORT]
    if "copilot" in targets:
        if dry_run or os.path.isfile(os.path.join(project, RUNNER)):
            return ["support files: %s/ is written by the GitHub Copilot render" % SUPPORT]
        return ["! %s/ is missing. With GitHub Copilot as a target, write it first: "
                "npx create-sdd-speckit-app . --emit=copilot" % SUPPORT]
    count = 0
    for entry in VENDOR:
        src = os.path.join(ROOT, entry)
        if not os.path.exists(src):
            continue
        dst = os.path.join(dest, entry)
        if os.path.isdir(src):
            for dirpath, dirnames, filenames in os.walk(src):
                dirnames[:] = sorted(d for d in dirnames if d != "__pycache__")
                for name in sorted(filenames):
                    if name == ".DS_Store" or name.endswith(".pyc"):
                        continue
                    count += 1
                    if dry_run:
                        continue
                    out = os.path.join(dst, os.path.relpath(os.path.join(dirpath, name), src))
                    os.makedirs(os.path.dirname(out), exist_ok=True)
                    shutil.copyfile(os.path.join(dirpath, name), out)
        else:
            count += 1
            if not dry_run:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copyfile(src, dst)
    return ["%s %d support files -> %s/" % ("would copy" if dry_run else "copied", count, SUPPORT)]


def compose(project, facts, dry_run, force):
    """Composes from the pinned copy when the project has one, so CI's --check agrees."""
    pinned = os.path.join(project, SUPPORT)
    root = pinned if os.path.isfile(os.path.join(pinned, "scripts", "compose-templates.py")) else ROOT
    composer = load_module("compose_templates", os.path.join(root, "scripts", "compose-templates.py"))
    try:
        ctx, actions = composer.run(project, facts["industry"], facts["stack"], facts["targets"],
                                    dry_run=dry_run, force=force, root=root)
    except composer.ComposeError as err:
        raise SystemExit("template composition failed: %s" % err)
    verb = {"write": "would write" if dry_run else "wrote", "remove": "would remove" if dry_run else "removed",
            "skip-exists": "kept (already exists)", "skip-edited": "kept (edited by hand; --force replaces it)"}
    log = ["%s %s" % (verb[a["action"]], a["path"]) for a in actions if a["action"] != "unchanged"]
    same = sum(1 for a in actions if a["action"] == "unchanged")
    if same:
        log.append("%d composed file(s) already current" % same)
    if not actions:
        log.append("templates: no profile overlays any template; the base templates are used as they are")
    return log


def checklist_kinds(industry):
    """The checklist kinds this project offers: the industry profile's list, or every base kind."""
    profile = read_json(os.path.join(ROOT, "profiles", "industries", industry, "profile.json"), {}) or {}
    if profile.get("checklistKinds"):
        return list(profile["checklistKinds"])
    base = os.path.join(ROOT, "templates", "checklists")
    return sorted(f[:-len("-template.md")] for f in (os.listdir(base) if os.path.isdir(base) else [])
                  if f.endswith("-template.md"))


IGNORE_HEADER = "# sdd-speckit: local harness state, never committed"
IGNORE_LINES = [".specify/.active-spec", ".specify/.constitution-unlock", ".specify/harness-log.jsonl", ".specify/usage-log.txt"]


def merge_gitignore(project, dry_run):
    path = os.path.join(project, ".gitignore")
    try:
        with open(path, encoding="utf-8") as fh:
            existing = fh.read()
    except OSError:
        existing = ""
    have = {l.strip() for l in existing.split("\n")}
    missing = [l for l in IGNORE_LINES if l not in have]
    if not missing:
        return []
    if not dry_run:
        block = ([] if IGNORE_HEADER in have else [IGNORE_HEADER]) + missing
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write((existing.rstrip("\n") + "\n\n" if existing.strip() else "") + "\n".join(block) + "\n")
    return ["%s .gitignore (%d harness state path(s))" % ("would update" if dry_run else "updated", len(missing))]


def hook_entry(stage, matcher):
    return {"matcher": matcher, "hooks": [{
        "type": "command",
        "command": 'python3 "$CLAUDE_PROJECT_DIR/%s" hook %s' % (RUNNER, stage),
    }]}


def merge_settings(project, facts, defs, dry_run):
    """Adds permission rules and the gate hooks. A rule or hook already there is never removed."""
    if "claude" not in facts["targets"]:
        return ["no Claude Code target — .claude/settings.json not changed"]
    path = os.path.join(project, ".claude", "settings.json")
    settings = read_json(path, {}) or {}
    before = json.dumps(settings, sort_keys=True)

    base = defs.get("permissions", {})
    perms = dict(settings.get("permissions") or {})
    perms["allow"] = union(perms.get("allow"), base.get("allow"), facts["stackPermissions"])
    perms["ask"] = union(perms.get("ask"), base.get("ask"))
    perms["deny"] = union(perms.get("deny"), base.get("deny"))
    settings["permissions"] = perms

    hooks = dict(settings.get("hooks") or {})
    for event, stage, matcher in (("PreToolUse", "pre", "Write|Edit|MultiEdit|NotebookEdit"),
                                  ("PostToolUse", "post", "Write|Edit|MultiEdit")):
        entries = list(hooks.get(event) or [])
        wired = any("sdd-speckit/scripts/harness/gate.py" in (h.get("command") or "")
                    for e in entries for h in (e.get("hooks") or []))
        if not wired:
            entries.append(hook_entry(stage, matcher))
        hooks[event] = entries
    settings["hooks"] = hooks

    if json.dumps(settings, sort_keys=True) == before:
        return [".claude/settings.json already has the permission rules and gate hooks"]
    if not dry_run:
        write_json(path, settings)
    return ["%s .claude/settings.json (permission rules, gate hooks)" % ("would write" if dry_run else "wrote")]


def main(argv=None):
    ap = argparse.ArgumentParser(description="Onboard a project to sdd-speckit templates and harness.")
    ap.add_argument("--project", required=True)
    ap.add_argument("--mode", choices=["greenfield", "brownfield", "auto"])
    ap.add_argument("--industry")
    ap.add_argument("--stack")
    ap.add_argument("--targets")
    ap.add_argument("--gates", choices=["default", "off", "warn", "block"])
    ap.add_argument("--gate", action="append")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    project = os.path.abspath(args.project)
    defs = read_json(os.path.join(HERE, "harness", "gates.json"))
    if not defs:
        raise SystemExit("scripts/harness/gates.json is missing or unreadable")

    record, facts = resolve(project, args, defs)
    log = []
    log += vendor(project, facts["targets"], args.dry_run)
    log += compose(project, facts, args.dry_run, args.force)
    log += merge_settings(project, facts, defs, args.dry_run)
    log += merge_gitignore(project, args.dry_run)

    path = os.path.join(project, CONFIG)
    if read_json(path) == record:
        log.append("%s already current" % CONFIG)
    else:
        if not args.dry_run:
            write_json(path, record)
        log.append("%s %s (mode=%s, industry=%s, stack=%s)" % (
            "would write" if args.dry_run else "wrote", CONFIG, facts["mode"], facts["industry"], facts["stack"]))

    gates = record["harness"]["gates"]
    if args.json:
        print(json.dumps({"ok": True, "dryRun": args.dry_run, "mode": facts["mode"], "industry": facts["industry"],
                          "stack": facts["stack"], "targets": facts["targets"], "harness": record["harness"], "log": log}, indent=2))
    else:
        print("Onboarded %s (mode=%s, industry=%s, stack=%s)" % (project, facts["mode"], facts["industry"], facts["stack"]))
        for line in log:
            print("  - " + line)
        print("  Gates: " + ", ".join("%s=%s" % (g, gates[g]) for g in gates))
    return 0


if __name__ == "__main__":
    sys.exit(main())
