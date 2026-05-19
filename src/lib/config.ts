import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, ProjectradarConfig } from "./schema/config";

export type ConfigStatus =
  | { kind: "ok"; root: string; config: ProjectradarConfig; configPath: string | null }
  | { kind: "no-root"; message: string }
  | { kind: "root-missing"; root: string; message: string }
  | { kind: "config-invalid"; root: string; configPath: string; message: string };

// AI-status getter lives in lib/ai/provider.ts. Re-export so existing
// callsites keep working without an extra import.
export { getAiStatus, providerLabel } from "@/lib/ai/provider";
export type { AiStatus } from "@/lib/ai/provider";

const CONFIG_FILENAME = "projectradar.config.json";

function readEnvRoot(): string | null {
  const raw = process.env.PROJECTRADAR_ROOT?.trim();
  if (!raw) return null;
  return path.resolve(raw);
}

function loadConfigFile(root: string):
  | { ok: true; config: ProjectradarConfig; configPath: string | null }
  | { ok: false; configPath: string; error: string } {
  const configPath = path.join(root, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    return { ok: true, config: DEFAULT_CONFIG, configPath: null };
  }
  let raw: string;
  try {
    raw = fs.readFileSync(configPath, "utf8");
  } catch (err) {
    return {
      ok: false,
      configPath,
      error: `Kan ${CONFIG_FILENAME} niet lezen: ${(err as Error).message}`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      configPath,
      error: `${CONFIG_FILENAME} bevat ongeldige JSON: ${(err as Error).message}`,
    };
  }
  const result = ProjectradarConfig.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      configPath,
      error: result.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; "),
    };
  }
  return { ok: true, config: result.data, configPath };
}

export function getConfigStatus(): ConfigStatus {
  const root = readEnvRoot();
  if (!root) {
    return {
      kind: "no-root",
      message:
        "PROJECTRADAR_ROOT is niet ingesteld. Voeg het pad toe in .env.local.",
    };
  }
  if (!fs.existsSync(root)) {
    return {
      kind: "root-missing",
      root,
      message: `De map ${root} bestaat niet. Maak hem aan of pas PROJECTRADAR_ROOT aan.`,
    };
  }
  const loaded = loadConfigFile(root);
  if (!loaded.ok) {
    return {
      kind: "config-invalid",
      root,
      configPath: loaded.configPath,
      message: loaded.error,
    };
  }
  return {
    kind: "ok",
    root,
    config: loaded.config,
    configPath: loaded.configPath,
  };
}
