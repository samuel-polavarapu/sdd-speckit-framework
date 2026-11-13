import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Profiles are the two overlay layers on the base templates:
 *   profiles/industries/<id>/   regulatory and domain standards
 *   profiles/stacks/<id>/       technology conventions
 * scripts/compose-templates.py joins them. This module only lists them for the questions.
 */
export const KINDS = {
  industry: { dir: "industries", none: "none" },
  stack: { dir: "stacks", none: "custom" },
};

/** Reads profiles/<kind dir>/<id>/profile.json from the framework root. */
export function loadProfiles(frameworkRoot, kind) {
  const dir = join(frameworkRoot, "profiles", KINDS[kind].dir);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const id of readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()) {
    const manifest = join(dir, id, "profile.json");
    if (!existsSync(manifest)) continue;
    try {
      const p = JSON.parse(readFileSync(manifest, "utf8"));
      out.push({ ...p, id: p.id ?? id, dir: join(dir, id) });
    } catch (err) {
      out.push({ id, label: id, description: `unreadable profile.json: ${err.message}`, broken: true, dir: join(dir, id) });
    }
  }
  return out;
}

export function profileIds(frameworkRoot, kind) {
  return [...loadProfiles(frameworkRoot, kind).filter((p) => !p.broken).map((p) => p.id), KINDS[kind].none];
}

export function stackChoices(frameworkRoot) {
  return [
    ...loadProfiles(frameworkRoot, "stack")
      .filter((p) => !p.broken)
      .map((p) => ({ value: p.id, label: p.label ?? p.id, hint: p.description ?? "" })),
    { value: "custom", label: "Custom / skip", hint: "No stack overlay. Base templates only." },
  ];
}

export function industryChoices(frameworkRoot) {
  return [
    { value: "none", label: "None / skip", hint: "No regulatory overlay. Base templates only." },
    ...loadProfiles(frameworkRoot, "industry")
      .filter((p) => !p.broken)
      .map((p) => ({
        value: p.id,
        label: p.label ?? p.id,
        hint: (p.standards ?? []).map((s) => s.title).slice(0, 4).join(", ") || (p.description ?? ""),
      })),
  ];
}

export function findProfile(frameworkRoot, kind, id) {
  return loadProfiles(frameworkRoot, kind).find((p) => p.id === id) ?? null;
}

export function profileVscodeExtensions(profile) {
  if (!profile) return [];
  const p = join(profile.dir, "vscode-extensions.json");
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8")).recommendations ?? [];
  } catch {
    return [];
  }
}
