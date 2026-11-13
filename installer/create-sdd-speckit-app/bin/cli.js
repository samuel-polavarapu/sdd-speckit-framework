#!/usr/bin/env node
/**
 * create-sdd-speckit-app — interactive installer for the SDD Speckit Framework.
 *
 * Order is load-bearing: all eight questions are answered and confirmed before anything is
 * written. In non-interactive mode the flags stand in for the answers, and a missing flag falls
 * back to a documented default.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

import {
  defaultConfig, validateConfig, speckitIntegrationFor, ASSISTANTS, BOTH, validateCustomMcp,
  normalizeAssistant, targetsFor, targetList, TARGET_LABELS, migrateConfig, gateDefaults, GATE_IDS, GATE_MODES, MODES,
} from "../src/config-schema.js";
import { renderCopilot, writeCopilot, checkCopilot } from "../src/copilot.js";
import { renderFactory, writeFactory, checkFactory } from "../src/factory.js";
import { askAll, makeUi, promptBackend, Cancelled } from "../src/prompts.js";
import { scaffold } from "../src/scaffold.js";
import { loadCatalog, connectorsNeedingInput } from "../src/mcp-map.js";
import { profileIds } from "../src/profiles-map.js";
import { havePython, scanTarget } from "../src/onboard.js";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRAMEWORK_ROOT = resolve(HERE, "..", "..", "..");
const VERSION = "0.3.0";

/* ------------------------------------------------------------------- args */

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  const repeatable = new Set(["mcp-custom", "mcp-input", "gate"]);

  for (const raw of argv) {
    if (!raw.startsWith("--")) {
      positional.push(raw);
      continue;
    }
    const body = raw.slice(2);
    const eq = body.indexOf("=");
    const key = eq === -1 ? body : body.slice(0, eq);
    const value = eq === -1 ? true : body.slice(eq + 1);
    if (repeatable.has(key)) (flags[key] ??= []).push(value);
    else flags[key] = value;
  }
  return { flags, positional };
}

function usage() {
  const stacks = profileIds(FRAMEWORK_ROOT, "stack").join(" | ");
  const industries = profileIds(FRAMEWORK_ROOT, "industry").reverse().join(" | ");
  const connectors = loadCatalog(FRAMEWORK_ROOT).connectors.map((c) => c.id).join(",");
  return `create-sdd-speckit-app ${VERSION}

  npx create-sdd-speckit-app [project-directory] [options]

Asks eight questions, in this order, before it writes anything:
  1 telemetry   2 project mode   3 industry   4 tech stack   5 primary assistant
  6 MCP connectors   7 code editor   8 harness gates

Run it again in the same directory to change an answer. An answer you do not give again is kept.

Options
  --yes                      Non-interactive. Every unset flag takes its documented default.
  --telemetry=<on|off>       Default: off
  --otel-exporter=<console|otlp>   Default: console
  --otel-endpoint=<url>      Required when the exporter is otlp
  --mode=<greenfield|brownfield|auto>   Default: auto (brownfield when the directory holds code)
  --industry=<id>            ${industries}      Default: none
  --stack=<id>               ${stacks}      Default: custom
  --assistant=<id>           ${[...ASSISTANTS.map((a) => a.id), BOTH].join(" | ")}      Default: claude
                             ${BOTH} = Claude Code and GitHub Copilot (claude primary, copilot secondary)
                             factory = Factory Droid (installs the plugin in .factory-plugin/)
  --secondary-assistants=<a,b>
  --mcp=<ids>                Comma separated from: ${connectors}
  --mcp-custom=<name>:<transport>:<url-or-command>   Repeatable
  --mcp-input=<id>.<field>=<value>                   Answers a connector that needs your own URL,
                             e.g. --mcp-input=rally.url=https://host/mcp
  --editor=<vscode|cursor|jetbrains|none>            Default: vscode
  --gates=<default|off|warn|block>   All gates at once. Default: the defaults for the mode
                             (greenfield: all block; brownfield: warn, except the constitution
                             guard and the secrets scan, which block)
  --gate=<id>=<off|warn|block>       One gate. Repeatable. Ids: ${GATE_IDS.join(", ")}
  --dry-run                  Print every action and write nothing
  --force-interactive        Ask the eight questions even without a TTY (for demos and tests)
  --no-speckit               Skip \`specify init\`; use the vendored templates
  --version, --help

GitHub Copilot files only (no questions)
  --emit=copilot [dir]       Render the Copilot skills, custom agents, hooks and instructions into
                             dir (default: .). Use it to add Copilot support to an existing repo.
  --emit=copilot --check [--strict] [dir]
                             Write nothing. Exit 1 if dir differs from a fresh render. --strict also
                             fails on any file the render would not write (used for the dist/ copy).

Factory Droid plugin (no questions)
  --emit=factory [dir]       Render the native Droid plugin (phase skills, droids, hooks, templates,
                             scripts) into dir. The committed copy is adapters/factory/dist/.
  --emit=factory --check [dir]
                             Write nothing. Exit 1 if dir differs from a fresh render.

Templates only (no questions)
  --emit=templates [dir]     Compose the templates for dir's recorded industry and stack, or for
                             --industry and --stack. Add --check to write nothing and exit 1 when
                             the composed files are stale.

Non-interactive examples
  npx create-sdd-speckit-app my-app --yes --stack=python-fastapi --assistant=claude \\
      --telemetry=off --mcp=github,playwright --editor=vscode
  npx create-sdd-speckit-app my-app --yes --assistant=both --mcp=github --editor=vscode
  npx create-sdd-speckit-app . --yes --mode=brownfield --industry=healthcare --stack=dotnet-aspire

A tenant-hosted connector such as Rally has no default URL. Supply it with --mcp-input, or the
run fails rather than writing a guess.

Docs: docs/INSTALLER.md · docs/TEMPLATES.md · docs/HARNESS.md · docs/MCP_CONNECTORS.md`;
}

/* --------------------------------------------------- non-interactive config */

function parseCustomMcpFlag(spec) {
  // name:transport:url-or-command — the command may itself contain colons, so split on the first two.
  const first = spec.indexOf(":");
  const second = spec.indexOf(":", first + 1);
  if (first === -1 || second === -1) {
    throw new Error(`--mcp-custom="${spec}" must be <name>:<transport>:<url-or-command>`);
  }
  const id = spec.slice(0, first);
  const transport = spec.slice(first + 1, second);
  const rest = spec.slice(second + 1);

  const entry = { id, transport };
  if (transport === "stdio") {
    const parts = rest.trim().split(/\s+/);
    entry.command = parts[0];
    entry.args = parts.slice(1);
  } else {
    entry.url = rest;
  }
  const errors = validateCustomMcp(entry);
  if (errors.length) throw new Error(`--mcp-custom="${spec}": ${errors.join("; ")}`);
  return entry;
}

/** The record a previous run left in the target, brought up to the current shape. Null if none. */
function readExistingRecord(targetDir) {
  try {
    return migrateConfig(JSON.parse(readFileSync(join(resolve(targetDir), ".specify", "sdd-speckit.json"), "utf8")));
  } catch {
    return null;
  }
}

/** The starting answers: a previous run's, where there was one, over the defaults. */
function baseConfig(existing) {
  const cfg = defaultConfig();
  if (!existing) return cfg;
  if (existing.telemetry && typeof existing.telemetry.enabled === "boolean") cfg.telemetry = { ...cfg.telemetry, ...existing.telemetry };
  for (const k of ["mode", "industry", "stack", "editor"]) if (existing[k]) cfg[k] = existing[k];
  if (existing.assistant?.primary) {
    cfg.assistant = { primary: existing.assistant.primary, secondary: [...(existing.assistant.secondary ?? [])] };
  }
  cfg.harness = { gates: { ...existing.harness.gates } };
  return cfg;
}

/**
 * Gates: --gates sets all of them, --gate sets one. With neither, a previous run's gates are
 * kept. A record from before 0.3.0 has none, so it keeps doing what it did (the constitution
 * guard only) until a mode is given, which is the opt-in to that mode's defaults.
 */
function gatesFromFlags(flags, cfg, existing) {
  let gates;
  const all = flags.gates;
  if (all !== undefined && all !== "default" && !GATE_MODES.includes(all)) {
    throw new Error(`--gates must be default, ${GATE_MODES.join(" or ")}, got "${all}"`);
  }
  if (GATE_MODES.includes(all)) gates = Object.fromEntries(GATE_IDS.map((id) => [id, all]));
  else if (all === "default" || !existing || flags.mode !== undefined) gates = gateDefaults(cfg.mode);
  else gates = { ...cfg.harness.gates };

  for (const spec of flags.gate ?? []) {
    const m = /^([a-z-]+)=([a-z]+)$/.exec(String(spec));
    if (!m || !GATE_IDS.includes(m[1]) || !GATE_MODES.includes(m[2])) {
      throw new Error(`--gate="${spec}" must be <${GATE_IDS.join("|")}>=<${GATE_MODES.join("|")}>`);
    }
    gates[m[1]] = m[2];
  }
  return gates;
}

function configFromFlags(flags, targetDir) {
  const existing = readExistingRecord(targetDir);
  const cfg = baseConfig(existing);

  const t = flags.telemetry;
  if (t === "on" || t === true) {
    cfg.telemetry.enabled = true;
    cfg.telemetry.exporter = flags["otel-exporter"] ?? (flags["otel-endpoint"] ? "otlp" : "console");
    cfg.telemetry.endpoint = flags["otel-endpoint"] ?? "";
  } else if (t === "off") {
    cfg.telemetry = { enabled: false, exporter: "console", endpoint: "" };
  } else if (t === undefined) {
    // keep the previous answer, or the default (off)
  } else {
    throw new Error(`--telemetry must be on or off, got "${t}"`);
  }

  const scan = flags.mode === "auto" || flags.stack === "auto" || (!flags.mode && !existing) ? scanTarget(FRAMEWORK_ROOT, resolve(targetDir)) : null;
  if (flags.mode && flags.mode !== "auto") cfg.mode = flags.mode;
  else if (flags.mode === "auto" || !existing) cfg.mode = scan?.mode ?? "greenfield";
  if (!MODES.includes(cfg.mode)) throw new Error(`--mode must be greenfield, brownfield or auto, got "${flags.mode}"`);
  if (flags.industry) cfg.industry = flags.industry;
  if (flags.stack) cfg.stack = flags.stack === "auto" ? scan?.stack ?? "custom" : flags.stack;
  if (flags.assistant) {
    cfg.assistant.primary = flags.assistant;
    if (!flags["secondary-assistants"]) cfg.assistant.secondary = [];
  }
  if (flags["secondary-assistants"]) {
    cfg.assistant.secondary = String(flags["secondary-assistants"]).split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (flags.mcp) cfg.mcp.catalog = String(flags.mcp).split(",").map((s) => s.trim()).filter(Boolean);
  if (flags["mcp-custom"]) cfg.mcp.custom = flags["mcp-custom"].map(parseCustomMcpFlag);
  if (flags.editor) cfg.editor = flags.editor;
  cfg.assistant = normalizeAssistant(cfg.assistant);

  // --mcp-input=rally.url=https://...
  cfg.mcp.inputs = {};
  const rawInputs = flags["mcp-input"] ? [].concat(flags["mcp-input"]) : [];
  for (const spec of rawInputs) {
    const m = /^([a-z0-9-]+)\.([A-Za-z]+)=(.+)$/.exec(spec);
    if (!m) throw new Error(`--mcp-input="${spec}" must be <connector>.<field>=<value>`);
    (cfg.mcp.inputs[m[1]] ??= {})[m[2]] = m[3];
  }

  const stackIds = profileIds(FRAMEWORK_ROOT, "stack");
  if (!stackIds.includes(cfg.stack)) throw new Error(`--stack="${cfg.stack}" is unknown. Choose: ${stackIds.join(" | ")}`);
  const industryIds = profileIds(FRAMEWORK_ROOT, "industry");
  if (!industryIds.includes(cfg.industry)) throw new Error(`--industry="${cfg.industry}" is unknown. Choose: ${industryIds.join(" | ")}`);
  cfg.harness = { gates: gatesFromFlags(flags, cfg, existing) };

  const known = new Set(loadCatalog(FRAMEWORK_ROOT).connectors.map((c) => c.id));
  for (const id of cfg.mcp.catalog) {
    if (!known.has(id)) throw new Error(`--mcp="${id}" is not in the catalog. Choose from: ${[...known].join(",")}`);
  }

  // A connector with no public endpoint must be given one. Never default it.
  for (const c of connectorsNeedingInput(FRAMEWORK_ROOT, cfg.mcp.catalog)) {
    if (!cfg.mcp.inputs[c.id]?.url) {
      throw new Error(
        `${c.displayName} is tenant-hosted and has no default URL.\n` +
        `  Supply it: --mcp-input=${c.id}.url=https://<your-host>/mcp` +
        (c.auth?.credentialEnvVar ? `\n  Credential env var defaults to ${c.auth.credentialEnvVar}; override with --mcp-input=${c.id}.credentialEnvVar=NAME` : "")
      );
    }
  }
  return cfg;
}

/* -------------------------------------------------------------- reporting */

function summarize(cfg, result) {
  const lines = [];
  const yn = (b) => (b ? "yes" : "no");
  lines.push("Your choices");
  lines.push(`  1 Telemetry          ${yn(cfg.telemetry.enabled)}${cfg.telemetry.enabled ? ` (${cfg.telemetry.exporter}${cfg.telemetry.endpoint ? ` -> ${cfg.telemetry.endpoint}` : ""})` : ""}`);
  lines.push(`  2 Project mode       ${cfg.mode}`);
  lines.push(`  3 Industry           ${cfg.industry}`);
  lines.push(`  4 Tech stack         ${cfg.stack}`);
  lines.push(`  5 Primary assistant  ${cfg.assistant.primary} (Speckit integration: ${speckitIntegrationFor(cfg.assistant.primary)})`);
  if (cfg.assistant.secondary?.length) lines.push(`    Secondary          ${cfg.assistant.secondary.join(", ")}`);
  lines.push(`    Set up for         ${targetList(cfg.assistant).map((t) => TARGET_LABELS[t]).join(" + ")}`);
  lines.push(`  6 MCP connectors     ${[...(cfg.mcp.catalog ?? []), ...(cfg.mcp.custom ?? []).map((c) => `${c.id} (custom)`)].join(", ") || "none"}`);
  lines.push(`  7 Editor             ${cfg.editor}`);
  lines.push(`  8 Harness gates      ${GATE_IDS.map((id) => `${id}=${cfg.harness.gates[id]}`).join("  ")}`);

  lines.push("", result.dryRun ? "Would do (dry run — nothing written)" : "Done");
  for (const l of result.log) lines.push(`  - ${l}`);

  if (!result.speckit.delegated && !result.dryRun) {
    lines.push("", "Speckit scaffolding");
    lines.push(`  \`specify init\` did not run (${result.speckit.fallbackReason ?? "skipped"}).`);
    lines.push("  The vendored templates were used instead. To get the real .specify/ layout, install uv");
    lines.push("  (https://docs.astral.sh/uv/) and run:");
    for (const integ of result.speckit.integrations ?? [result.speckit.integration]) {
      lines.push(`    uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --integration ${integ}`);
    }
  }

  const t = result.targets ?? targetsFor(cfg.assistant);
  if (result.pendingOauth.length) {
    lines.push("", "Still to authorize — writing .mcp.json does not complete an OAuth login");
    if (t.claude) lines.push("  Claude Code: open the project and run /mcp once, then authorize.");
    if (t.copilot) lines.push("  GitHub Copilot: start each server when VS Code or the Copilot CLI asks, then authorize.");
    if (t.factory) lines.push("  Factory Droid: run /mcp in a session, then authorize.");
    for (const c of result.pendingOauth) lines.push(`    - ${c.displayName}`);
  }

  const cred = [
    ...(cfg.mcp.catalog ?? []).flatMap((id) => {
      const v = cfg.mcp.inputs?.[id]?.credentialEnvVar;
      return v ? [v] : [];
    }),
    ...(cfg.mcp.custom ?? []).map((c) => c.credentialEnvVar).filter(Boolean),
  ];
  if (cfg.mcp.catalog?.includes("github")) cred.push("GITHUB_PAT");
  if (cred.length) {
    lines.push("", "Environment variables to export before you start your assistant");
    for (const v of [...new Set(cred)]) lines.push(`    ${v}`);
    lines.push("  .mcp.json references them by name, so no secret is committed.");
  }

  if (t.claude) {
    lines.push("", "Claude Code — register the plugin");
    if (result.registration.shellSubcommandsWork) {
      for (const c of result.registration.shell) lines.push(`    ${c}`);
      lines.push("  Or, inside an interactive session:");
    } else {
      lines.push("  `claude plugin` subcommands are unavailable here. Inside an interactive session run:");
    }
    for (const c of result.registration.slash) lines.push(`    ${c}`);
    lines.push(`  For local development without a marketplace: ${result.registration.devLoad}`);
  }

  if (t.copilot) {
    lines.push("", "GitHub Copilot — nothing to register");
    lines.push("  The phases are skills in .github/skills/sdd-speckit-*/, and the phase agents are in .github/agents/.");
    lines.push("  Commit .github/ and .specify/sdd-speckit/ so the Copilot cloud agent sees them on the default branch.");
    if (result.servers?.length) {
      lines.push("  The Copilot cloud agent does not read .mcp.json. Add the same servers under the repository's");
      lines.push("  Settings → Copilot → Coding agent → MCP configuration.");
    }
  }

  if (t.factory) {
    lines.push("", "Factory Droid — install the plugin");
    for (const c of result.factoryRegistration.shell) lines.push(`    ${c}`);
    lines.push("  Or use /plugins inside a session. For a shared repo, point the marketplace at your published");
    lines.push("  copy of the framework (owner/repo) rather than a local path. See docs/FACTORY.md.");
    if (result.servers?.length) {
      lines.push("  Droid keeps project MCP servers in .factory/mcp.json. Copy the servers from .mcp.json there if");
      lines.push("  your Droid version does not pick up .mcp.json.");
    }
  }

  lines.push("", `Next step (${cfg.mode})`);
  if (t.claude) lines.push("    Claude Code:     /sdd-speckit:speckit.onboard");
  if (t.copilot) lines.push("    GitHub Copilot:  /sdd-speckit-onboard   (Copilot Chat in agent mode, or the Copilot CLI)");
  if (t.factory) lines.push("    Factory Droid:   /sdd-speckit-onboard");
  lines.push(
    cfg.mode === "brownfield"
      ? "  It runs discovery on the existing code, then leads you to a derived constitution and baseline specs."
      : "  It checks the setup, then leads you to the constitution and your first feature spec."
  );
  return lines.join("\n");
}

/* ---------------------------------------------------------- --emit=copilot */

function emitTemplates(flags, targetDir) {
  if (!havePython()) {
    console.error("--emit=templates needs python3 on the PATH.");
    return 1;
  }
  const args = [join(FRAMEWORK_ROOT, "scripts", "compose-templates.py"), "--project", resolve(targetDir)];
  for (const k of ["industry", "stack", "targets"]) if (typeof flags[k] === "string") args.push(`--${k}`, flags[k]);
  for (const k of ["check", "dry-run", "force"]) if (flags[k] === true || flags[k] === "true") args.push(`--${k}`);
  return spawnSync("python3", args, { stdio: "inherit" }).status ?? 1;
}

function emitFactory(flags, targetDir) {
  let files;
  try {
    files = renderFactory(FRAMEWORK_ROOT);
  } catch (err) {
    console.error(`Factory render failed: ${err.message}`);
    return 1;
  }
  const dir = resolve(targetDir);
  if (flags.check === true || flags.check === "true") {
    const diffs = checkFactory(dir, files);
    if (!diffs.length) {
      console.log(`Factory Droid plugin in ${dir} matches the sources (${files.length} files).`);
      return 0;
    }
    console.error(`Factory Droid plugin in ${dir} has drifted from the sources:`);
    for (const d of diffs) console.error(`  ${d}`);
    console.error(`\nRe-render: node installer/create-sdd-speckit-app/bin/cli.js --emit=factory ${targetDir}`);
    return 1;
  }
  const dryRun = flags["dry-run"] === true || flags["dry-run"] === "true";
  const log = writeFactory(dir, files, { dryRun });
  console.log(`${dryRun ? "Would render" : "Rendered"} ${files.length} Factory Droid plugin files into ${dir}`);
  for (const l of log) console.log(`  - ${l}`);
  return 0;
}

function emit(flags, targetDir) {
  if (flags.emit === "templates") return emitTemplates(flags, targetDir);
  if (flags.emit === "factory") return emitFactory(flags, targetDir);
  if (flags.emit !== "copilot") {
    console.error(`--emit="${flags.emit}" is unknown. The values are copilot, factory and templates.`);
    return 1;
  }
  let files;
  try {
    files = renderCopilot(FRAMEWORK_ROOT);
  } catch (err) {
    console.error(`Copilot render failed: ${err.message}`);
    return 1;
  }

  if (flags.check === true || flags.check === "true") {
    const diffs = checkCopilot(resolve(targetDir), files, { strict: flags.strict === true || flags.strict === "true" });
    if (!diffs.length) {
      console.log(`Copilot files in ${resolve(targetDir)} match the sources (${files.length} files).`);
      return 0;
    }
    console.error(`Copilot files in ${resolve(targetDir)} have drifted from the sources:`);
    for (const d of diffs) console.error(`  ${d}`);
    console.error(`\nRe-render: node installer/create-sdd-speckit-app/bin/cli.js --emit=copilot ${targetDir}`);
    return 1;
  }

  const dryRun = flags["dry-run"] === true || flags["dry-run"] === "true";
  const log = writeCopilot(resolve(targetDir), files, { dryRun });
  console.log(`${dryRun ? "Would render" : "Rendered"} ${files.length} GitHub Copilot files into ${resolve(targetDir)}`);
  for (const l of log) console.log(`  - ${l}`);
  return 0;
}

/* ------------------------------------------------------------------- main */

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (flags.help || flags.h) return console.log(usage()), 0;
  if (flags.version || flags.v) return console.log(VERSION), 0;

  const targetDir = positional[0] ?? ".";

  if (flags.emit !== undefined) return emit(flags, targetDir);
  const forceInteractive = flags["force-interactive"] === true;
  const nonInteractive = !forceInteractive && (flags.yes === true || flags.yes === "true" || !process.stdin.isTTY);
  const dryRun = flags["dry-run"] === true || flags["dry-run"] === "true";
  const skipSpeckit = flags["no-speckit"] === true || flags.speckit === "false";

  if (!existsSync(join(FRAMEWORK_ROOT, "mcp", "catalog.json"))) {
    console.error(`Cannot find the framework files. Expected them at ${FRAMEWORK_ROOT}`);
    return 1;
  }

  let cfg;
  if (nonInteractive) {
    try {
      cfg = configFromFlags(flags, targetDir);
    } catch (err) {
      console.error(`\n${err.message}\n\nRun with --help for the flag list.`);
      return 1;
    }
    console.log(`create-sdd-speckit-app ${VERSION} — non-interactive`);
  } else {
    const ui = makeUi();
    ui.intro(`create-sdd-speckit-app ${VERSION}  ·  eight questions, then it scaffolds  ·  prompts: ${promptBackend}`);
    try {
      const current = baseConfig(readExistingRecord(targetDir));
      const answers = await askAll(ui, FRAMEWORK_ROOT, current, { scan: scanTarget(FRAMEWORK_ROOT, resolve(targetDir)) });
      cfg = { ...current, ...answers };

      const proceed = await ui.confirm({
        message:
          `Scaffold into ${resolve(targetDir)}?\n` +
          `  telemetry=${cfg.telemetry.enabled ? cfg.telemetry.exporter : "off"}  mode=${cfg.mode}  industry=${cfg.industry}  stack=${cfg.stack}\n  ` +
          `assistant=${targetList(cfg.assistant).join("+")}  mcp=${[...(cfg.mcp.catalog ?? []), ...(cfg.mcp.custom ?? []).map((c) => c.id)].join(",") || "none"}  editor=${cfg.editor}\n` +
          `  gates: ${GATE_IDS.map((id) => `${id}=${cfg.harness.gates[id]}`).join(" ")}`,
        initialValue: true,
      });
      ui.close();
      if (!proceed) {
        console.log("\nNothing written.");
        return 0;
      }
    } catch (err) {
      ui.close();
      if (err instanceof Cancelled) {
        console.log("\nCancelled. Nothing written.");
        return 0;
      }
      throw err;
    }
  }

  const errors = validateConfig(cfg);
  if (errors.length) {
    console.error("\nConfiguration is incomplete, so nothing was written:");
    for (const e of errors) console.error(`  - ${e}`);
    return 1;
  }

  if (!dryRun && existsSync(targetDir) && readdirSync(targetDir).length && targetDir !== ".") {
    console.log(`\nNote: ${resolve(targetDir)} is not empty. Existing files are merged, not replaced.`);
  }

  let result;
  try {
    result = scaffold(targetDir, FRAMEWORK_ROOT, cfg, { dryRun, skipSpeckit });
  } catch (err) {
    console.error(`\nScaffolding failed: ${err.message}`);
    return 1;
  }

  console.log(`\n${summarize(cfg, result)}\n`);
  return 0;
}

// Set exitCode rather than calling process.exit(): exit() truncates buffered stdout when the
// output is piped, which silently swallows the summary.
main().then(
  (code) => {
    process.exitCode = code ?? 0;
  },
  (err) => {
    console.error(err?.stack ?? String(err));
    process.exitCode = 1;
  }
);
