import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, mdFiles } from "./helpers.js";

const readme = readFileSync(join(ROOT, "README.md"), "utf8");

/** The README states component counts in its "What is in the box" table. They must match the directories. */
test("README component counts match the directories", () => {
  const commands = mdFiles(join(ROOT, "commands")).length;
  const agents = mdFiles(join(ROOT, "agents")).length;
  assert.match(readme, new RegExp(`\\| \`commands/\` \\| ${commands} slash commands`), `README commands/ row should say ${commands}`);
  assert.match(readme, new RegExp(`\\| \`agents/\` \\| ${agents} subagents`), `README agents/ row should say ${agents}`);
});

test("every skill directory has a SKILL.md", () => {
  for (const s of readdirSync(join(ROOT, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    assert.ok(readdirSync(join(ROOT, "skills", s.name)).includes("SKILL.md"), `skills/${s.name} has no SKILL.md`);
  }
});
