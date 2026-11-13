import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG = resolve(HERE, "..");
export const ROOT = resolve(PKG, "..", "..");
export const CLI = join(PKG, "bin", "cli.js");

export function tmp(prefix = "sdd-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cli(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", ...opts });
}

/** Every file under dir as a sorted list of posix relative paths. */
export function tree(dir, skip = []) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const abs = join(d, e.name);
      const rel = relative(dir, abs).split("\\").join("/");
      if (skip.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
      if (e.isDirectory()) walk(abs);
      else out.push(rel);
    }
  };
  walk(dir);
  return out.sort();
}

export function snapshot(dir, skip = []) {
  return Object.fromEntries(tree(dir, skip).map((f) => [f, readFileSync(join(dir, f), "utf8")]));
}

export function mdFiles(dir) {
  return readdirSync(dir).filter((f) => f.endsWith(".md") && statSync(join(dir, f)).isFile()).sort();
}
