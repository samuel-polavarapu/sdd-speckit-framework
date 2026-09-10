import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Reads presets/<id>/preset.json from the framework root. */
export function loadPresets(frameworkRoot) {
  const dir = join(frameworkRoot, "presets");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const id of readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()) {
    const manifest = join(dir, id, "preset.json");
    if (!existsSync(manifest)) continue;
    try {
      const p = JSON.parse(readFileSync(manifest, "utf8"));
      out.push({ ...p, id: p.id ?? id, dir: join(dir, id) });
    } catch (err) {
      out.push({ id, label: id, description: `unreadable preset.json: ${err.message}`, broken: true, dir: join(dir, id) });
    }
  }
  return out;
}

export function presetChoices(frameworkRoot) {
  return [
    ...loadPresets(frameworkRoot)
      .filter((p) => !p.broken)
      .map((p) => ({ value: p.id, label: p.label ?? p.id, hint: p.description ?? "" })),
    { value: "custom", label: "Custom / skip", hint: "No template override. Base templates only." },
  ];
}

export function findPreset(frameworkRoot, id) {
  return loadPresets(frameworkRoot).find((p) => p.id === id) ?? null;
}

/** Template overrides a preset contributes, as [absolute source, relative target] pairs. */
export function presetOverrides(preset) {
  if (!preset) return [];
  return (preset.overrides ?? []).map((f) => [
    join(preset.dir, "templates", f),
    join(".specify", "templates", "overrides", f),
  ]);
}

export function presetVscodeExtensions(preset) {
  if (!preset) return [];
  const p = join(preset.dir, "vscode-extensions.json");
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8")).recommendations ?? [];
  } catch {
    return [];
  }
}
