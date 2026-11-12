/**
 * The one config shape shared by the installer and /speckit.setup.
 * Adding a question is a change here first, then in prompts.js and speckit.setup.md.
 */

export const CONFIG_VERSION = 2;

export const ASSISTANTS = [
  { id: "claude", label: "Claude Code", speckitIntegration: "claude", default: true },
  { id: "copilot", label: "GitHub Copilot", speckitIntegration: "copilot" },
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
 * Which assistants get files written. Copilot files when copilot is chosen at all. Claude Code
 * files when claude is chosen, and also when neither is: before 0.2.0 every project got the
 * Claude Code files, and a Cursor or generic project still does.
 */
export function targetsFor(assistant) {
  const chosen = new Set([assistant?.primary, ...(assistant?.secondary ?? [])]);
  const copilot = chosen.has("copilot");
  const claude = chosen.has("claude") || !copilot;
  return { claude, copilot };
}

export function targetList(assistant) {
  const t = targetsFor(assistant);
  return [t.claude && "claude", t.copilot && "copilot"].filter(Boolean);
}

export const EDITORS = ["vscode", "cursor", "jetbrains", "none"];
export const TRANSPORTS = ["http", "sse", "stdio"];
export const EXPORTERS = ["console", "otlp"];

/** Defaults used for any answer a non-interactive run does not supply. */
export function defaultConfig() {
  return {
    configVersion: CONFIG_VERSION,
    telemetry: { enabled: false, exporter: "console", endpoint: "" },
    stack: "custom",
    assistant: { primary: "claude", secondary: [] },
    mcp: { catalog: [], custom: [] },
    editor: "vscode",
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
  if (!cfg.stack) errors.push("stack must be answered");
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
