import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { checkFactory, loadFactoryAdapter, mapDroidTools, renderFactory } from "../src/factory.js";
import { parseFrontmatter } from "../src/copilot.js";
import { ROOT, cli, have, mdFiles, tmp } from "./helpers.js";

const DIST = join(ROOT, "adapters", "factory", "dist");
const files = renderFactory(ROOT);
const byPath = new Map(files.map((f) => [f.path, f.content.toString("utf8")]));

// Droid's documented tool ids. An unknown id in a droid's `tools` is a validation error.
const DROID_TOOLS = new Set(["Read", "LS", "Grep", "Glob", "Create", "Edit", "ApplyPatch", "Execute", "FetchUrl", "WebSearch"]);

test("the committed plugin in adapters/factory/dist matches a fresh render", () => {
  assert.deepEqual(checkFactory(DIST, files), [], "run: npm run render:factory");
});

test("the root marketplace points Droid at the rendered plugin", () => {
  const market = JSON.parse(readFileSync(join(ROOT, ".factory-plugin", "marketplace.json"), "utf8"));
  const adapter = loadFactoryAdapter(ROOT);
  const entry = market.plugins.find((p) => p.name === adapter.pluginName);
  assert.ok(entry, `marketplace lists ${adapter.pluginName}`);
  assert.equal(entry.source, "./adapters/factory/dist");
  assert.ok(existsSync(join(ROOT, entry.source, ".factory-plugin", "plugin.json")));
  const claudeMarket = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "marketplace.json"), "utf8"));
  assert.equal(market.name, claudeMarket.name, "both marketplaces install as <plugin>@sdd-speckit-framework");
});

test("plugin.json carries the Claude plugin's version", () => {
  const claude = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf8"));
  const droid = JSON.parse(byPath.get(".factory-plugin/plugin.json"));
  assert.equal(droid.version, claude.version);
  assert.equal(droid.name, "sdd-speckit");
});

test("every command becomes a phase skill the model cannot start by itself", () => {
  for (const f of mdFiles(join(ROOT, "commands"))) {
    const phase = f.replace(/^speckit\.|\.md$/g, "");
    const text = byPath.get(`skills/sdd-speckit-${phase}/SKILL.md`);
    assert.ok(text, `skills/sdd-speckit-${phase}/SKILL.md`);
    const { data } = parseFrontmatter(text);
    assert.equal(data.name, `sdd-speckit-${phase}`);
    assert.ok(data.description);
    assert.equal(data["disable-model-invocation"], "true");
  }
});

test("every agent becomes a droid with a valid model and only Droid tool ids", () => {
  const adapter = loadFactoryAdapter(ROOT);
  const models = new Set([...Object.values(adapter.models).filter((v) => typeof v === "string" && !v.startsWith("Claude")), "inherit"]);
  for (const path of [...byPath.keys()].filter((p) => p.startsWith("droids/"))) {
    const { data, body } = parseFrontmatter(byPath.get(path));
    assert.match(data.name, /^[a-z0-9-_]+$/, path);
    assert.equal(path, `droids/${data.name}.md`);
    assert.ok(models.has(data.model), `${path}: model ${data.model}`);
    assert.ok(Array.isArray(data.tools) && data.tools.length, `${path}: tools`);
    for (const t of data.tools) assert.ok(DROID_TOOLS.has(t), `${path}: unknown Droid tool ${t}`);
    assert.ok(body.trim(), `${path}: a droid body cannot be empty`);
  }
  for (const f of mdFiles(join(ROOT, "agents"))) assert.ok(byPath.has(`droids/${f}`), `droids/${f}`);
});

test("analyze runs in a droid that cannot write", () => {
  const { data } = parseFrontmatter(byPath.get("droids/qa-analyst-readonly.md"));
  for (const t of ["Create", "Edit", "ApplyPatch"]) assert.ok(!data.tools.includes(t), t);
  assert.match(byPath.get("skills/sdd-speckit-analyze/SKILL.md"), /\*\*qa-analyst-readonly\*\*/);
});

test("a Droid tool stays while any Claude tool that maps to it is allowed", () => {
  const adapter = loadFactoryAdapter(ROOT);
  assert.deepEqual(mapDroidTools(adapter, ["Read", "Write", "Edit"], ["Write"]), ["Read", "LS", "Edit", "ApplyPatch"]);
  assert.throws(() => mapDroidTools(adapter, ["Teleport"]), /no Droid mapping/);
});

test("no Claude-only text or paths survive the render", () => {
  for (const [path, text] of byPath) {
    // Support files (templates, docs) may name every assistant on purpose. Skills and droids may not.
    if (!path.endsWith(".md") || !/^(skills|droids)\//.test(path)) continue;
    assert.doesNotMatch(text, /CLAUDE_PLUGIN_ROOT|\/sdd-speckit:|claude-only:start|<!-- (copilot|factory)-only/, path);
  }
  assert.match(byPath.get("skills/speckit-workflow/SKILL.md"), /Factory Droid hooks/);
});

test("hooks.json runs the gates on Droid's write tools from the plugin root", () => {
  const hooks = JSON.parse(byPath.get("hooks/hooks.json"));
  assert.equal(hooks.PreToolUse[0].matcher, "Create|Edit|ApplyPatch");
  for (const event of ["PreToolUse", "PostToolUse"]) {
    for (const h of hooks[event].flatMap((m) => m.hooks)) {
      const script = /\$\{DROID_PLUGIN_ROOT\}\/(\S+?)"/.exec(h.command)?.[1];
      assert.ok(script && byPath.has(script), `${event}: ${h.command}`);
    }
  }
});

const skip = !have("python3") && "python3 is needed";

test("the rendered gate hook blocks a Droid Edit of the constitution", { skip }, () => {
  const project = tmp("sdd-droid-");
  const out = tmp("sdd-droid-plugin-");
  assert.equal(cli(["--emit=factory", out]).status, 0);
  const payload = JSON.stringify({
    tool_name: "Edit",
    tool_input: { file_path: join(project, ".specify/memory/constitution.md"), old_string: "a", new_string: "b" },
    cwd: project,
    hook_event_name: "PreToolUse",
  });
  const r = spawnSync("sh", [join(out, "scripts/harness/hook.sh"), "pre"], {
    input: payload,
    cwd: project,
    encoding: "utf8",
    env: { ...process.env, SDD_SPECKIT_HOST: "factory", DROID_PLUGIN_ROOT: out, CLAUDE_PROJECT_DIR: "" },
  });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /constitution-guard/);
});
