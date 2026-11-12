#!/usr/bin/env python3
"""
Reads a tool-hook payload on stdin. It prints, first, whether the tool writes files ("1" or "0"),
then one target path per line (none, one, or several for a multi-file patch), each resolved
against the payload's cwd when it is relative.

It accepts every payload shape the framework's hooks receive:

  Claude Code             {"tool_name": "Write", "tool_input": {"file_path": ...}}
  Copilot (PascalCase)    {"tool_name": ..., "tool_input": {...}, "cwd": ...}
  Copilot (camelCase)     {"toolName": "edit", "toolArgs": "{\"path\": ...}", "cwd": ...}

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
PATH_KEYS = ("file_path", "path", "filePath", "notebook_path", "target_file")
PATCH_FILE = re.compile(r"^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\+\+\+ (?:b/)?(.+)$", re.MULTILINE)


def main():
    try:
        d = json.load(sys.stdin)
    except Exception:
        print("0")
        return

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
    if not paths and "patch" in name.lower():
        for v in args.values():
            if isinstance(v, str):
                paths += [(a or b).strip() for a, b in PATCH_FILE.findall(v) if (a or b).strip() != "/dev/null"]

    base = d.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    paths = [p if os.path.isabs(p) else os.path.normpath(os.path.join(base, p)) for p in paths]

    print("1" if WRITE_TOOL.search(name) else "0")
    for p in paths:
        print(p)


if __name__ == "__main__":
    main()
