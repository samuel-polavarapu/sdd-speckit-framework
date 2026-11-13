import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, mdFiles } from "./helpers.js";

const readme = readFileSync(join(ROOT, "README.md"), "utf8");

/** The README states component counts in its table and its tree. Both must match the directories. */
test("README component counts match the directories", () => {
  const commands = mdFiles(join(ROOT, "commands")).length;
  const agents = mdFiles(join(ROOT, "agents")).length;
  assert.match(readme, new RegExp(`\\| Commands \\| ${commands} \\|`), `README Commands row should say ${commands}`);
  assert.match(readme, new RegExp(`\\| Subagents \\| ${agents} \\|`), `README Subagents row should say ${agents}`);
  assert.match(readme, new RegExp(`commands/\\s+${commands} slash commands`), `README tree should say ${commands} slash commands`);
  assert.match(readme, new RegExp(`agents/\\s+${agents} subagents`), `README tree should say ${agents} subagents`);
});

test("every skill directory has a SKILL.md", () => {
  for (const s of readdirSync(join(ROOT, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    assert.ok(readdirSync(join(ROOT, "skills", s.name)).includes("SKILL.md"), `skills/${s.name} has no SKILL.md`);
  }
});
