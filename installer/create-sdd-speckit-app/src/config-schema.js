/**
 * The one config shape shared by the installer and /speckit.setup.
 * Adding a question is a change here first, then in prompts.js and speckit.setup.md.
 *
 * The harness gates are defined once, in scripts/harness/gates.json. The gate runner and
 * scripts/onboard-project.py read the same file, so the three never disagree.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CONFIG_VERSION = 3;

const FRAMEWORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATE_DEFS = JSON.parse(readFileSync(join(FRAMEWORK_ROOT, "scripts", "harness", "gates.json"), "utf8"));

export const MODES = ["greenfield", "brownfield"];
export const GATES = GATE_DEFS.gates;
export const GATE_IDS = GATES.map((g) => g.id);
export const GATE_MODES = GATE_DEFS.modes;
/** greenfield and brownfield, plus `migrated`: what a record from before 0.3.0 keeps doing. */
export const GATE_DEFAULTS = GATE_DEFS.defaults;

export function gateDefaults(mode) {
  return { ...(GATE_DEFAULTS[mode] ?? GATE_DEFAULTS.greenfield) };
}

/**
 * Brings a record from an earlier version up to this shape without changing what it does.
 * A record with no gates gets the `migrated` set: the constitution guard, and nothing new.
 */
export function migrateConfig(record) {
  if (!record || typeof record !== "object") return null;
  const out = { ...record, configVersion: CONFIG_VERSION };
  out.mode = MODES.includes(record.mode) ? record.mode : "greenfield";
  out.industry = record.industry || "none";
  const gates = record.harness?.gates;
  out.harness = {
    ...(record.harness ?? {}),
    gates: gates ? { ...gateDefaults(out.mode), ...gates } : gateDefaults("migrated"),
  };
  return out;
}

export const ASSISTANTS = [
  { id: "claude", label: "Claude Code", speckitIntegration: "claude", default: true },
  { id: "copilot", label: "GitHub Copilot", speckitIntegration: "copilot" },
  { id: "factory", label: "Factory Droid", speckitIntegration: "droid" },
  { id: "cursor", label: "Cursor", speckitIntegration: "cursor-agent" },
  { id: "other", label: "Other / generic", speckitIntegration: "generic" },
];

/** Shortcut accepted wherever a primary assistant is: Claude Code primary, Copilot secondary. */
export const BOTH = "both";

/** Resolves --assistant=both, and drops a secondary that repeats the primary. */
export function normalizeAssistant(assistant) {
  const a = { primary: assistant?.primary ?? "claude", secondary: [...(assistant?.secondary ?? [])] };
  if (a.primary === BOTH) {
    a.primary = "claude";
    a.secondary.push("copilot");
  }
  a.secondary = [...new Set(a.secondary)].filter((s) => s !== a.primary);
  return a;
}

/**
 * Which assistants get set up. Copilot files when copilot is chosen at all. Factory Droid when
 * factory is chosen: the Droid plugin is installed from the marketplace, so the project gets
 * AGENTS.md, the pinned support files and the install steps rather than rendered files. Claude
 * Code files when claude is chosen, and also when none of the three is: before 0.2.0 every
 * project got the Claude Code files, and a Cursor or generic project still does.
 */
export function targetsFor(assistant) {
  const chosen = new Set([assistant?.primary, ...(assistant?.secondary ?? [])]);
  const copilot = chosen.has("copilot");
  const factory = chosen.has("factory");
  const claude = chosen.has("claude") || (!copilot && !factory);
  return { claude, copilot, factory };
}

export const TARGET_LABELS = { claude: "Claude Code", copilot: "GitHub Copilot", factory: "Factory Droid" };

export function targetList(assistant) {
  const t = targetsFor(assistant);
  return [t.claude && "claude", t.copilot && "copilot", t.factory && "factory"].filter(Boolean);
}

export const EDITORS = ["vscode", "cursor", "jetbrains", "none"];
export const TRANSPORTS = ["http", "sse", "stdio"];
export const EXPORTERS = ["console", "otlp"];

/** Defaults used for any answer a non-interactive run does not supply. */
export function defaultConfig() {
  return {
    configVersion: CONFIG_VERSION,
    telemetry: { enabled: false, exporter: "console", endpoint: "" },
    mode: "greenfield",
    industry: "none",
    stack: "custom",
    assistant: { primary: "claude", secondary: [] },
    mcp: { catalog: [], custom: [] },
    editor: "vscode",
    harness: { gates: gateDefaults("greenfield") },
  };
}

export function speckitIntegrationFor(assistantId) {
  const found = ASSISTANTS.find((a) => a.id === assistantId);
  return found ? found.speckitIntegration : "generic";
}

/** Validates a custom MCP entry against mcp/custom-template.json's rules. */
export function validateCustomMcp(entry) {
  const errors = [];
  if (!entry || typeof entry !== "object") return ["entry is not an object"];

  if (!entry.id) errors.push("id is required");
  else if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.id))
    errors.push(`id "${entry.id}" must be lowercase letters, digits and hyphens`);

  if (!entry.transport) errors.push("transport is required");
  else if (!TRANSPORTS.includes(entry.transport))
    errors.push(`transport "${entry.transport}" must be one of ${TRANSPORTS.join(", ")}`);

  if (entry.transport === "stdio") {
    if (!entry.command) errors.push("stdio transport needs a command");
    if (entry.url) errors.push("stdio transport must not have a url");
  } else if (entry.transport === "http" || entry.transport === "sse") {
    if (!entry.url) errors.push(`${entry.transport} transport needs a url`);
    else if (!/^https?:\/\//.test(entry.url)) errors.push(`url "${entry.url}" must start with http:// or https://`);
    if (entry.command) errors.push(`${entry.transport} transport must not have a command`);
  }

  if (entry.credentialEnvVar && !/^[A-Z][A-Z0-9_]*$/.test(entry.credentialEnvVar))
    errors.push(`credentialEnvVar "${entry.credentialEnvVar}" must be UPPER_SNAKE_CASE`);

  return errors;
}

/** Rejects a config that is missing an answer, so nothing scaffolds half-configured. */
export function validateConfig(cfg) {
  const errors = [];
  if (!cfg.telemetry || typeof cfg.telemetry.enabled !== "boolean")
    errors.push("telemetry.enabled must be answered");
  if (cfg.telemetry?.enabled) {
    if (!EXPORTERS.includes(cfg.telemetry.exporter))
      errors.push(`telemetry.exporter must be one of ${EXPORTERS.join(", ")}`);
    if (cfg.telemetry.exporter === "otlp" && !cfg.telemetry.endpoint)
      errors.push("telemetry.endpoint is required when the exporter is otlp");
  }
  if (!MODES.includes(cfg.mode)) errors.push(`mode must be one of ${MODES.join(", ")}`);
  if (!cfg.industry) errors.push("industry must be answered, even if the answer is none");
  if (!cfg.stack) errors.push("stack must be answered");
  for (const id of GATE_IDS) {
    const m = cfg.harness?.gates?.[id];
    if (!GATE_MODES.includes(m)) errors.push(`harness gate "${id}" must be one of ${GATE_MODES.join(", ")}`);
  }
  for (const id of Object.keys(cfg.harness?.gates ?? {})) {
    if (!GATE_IDS.includes(id)) errors.push(`harness gate "${id}" is unknown`);
  }
  if (!cfg.assistant?.primary) errors.push("assistant.primary must be answered");
  else if (!ASSISTANTS.some((a) => a.id === cfg.assistant.primary))
    errors.push(`assistant.primary "${cfg.assistant.primary}" is unknown`);
  for (const s of cfg.assistant?.secondary ?? []) {
    if (!ASSISTANTS.some((a) => a.id === s)) errors.push(`secondary assistant "${s}" is unknown`);
  }
  if (!cfg.mcp || !Array.isArray(cfg.mcp.catalog) || !Array.isArray(cfg.mcp.custom))
    errors.push("mcp must be answered, even if the answer is none");
  if (!cfg.editor) errors.push("editor must be answered");
  else if (!EDITORS.includes(cfg.editor)) errors.push(`editor "${cfg.editor}" is unknown`);

  for (const c of cfg.mcp?.custom ?? []) {
    for (const e of validateCustomMcp(c)) errors.push(`custom mcp: ${e}`);
  }
  return errors;
}
