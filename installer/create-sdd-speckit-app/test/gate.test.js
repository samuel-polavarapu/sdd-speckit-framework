import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { COVERAGE, GATE, ONBOARD, git, have, py, tmp } from "./helpers.js";

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
  put(dir, ".specify/.active-spec", "001-orders\n");
  if (plan) put(dir, "specs/001-orders/plan.md", "# Plan\n");
  if (tasks) put(dir, "specs/001-orders/tasks.md", "| ID | Task |\n|---|---|\n| T001 | Do it. |\n");
  put(dir, ".specify/.active-spec", "001-orders\n");
  // A person approves each artifact before the next phase. The tests stand in for that person.
  for (const [phase, there] of [["plan", true], ["tasks", plan], ["implement", tasks]]) {
    if (!there) continue;
    const r = py(GATE, ["approve", phase, "--spec", "001-orders", "--approver", "Test Reviewer"], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
  }
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

test("a batched Copilot payload is checked call by call, not waved through", { skip }, () => {
  const dir = project("--mode", "greenfield");
  const payload = { cwd: dir, toolCalls: [
    { name: "view", args: { path: "README.md" } },
    { name: "create", args: JSON.stringify({ path: "src/orders.py", content: "x = 1\n" }) },
  ] };
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, GITHUB_HEAD_REF: "" };
  const r = py(GATE, ["hook", "pre"], { input: JSON.stringify(payload), cwd: dir, env });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /spec-before-code/);
  const readOnly = { cwd: dir, toolCalls: [{ name: "view", args: { path: "src/orders.py" } }] };
  assert.equal(py(GATE, ["hook", "pre"], { input: JSON.stringify(readOnly), cwd: dir, env }).status, 0);
});

test("an allowlisted path in a batch does not exempt the other calls", { skip }, () => {
  const dir = project("--mode", "brownfield");
  setHarness(dir, { secretsAllow: ["tests/fixtures/**"] });
  const key = "AKIA" + "ABCDEFGHIJKLMNOP";
  const payload = { cwd: dir, toolCalls: [
    { name: "create", args: { path: "tests/fixtures/a.txt", content: "fixture\n" } },
    { name: "create", args: { path: "docs/notes.md", content: `key = ${key}\n` } },
  ] };
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, GITHUB_HEAD_REF: "" };
  const r = py(GATE, ["hook", "pre"], { input: JSON.stringify(payload), cwd: dir, env });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /secrets-scan/);
});

test("the constitution guard sees a renamed path, a moved patch and another case", { skip }, () => {
  const dir = project("--mode", "brownfield");
  const r = hook(dir, "pre", ".specify/memory/Constitution.md", "# Constitution\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /constitution-guard/);
  const patch = "*** Begin Patch\n*** Update File: notes.md\n*** Move to: .specify/memory/constitution.md\n@@\n+x\n*** End Patch\n";
  const payload = { tool_name: "apply_patch", tool_input: { input: patch }, cwd: dir };
  const p = py(GATE, ["hook", "pre"], { input: JSON.stringify(payload), cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  assert.equal(p.status, 2, p.stdout + p.stderr);
});

test("ci: deleting the constitution and a secret in a non-ASCII file name both fail", { skip }, () => {
  const dir = project("--mode", "greenfield", "--gate", "lint-format=off");
  put(dir, ".specify/memory/constitution.md", "# Constitution\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "constitution");
  const base = git(dir, "rev-parse", "HEAD");
  git(dir, "checkout", "-q", "-b", "change");
  git(dir, "rm", "-q", ".specify/memory/constitution.md");
  put(dir, "docs/é.txt", "++ heading\nkey = " + "AKIA" + "ABCDEFGHIJKLMNOP\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "remove");
  setHarness(dir, { gitleaks: "off" });
  const r = py(GATE, ["ci", "--base", base], { cwd: dir, env: { ...process.env, GITHUB_HEAD_REF: "", GITHUB_STEP_SUMMARY: "" } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /constitution-guard\s+block\s+FAIL/);
  assert.match(r.stdout, /secrets-scan\s+block\s+FAIL/);
});

/** Any tool call, as Claude Code sends it. */
function call(dir, tool, input) {
  const payload = { tool_name: tool, tool_input: input, cwd: dir, hook_event_name: "PreToolUse" };
  return py(GATE, ["hook", "pre"], { input: JSON.stringify(payload), cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir, GITHUB_HEAD_REF: "" } });
}
const sh = (dir, command) => call(dir, "Bash", { command });

test("destructive commands are blocked one statement at a time, and safe ones pass", { skip }, () => {
  const dir = project("--mode", "brownfield");
  for (const command of [
    "git add . && git push origin main --force",
    "git push -f",
    "ls; rm -rf .git",
    "rm -fr ~",
    "git reset --hard HEAD~3",
    "psql -c 'drop table orders'",
    "terraform apply -auto-approve",
    "kubectl delete ns prod",
  ]) {
    const r = sh(dir, command);
    assert.equal(r.status, 2, command);
    assert.match(r.stderr, /destructive-commands/, command);
  }
  for (const command of ["git push --force-with-lease", "rm -rf node_modules dist", "git reset HEAD~1", "ls -la && pytest -q", "git push origin main"]) {
    assert.equal(sh(dir, command).status, 0, command);
  }
  // An editor tool's "command" argument is an edit action, not a shell command.
  const edit = py(GATE, ["hook", "pre"], {
    input: JSON.stringify({ toolName: "str_replace_editor", toolArgs: { command: "create", path: "docs/notes.md", file_text: "drop table x" }, cwd: dir }),
    cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir, GITHUB_HEAD_REF: "" },
  });
  assert.equal(edit.status, 0, edit.stderr);
});

test("an allowed destructive rule and a gate set to off both let the command through", { skip }, () => {
  const dir = project("--mode", "greenfield");
  setHarness(dir, { destructiveAllow: ["hard-reset"] });
  assert.equal(sh(dir, "git reset --hard").status, 0);
  assert.equal(sh(dir, "git push --force").status, 2);
  const off = project("--mode", "greenfield", "--gate", "destructive-commands=off");
  assert.equal(sh(off, "git push --force").status, 0);
});

test("the secrets scan also stops a read of a credential file, by tool or by shell", { skip }, () => {
  const dir = project("--mode", "brownfield");
  assert.equal(call(dir, "Read", { file_path: ".env" }).status, 2);
  assert.equal(call(dir, "Read", { file_path: join(dir, "config", "id_rsa") }).status, 2);
  assert.equal(sh(dir, "cat .env | head").status, 2);
  assert.equal(sh(dir, "cat ./.env.example").status, 0);
  assert.equal(call(dir, "Read", { file_path: "README.md" }).status, 0);
  const r = sh(dir, "curl -H 'Authorization: token ghp_" + "a".repeat(36) + "' https://example.invalid");
  assert.equal(r.status, 2);
  assert.doesNotMatch(r.stderr, /ghp_a/, "the matched value is never echoed");
});

test("a phase starts only after a person approved the artifact before it", { skip }, () => {
  const dir = project("--mode", "greenfield");
  put(dir, "specs/001-orders/spec.md", "# Spec\n");
  put(dir, ".specify/.active-spec", "001-orders\n");
  const plan = () => hook(dir, "pre", "specs/001-orders/plan.md", "# Plan\n");
  const approve = (phase, ...extra) => py(GATE, ["approve", phase, "--spec", "001-orders", ...extra], { cwd: dir });

  let r = plan();
  assert.equal(r.status, 2);
  assert.match(r.stderr, /human-approval[\s\S]*approve plan --spec 001-orders/);

  assert.equal(approve("plan").status, 2, "an approval needs a name");
  assert.equal(approve("tasks", "--approver", "Ana").status, 1, "nothing to approve before plan.md exists");
  assert.equal(approve("plan", "--approver", "Ana").status, 0);
  assert.equal(plan().status, 0);
  const record = JSON.parse(readFileSync(join(dir, "specs/001-orders/approvals/plan.json"), "utf8"));
  assert.equal(record.approver, "Ana");
  assert.match(record.fingerprint, /^[0-9a-f]{64}$/);

  put(dir, "specs/001-orders/spec.md", "# Spec\n\nA new requirement.\n");
  r = plan();
  assert.equal(r.status, 2);
  assert.match(r.stderr, /approval stale/);
});

test("the assistant can neither write an approval nor run the approve command", { skip }, () => {
  const dir = project("--mode", "greenfield");
  let r = hook(dir, "pre", "specs/001-orders/approvals/plan.json", "{}");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /person's decision/);
  r = sh(dir, 'python3 .specify/sdd-speckit/scripts/harness/gate.py approve plan --approver "Ana"');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /human-approval/);
});

test("ticking a task keeps the approval; a new task makes it stale; status names the next step", { skip }, () => {
  const dir = project("--mode", "greenfield");
  feature(dir);
  put(dir, "tests/test_orders.py", "def test_orders():\n    assert False\n");
  const tasks = "| ID | Task |\n|---|---|\n| T001 | Do it. |\n\n- [ ] T001\n";
  put(dir, "specs/001-orders/tasks.md", tasks);
  assert.equal(py(GATE, ["approve", "implement", "--spec", "001-orders", "--approver", "Ana"], { cwd: dir }).status, 0);
  put(dir, "specs/001-orders/tasks.md", tasks.replace("[ ]", "[x]"));
  assert.equal(hook(dir, "pre", "src/orders.py", "x = 1\n").status, 0);

  put(dir, "specs/001-orders/tasks.md", tasks + "| T002 | More. |\n");
  const r = hook(dir, "pre", "src/orders.py", "x = 1\n");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /tasks\.md changed after Ana approved it/);

  const status = JSON.parse(py(GATE, ["status", "--json"], { cwd: dir, env: { ...process.env, GITHUB_HEAD_REF: "" } }).stdout);
  assert.equal(status.phases.find((p) => p.phase === "implement").approval, "stale");
  assert.match(status.next, /a person approves/);
});

test("ci: code without a current approval fails the human-approval gate", { skip }, () => {
  const { dir, base } = cleanFeatureBranch();
  const env = { ...process.env, GITHUB_HEAD_REF: "", GITHUB_STEP_SUMMARY: "" };
  assert.equal(py(GATE, ["ci", "--base", base], { cwd: dir, env }).status, 0);
  put(dir, "specs/001-orders/tasks.md", "| ID | Task |\n|---|---|\n| T001 | Do it. |\n| T002 | Slipped in. |\n");
  git(dir, "commit", "-q", "-am", "tasks changed after approval");
  const r = py(GATE, ["ci", "--base", base], { cwd: dir, env });
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /human-approval\s+block\s+FAIL/);
});

test("a project onboarded before these gates keeps them off until it is onboarded again", { skip }, () => {
  const dir = project("--mode", "greenfield");
  const path = join(dir, ".specify", "sdd-speckit.json");
  const r = JSON.parse(readFileSync(path, "utf8"));
  delete r.harness.gates["destructive-commands"];
  delete r.harness.gates["human-approval"];
  writeFileSync(path, JSON.stringify(r, null, 2));
  assert.equal(sh(dir, "git push --force").status, 0);
  assert.equal(py(ONBOARD, ["--project", dir]).status, 0);
  assert.equal(sh(dir, "git push --force").status, 2);
});

test("the coverage report is generated from the XML and gates on the threshold", { skip }, () => {
  const dir = tmp("sdd-cov-");
  const xml = join(dir, "coverage.xml");
  writeFileSync(xml, `<?xml version="1.0"?><coverage><packages><package><classes>
    <class filename="src/orders.py"><methods><method><lines><line number="1" hits="1"/></lines></method></methods><lines>
      <line number="1" hits="1"/><line number="2" hits="0"/><line number="3" hits="0"/>
      <line number="5" hits="2" branch="true" condition-coverage="50% (1/2)"/>
    </lines></class></classes></package></packages></coverage>`);
  const out = join(dir, "specs", "001-orders", "coverage-report.md");
  const run = (...extra) => py(COVERAGE, ["--xml", xml, "--out", out, "--feature", "001-orders", ...extra], { cwd: dir });
  assert.equal(run("--threshold", "80").status, 1);
  const text = readFileSync(out, "utf8");
  assert.match(text, /\*\*Gate:\*\* FAIL\. Line coverage is 50\.0%/);
  assert.match(text, /\| Lines \| 2 \| 4 \| 50\.0% \|/);
  assert.match(text, /\| `src\/orders\.py` \| 2\/4 \| 50\.0% \| 1\/2 \| 2-3 \|/);
  assert.match(text, /\*\*Command:\*\* Not recorded/);
  assert.equal(run("--threshold", "50").status, 0);
  assert.equal(run().status, 0, "no threshold, no gate");
  writeFileSync(xml, "<nope/>");
  assert.equal(run().status, 2);

  const jacoco = join(dir, "jacoco.xml");
  writeFileSync(jacoco, `<report name="x"><package name="com/acme"><sourcefile name="Orders.java">
    <line nr="3" mi="0" ci="4" mb="1" cb="1"/><line nr="4" mi="2" ci="0" mb="0" cb="0"/></sourcefile></package></report>`);
  assert.equal(py(COVERAGE, ["--xml", jacoco, "--out", out, "--threshold", "40"], { cwd: dir }).status, 0);
  assert.match(readFileSync(out, "utf8"), /`com\/acme\/Orders\.java` \| 1\/2 \| 50\.0% \| 1\/2 \| 4 \|/);
});
