#!/usr/bin/env node
/**
 * create-sdd-speckit-app — interactive installer for the SDD Speckit Framework.
 *
 * Order is load-bearing: all five questions are answered and confirmed before anything is
 * written. In non-interactive mode the flags stand in for the answers, and a missing flag falls
 * back to a documented default.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { defaultConfig, validateConfig, speckitIntegrationFor, ASSISTANTS, validateCustomMcp } from "../src/config-schema.js";
import { askAll, makeUi, promptBackend, Cancelled } from "../src/prompts.js";
import { scaffold } from "../src/scaffold.js";
import { loadCatalog, connectorsNeedingInput } from "../src/mcp-map.js";
import { loadPresets } from "../src/presets-map.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRAMEWORK_ROOT = resolve(HERE, "..", "..", "..");
const VERSION = "0.1.0";

/* ------------------------------------------------------------------- args */

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  const repeatable = new Set(["mcp-custom", "mcp-input"]);

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
  const presets = loadPresets(FRAMEWORK_ROOT).map((p) => p.id).join(" | ");
  const connectors = loadCatalog(FRAMEWORK_ROOT).connectors.map((c) => c.id).join(",");
  return `create-sdd-speckit-app ${VERSION}

  npx create-sdd-speckit-app [project-directory] [options]

Asks five questions, in this order, before it writes anything:
  1 telemetry   2 tech stack   3 primary assistant   4 MCP connectors   5 code editor

Options
  --yes                      Non-interactive. Every unset flag takes its documented default.
  --telemetry=<on|off>       Default: off
  --otel-exporter=<console|otlp>   Default: console
  --otel-endpoint=<url>      Required when the exporter is otlp
  --stack=<id>               ${presets} | custom      Default: custom
  --assistant=<id>           ${ASSISTANTS.map((a) => a.id).join(" | ")}      Default: claude
  --secondary-assistants=<a,b>
  --mcp=<ids>                Comma separated from: ${connectors}
  --mcp-custom=<name>:<transport>:<url-or-command>   Repeatable
  --mcp-input=<id>.<field>=<value>                   Answers a connector that needs your own URL,
                             e.g. --mcp-input=rally.url=https://host/mcp
  --editor=<vscode|cursor|jetbrains|none>            Default: vscode
  --dry-run                  Print every action and write nothing
  --force-interactive        Ask the five questions even without a TTY (for demos and tests)
  --no-speckit               Skip \`specify init\`; use the vendored templates
  --version, --help

Non-interactive example
  npx create-sdd-speckit-app my-app --yes --stack=python-fastapi --assistant=claude \\
      --telemetry=off --mcp=github,playwright --editor=vscode

A tenant-hosted connector such as Rally has no default URL. Supply it with --mcp-input, or the
run fails rather than writing a guess.

Docs: docs/INSTALLER.md · docs/MCP_CONNECTORS.md`;
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

function configFromFlags(flags) {
  const cfg = defaultConfig();

  const t = flags.telemetry;
  if (t === "on" || t === true) {
    cfg.telemetry.enabled = true;
    cfg.telemetry.exporter = flags["otel-exporter"] ?? (flags["otel-endpoint"] ? "otlp" : "console");
    cfg.telemetry.endpoint = flags["otel-endpoint"] ?? "";
  } else if (t === "off" || t === undefined) {
    cfg.telemetry.enabled = false;
  } else {
    throw new Error(`--telemetry must be on or off, got "${t}"`);
  }

  if (flags.stack) cfg.stack = flags.stack;
  if (flags.assistant) cfg.assistant.primary = flags.assistant;
  if (flags["secondary-assistants"]) {
    cfg.assistant.secondary = String(flags["secondary-assistants"]).split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (flags.mcp) cfg.mcp.catalog = String(flags.mcp).split(",").map((s) => s.trim()).filter(Boolean);
  if (flags["mcp-custom"]) cfg.mcp.custom = flags["mcp-custom"].map(parseCustomMcpFlag);
  if (flags.editor) cfg.editor = flags.editor;

  // --mcp-input=rally.url=https://...
  cfg.mcp.inputs = {};
  const rawInputs = flags["mcp-input"] ? [].concat(flags["mcp-input"]) : [];
  for (const spec of rawInputs) {
    const m = /^([a-z0-9-]+)\.([A-Za-z]+)=(.+)$/.exec(spec);
    if (!m) throw new Error(`--mcp-input="${spec}" must be <connector>.<field>=<value>`);
    (cfg.mcp.inputs[m[1]] ??= {})[m[2]] = m[3];
  }

  const stackIds = new Set([...loadPresets(FRAMEWORK_ROOT).map((p) => p.id), "custom"]);
  if (!stackIds.has(cfg.stack)) throw new Error(`--stack="${cfg.stack}" is unknown. Choose: ${[...stackIds].join(" | ")}`);

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
  lines.push(`  2 Tech stack         ${cfg.stack}`);
  lines.push(`  3 Primary assistant  ${cfg.assistant.primary} (Speckit integration: ${speckitIntegrationFor(cfg.assistant.primary)})`);
  if (cfg.assistant.secondary?.length) lines.push(`    Secondary          ${cfg.assistant.secondary.join(", ")}`);
  lines.push(`  4 MCP connectors     ${[...(cfg.mcp.catalog ?? []), ...(cfg.mcp.custom ?? []).map((c) => `${c.id} (custom)`)].join(", ") || "none"}`);
  lines.push(`  5 Editor             ${cfg.editor}`);

  lines.push("", result.dryRun ? "Would do (dry run — nothing written)" : "Done");
  for (const l of result.log) lines.push(`  - ${l}`);

  if (!result.speckit.delegated && !result.dryRun) {
    lines.push("", "Speckit scaffolding");
    lines.push(`  \`specify init\` did not run (${result.speckit.fallbackReason ?? "skipped"}).`);
    lines.push("  The vendored templates were used instead. To get the real .specify/ layout, install uv");
    lines.push("  (https://docs.astral.sh/uv/) and run:");
    lines.push(`    uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --integration ${result.speckit.integration}`);
  }

  if (result.pendingOauth.length) {
    lines.push("", "Still to authorize — writing .mcp.json does not complete an OAuth login");
    lines.push("  Open Claude Code in the project and run /mcp once, then authorize:");
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
    lines.push("", "Environment variables to export before you start Claude Code");
    for (const v of [...new Set(cred)]) lines.push(`    ${v}`);
    lines.push("  .mcp.json references them by name, so no secret is committed.");
  }

  lines.push("", "Register the plugin");
  if (result.registration.shellSubcommandsWork) {
    for (const c of result.registration.shell) lines.push(`    ${c}`);
    lines.push("  Or, inside an interactive session:");
  } else {
    lines.push("  `claude plugin` subcommands are unavailable here. Inside an interactive session run:");
  }
  for (const c of result.registration.slash) lines.push(`    ${c}`);
  lines.push(`  For local development without a marketplace: ${result.registration.devLoad}`);

  lines.push("", "Next step");
  lines.push("    /sdd-speckit:speckit.constitution");
  return lines.join("\n");
}

/* ------------------------------------------------------------------- main */

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (flags.help || flags.h) return console.log(usage()), 0;
  if (flags.version || flags.v) return console.log(VERSION), 0;

  const targetDir = positional[0] ?? ".";
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
      cfg = configFromFlags(flags);
    } catch (err) {
      console.error(`\n${err.message}\n\nRun with --help for the flag list.`);
      return 1;
    }
    console.log(`create-sdd-speckit-app ${VERSION} — non-interactive`);
  } else {
    const ui = makeUi();
    ui.intro(`create-sdd-speckit-app ${VERSION}  ·  five questions, then it scaffolds  ·  prompts: ${promptBackend}`);
    try {
      const answers = await askAll(ui, FRAMEWORK_ROOT, defaultConfig());
      cfg = { ...defaultConfig(), ...answers };

      const proceed = await ui.confirm({
        message:
          `Scaffold into ${resolve(targetDir)}?\n` +
          `  telemetry=${cfg.telemetry.enabled ? cfg.telemetry.exporter : "off"}  stack=${cfg.stack}  ` +
          `assistant=${cfg.assistant.primary}  mcp=${[...(cfg.mcp.catalog ?? []), ...(cfg.mcp.custom ?? []).map((c) => c.id)].join(",") || "none"}  editor=${cfg.editor}`,
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
