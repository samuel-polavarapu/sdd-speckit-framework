import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAdapter, parseFrontmatter } from "../src/copilot.js";
import { ROOT, mdFiles } from "./helpers.js";

/** Every source the Copilot renderer parses: a dropped frontmatter line is silent there. */
function sources() {
  const out = [];
  for (const d of ["commands", "agents"]) for (const f of mdFiles(join(ROOT, d))) out.push(join(d, f));
  for (const s of readdirSync(join(ROOT, "skills"))) {
    if (existsSync(join(ROOT, "skills", s, "SKILL.md"))) out.push(join("skills", s, "SKILL.md"));
  }
  return out;
}

test("frontmatter is flat key: value, so the renderer drops nothing", () => {
  for (const rel of sources()) {
    const text = readFileSync(join(ROOT, rel), "utf8");
    const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
    assert.ok(m, `${rel}: no frontmatter`);
    const lines = m[1].split("\n").filter((l) => l.trim());
    const { data } = parseFrontmatter(text);
    assert.equal(Object.keys(data).length, lines.length, `${rel}: a frontmatter line is nested, multi-line or duplicated`);
    assert.ok(data.name, `${rel}: name is missing`);
    assert.ok(data.description, `${rel}: description is missing`);
  }
});

test("every command has a routing entry, and every routing entry has a command", () => {
  const routing = Object.keys(loadAdapter(ROOT).routing).filter((k) => !k.startsWith("$"));
  const commands = mdFiles(join(ROOT, "commands")).map((f) => f.replace(/\.md$/, ""));
  assert.deepEqual([...routing].sort(), [...commands].sort());
});

test("routing names only agents that exist", () => {
  const agents = new Set(mdFiles(join(ROOT, "agents")).map((f) => f.replace(/\.md$/, "")));
  for (const [cmd, r] of Object.entries(loadAdapter(ROOT).routing)) {
    if (cmd.startsWith("$")) continue;
    for (const a of r.agents) assert.ok(agents.has(a), `${cmd} routes to unknown agent ${a}`);
  }
});
