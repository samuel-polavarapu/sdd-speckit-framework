import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cli, snapshot, tmp } from "./helpers.js";

const BASE = ["--yes", "--no-speckit"];

test("--dry-run writes nothing", () => {
  const dir = tmp();
  const r = cli([dir, ...BASE, "--dry-run", "--stack=python-fastapi"]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readdirSync(dir), []);
});

test("a Claude Code scaffold writes the config record and the framework files", () => {
  const dir = tmp();
  const r = cli([dir, ...BASE, "--stack=python-fastapi", "--mcp=github"]);
  assert.equal(r.status, 0, r.stderr);
  const record = JSON.parse(readFileSync(join(dir, ".specify", "sdd-speckit.json"), "utf8"));
  assert.equal(record.stack, "python-fastapi");
  assert.deepEqual(record.assistant.targets, ["claude"]);
  assert.ok(existsSync(join(dir, ".claude", "sdd-speckit", "commands", "speckit.plan.md")));
  assert.ok(existsSync(join(dir, ".specify", "templates", "overrides", "plan-template.md")));
  assert.ok(existsSync(join(dir, ".mcp.json")));
});

test("--assistant=both writes the Copilot files too", () => {
  const dir = tmp();
  const r = cli([dir, ...BASE, "--assistant=both"]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(dir, ".github", "copilot-instructions.md")));
  assert.ok(existsSync(join(dir, ".github", "skills", "sdd-speckit-plan", "SKILL.md")));
});

test("--assistant=factory sets up Droid without Claude Code files", () => {
  const dir = tmp();
  const r = cli([dir, ...BASE, "--assistant=factory", "--stack=python-fastapi"]);
  assert.equal(r.status, 0, r.stderr);
  const record = JSON.parse(readFileSync(join(dir, ".specify", "sdd-speckit.json"), "utf8"));
  assert.deepEqual(record.assistant.targets, ["factory"]);
  assert.equal(record.assistant.primary, "factory");
  assert.ok(!existsSync(join(dir, ".claude")), ".claude/ is not written for a Droid-only project");
  assert.ok(!existsSync(join(dir, "CLAUDE.md")));
  assert.ok(existsSync(join(dir, "AGENTS.md")));
  assert.ok(existsSync(join(dir, ".specify", "sdd-speckit", "scripts", "harness", "gate.py")));
  assert.match(r.stdout, /droid plugin install sdd-speckit@sdd-speckit-framework --scope project/);
  assert.match(r.stdout, /Factory Droid:\s+\/sdd-speckit-onboard/);
});

test("a second run changes nothing", () => {
  const dir = tmp();
  const args = [dir, ...BASE, "--assistant=both", "--stack=web-fullstack-node", "--mcp=github"];
  assert.equal(cli(args).status, 0);
  const first = snapshot(dir);
  assert.equal(cli(args).status, 0);
  assert.deepEqual(snapshot(dir), first);
});

test("an unknown stack fails before anything is written", () => {
  const dir = tmp();
  const r = cli([dir, ...BASE, "--stack=cobol"]);
  assert.equal(r.status, 1);
  assert.deepEqual(readdirSync(dir), []);
});
