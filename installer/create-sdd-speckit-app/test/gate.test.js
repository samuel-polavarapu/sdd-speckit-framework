import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { GATE, ONBOARD, git, have, py, tmp } from "./helpers.js";

const skip = !(have("python3") && have("git")) && "python3 and git are needed";

/** A git repository onboarded with the given flags. */
function project(...flags) {
  const dir = tmp("sdd-gate-");
  git(dir, "init", "-q", "-b", "main");
  const r = py(ONBOARD, ["--project", dir, "--stack", "python-fastapi", ...flags]);
  assert.equal(r.status, 0, r.stderr);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "onboard");
  return dir;
}

function put(dir, rel, text) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
}

function hook(dir, stage, rel, content, extra = {}) {
  const payload = { tool_name: "Write", tool_input: { file_path: rel, content }, cwd: dir, ...extra };
  return py(GATE, ["hook", stage], { input: JSON.stringify(payload), cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir, GITHUB_HEAD_REF: "" } });
}

function feature(dir, { plan = true, tasks = true } = {}) {
  put(dir, "specs/001-orders/spec.md", "# Spec\n");
  if (plan) put(dir, "specs/001-orders/plan.md", "# Plan\n");
  if (tasks) put(dir, "specs/001-orders/tasks.md", "| ID | Task |\n|---|---|\n| T001 | Do it. |\n");
  put(dir, ".specify/.active-spec", "001-orders\n");
}

test("greenfield: a source write with no active feature is blocked", { skip }, () => {
  const dir = project("--mode", "greenfield");
  const r = hook(dir, "pre", "src/orders.py", "x = 1\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /spec-before-code/);
  assert.equal(JSON.parse(r.stdout).permissionDecision, "deny");
});

test("greenfield: each missing artifact is named, and a complete feature passes", { skip }, () => {
  const dir = project("--mode", "greenfield");
  feature(dir, { plan: false, tasks: false });
  let r = hook(dir, "pre", "src/orders.py", "x = 1\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /plan\.md/);

  feature(dir, { tasks: false });
  r = hook(dir, "pre", "src/orders.py", "x = 1\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /tasks-before-implement/);

  feature(dir);
  r = hook(dir, "pre", "src/orders.py", "x = 1\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /test-first/);

  put(dir, "tests/test_orders.py", "def test_orders():\n    assert False\n");
  r = hook(dir, "pre", "src/orders.py", "x = 1\n");
  assert.equal(r.status, 0, r.stderr);
});

test("a baseline spec never counts as the active feature", { skip }, () => {
  const dir = project("--mode", "greenfield");
  put(dir, "specs/_baseline/orders/spec.md", "# Baseline\n");
  put(dir, "specs/_baseline/orders/plan.md", "# Plan\n");
  put(dir, ".specify/.active-spec", "_baseline/orders\n");
  assert.equal(hook(dir, "pre", "src/orders.py", "x = 1\n").status, 2);
});

test("brownfield: process gates warn and log, and the write goes through", { skip }, () => {
  const dir = project("--mode", "brownfield");
  const r = hook(dir, "pre", "src/orders.py", "x = 1\n", { hook_event_name: "PreToolUse" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(JSON.parse(r.stdout).systemMessage, /spec-before-code/);
  const log = readFileSync(join(dir, ".specify", "harness-log.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.ok(log.some((e) => e.gate === "spec-before-code" && e.mode === "warn"));
});

test("brownfield still blocks a secret and an unguarded constitution write", { skip }, () => {
  const dir = project("--mode", "brownfield");
  const key = "AKIA" + "ABCDEFGHIJKLMNOP";
  let r = hook(dir, "pre", "docs/notes.md", `key = ${key}\n`);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /secrets-scan/);
  assert.equal(hook(dir, "pre", "docs/notes.md", `key = ${key}  # sdd-allow-secret\n`).status, 0);

  r = hook(dir, "pre", ".specify/memory/constitution.md", "# Constitution\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /constitution-guard/);
  put(dir, ".specify/.constitution-unlock", "");
  assert.equal(hook(dir, "pre", ".specify/memory/constitution.md", "# Constitution\n").status, 0);
});

test("an industry profile adds its sensitive patterns to the secrets scan", { skip }, () => {
  const ssn = ["123", "45", "6789"].join("-");
  const plain = project("--mode", "brownfield");
  assert.equal(hook(plain, "pre", "docs/notes.md", `id ${ssn}\n`).status, 0);
  const hc = project("--mode", "brownfield", "--industry", "healthcare");
  const r = hook(hc, "pre", "docs/notes.md", `id ${ssn}\n`);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /us-ssn/);
});

test("gates set to off do nothing, and an unreadable payload never blocks", { skip }, () => {
  const dir = project("--mode", "greenfield", "--gates", "off");
  assert.equal(hook(dir, "pre", "src/orders.py", "x = 1\n").status, 0);
  const strict = project("--mode", "greenfield");
  const r = py(GATE, ["hook", "pre"], { input: "not json", cwd: strict });
  assert.equal(r.status, 0);
});

test("ci: the same gates fail a pull request in block mode and pass it in warn mode", { skip }, () => {
  for (const [mode, status] of [["greenfield", 1], ["brownfield", 0]]) {
    // lint-format is off here: it would run the stack's real lint command.
    const dir = project("--mode", mode, "--gate", "lint-format=off");
    const base = git(dir, "rev-parse", "HEAD");
    git(dir, "checkout", "-q", "-b", "change");
    put(dir, "src/orders.py", "x = 1\n");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "code first");
    const r = py(GATE, ["ci", "--base", base], { cwd: dir, env: { ...process.env, GITHUB_HEAD_REF: "", GITHUB_STEP_SUMMARY: "" } });
    assert.equal(r.status, status, r.stdout + r.stderr);
    assert.match(r.stdout, /spec-before-code\s+(block|warn)\s+(FAIL|warn)/);
    assert.match(r.stdout, /test-first/);
  }
});

test("ci: a feature branch with spec, plan, tasks and a test first passes", { skip }, () => {
  const dir = project("--mode", "greenfield", "--gate", "lint-format=off");
  const base = git(dir, "rev-parse", "HEAD");
  git(dir, "checkout", "-q", "-b", "001-orders");
  feature(dir);
  put(dir, "tests/test_orders.py", "def test_orders():\n    assert True\n");
  git(dir, "add", "-A", "--", "specs", "tests");
  git(dir, "commit", "-q", "-m", "spec, plan, tasks and the failing test");
  put(dir, "src/orders.py", "x = 1\n");
  git(dir, "add", "-A", "--", "src");
  git(dir, "commit", "-q", "-m", "implementation");
  const r = py(GATE, ["ci", "--base", base], { cwd: dir, env: { ...process.env, GITHUB_HEAD_REF: "", GITHUB_STEP_SUMMARY: "" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(!existsSync(join(dir, ".specify", ".constitution-unlock")));
});

/** A stand-in gitleaks that takes only the old `detect` form and reports one finding. */
function fakeGitleaks() {
  const bin = tmp("sdd-bin-");
  const exe = join(bin, "gitleaks");
  writeFileSync(exe, [
    "#!/usr/bin/env bash",
    '[ "$1" = "detect" ] || { echo "unknown command \\"$1\\"" >&2; exit 1; }',
    'while [ $# -gt 0 ]; do [ "$1" = "--report-path" ] && report="$2"; shift; done',
    `printf '%s' '[{"RuleID":"generic-api-key","File":"src/orders.py","StartLine":1,"Secret":"REDACTED"}]' > "$report"`,
    "",
  ].join("\n"));
  chmodSync(exe, 0o755);
  return bin;
}

function cleanFeatureBranch() {
  const dir = project("--mode", "greenfield", "--gate", "lint-format=off");
  const base = git(dir, "rev-parse", "HEAD");
  git(dir, "checkout", "-q", "-b", "001-orders");
  feature(dir);
  put(dir, "tests/test_orders.py", "def test_orders():\n    assert True\n");
  put(dir, "src/orders.py", "x = 1\n");
  git(dir, "add", "-A", "--", "specs", "tests", "src");
  git(dir, "commit", "-q", "-m", "feature");
  return { dir, base };
}

const record = (dir) => join(dir, ".specify", "sdd-speckit.json");
function setHarness(dir, patch) {
  const r = JSON.parse(readFileSync(record(dir), "utf8"));
  Object.assign(r.harness, patch);
  writeFileSync(record(dir), JSON.stringify(r, null, 2));
}

test("ci: gitleaks findings join the secrets scan, and secretsAllow drops them", { skip: skip || process.platform === "win32" }, () => {
  const { dir, base } = cleanFeatureBranch();
  const env = { ...process.env, GITHUB_HEAD_REF: "", GITHUB_STEP_SUMMARY: "", PATH: fakeGitleaks() + delimiter + process.env.PATH };
  const run = () => py(GATE, ["ci", "--base", base], { cwd: dir, env });

  let r = run();
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /src\/orders\.py: gitleaks rule generic-api-key/);
  assert.match(r.stdout, /secrets-scan\s+block\s+FAIL/);

  setHarness(dir, { secretsAllow: ["generic-api-key"] });
  r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);

  setHarness(dir, { secretsAllow: [], gitleaks: "off" });
  r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /gitleaks: off/);
});

test("ci: gitleaks set to required fails when the binary is missing", { skip: skip || (have("gitleaks", ["version"]) && "gitleaks is installed") }, () => {
  const { dir, base } = cleanFeatureBranch();
  const env = { ...process.env, GITHUB_HEAD_REF: "", GITHUB_STEP_SUMMARY: "" };
  assert.equal(py(GATE, ["ci", "--base", base], { cwd: dir, env }).status, 0, "auto skips a missing gitleaks");
  setHarness(dir, { gitleaks: "required" });
  const r = py(GATE, ["ci", "--base", base], { cwd: dir, env });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /gitleaks is required/);
});
