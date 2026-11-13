/**
 * Factory Droid adapter.
 *
 * Renders a native Droid plugin from the canonical Claude Code sources, so a team installs the
 * framework with one marketplace command and every phase is still edited in one place:
 *
 *   commands/speckit.X.md  -> skills/sdd-speckit-X/SKILL.md   (user-invoked phase skill)
 *   agents/X.md            -> droids/X.md                     (custom droid, model + tools)
 *   skills/X/              -> skills/X/                       (Agent Skills format is shared)
 *   hooks                  -> hooks/hooks.json                (harness gates, artifact changelog)
 *   .claude-plugin/        -> .factory-plugin/plugin.json
 *   templates, scripts...  -> copied at the plugin root       (${DROID_PLUGIN_ROOT}/...)
 *
 * Phases render as skills rather than Droid commands: Droid expands ${DROID_PLUGIN_ROOT} inside
 * SKILL.md, and a phase needs that path to find its templates and scripts.
 *
 * The routing table (which droid runs which phase) is shared with the Copilot adapter.
 * renderFactory() is pure; writeFactory() and checkFactory() are the only functions that touch disk.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { frontmatter, loadAdapter as loadCopilotAdapter, parseFrontmatter, posix, walk } from "./copilot.js";

export function loadFactoryAdapter(frameworkRoot) {
  const adapter = JSON.parse(readFileSync(join(frameworkRoot, "adapters", "factory", "adapter.json"), "utf8"));
  adapter.routing = loadCopilotAdapter(frameworkRoot).routing;
  return adapter;
}

/* ---------------------------------------------------------- text rewrites */

/**
 * Sources may carry assistant-specific passages:
 *   <!-- claude-only:start --> ... <!-- claude-only:end -->   dropped for Droid
 *   <!-- copilot-only ... -->                                 dropped for Droid
 *   <!-- factory-only ... -->                                 unwrapped for Droid, verbatim
 */
export function rewriteFactoryText(text, adapter, { agentRenames = {} } = {}) {
  const prefix = adapter.commandSkillPrefix;

  let out = text
    .replace(/<!-- claude-only:start -->[\s\S]*?<!-- claude-only:end -->\n?/g, "")
    .replace(/<!-- copilot-only\n[\s\S]*?-->\n?/g, "");

  const kept = [];
  out = out.replace(/<!-- factory-only\n([\s\S]*?)-->\n?/g, (_, body) => {
    kept.push(body);
    return `\u0000KEEP${kept.length - 1}\u0000`;
  });

  out = out
    .replaceAll("${CLAUDE_PLUGIN_ROOT}", adapter.rootVar)
    .replace(/\/sdd-speckit:speckit\.([a-z]+)/g, `/${prefix}$1`)
    .replace(/(^|[\s`(*])\/speckit\.([a-z]+)/g, `$1/${prefix}$2`)
    .replace(/`\$ARGUMENTS`/g, "the arguments given after the command")
    .replace(/\$ARGUMENTS/g, "the arguments given after the command");

  for (const [from, to] of Object.entries(agentRenames)) {
    out = out.replace(new RegExp(`\\*\\*${from}\\*\\*`, "g"), `**${to}**`);
  }

  return out.replace(/\u0000KEEP(\d+)\u0000/g, (_, i) => kept[Number(i)]);
}

const FORBIDDEN = [/CLAUDE_PLUGIN_ROOT/, /\/sdd-speckit:/, /claude-only:start/, /<!-- copilot-only/, /<!-- factory-only/];

function assertClean(path, text) {
  for (const re of FORBIDDEN) {
    if (re.test(text)) throw new Error(`factory render: ${path} still contains ${re}`);
  }
}

function generatedNote(source) {
  return `<!-- Generated from ${source} by sdd-speckit-framework. Edit the source, then re-run --emit=factory. -->\n\n`;
}

/* -------------------------------------------------------------- mappings */

/** Claude tools -> Droid tool ids. A Droid tool is kept while any Claude tool that maps to it is allowed. */
export function mapDroidTools(adapter, tools = [], disallowed = []) {
  const deny = new Set(disallowed);
  const out = [];
  for (const t of tools) {
    if (deny.has(t)) continue;
    const mapped = adapter.tools[t];
    if (!Array.isArray(mapped)) throw new Error(`factory render: no Droid mapping for tool ${t} (adapters/factory/adapter.json)`);
    for (const m of mapped) if (!out.includes(m)) out.push(m);
  }
  return out;
}

export function mapDroidModel(adapter, tier) {
  return (tier && adapter.models?.[tier]) || "inherit";
}

/* ---------------------------------------------------------------- render */

function readonlyVariantsFor(frameworkRoot, adapter) {
  const out = [];
  const dir = join(frameworkRoot, "commands");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const { data } = parseFrontmatter(readFileSync(join(dir, f), "utf8"));
    const command = data.name ?? f.replace(/\.md$/, "");
    const denied = data["disallowed-tools"] ?? [];
    if (!denied.length) continue;
    for (const agent of adapter.routing[command]?.agents ?? []) out.push({ command, agent, denied });
  }
  return out;
}

function renderDroids(frameworkRoot, adapter) {
  const files = [];
  const variants = readonlyVariantsFor(frameworkRoot, adapter);
  const dir = join(frameworkRoot, "agents");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, f), "utf8"));
    const name = data.name ?? f.replace(/\.md$/, "");
    const baseDisallowed = data.disallowedTools ?? [];

    const emit = (droidName, description, disallowed) => {
      const fm = {
        name: droidName,
        description,
        model: mapDroidModel(adapter, data.model),
        tools: mapDroidTools(adapter, data.tools ?? [], disallowed),
      };
      const text = frontmatter(fm) + "\n" + generatedNote(`agents/${f}`) + rewriteFactoryText(body, adapter).replace(/^\n+/, "");
      const path = `droids/${droidName}.md`;
      assertClean(path, text);
      files.push({ path, content: Buffer.from(text) });
    };

    emit(name, data.description ?? "", baseDisallowed);
    for (const v of variants.filter((r) => r.agent === name)) {
      emit(
        `${name}-readonly`,
        `Read-only variant of ${name} for /${adapter.commandSkillPrefix}${v.command.replace(/^speckit\./, "")}: ${v.denied.join(", ")} removed. ${data.description ?? ""}`.trim(),
        [...new Set([...baseDisallowed, ...v.denied])]
      );
    }
  }
  return files;
}

function renderPhaseSkills(frameworkRoot, adapter) {
  const files = [];
  const dir = join(frameworkRoot, "commands");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, f), "utf8"));
    const command = data.name ?? f.replace(/\.md$/, "");
    const phase = command.replace(/^speckit\./, "");
    const skillName = `${adapter.commandSkillPrefix}${phase}`;
    const route = adapter.routing[command] ?? { agents: [] };
    const readonly = (data["disallowed-tools"] ?? []).length > 0;
    const droids = route.agents.map((a) => (readonly ? `${a}-readonly` : a));
    const renames = readonly ? Object.fromEntries(route.agents.map((a) => [a, `${a}-readonly`])) : {};

    const lines = [`> **SDD Speckit phase \`${phase}\`.** Model tier: **${data.model ?? "any"}**.`];
    if (data["argument-hint"]) lines.push(`> Arguments: \`${data["argument-hint"]}\``);
    if (droids.length) {
      lines.push(
        `> Run the phase work in the droid${droids.length > 1 ? "s" : ""} ${droids.map((a) => `**${a}**`).join(", ")} ` +
          "with the Task tool (`subagent_type` = the droid name). Each droid pins the model and the tool set."
      );
    }
    if (readonly) {
      lines.push(
        `> **Read-only.** ${droids.map((a) => `**${a}**`).join(", ")} has no file-editing tool. Do not edit files ` +
          "in the main session either: produce the report and stop."
      );
    }

    const fm = {
      name: skillName,
      description: data.description ?? "",
      // A phase is a deliberate act, as a Claude Code slash command is. The model must not start one.
      "disable-model-invocation": true,
    };
    const text =
      frontmatter(fm) + "\n" + generatedNote(`commands/${f}`) + lines.join("\n") + "\n\n" +
      rewriteFactoryText(body, adapter, { agentRenames: renames }).replace(/^\n+/, "");
    const path = `skills/${skillName}/SKILL.md`;
    assertClean(path, text);
    files.push({ path, content: Buffer.from(text) });
  }
  return files;
}

function renderSkills(frameworkRoot, adapter) {
  const files = [];
  const dir = join(frameworkRoot, "skills");
  const exclude = new Set(adapter.excludeSkills ?? []);
  for (const name of readdirSync(dir).sort()) {
    if (exclude.has(name) || !statSync(join(dir, name)).isDirectory()) continue;
    for (const abs of walk(join(dir, name))) {
      const path = `skills/${posix(relative(dir, abs))}`;
      let content = readFileSync(abs);
      if (abs.endsWith(".md")) {
        const text = rewriteFactoryText(content.toString("utf8"), adapter);
        assertClean(path, text);
        content = Buffer.from(text);
      }
      files.push({ path, content });
    }
  }
  return files;
}

function renderSupport(frameworkRoot, adapter) {
  const files = [];
  for (const entry of adapter.supportCopy) {
    const abs = join(frameworkRoot, entry);
    if (!existsSync(abs)) continue;
    for (const f of statSync(abs).isDirectory() ? walk(abs) : [abs]) {
      let content = readFileSync(f);
      if (f.endsWith(".md")) content = Buffer.from(rewriteFactoryText(content.toString("utf8"), adapter));
      files.push({ path: posix(relative(frameworkRoot, f)), content });
    }
  }
  return files;
}

function renderHooks(adapter) {
  // SDD_SPECKIT_HOST tells hook.sh it runs under Droid, so it does not stand down in favour of a
  // runner wired in .claude/settings.json, which Droid never runs.
  const run = (script, arg = "") =>
    `SDD_SPECKIT_HOST=factory sh "${adapter.rootVar}/scripts/${script}"${arg ? ` ${arg}` : ""}`;
  const matcher = adapter.hooks.writeMatcher;
  const hooks = {
    PreToolUse: [{ matcher, hooks: [{ type: "command", command: run("harness/hook.sh", "pre"), timeout: 15 }] }],
    PostToolUse: [
      {
        matcher,
        hooks: [
          { type: "command", command: run("hooks/log-artifact-change.sh"), timeout: 10 },
          { type: "command", command: run("harness/hook.sh", "post"), timeout: 30 },
        ],
      },
    ],
  };
  return [{ path: "hooks/hooks.json", content: Buffer.from(JSON.stringify(hooks, null, 2) + "\n") }];
}

function renderManifest(frameworkRoot, adapter) {
  const claude = JSON.parse(readFileSync(join(frameworkRoot, ".claude-plugin", "plugin.json"), "utf8"));
  const manifest = {
    name: adapter.pluginName,
    description: claude.description,
    version: claude.version,
    author: claude.author,
    homepage: claude.homepage,
    repository: claude.repository,
    license: claude.license,
    keywords: [...new Set([...(claude.keywords ?? []), "factory-droid"])],
  };
  return [{ path: ".factory-plugin/plugin.json", content: Buffer.from(JSON.stringify(manifest, null, 2) + "\n") }];
}

/** Every file of the Droid plugin, as [{ path, content: Buffer }] relative to the plugin root. */
export function renderFactory(frameworkRoot) {
  const adapter = loadFactoryAdapter(frameworkRoot);
  const files = [
    ...renderManifest(frameworkRoot, adapter),
    ...renderPhaseSkills(frameworkRoot, adapter),
    ...renderDroids(frameworkRoot, adapter),
    ...renderSkills(frameworkRoot, adapter),
    ...renderHooks(adapter),
    ...renderSupport(frameworkRoot, adapter),
  ];
  const seen = new Set();
  for (const f of files) {
    if (seen.has(f.path)) throw new Error(`factory render: two sources produce ${f.path}`);
    seen.add(f.path);
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/* ------------------------------------------------------------ write/check */

export function writeFactory(target, files, { dryRun }) {
  const groups = {};
  for (const f of files) {
    const parts = f.path.split("/");
    const key = parts.length > 1 ? `${parts[0]}/` : f.path;
    groups[key] = (groups[key] ?? 0) + 1;
    if (dryRun) continue;
    const p = join(target, f.path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, f.content);
  }
  return Object.entries(groups)
    .sort()
    .map(([k, n]) => `${dryRun ? "would write" : "wrote"} factory: ${k}${k.endsWith("/") ? ` (${n} file${n > 1 ? "s" : ""})` : ""}`);
}

/** The plugin directory is wholly generated, so any file the render does not produce is drift. */
export function checkFactory(dir, files) {
  const diffs = [];
  const want = new Map(files.map((f) => [f.path, f.content]));
  for (const [path, content] of want) {
    const p = join(dir, path);
    if (!existsSync(p)) diffs.push(`missing  ${path}`);
    else if (!readFileSync(p).equals(content)) diffs.push(`changed  ${path}`);
  }
  if (existsSync(dir)) {
    for (const abs of walk(dir)) {
      const rel = posix(relative(dir, abs));
      if (!want.has(rel)) diffs.push(`extra    ${rel}`);
    }
  }
  return diffs;
}
