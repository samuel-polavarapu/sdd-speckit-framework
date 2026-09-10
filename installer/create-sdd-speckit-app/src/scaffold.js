/**
 * Writes the project. Called only after all five questions are answered and confirmed.
 * Every function returns a list of actions, so --dry-run can print exactly what would happen.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { findPreset, presetOverrides, presetVscodeExtensions } from "./presets-map.js";
import { catalogFragment, customFragment, pendingOauth } from "./mcp-map.js";
import { CONFIG_VERSION, speckitIntegrationFor } from "./config-schema.js";

const PLUGIN_DIRS = ["commands", "agents", "skills", "hooks", "templates"];

export function have(cmd, args = ["--version"]) {
  try {
    return spawnSync(cmd, args, { stdio: "ignore", timeout: 15000 }).status === 0;
  } catch {
    return false;
  }
}

function readJson(p, fallback) {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(p, data, log, label) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
  log.push(label);
}

/* ------------------------------------------------------------ 1. .specify/ */

export function initSpeckit(target, cfg, { dryRun, skipSpeckit }) {
  const integration = speckitIntegrationFor(cfg.assistant.primary);
  const log = [];

  if (skipSpeckit) {
    log.push("skipped Speckit init (--no-speckit)");
    return { log, delegated: false, integration };
  }

  const uvx = have("uvx");
  if (!uvx) {
    log.push("uvx not found — vendored templates used instead of `specify init` (see the summary)");
    return { log, delegated: false, integration, fallbackReason: "uvx not installed" };
  }

  const args = [
    "--from", "git+https://github.com/github/spec-kit.git", "specify", "init",
    "--here", "--force", "--non-interactive", "--integration", integration,
  ];
  if (dryRun) {
    log.push(`would run: uvx ${args.join(" ")}`);
    return { log, delegated: true, integration, dryRun: true };
  }

  const r = spawnSync("uvx", args, { cwd: target, stdio: "inherit", timeout: 300000 });
  if (r.status === 0) {
    log.push(`ran \`specify init --integration ${integration}\``);
    return { log, delegated: true, integration };
  }
  log.push(`\`specify init\` exited ${r.status ?? "on signal"} — vendored templates used instead`);
  return { log, delegated: false, integration, fallbackReason: `specify init failed (${r.status})` };
}

/* ---------------------------------------------- 2. plugin files + overrides */

export function copyFrameworkFiles(target, frameworkRoot, cfg, { dryRun }) {
  const log = [];

  for (const d of PLUGIN_DIRS) {
    const from = join(frameworkRoot, d);
    if (!existsSync(from)) continue;
    const to = join(target, ".claude", "sdd-speckit", d);
    if (dryRun) log.push(`would copy ${d}/ -> .claude/sdd-speckit/${d}/`);
    else {
      cpSync(from, to, { recursive: true });
      log.push(`copied ${d}/ (${readdirSync(from).length} entries) -> .claude/sdd-speckit/${d}/`);
    }
  }

  const preset = findPreset(frameworkRoot, cfg.stack);
  for (const [from, rel] of presetOverrides(preset)) {
    if (!existsSync(from)) continue;
    const to = join(target, rel);
    if (dryRun) log.push(`would copy preset override -> ${rel}`);
    else {
      mkdirSync(dirname(to), { recursive: true });
      cpSync(from, to);
      log.push(`preset override -> ${rel}`);
    }
  }
  if (preset && !presetOverrides(preset).length) log.push(`preset "${cfg.stack}" contributes no template override`);
  return log;
}

/** Registering the plugin is preferred over the raw copy; both are reported honestly. */
export function pluginRegistration(frameworkRoot) {
  const shellSubcommandsWork = have("claude", ["plugin", "--help"]);
  const marketplaceCmd = `claude plugin marketplace add ${frameworkRoot}`;
  const installCmd = "claude plugin install sdd-speckit@sdd-speckit-framework";
  return {
    shellSubcommandsWork,
    shell: [marketplaceCmd, installCmd],
    slash: [`/plugin marketplace add ${frameworkRoot}`, "/plugin install sdd-speckit@sdd-speckit-framework"],
    devLoad: `claude --plugin-dir ${frameworkRoot}`,
  };
}

/* --------------------------------------------------------------- 3. .mcp.json */

export function writeMcpJson(target, frameworkRoot, cfg, { dryRun }) {
  const log = [];
  const ids = cfg.mcp.catalog ?? [];
  const customs = cfg.mcp.custom ?? [];
  if (!ids.length && !customs.length) {
    log.push("no MCP connectors selected — .mcp.json not written");
    return { log, servers: {}, pending: [] };
  }

  const p = join(target, ".mcp.json");
  const existing = readJson(p, { mcpServers: {} });
  const servers = { ...(existing.mcpServers ?? {}) };

  for (const id of ids) {
    Object.assign(servers, catalogFragment(frameworkRoot, id, cfg.mcp.inputs?.[id] ?? {}));
    log.push(`mcp: ${id} (catalog)`);
  }
  for (const c of customs) {
    Object.assign(servers, customFragment(c));
    log.push(`mcp: ${c.id} (custom, ${c.transport})`);
  }

  if (dryRun) log.push(`would write .mcp.json with ${Object.keys(servers).length} servers`);
  else writeJson(p, { ...existing, mcpServers: servers }, log, `wrote .mcp.json (${Object.keys(servers).length} servers)`);

  return { log, servers, pending: pendingOauth(frameworkRoot, ids) };
}

/* ------------------------------------- 4. .claude/settings.json + config record */

export function writeSettings(target, cfg, { dryRun }) {
  const log = [];
  const p = join(target, ".claude", "settings.json");
  const settings = readJson(p, {});
  const env = { ...(settings.env ?? {}) };

  if (cfg.telemetry.enabled) {
    env.CLAUDE_CODE_ENABLE_TELEMETRY = "1";
    env.OTEL_METRICS_EXPORTER = cfg.telemetry.exporter;
    if (cfg.telemetry.exporter === "otlp") {
      env.OTEL_EXPORTER_OTLP_ENDPOINT = cfg.telemetry.endpoint;
      env.OTEL_EXPORTER_OTLP_PROTOCOL = "grpc";
    }
    log.push(`telemetry on (${cfg.telemetry.exporter}${cfg.telemetry.endpoint ? ` -> ${cfg.telemetry.endpoint}` : ""})`);
  } else {
    // Absent, not "0" — an explicit 0 reads as a considered opt-out of something that was on.
    for (const k of ["CLAUDE_CODE_ENABLE_TELEMETRY", "OTEL_METRICS_EXPORTER", "OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_PROTOCOL"]) {
      delete env[k];
    }
    log.push("telemetry off — no OTel env written");
  }

  const next = { ...settings };
  if (Object.keys(env).length) next.env = env;
  else delete next.env;

  if (dryRun) log.push("would write .claude/settings.json");
  else writeJson(p, next, log, "wrote .claude/settings.json");
  return log;
}

export function writeConfigRecord(target, cfg, extra, { dryRun }) {
  const log = [];
  const record = {
    configVersion: CONFIG_VERSION,
    generatedBy: "create-sdd-speckit-app",
    telemetry: cfg.telemetry,
    stack: cfg.stack,
    assistant: { ...cfg.assistant, speckitIntegration: speckitIntegrationFor(cfg.assistant.primary) },
    mcp: { catalog: cfg.mcp.catalog ?? [], custom: cfg.mcp.custom ?? [] },
    editor: cfg.editor,
    ...extra,
  };
  const p = join(target, ".specify", "sdd-speckit.json");
  if (dryRun) log.push("would write .specify/sdd-speckit.json");
  else writeJson(p, record, log, "wrote .specify/sdd-speckit.json");
  return log;
}

/* -------------------------------------------------------------- 5. editor files */

export function writeEditorFiles(target, frameworkRoot, cfg, { dryRun }) {
  const log = [];
  const map = readJson(join(frameworkRoot, "editors", "editor-map.json"), { editors: {}, aliases: {} });
  const key = map.aliases?.[cfg.editor] ?? cfg.editor;
  const entry = map.editors?.[key];

  if (!entry) {
    log.push(`editor "${cfg.editor}" is not in editor-map.json — nothing written`);
    return log;
  }
  if (!entry.copy?.length) {
    log.push(`editor "${entry.label}" — nothing to write (see ONBOARDING.md)`);
    return log;
  }

  const presetExtras = entry.mergesPresetExtensions ? presetVscodeExtensions(findPreset(frameworkRoot, cfg.stack)) : [];

  for (const c of entry.copy) {
    const from = join(frameworkRoot, c.from);
    const to = join(target, c.to);
    if (!existsSync(from)) {
      log.push(`missing source ${c.from} — skipped`);
      continue;
    }

    if (c.mergeStrategy === "merge-recommendations") {
      const base = JSON.parse(readFileSync(from, "utf8"));
      const current = readJson(to, {});
      const merged = {
        ...current,
        ...base,
        recommendations: [...new Set([...(current.recommendations ?? []), ...(base.recommendations ?? []), ...presetExtras])],
      };
      if (dryRun) log.push(`would write ${c.to} (${merged.recommendations.length} recommendations)`);
      else writeJson(to, merged, log, `wrote ${c.to} (${merged.recommendations.length} recommendations)`);
    } else if (c.mergeStrategy === "merge-shallow") {
      const merged = { ...readJson(to, {}), ...JSON.parse(readFileSync(from, "utf8")) };
      if (dryRun) log.push(`would write ${c.to}`);
      else writeJson(to, merged, log, `wrote ${c.to}`);
    } else {
      if (dryRun) log.push(`would copy ${c.from} -> ${c.to}`);
      else {
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to);
        log.push(`wrote ${c.to}`);
      }
    }
  }
  if (entry.pluginId) log.push(`JetBrains plugin required: ${entry.pluginId}`);
  return log;
}

/* -------------------------------------------------------------- 6. telemetry */

export function writeCollector(target, frameworkRoot, cfg, { dryRun }) {
  const log = [];
  if (!cfg.telemetry.enabled || cfg.telemetry.exporter !== "otlp") return log;
  const from = join(frameworkRoot, "scripts", "otel-collector");
  if (!existsSync(from)) return log;
  const to = join(target, "scripts", "otel-collector");
  if (dryRun) log.push("would copy scripts/otel-collector/");
  else {
    cpSync(from, to, { recursive: true });
    log.push("copied scripts/otel-collector/ (docker compose up -d to run it)");
  }
  return log;
}

/* ------------------------------------------------------------------ driver */

export function scaffold(targetDir, frameworkRoot, cfg, opts = {}) {
  const target = resolve(targetDir);
  const dryRun = !!opts.dryRun;
  if (!dryRun) mkdirSync(target, { recursive: true });

  const speckit = initSpeckit(target, cfg, { dryRun, skipSpeckit: opts.skipSpeckit });
  const files = copyFrameworkFiles(target, frameworkRoot, cfg, { dryRun });
  const mcp = writeMcpJson(target, frameworkRoot, cfg, { dryRun });
  const settings = writeSettings(target, cfg, { dryRun });
  const editors = writeEditorFiles(target, frameworkRoot, cfg, { dryRun });
  const collector = writeCollector(target, frameworkRoot, cfg, { dryRun });
  const record = writeConfigRecord(
    target, cfg,
    { speckitDelegated: speckit.delegated, speckitFallbackReason: speckit.fallbackReason ?? null },
    { dryRun }
  );

  return {
    target,
    dryRun,
    speckit,
    registration: pluginRegistration(frameworkRoot),
    pendingOauth: mcp.pending,
    servers: Object.keys(mcp.servers),
    log: [...speckit.log, ...files, ...mcp.log, ...settings, ...editors, ...collector, ...record],
  };
}
