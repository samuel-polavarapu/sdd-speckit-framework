/**
 * Bridges to the two Python scripts that do the template and harness work:
 *   scripts/discover-scan.py     facts about the target directory (greenfield or brownfield?)
 *   scripts/onboard-project.py   pins the support files, composes templates, wires the gates
 *
 * They are Python because the hooks already need python3, and because the bash installer, the
 * setup phase and CI call the same files. One implementation means every path writes the same
 * project. Without python3 the installer still finishes, and says what it could not do.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { GATE_IDS, targetList } from "./config-schema.js";

let pythonChecked;
export function havePython() {
  if (pythonChecked === undefined) {
    try {
      pythonChecked = spawnSync("python3", ["--version"], { stdio: "ignore", timeout: 15000 }).status === 0;
    } catch {
      pythonChecked = false;
    }
  }
  return pythonChecked;
}

/** The brief scan: { mode, modeReasons, stack, stackReason, proposed }. Null when it cannot run. */
export function scanTarget(frameworkRoot, target) {
  if (!havePython()) return null;
  const r = spawnSync("python3", [join(frameworkRoot, "scripts", "discover-scan.py"), target, "--brief"], {
    encoding: "utf8",
    timeout: 120000,
  });
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

export function onboardArgs(target, cfg, { dryRun, force } = {}) {
  return [
    "--project", target,
    "--mode", cfg.mode,
    "--industry", cfg.industry,
    "--stack", cfg.stack,
    "--targets", targetList(cfg.assistant).join(","),
    ...GATE_IDS.map((id) => `--gate=${id}=${cfg.harness.gates[id]}`),
    ...(dryRun ? ["--dry-run"] : []),
    ...(force ? ["--force"] : []),
    "--json",
  ];
}

/** Runs onboard-project.py. Returns its log lines; throws when composition or a profile fails. */
export function onboardProject(target, frameworkRoot, cfg, { dryRun, force } = {}) {
  if (!havePython()) {
    return {
      ran: false,
      log: [
        "python3 not found — templates not composed and harness gates not wired (base templates only)",
        "install python3, then run: python3 <framework>/scripts/onboard-project.py --project .",
      ],
    };
  }
  const script = join(frameworkRoot, "scripts", "onboard-project.py");
  if (!existsSync(script)) return { ran: false, log: ["scripts/onboard-project.py is missing — templates and harness skipped"] };

  const r = spawnSync("python3", [script, ...onboardArgs(target, cfg, { dryRun, force })], { encoding: "utf8", timeout: 300000 });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "onboard-project.py failed").trim());
  const out = JSON.parse(r.stdout);
  return { ran: true, log: out.log.map((l) => l.replace(/^! /, "WARNING: ")), harness: out.harness };
}
