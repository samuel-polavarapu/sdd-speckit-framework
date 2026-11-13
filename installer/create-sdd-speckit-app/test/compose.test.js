import test from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPOSE, HERE, ONBOARD, ROOT, have, py, tmp } from "./helpers.js";
import { suggestedConnectors } from "../src/mcp-map.js";

const skip = !have("python3") && "python3 is not installed";
const OVERRIDES = join(".specify", "templates", "overrides");
const compose = (dir, ...args) => py(COMPOSE, ["--project", dir, ...args]);
const withoutHeader = (text) => text.split("\n").filter((l) => !l.includes("sdd-speckit:composed")).join("\n");

test("the framework's templates and profiles lint clean", { skip }, () => {
  const r = py(COMPOSE, ["--lint", "--json"]);
  const out = JSON.parse(r.stdout);
  assert.deepEqual(out.problems, []);
  const industries = readdirSync(join(ROOT, "profiles", "industries")).filter((d) => !d.startsWith(".")).length;
  const stacks = readdirSync(join(ROOT, "profiles", "stacks")).filter((d) => !d.startsWith(".")).length;
  assert.equal(out.combinations, (industries + 1) * (stacks + 1));
});

test("a stack-only composition equals the 0.2 preset templates", { skip }, () => {
  const fixtures = join(HERE, "fixtures", "presets-0.2");
  for (const stack of readdirSync(fixtures).filter((d) => !d.startsWith("."))) {
    const dir = tmp();
    assert.equal(compose(dir, "--stack", stack).status, 0);
    for (const f of ["plan-template.md", "tasks-template.md"]) {
      assert.equal(
        withoutHeader(readFileSync(join(dir, OVERRIDES, f), "utf8")),
        readFileSync(join(fixtures, stack, f), "utf8"),
        `${stack}/${f}`
      );
    }
  }
});

test("an industry and a stack compose into one file with no slot marker left", { skip }, () => {
  const dir = tmp();
  const r = compose(dir, "--industry", "healthcare", "--stack", "python-fastapi", "--targets", "claude,copilot");
  assert.equal(r.status, 0, r.stderr);
  const tasks = readFileSync(join(dir, OVERRIDES, "tasks-template.md"), "utf8");
  assert.match(tasks, /^\| R001 \|/m, "regulatory task block");
  assert.match(tasks, /^\| S001 \|/m, "stack task block");
  assert.ok(tasks.indexOf("| R001 |") < tasks.indexOf("| S001 |"), "industry layer comes before the stack layer");
  const constitution = readFileSync(join(dir, OVERRIDES, "constitution-template.md"), "utf8");
  assert.match(constitution, /^\| G-HC-1 \|/m);
  assert.match(constitution, /^## Annex R — Regulatory controls/m);
  assert.ok(existsSync(join(dir, OVERRIDES, "checklists", "hipaa-safeguards-template.md")), "the profile's own checklist");
  for (const f of ["tasks-template.md", "constitution-template.md", "plan-template.md", "spec-template.md"]) {
    assert.doesNotMatch(readFileSync(join(dir, OVERRIDES, f), "utf8"), /^(<!-- |# )@?slot[: ]/m, f);
  }
  assert.ok(existsSync(join(dir, "AGENTS.md")));
  assert.ok(existsSync(join(dir, "CLAUDE.md")));
});

test("the spec template stays free of stack content", { skip }, () => {
  const dir = tmp();
  assert.equal(compose(dir, "--stack", "python-fastapi").status, 0);
  assert.ok(!existsSync(join(dir, OVERRIDES, "spec-template.md")), "a stack alone does not overlay the spec");
});

test("--check passes after a compose and fails after a composed file changes", { skip }, () => {
  const dir = tmp();
  const args = ["--industry", "general-saas", "--stack", "web-fullstack-node"];
  assert.equal(compose(dir, ...args).status, 0);
  assert.equal(compose(dir, ...args, "--check").status, 0);
  appendFileSync(join(dir, OVERRIDES, "plan-template.md"), "\nedited\n");
  assert.equal(compose(dir, ...args, "--check").status, 1);
});

test("composing twice changes nothing, and a dropped profile removes its overrides", { skip }, () => {
  const dir = tmp();
  const args = ["--industry", "public-sector", "--stack", "dotnet-aspire"];
  assert.equal(compose(dir, ...args).status, 0);
  const again = JSON.parse(compose(dir, ...args, "--json").stdout);
  assert.deepEqual(again.actions.filter((a) => a.action === "write" || a.action === "remove"), []);
  assert.equal(compose(dir, "--industry", "none", "--stack", "dotnet-aspire").status, 0);
  assert.doesNotMatch(readFileSync(join(dir, OVERRIDES, "constitution-template.md"), "utf8"), /Annex R|G-PS-/);
  assert.ok(!existsSync(join(dir, OVERRIDES, "checklists", "ato-readiness-template.md")));
  assert.ok(existsSync(join(dir, OVERRIDES, "plan-template.md")));
  assert.equal(compose(dir, "--industry", "none", "--stack", "custom").status, 0);
  assert.ok(!existsSync(join(dir, OVERRIDES, "constitution-template.md")), "no profile, no override");
});

test("an existing AGENTS.md keeps its text, and a hand-edited override is kept", { skip }, () => {
  const dir = tmp();
  writeFileSync(join(dir, "AGENTS.md"), "# Team notes\n\nKeep me.\n");
  assert.equal(compose(dir, "--stack", "python-fastapi").status, 0);
  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /^# Team notes\n\nKeep me\.\n/);
  assert.match(agents, /sdd-speckit:begin[\s\S]*sdd-speckit:end/);

  const plan = join(dir, OVERRIDES, "plan-template.md");
  writeFileSync(plan, "# Our own plan template\n");
  const r = JSON.parse(compose(dir, "--stack", "python-fastapi", "--json").stdout);
  assert.equal(r.actions.find((a) => a.path.endsWith("overrides/plan-template.md")).action, "skip-edited");
  assert.equal(readFileSync(plan, "utf8"), "# Our own plan template\n");
});

test("a project-local fragment is the last layer, and an unknown slot is an error", { skip }, () => {
  const dir = tmp();
  const local = join(dir, ".specify", "templates", "fragments");
  mkdirSync(local, { recursive: true });
  writeFileSync(join(local, "spec-template.md"), "<!-- @slot nfr-rows -->\n| NFR-LOC-01 | Local rule. | [Target.] | [Where.] |\n");
  assert.equal(compose(dir, "--industry", "healthcare").status, 0);
  const spec = readFileSync(join(dir, OVERRIDES, "spec-template.md"), "utf8");
  assert.ok(spec.indexOf("| NFR-HC-01 |") < spec.indexOf("| NFR-LOC-01 |"));

  writeFileSync(join(local, "spec-template.md"), "<!-- @slot no-such-slot -->\ntext\n");
  const bad = compose(dir, "--industry", "healthcare");
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /no-such-slot/);
});

test("a stack profile's defaults reach the constitution annex and AGENTS.md", { skip }, () => {
  const dir = tmp();
  assert.equal(compose(dir, "--industry", "healthcare", "--stack", "python-fastapi").status, 0);
  const constitution = readFileSync(join(dir, OVERRIDES, "constitution-template.md"), "utf8");
  assert.match(constitution, /^## Annex T — Technology standards \(Python service \(FastAPI\)\)/m);
  assert.match(constitution, /^\| Unit tests \| pytest \|$/m);
  assert.ok(constitution.indexOf("## Annex R") < constitution.indexOf("## Annex T"), "regulatory annex first");
  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /^### Technology\n[\s\S]*^\| Language \| Python 3\.12 \|$/m);
  assert.ok(agents.indexOf("### Technology") < agents.indexOf("### Build, test and lint"));

  const bare = tmp();
  assert.equal(compose(bare, "--stack", "custom").status, 0);
  assert.doesNotMatch(readFileSync(join(bare, "AGENTS.md"), "utf8"), /### Technology/);
});

test("onboarding records the industry's checklist kinds, or the base kinds", { skip }, () => {
  const kinds = (industry) => {
    const dir = tmp();
    const r = py(ONBOARD, ["--project", dir, "--industry", industry, "--stack", "custom"]);
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(readFileSync(join(dir, ".specify", "sdd-speckit.json"), "utf8")).checklistKinds;
  };
  assert.deepEqual(kinds("none"), ["accessibility", "privacy", "release", "requirements", "security"]);
  const fs = kinds("financial-services");
  assert.ok(fs.includes("pci-scope") && fs.includes("sox-change") && fs.includes("security"));
});

test("a stack's recommended connectors are suggested only when they need nothing first", () => {
  assert.deepEqual(suggestedConnectors(ROOT, "web-fullstack-node"), ["github", "figma", "playwright"]);
  assert.deepEqual(suggestedConnectors(ROOT, "custom"), []);
  assert.deepEqual(suggestedConnectors(ROOT, undefined), []);
});
