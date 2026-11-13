/**
 * The eight required questions, in order:
 *   1 telemetry  2 project mode  3 industry  4 tech stack  5 primary assistant
 *   6 MCP connectors  7 code editor  8 harness gates
 *
 * Nothing here touches the filesystem. The caller scaffolds only after all eight return.
 *
 * Uses @clack/prompts when it is installed, and falls back to node:readline otherwise, so the
 * installer runs from a bare checkout with no npm install.
 */
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { findProfile, industryChoices, stackChoices } from "./profiles-map.js";
import { catalogChoices, connectorsNeedingInput, findConnector, suggestedConnectors } from "./mcp-map.js";
import {
  ASSISTANTS, BOTH, EXPORTERS, GATES, GATE_MODES, gateDefaults, normalizeAssistant, validateCustomMcp,
} from "./config-schema.js";

let clack = null;
try {
  clack = await import("@clack/prompts");
} catch {
  clack = null;
}

export class Cancelled extends Error {}

/* ------------------------------------------------------------------ plain UI */

/**
 * Line-queue reader. node:readline/promises answers only the first question when stdin is a
 * pipe, so the queue is what makes a piped or heredoc-driven run work the same as a TTY.
 */
function makeLineReader() {
  const rl = createInterface({ input: stdin, terminal: !!stdin.isTTY });
  const queue = [];
  const waiters = [];
  let closed = false;

  rl.on("line", (line) => {
    const w = waiters.shift();
    if (w) w(line);
    else queue.push(line);
  });
  rl.on("close", () => {
    closed = true;
    while (waiters.length) waiters.shift()(null);
  });

  return {
    close: () => rl.close(),
    next: () =>
      new Promise((resolve) => {
        if (queue.length) return resolve(queue.shift());
        if (closed) return resolve(null);
        waiters.push(resolve);
      }),
  };
}

function makePlainUi() {
  const reader = makeLineReader();
  const ask = async (q) => {
    stdout.write(q);
    const line = await reader.next();
    if (line === null) throw new Cancelled("stdin closed before every question was answered");
    return line.trim();
  };

  return {
    close: () => reader.close(),
    intro: (t) => console.log(`\n${t}\n`),
    outro: (t) => console.log(`\n${t}\n`),
    note: (body, title) => console.log(`${title ? `— ${title}\n` : ""}${body}\n`),

    async confirm({ message, initialValue = false }) {
      const suffix = initialValue ? "(Y/n)" : "(y/N)";
      const a = (await ask(`${message} ${suffix} `)).toLowerCase();
      if (a === "") return initialValue;
      return a === "y" || a === "yes";
    },

    async text({ message, placeholder, initialValue = "", validate }) {
      for (;;) {
        const hint = placeholder ? ` [${placeholder}]` : initialValue ? ` [${initialValue}]` : "";
        const a = (await ask(`${message}${hint}: `)) || initialValue;
        const err = validate ? validate(a) : undefined;
        if (err) {
          console.log(`  ! ${err}`);
          continue;
        }
        return a;
      }
    },

    async select({ message, options, initialValue }) {
      console.log(`\n${message}`);
      options.forEach((o, i) => {
        const mark = o.value === initialValue ? "*" : " ";
        console.log(`  ${mark} ${i + 1}) ${o.label}${o.hint ? ` — ${o.hint}` : ""}`);
      });
      for (;;) {
        const a = await ask(`Choose 1-${options.length} [${options.findIndex((o) => o.value === initialValue) + 1 || 1}]: `);
        const idx = a === "" ? options.findIndex((o) => o.value === initialValue) : Number(a) - 1;
        const pick = options[idx < 0 ? 0 : idx];
        if (pick) return pick.value;
        console.log("  ! Not a listed option.");
      }
    },

    async multiselect({ message, options, required = false, initialValues = [] }) {
      console.log(`\n${message}`);
      options.forEach((o, i) => console.log(`  ${i + 1}) ${o.label}${o.hint ? ` — ${o.hint}` : ""}`));
      const preset = options.filter((o) => initialValues.includes(o.value));
      const hint = preset.length
        ? `blank keeps ${preset.map((o) => o.value).join(", ")}; "none" for none`
        : "blank for none";
      for (;;) {
        const a = await ask(`Numbers, comma separated (${hint}): `);
        if (a === "" && preset.length) return preset.map((o) => o.value);
        if (a.toLowerCase() === "none" && !required) return [];
        if (a === "") {
          if (required) {
            console.log("  ! Choose at least one.");
            continue;
          }
          return [];
        }
        const nums = a.split(",").map((s) => Number(s.trim()) - 1);
        if (nums.some((n) => Number.isNaN(n) || !options[n])) {
          console.log("  ! Not a listed option.");
          continue;
        }
        return nums.map((n) => options[n].value);
      }
    },
  };
}

/* ------------------------------------------------------------------ clack UI */

function makeClackUi() {
  const guard = (v) => {
    if (clack.isCancel(v)) throw new Cancelled("cancelled");
    return v;
  };
  return {
    close: () => {},
    intro: (t) => clack.intro(t),
    outro: (t) => clack.outro(t),
    note: (b, t) => clack.note(b, t),
    confirm: async (o) => guard(await clack.confirm(o)),
    text: async (o) => guard(await clack.text(o)),
    select: async (o) => guard(await clack.select(o)),
    multiselect: async (o) => guard(await clack.multiselect({ ...o, required: o.required ?? false })),
  };
}

export function makeUi() {
  return clack ? makeClackUi() : makePlainUi();
}

export const promptBackend = clack ? "@clack/prompts" : "readline";

/* ------------------------------------------------------ the eight questions */

export async function askTelemetry(ui, current) {
  const enabled = await ui.confirm({
    message:
      "Enable OpenTelemetry usage monitoring for this project?\n" +
      "  It records local metrics — sessions, tokens, estimated cost. It sends nothing to Anthropic.",
    initialValue: current?.enabled ?? false,
  });
  if (!enabled) return { enabled: false, exporter: "console", endpoint: "" };

  const exporter = await ui.select({
    message: "Which exporter?",
    initialValue: current?.exporter ?? "console",
    options: [
      { value: "console", label: "console", hint: "Prints locally. No collector to run." },
      { value: "otlp", label: "otlp", hint: "Sends to a collector. Needs an endpoint." },
    ],
  });
  if (!EXPORTERS.includes(exporter)) throw new Error(`unknown exporter ${exporter}`);

  let endpoint = "";
  if (exporter === "otlp") {
    endpoint = await ui.text({
      message: "OTLP endpoint",
      placeholder: "http://localhost:4317",
      initialValue: current?.endpoint || "http://localhost:4317",
      validate: (v) => (/^https?:\/\//.test(v) ? undefined : "Must start with http:// or https://"),
    });
  }
  return { enabled: true, exporter, endpoint };
}

/** `scan` is the brief repository scan, or null. It only sets which option starts selected. */
export async function askMode(ui, current, scan) {
  if (scan?.mode === "brownfield") ui.note(scan.modeReasons.join("\n"), "This directory already holds code");
  return ui.select({
    message: "Is this a new project or an existing codebase?",
    initialValue: current ?? scan?.mode ?? "greenfield",
    options: [
      { value: "greenfield", label: "Greenfield — new project", hint: "Gates start at block: spec, plan and tasks come before code" },
      { value: "brownfield", label: "Brownfield — existing codebase", hint: "Gates start at warn. Discovery, a derived constitution and baseline specs come first" },
    ],
  });
}

export async function askIndustry(ui, frameworkRoot, current) {
  return ui.select({
    message: "Which industry or domain? It adds that domain's standards to the constitution, spec, plan, tasks and checklists.",
    initialValue: current ?? "none",
    options: industryChoices(frameworkRoot),
  });
}

export async function askStack(ui, frameworkRoot, current, scan) {
  const options = stackChoices(frameworkRoot);
  const suggested = options.some((o) => o.value === scan?.stack) ? scan.stack : null;
  return ui.select({
    message: "Which tech stack?" + (suggested && suggested !== "custom" ? ` (detected: ${suggested})` : ""),
    initialValue: current && current !== "custom" ? current : suggested ?? current ?? "custom",
    options,
  });
}

export async function askHarness(ui, mode, current) {
  const defaults = gateDefaults(mode);
  const summary = GATES.map((g) => `${g.id}=${defaults[g.id]}`).join("  ");
  const choice = await ui.select({
    message: "How strict should the harness gates be? They run in the assistant hooks and in CI.",
    initialValue: "default",
    options: [
      { value: "default", label: `Use the ${mode} defaults`, hint: summary },
      { value: "custom", label: "Choose each gate", hint: "off, warn or block, gate by gate" },
      { value: "warn", label: "All warn", hint: "Report every finding, block nothing" },
      { value: "off", label: "All off", hint: "No gates. You can turn them on later with /speckit.setup" },
    ],
  });
  if (choice === "default") return { gates: defaults };
  if (choice !== "custom") return { gates: Object.fromEntries(GATES.map((g) => [g.id, choice])) };

  const gates = {};
  for (const g of GATES) {
    gates[g.id] = await ui.select({
      message: `${g.label} — ${g.description}`,
      initialValue: current?.gates?.[g.id] ?? defaults[g.id],
      options: GATE_MODES.map((m) => ({ value: m, label: m })),
    });
  }
  return { gates };
}

export async function askAssistant(ui, current) {
  const options = ASSISTANTS.map((a) => ({
    value: a.id,
    label: a.label + (a.default ? " (default)" : ""),
    hint: `Speckit integration: ${a.speckitIntegration}`,
  }));
  // "Both" sits right after the three assistants this framework ships for (Claude, Copilot, Droid).
  options.splice(3, 0, {
    value: BOTH,
    label: "Both — Claude Code and GitHub Copilot",
    hint: "Writes the Claude Code plugin files and the .github/ Copilot files",
  });

  const primary = await ui.select({
    message: "Primary AI coding assistant?",
    initialValue: current?.primary ?? "claude",
    options,
  });
  if (primary === BOTH) return normalizeAssistant({ primary });

  const secondary = await ui.multiselect({
    message: "Any secondary assistants? (optional)",
    options: ASSISTANTS.filter((a) => a.id !== primary).map((a) => ({ value: a.id, label: a.label })),
  });
  return normalizeAssistant({ primary, secondary });
}

export async function askMcp(ui, frameworkRoot, current, stack) {
  const suggested = suggestedConnectors(frameworkRoot, stack);
  // Earlier picks win. On a first run the stack profile's suggestions are pre-selected, never applied
  // silently: the user sees them ticked and can untick them.
  const initialValues = current?.catalog?.length ? current.catalog : suggested;
  if (suggested.length) {
    ui.note(`${suggested.join(", ")}\nPre-selected below. Untick any you do not want.`,
      `Connectors the ${stack} stack profile suggests`);
  }
  const catalog = await ui.multiselect({
    message: "Which MCP connectors? (optional — you can add more later with /speckit.setup)",
    options: catalogChoices(frameworkRoot),
    initialValues,
  });

  // A tenant-hosted connector has no default endpoint. Collect it, or drop the pick.
  const inputs = {};
  for (const c of connectorsNeedingInput(frameworkRoot, catalog)) {
    ui.note(
      `${c.displayName} is hosted by your own organization, so this framework ships no default URL.\n` +
        `A ${c.displayName.split(" ")[0]} admin provisions the host and the credential. Ask your platform team.`,
      "One more thing"
    );
    const url = await ui.text({
      message: `${c.displayName} MCP URL`,
      placeholder: c.userInput?.[0]?.example ?? "https://<your-host>/mcp",
      validate: (v) => (/^https?:\/\/.+/.test(v) ? undefined : "Must be an http:// or https:// URL"),
    });
    const credentialEnvVar = await ui.text({
      message: `Env var holding the ${c.displayName} credential`,
      initialValue: c.auth?.credentialEnvVar ?? "API_TOKEN",
      validate: (v) => (/^[A-Z][A-Z0-9_]*$/.test(v) ? undefined : "Must be UPPER_SNAKE_CASE"),
    });
    inputs[c.id] = { url, credentialEnvVar };
  }

  const custom = [...(current?.custom ?? [])];
  for (;;) {
    const more = await ui.confirm({
      message: custom.length ? "Add another custom MCP server?" : "Add a custom MCP server?",
      initialValue: false,
    });
    if (!more) break;

    const id = await ui.text({
      message: "Server name",
      placeholder: "acme-tickets",
      validate: (v) => {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) return "Lowercase letters, digits and hyphens";
        if (custom.some((c) => c.id === v) || catalog.includes(v)) return `"${v}" is already configured`;
        return undefined;
      },
    });
    const transport = await ui.select({
      message: "Transport",
      initialValue: "http",
      options: [
        { value: "http", label: "http", hint: "Remote server, streamable HTTP" },
        { value: "sse", label: "sse", hint: "Remote server, server-sent events" },
        { value: "stdio", label: "stdio", hint: "Local process" },
      ],
    });

    const entry = { id, transport };
    if (transport === "stdio") {
      const cmd = await ui.text({
        message: "Command and arguments",
        placeholder: "npx -y @acme/mcp-server",
        validate: (v) => (v.trim() ? undefined : "Required"),
      });
      const parts = cmd.trim().split(/\s+/);
      entry.command = parts[0];
      entry.args = parts.slice(1);
    } else {
      entry.url = await ui.text({
        message: "URL",
        placeholder: "https://mcp.acme.example/mcp",
        validate: (v) => (/^https?:\/\/.+/.test(v) ? undefined : "Must be an http:// or https:// URL"),
      });
      const cred = await ui.text({
        message: "Env var holding the credential (blank if none)",
        initialValue: "",
      });
      if (cred) entry.credentialEnvVar = cred;
    }

    const errors = validateCustomMcp(entry);
    if (errors.length) {
      ui.note(errors.map((e) => `- ${e}`).join("\n"), "Not added — validation failed");
      continue;
    }
    custom.push(entry);
  }

  return { catalog, custom, inputs };
}

export async function askEditor(ui, current) {
  return ui.select({
    message: "Preferred code editor?",
    initialValue: current ?? "vscode",
    options: [
      { value: "vscode", label: "VS Code (default)", hint: "Recommends each chosen assistant's extension via .vscode/extensions.json" },
      { value: "cursor", label: "Cursor", hint: "VS Code fork; same extension ids" },
      { value: "jetbrains", label: "JetBrains (IntelliJ IDEA, PyCharm, WebStorm, Rider)", hint: "Requires each chosen assistant's plugin via .idea/externalDependencies.xml" },
      { value: "none", label: "Other / none", hint: "Writes nothing. ONBOARDING.md keeps the pointers." },
    ],
  });
}

/** Runs all eight, in order. Returns a complete config, or throws Cancelled. */
export async function askAll(ui, frameworkRoot, current = {}, { scan = null } = {}) {
  const telemetry = await askTelemetry(ui, current.telemetry);
  const mode = await askMode(ui, current.mode, scan);
  const industry = await askIndustry(ui, frameworkRoot, current.industry);
  const stack = await askStack(ui, frameworkRoot, current.stack, scan);
  const assistant = await askAssistant(ui, current.assistant);
  const mcp = await askMcp(ui, frameworkRoot, current.mcp, stack);
  const editor = await askEditor(ui, current.editor);
  const harness = await askHarness(ui, mode, current.harness);
  return { telemetry, mode, industry, stack, assistant, mcp, editor, harness };
}
