import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function loadCatalog(frameworkRoot) {
  const p = join(frameworkRoot, "mcp", "catalog.json");
  if (!existsSync(p)) return { connectors: [] };
  return JSON.parse(readFileSync(p, "utf8"));
}

export function catalogChoices(frameworkRoot) {
  return loadCatalog(frameworkRoot).connectors.map((c) => {
    const bits = [];
    if (c.auth?.kind === "none") bits.push("no auth");
    else if (c.auth?.needsUpfrontCredential) bits.push(`needs ${c.auth.credentialEnvVar ?? "a credential"} up front`);
    else bits.push("OAuth — authorize once with /mcp");
    if (c.requiresUserInput) bits.push("asks for your own URL");
    return { value: c.id, label: c.displayName, hint: `${c.description} (${bits.join("; ")})` };
  });
}

export function findConnector(frameworkRoot, id) {
  return loadCatalog(frameworkRoot).connectors.find((c) => c.id === id) ?? null;
}

/** Connectors the installer must prompt for before it can write anything. */
export function connectorsNeedingInput(frameworkRoot, ids) {
  return loadCatalog(frameworkRoot).connectors.filter((c) => ids.includes(c.id) && c.requiresUserInput);
}

export const RALLY_URL_PLACEHOLDER = "RALLY_MCP_URL_PLACEHOLDER";

/**
 * Builds the mcpServers fragment for one catalog pick.
 * `answers` supplies the values for a connector that requires user input (Rally).
 */
export function catalogFragment(frameworkRoot, id, answers = {}) {
  const snippet = join(frameworkRoot, "mcp", "snippets", `${id}.json`);
  if (!existsSync(snippet)) throw new Error(`no snippet for connector "${id}"`);
  const parsed = JSON.parse(readFileSync(snippet, "utf8"));
  delete parsed.$comment;
  const servers = parsed.mcpServers ?? {};

  const connector = findConnector(frameworkRoot, id);
  if (connector?.requiresUserInput) {
    const entry = servers[id];
    if (!entry) throw new Error(`snippet for "${id}" has no "${id}" server entry`);
    const url = answers.url;
    if (!url) throw new Error(`connector "${id}" is tenant-hosted and has no default URL — collect it from the user`);
    if (url === RALLY_URL_PLACEHOLDER) throw new Error(`connector "${id}" was given the placeholder URL instead of a real one`);
    entry.url = url;
    const envVar = answers.credentialEnvVar || connector.auth?.credentialEnvVar;
    if (envVar && entry.headers?.Authorization) entry.headers.Authorization = `Bearer \${${envVar}}`;
  }
  return servers;
}

/** Builds the mcpServers fragment for a validated custom entry. */
export function customFragment(entry) {
  const server = entry.transport === "stdio"
    ? { type: "stdio", command: entry.command, ...(entry.args?.length ? { args: entry.args } : {}), ...(entry.env ? { env: entry.env } : {}) }
    : { type: entry.transport, url: entry.url };

  if (entry.transport !== "stdio" && entry.credentialEnvVar) {
    server.headers = { [entry.headerName || "Authorization"]: `Bearer \${${entry.credentialEnvVar}}` };
  }
  return { [entry.id]: server };
}

/** Connectors still needing a one-time /mcp authorization after .mcp.json is written. */
export function pendingOauth(frameworkRoot, ids) {
  return loadCatalog(frameworkRoot)
    .connectors.filter((c) => ids.includes(c.id) && c.auth?.kind !== "none")
    .map((c) => ({ id: c.id, displayName: c.displayName, note: c.notes }));
}
