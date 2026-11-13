#!/usr/bin/env python3
"""
Reads a tool-hook payload on stdin. It prints, first, whether the tool writes files ("1" or "0"),
then one target path per line (none, one, or several for a multi-file patch), each resolved
against the payload's cwd when it is relative.

It accepts every payload shape the framework's hooks receive:

  Claude Code             {"tool_name": "Write", "tool_input": {"file_path": ...}}
  Copilot (PascalCase)    {"tool_name": ..., "tool_input": {...}, "cwd": ...}
  Copilot (camelCase)     {"toolName": "edit", "toolArgs": "{\"path\": ...}", "cwd": ...}
  Copilot CLI (batched)   {"toolCalls": [{"name": "edit", "args": {...}}, ...], "cwd": ...}

A batched payload is read as the union of its calls: it writes when any call writes, and it
carries every call's paths and content. A hook that read only the single-call fields would see
nothing in a batch and let every call through.

toolArgs can arrive as a JSON-encoded string or as an object. Both are handled.
A parse failure prints "0" and no path, so a hook never blocks on a payload it cannot read.
"""
import json
import os
import re
import sys

# Matches the file-writing tools of Claude Code (Write, Edit, MultiEdit, NotebookEdit) and of
# Copilot (create, edit, apply_patch, and VS Code's create_file, replace_string_in_file, ...).
WRITE_TOOL = re.compile(r"write|edit|create|replace|insert|patch|notebook", re.IGNORECASE)
SHELL_TOOL = re.compile(r"^(bash|sh|zsh|shell|powershell|pwsh|terminal|execute|run_in_terminal)$", re.IGNORECASE)
PATH_KEYS = ("file_path", "path", "filePath", "notebook_path", "target_file")
PATCH_FILE = re.compile(r"^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$|^\+\+\+ (?:b/)?(.+)$", re.MULTILINE)


CONTENT_KEYS = ("content", "new_string", "new_str", "newString", "new_source", "text", "insert_text", "patch", "input", "_raw")


def _added_patch_lines(text):
    return "\n".join(l[1:] for l in text.split("\n") if l.startswith("+") and not l.startswith("+++"))


def parse(d):
    """Like parse_one, and it also expands a batched {"toolCalls": [...]} payload."""
    batch = d.get("toolCalls")
    if not isinstance(batch, list):
        return parse_one(d)
    singles = [{"tool_name": c.get("name") or c.get("toolName") or "",
                "tool_input": c.get("args", c.get("arguments", c.get("toolArgs"))),
                "cwd": d.get("cwd")} for c in batch if isinstance(c, dict)]
    if d.get("toolName") or d.get("tool_name"):
        singles.append(d)
    parsed = [parse_one(s) for s in singles]
    writers = [p for p in parsed if p["writes"]]
    paths = []
    for p in writers:
        paths += [x for x in p["paths"] if x not in paths]
    touched, commands = [], []
    for p in parsed:
        touched += [x for x in p["touched"] if x not in touched]
        commands += p["commands"]
    return {"writes": bool(writers), "paths": paths, "touched": touched, "commands": commands,
            "tool": ",".join(p["tool"] for p in writers),
            "content": "\n".join(p["content"] for p in writers if p["content"]),
            "parts": [part for p in writers for part in p["parts"]],
            "base": d.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()}


def parse_one(d):
    """-> {"writes": bool, "paths": [absolute path written], "touched": [absolute path read or
    written], "commands": [shell command], "tool": str, "content": str,
    "parts": [([absolute path written], content)], "base": str}.

    content is the text the tool is about to write, as far as the payload shows it: the whole
    file for a write, the replacement text for an edit, the added lines for a patch.
    """
    name = d.get("tool_name") or d.get("toolName") or ""
    args = d.get("tool_input")
    if args is None:
        args = d.get("toolArgs")
    if isinstance(args, str):
        try:
            args = json.loads(args)
        except Exception:
            args = {"_raw": args}
    if not isinstance(args, dict):
        args = {}

    paths = [args[k] for k in PATH_KEYS if isinstance(args.get(k), str) and args[k]][:1]

    # A patch tool carries its targets inside the patch text, not in a path field.
    is_patch = "patch" in name.lower()
    if not paths and is_patch:
        for v in args.values():
            if isinstance(v, str):
                paths += [(a or b).strip() for a, b in PATCH_FILE.findall(v) if (a or b).strip() != "/dev/null"]

    chunks = []
    for k in CONTENT_KEYS:
        v = args.get(k)
        if isinstance(v, str) and v:
            chunks.append(_added_patch_lines(v) if is_patch else v)
    for edit in args.get("edits") or []:
        if isinstance(edit, dict):
            chunks += [edit[k] for k in ("new_string", "newString", "new_str") if isinstance(edit.get(k), str)]

    base = d.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    paths = [os.path.expanduser(p) for p in paths]
    paths = [p if os.path.isabs(p) else os.path.normpath(os.path.join(base, p)) for p in paths]
    # Any tool that takes a command string runs a command, whatever the tool is called.
    commands = [args[k] for k in ("command", "cmd") if isinstance(args.get(k), str) and args[k]]
    if not commands and SHELL_TOOL.search(name) and isinstance(args.get("_raw"), str):
        commands = [args["_raw"]]
    if WRITE_TOOL.search(name) and not SHELL_TOOL.search(name):
        commands = []  # an editor tool's "command" argument names an edit action, not a shell command
    writes = bool(WRITE_TOOL.search(name)) and not commands
    content = "\n".join(chunks) if writes else ""
    # parts pairs each call's paths with its own content, so a check that depends on the path
    # (an allowlist entry, say) is applied to that call's text only.
    return {"writes": writes, "paths": paths if writes else [], "touched": paths, "commands": commands,
            "tool": name, "content": content, "parts": [(paths if writes else [], content)], "base": base}


def main():
    try:
        d = json.load(sys.stdin)
        if not isinstance(d, dict):
            raise ValueError("payload is not an object")
    except Exception:
        print("0")
        return

    parsed = parse(d)
    print("1" if parsed["writes"] else "0")
    for p in parsed["paths"]:
        print(p)


if __name__ == "__main__":
    main()
