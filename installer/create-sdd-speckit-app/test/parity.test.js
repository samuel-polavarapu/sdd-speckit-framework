import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, cli, have, snapshot, tmp } from "./helpers.js";

const skip = !(have("bash") && have("python3") && have("curl")) && "bash, python3 and curl are needed";
const RECORD = ".specify/sdd-speckit.json";
// The only differences allowed: who wrote the record, and what the Node path notes about `specify init`.
const ONLY_NODE = ["speckitDelegated", "speckitFallbackReason"];

function bash(dir, args) {
  return spawnSync("bash", [join(ROOT, "installer", "install.sh"), dir, "--no-node", ...args], { encoding: "utf8" });
}

function normalised(dir) {
  const files = snapshot(dir);
  const record = JSON.parse(files[RECORD]);
  delete record.generatedBy;
  for (const k of ONLY_NODE) delete record[k];
  delete files[RECORD];
  return { files, record };
}

const CASES = {
  "greenfield, industry, stack, both assistants": [
    "--mode=greenfield", "--industry=healthcare", "--stack=python-fastapi", "--assistant=both", "--mcp=github", "--gate=lint-format=warn",
  ],
  "detected mode, Copilot only, telemetry, JetBrains": [
    "--telemetry=on", "--otel-endpoint=http://localhost:4317", "--editor=jetbrains", "--assistant=copilot", "--gates=warn", "--industry=financial-services",
  ],
  "Factory Droid primary, Copilot secondary": [
    "--assistant=factory", "--secondary-assistants=copilot", "--industry=public-sector", "--stack=dotnet-aspire",
  ],
  "no flags at all": [],
};

for (const [name, flags] of Object.entries(CASES)) {
  test(`install.sh writes what create-sdd-speckit-app writes: ${name}`, { skip }, () => {
    const args = ["--yes", "--no-speckit", ...flags];
    const viaNode = tmp("sdd-node-");
    const viaBash = tmp("sdd-bash-");
    const n = cli([viaNode, ...args]);
    assert.equal(n.status, 0, n.stderr);
    const b = bash(viaBash, args);
    assert.equal(b.status, 0, b.stdout + b.stderr);

    const left = normalised(viaNode);
    const right = normalised(viaBash);
    assert.deepEqual(Object.keys(right.files), Object.keys(left.files));
    for (const f of Object.keys(left.files)) assert.equal(right.files[f], left.files[f], f);
    assert.deepEqual(right.record, left.record);
  });
}

test("install.sh keeps earlier answers on a second run, as the Node installer does", { skip }, () => {
  const dir = tmp("sdd-bash-");
  const first = ["--yes", "--no-speckit", "--mode=brownfield", "--industry=general-saas", "--stack=web-fullstack-node", "--editor=none"];
  assert.equal(bash(dir, first).status, 0);
  assert.equal(bash(dir, ["--yes", "--no-speckit", "--gate=test-first=block"]).status, 0);
  const record = JSON.parse(readFileSync(join(dir, RECORD), "utf8"));
  assert.equal(record.mode, "brownfield");
  assert.equal(record.industry, "general-saas");
  assert.equal(record.stack, "web-fullstack-node");
  assert.equal(record.editor, "none");
  assert.equal(record.harness.gates["test-first"], "block");
  assert.equal(record.harness.gates["spec-before-code"], "warn");
});

test("install.sh rejects an unknown profile or gate before it writes", { skip }, () => {
  for (const flag of ["--industry=nope", "--stack=cobol", "--mode=legacy", "--gate=test-first=loud", "--gates=strict"]) {
    const dir = tmp("sdd-bash-");
    const r = bash(dir, ["--yes", "--no-speckit", flag]);
    assert.equal(r.status, 1, flag);
    assert.deepEqual(readdirSync(dir), [], flag);
  }
});
