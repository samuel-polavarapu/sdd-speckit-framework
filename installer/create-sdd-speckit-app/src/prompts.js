/**
 * The five required questions, in order:
 *   1 telemetry  2 tech stack  3 primary assistant  4 MCP connectors  5 code editor
 *
 * Nothing here touches the filesystem. The caller scaffolds only after all five return.
 *
 * Uses @clack/prompts when it is installed, and falls back to node:readline otherwise, so the
 * installer runs from a bare checkout with no npm install.
 */
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { presetChoices } from "./presets-map.js";
import { catalogChoices, connectorsNeedingInput, findConnector } from "./mcp-map.js";
import { ASSISTANTS, EXPORTERS, validateCustomMcp } from "./config-schema.js";

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

    async multiselect({ message, options, required = false }) {
      console.log(`\n${message}`);
      options.forEach((o, i) => console.log(`  ${i + 1}) ${o.label}${o.hint ? ` — ${o.hint}` : ""}`));
      for (;;) {
        const a = await ask("Numbers, comma separated (blank for none): ");
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

/* ------------------------------------------------------- the five questions */

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

export async function askStack(ui, frameworkRoot, current) {
  return ui.select({
    message: "Which tech stack?",
    initialValue: current ?? "custom",
    options: presetChoices(frameworkRoot),
  });
}

export async function askAssistant(ui, current) {
  const primary = await ui.select({
    message: "Primary AI coding assistant?",
    initialValue: current?.primary ?? "claude",
    options: ASSISTANTS.map((a) => ({
      value: a.id,
      label: a.label + (a.default ? " (default)" : ""),
      hint: `Speckit integration: ${a.speckitIntegration}`,
    })),
  });
  const secondary = await ui.multiselect({
    message: "Any secondary assistants? (optional)",
    options: ASSISTANTS.filter((a) => a.id !== primary).map((a) => ({ value: a.id, label: a.label })),
  });
  return { primary, secondary };
}

export async function askMcp(ui, frameworkRoot, current) {
  const catalog = await ui.multiselect({
    message: "Which MCP connectors? (optional — you can add more later with /speckit.setup)",
    options: catalogChoices(frameworkRoot),
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
      { value: "vscode", label: "VS Code (default)", hint: "Recommends anthropic.claude-code via .vscode/extensions.json" },
      { value: "cursor", label: "Cursor", hint: "VS Code fork; same extension id" },
      { value: "jetbrains", label: "JetBrains (IntelliJ IDEA, PyCharm, WebStorm, Rider)", hint: "Requires the plugin via .idea/externalDependencies.xml" },
      { value: "none", label: "Other / none", hint: "Writes nothing. ONBOARDING.md keeps the pointers." },
    ],
  });
}

/** Runs all five, in order. Returns a complete config, or throws Cancelled. */
export async function askAll(ui, frameworkRoot, current = {}) {
  const telemetry = await askTelemetry(ui, current.telemetry);
  const stack = await askStack(ui, frameworkRoot, current.stack);
  const assistant = await askAssistant(ui, current.assistant);
  const mcp = await askMcp(ui, frameworkRoot, current.mcp);
  const editor = await askEditor(ui, current.editor);
  return { telemetry, stack, assistant, mcp, editor };
}
