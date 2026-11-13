#!/usr/bin/env python3
"""Deterministic facts about a repository, as JSON. It reads; it never writes.

  discover-scan.py [DIR]            the full inventory, for the discover phase
  discover-scan.py [DIR] --brief    only what the installer needs: mode, stack, globs, commands

The discover phase gives this output to the codebase-cartographer agent, which adds what a scan
cannot see: architecture, conventions and intent. Facts come from here so that two runs agree.
Standard library only.
"""
import argparse
import collections
import json
import os
import re
import subprocess
import sys

sys.dont_write_bytecode = True

IGNORED_DIRS = {
    ".git", "node_modules", ".venv", "venv", "env", "__pycache__", "dist", "build", "out", "target", "bin", "obj",
    ".next", ".nuxt", ".turbo", ".cache", "coverage", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".tox", "vendor",
    ".gradle", ".terraform",
}
# Written by this framework or by an editor. Their presence says nothing about existing code.
FRAMEWORK_DIRS = {".specify", ".claude", ".github", ".vscode", ".idea", "specs"}
LANGUAGES = {
    ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript", ".mjs": "JavaScript",
    ".cjs": "JavaScript", ".py": "Python", ".cs": "C#", ".java": "Java", ".kt": "Kotlin", ".go": "Go", ".rs": "Rust",
    ".rb": "Ruby", ".php": "PHP", ".swift": "Swift", ".scala": "Scala", ".c": "C", ".h": "C", ".cpp": "C++",
    ".hpp": "C++", ".sql": "SQL", ".sh": "Shell", ".vue": "Vue", ".svelte": "Svelte", ".tf": "Terraform",
}
MANIFESTS = ["package.json", "pyproject.toml", "requirements.txt", "setup.py", "Pipfile", "go.mod", "pom.xml",
             "build.gradle", "build.gradle.kts", "Cargo.toml", "Gemfile", "composer.json", "Directory.Packages.props"]
MANIFEST_SUFFIXES = (".csproj", ".sln", ".fsproj")
CI_FILES = [".gitlab-ci.yml", "azure-pipelines.yml", "Jenkinsfile", "bitbucket-pipelines.yml", ".circleci/config.yml",
            ".travis.yml"]
LINT_FILES = [".eslintrc", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", "eslint.config.js", "eslint.config.mjs",
              "eslint.config.ts", ".prettierrc", ".prettierrc.json", "prettier.config.js", "biome.json", "ruff.toml",
              ".ruff.toml", ".flake8", "mypy.ini", ".pylintrc", ".editorconfig", ".golangci.yml", "rustfmt.toml",
              ".rubocop.yml", "tsconfig.json", ".pre-commit-config.yaml", "stylecop.json", ".globalconfig"]
DOC_FILES = ["README.md", "CONTRIBUTING.md", "ARCHITECTURE.md", "CHANGELOG.md", "SECURITY.md", "CODEOWNERS",
             "AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".github/CODEOWNERS",
             ".github/pull_request_template.md", ".specify/memory/constitution.md"]
TEST_NAME = re.compile(r"(^test_.*\.py$|_test\.(py|go)$|\.(test|spec)\.[cm]?[jt]sx?$|Tests?\.(cs|java|kt)$|_spec\.rb$)")
TEST_DIRS = {"tests", "test", "__tests__", "e2e", "spec"}
SOURCE_DIR_HINTS = ["src", "app", "lib", "server", "client", "api", "apps", "packages", "services", "cmd", "internal", "pkg"]


def read_text(path, limit=200000):
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read(limit)
    except OSError:
        return ""


def read_json(path):
    try:
        return json.loads(read_text(path))
    except ValueError:
        return None


def git(root, *args):
    try:
        r = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.SubprocessError):
        return None
    return r.stdout if r.returncode == 0 else None


def walk(root, max_files=50000):
    """Yields repository-relative posix paths of code-relevant files, skipping vendored trees."""
    count = 0
    for dirpath, dirnames, filenames in os.walk(root):
        rel_dir = os.path.relpath(dirpath, root).replace(os.sep, "/")
        dirnames[:] = sorted(d for d in dirnames if d not in IGNORED_DIRS)
        for name in sorted(filenames):
            count += 1
            if count > max_files:
                return
            yield name if rel_dir == "." else "%s/%s" % (rel_dir, name)


def is_test(rel):
    parts = rel.split("/")
    return bool(TEST_NAME.search(parts[-1])) or any(p in TEST_DIRS or p.endswith(".Tests") for p in parts[:-1])


def detect_stack(root, manifests, files):
    """-> (profile id or "custom", why). Only names a stack profile this framework ships."""
    if any(m.endswith(MANIFEST_SUFFIXES) for m in manifests):
        aspire = any("Aspire" in read_text(os.path.join(root, m)) for m in manifests if m.endswith(".csproj"))
        apphost = any("AppHost" in f for f in files)
        if aspire or apphost:
            return "dotnet-aspire", "a .csproj references Aspire, or an AppHost project exists"
        return "custom", ".NET without Aspire: no shipped profile matches"
    py = "\n".join(read_text(os.path.join(root, m)) for m in manifests if m.split("/")[-1] in
                   ("pyproject.toml", "requirements.txt", "Pipfile", "setup.py"))
    if re.search(r"(?i)\bfastapi\b", py):
        return "python-fastapi", "a Python manifest lists fastapi"
    for m in manifests:
        if m.split("/")[-1] == "package.json":
            pkg = read_json(os.path.join(root, m)) or {}
            deps = {**(pkg.get("dependencies") or {}), **(pkg.get("devDependencies") or {})}
            if "typescript" in deps or any(f.endswith((".ts", ".tsx")) for f in files):
                return "web-fullstack-node", "package.json with TypeScript"
    return "custom", "no shipped stack profile matches the manifests"


def propose_commands(root, manifests, stack):
    out = {"test": "", "lint": "", "format": "", "lintFile": ""}
    pkg = read_json(os.path.join(root, "package.json")) if "package.json" in manifests else None
    if pkg:
        scripts = pkg.get("scripts") or {}
        runner = "pnpm" if os.path.exists(os.path.join(root, "pnpm-lock.yaml")) else (
            "yarn" if os.path.exists(os.path.join(root, "yarn.lock")) else "npm")
        if "test" in scripts:
            out["test"] = "%s test" % runner
        if "lint" in scripts:
            out["lint"] = "%s run lint" % runner
        for key in ("format:check", "fmt:check", "prettier:check"):
            if key in scripts:
                out["format"] = "%s run %s" % (runner, key)
                break
        deps = {**(pkg.get("dependencies") or {}), **(pkg.get("devDependencies") or {})}
        if "eslint" in deps:
            out["lintFile"] = "npx eslint {file}"
        return out
    pyproject = read_text(os.path.join(root, "pyproject.toml"))
    if pyproject or "requirements.txt" in manifests:
        prefix = "uv run " if os.path.exists(os.path.join(root, "uv.lock")) else (
            "poetry run " if "[tool.poetry]" in pyproject else "")
        if "pytest" in pyproject or os.path.isdir(os.path.join(root, "tests")):
            out["test"] = prefix + "pytest"
        if "ruff" in pyproject or os.path.exists(os.path.join(root, "ruff.toml")):
            out["lint"] = prefix + "ruff check ."
            out["format"] = prefix + "ruff format --check ."
            out["lintFile"] = prefix + "ruff check {file}"
        return out
    if any(m.endswith(MANIFEST_SUFFIXES) for m in manifests):
        return {"test": "dotnet test", "lint": "dotnet build -warnaserror", "format": "dotnet format --verify-no-changes", "lintFile": ""}
    if "go.mod" in manifests:
        return {"test": "go test ./...", "lint": "go vet ./...", "format": "", "lintFile": ""}
    if "Cargo.toml" in manifests:
        return {"test": "cargo test", "lint": "cargo clippy -- -D warnings", "format": "cargo fmt --check", "lintFile": ""}
    return out


def scan(root):
    root = os.path.abspath(root)
    files = list(walk(root))
    own = [f for f in files if f.split("/")[0] not in FRAMEWORK_DIRS]

    languages = collections.Counter()
    by_top = collections.Counter()
    code_by_top = collections.Counter()
    code, tests = [], []
    for rel in own:
        top = rel.split("/")[0] if "/" in rel else "."
        by_top[top] += 1
        lang = LANGUAGES.get(os.path.splitext(rel)[1].lower())
        if not lang:
            continue
        languages[lang] += 1
        if is_test(rel):
            tests.append(rel)
        else:
            code.append(rel)
            code_by_top[top] += 1

    manifests = sorted(f for f in own if f.count("/") <= 2 and (f.split("/")[-1] in MANIFESTS or f.endswith(MANIFEST_SUFFIXES)))
    stack, stack_why = detect_stack(root, manifests, own)

    reasons = []
    if code:
        reasons.append("%d source file(s), e.g. %s" % (len(code), code[0]))
    if manifests:
        reasons.append("manifest(s): %s" % ", ".join(manifests[:4]))
    mode = "brownfield" if reasons else "greenfield"
    if not reasons:
        reasons.append("no source files and no package manifest")

    source_dirs = [d for d in SOURCE_DIR_HINTS if code_by_top.get(d)]
    source_dirs += [d for d, n in code_by_top.most_common() if d not in source_dirs and d != "." and n >= 3
                    and d not in TEST_DIRS]
    test_dirs = sorted({rel.split("/")[0] for rel in tests if rel.split("/")[0] in TEST_DIRS})
    test_globs = ["%s/**" % d for d in test_dirs]
    seen_patterns = set()
    for rel in tests:
        name = rel.split("/")[-1]
        for rx, glob in ((r"^test_.*\.py$", "**/test_*.py"), (r"_test\.py$", "**/*_test.py"), (r"_test\.go$", "**/*_test.go"),
                         (r"\.test\.", "**/*.test.*"), (r"\.spec\.", "**/*.spec.*"), (r"Tests?\.cs$", "**/*Tests.cs"),
                         (r"Tests?\.(java|kt)$", "**/*Test.*"), (r"_spec\.rb$", "**/*_spec.rb")):
            if re.search(rx, name) and glob not in seen_patterns:
                seen_patterns.add(glob)
                test_globs.append(glob)
    for rel in tests:
        for part in rel.split("/")[:-1]:
            if part.endswith(".Tests") and "**/*.Tests/**" not in test_globs:
                test_globs.append("**/*.Tests/**")

    brief = {
        "root": root,
        "mode": mode,
        "modeReasons": reasons,
        "stack": stack,
        "stackReason": stack_why,
        "proposed": {
            "sourceGlobs": ["%s/**" % d for d in source_dirs[:8]],
            "testGlobs": test_globs,
            "commands": propose_commands(root, manifests, stack),
        },
    }

    workflows = sorted(f for f in files if f.startswith(".github/workflows/"))
    ci = workflows + [f for f in CI_FILES if os.path.exists(os.path.join(root, f))]
    full = dict(brief)
    full.update({
        "counts": {"files": len(own), "source": len(code), "test": len(tests),
                   "testToSourceRatio": round(len(tests) / len(code), 2) if code else None},
        "languages": [{"language": l, "files": n} for l, n in languages.most_common()],
        "manifests": manifests,
        "topLevel": [{"path": d, "files": n, "sourceFiles": code_by_top.get(d, 0)} for d, n in sorted(by_top.items())],
        "tests": {"directories": test_dirs, "sample": tests[:10]},
        "ci": ci,
        "lintAndFormatConfigs": [f for f in LINT_FILES if os.path.exists(os.path.join(root, f))],
        "docs": [f for f in DOC_FILES if os.path.exists(os.path.join(root, f))],
        "adrDirectories": [d for d in ("docs/adr", "docs/adrs", "docs/decisions", "adr", "doc/adr") if os.path.isdir(os.path.join(root, d))],
        "containers": [f for f in own if f.split("/")[-1] in ("Dockerfile", "docker-compose.yml", "compose.yaml", "compose.yml")][:10],
        "git": git_facts(root),
    })
    return brief, full


def git_facts(root):
    if git(root, "rev-parse", "--is-inside-work-tree") is None:
        return None
    count = (git(root, "rev-list", "--count", "HEAD") or "0").strip()
    authors = git(root, "shortlog", "-sn", "HEAD") or ""
    names = git(root, "log", "-n", "500", "--format=", "--name-only") or ""
    hot = collections.Counter(l for l in names.split("\n") if l.strip())
    return {
        "commits": int(count) if count.isdigit() else 0,
        "contributors": len([l for l in authors.split("\n") if l.strip()]),
        "firstCommit": (git(root, "log", "--reverse", "--format=%cs") or "").split("\n")[0] or None,
        "lastCommit": (git(root, "log", "-1", "--format=%cs") or "").strip() or None,
        "branch": (git(root, "rev-parse", "--abbrev-ref", "HEAD") or "").strip() or None,
        "mostChangedFiles": [{"path": p, "changes": n} for p, n in hot.most_common(15)],
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Scan a repository for facts the discover phase needs.")
    ap.add_argument("dir", nargs="?", default=".")
    ap.add_argument("--brief", action="store_true")
    args = ap.parse_args(argv)
    if not os.path.isdir(args.dir):
        print(json.dumps({"root": os.path.abspath(args.dir), "mode": "greenfield", "modeReasons": ["the directory does not exist yet"],
                          "stack": "custom", "stackReason": "nothing to scan",
                          "proposed": {"sourceGlobs": [], "testGlobs": [], "commands": {"test": "", "lint": "", "format": "", "lintFile": ""}}}, indent=2))
        return 0
    brief, full = scan(args.dir)
    print(json.dumps(brief if args.brief else full, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
