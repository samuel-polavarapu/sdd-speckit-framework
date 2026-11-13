import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultConfig, validateConfig, normalizeAssistant, targetsFor, targetList, validateCustomMcp,
} from "../src/config-schema.js";

test("the default config is valid", () => {
  assert.deepEqual(validateConfig(defaultConfig()), []);
});

test("both = claude primary, copilot secondary", () => {
  assert.deepEqual(normalizeAssistant({ primary: "both" }), { primary: "claude", secondary: ["copilot"] });
  assert.deepEqual(normalizeAssistant({ primary: "claude", secondary: ["claude", "copilot", "copilot"] }).secondary, ["copilot"]);
});

test("targets: claude files unless copilot is the only one chosen", () => {
  assert.deepEqual(targetsFor({ primary: "copilot", secondary: [] }), { claude: false, copilot: true });
  assert.deepEqual(targetsFor({ primary: "cursor", secondary: [] }), { claude: true, copilot: false });
  assert.deepEqual(targetList({ primary: "claude", secondary: ["copilot"] }), ["claude", "copilot"]);
});

test("validateConfig rejects unknown answers", () => {
  const cfg = defaultConfig();
  cfg.editor = "emacs";
  cfg.assistant.primary = "nobody";
  assert.equal(validateConfig(cfg).length, 2);
});

test("otlp telemetry needs an endpoint", () => {
  const cfg = defaultConfig();
  cfg.telemetry = { enabled: true, exporter: "otlp", endpoint: "" };
  assert.match(validateConfig(cfg).join("\n"), /endpoint/);
});

test("custom MCP entries are validated by transport", () => {
  assert.deepEqual(validateCustomMcp({ id: "x", transport: "http", url: "https://h/mcp" }), []);
  assert.ok(validateCustomMcp({ id: "x", transport: "stdio" }).length);
  assert.ok(validateCustomMcp({ id: "Bad Id", transport: "http", url: "ftp://h" }).length >= 2);
});
