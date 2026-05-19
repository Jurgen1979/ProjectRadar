import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, ProjectradarConfig } from "./schema/config";
import type { AiProvider } from "./schema/enums";

export type ConfigStatus =
  | { kind: "ok"; root: string; config: ProjectradarConfig; configPath: string | null }
  | { kind: "no-root"; message: string }
  | { kind: "root-missing"; root: string; message: string }
  | { kind: "config-invalid"; root: string; configPath: string; message: string };

export type AiStatus =
  | { enabled: false; reason: string; provider: AiProvider; model: string }
  | { enabled: true; provider: Exclude<AiProvider, "none">; model: string };

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

export function getAiStatus(config: ProjectradarConfig): AiStatus {
  const provider = (process.env.AI_PROVIDER?.trim() || config.aiProvider) as AiProvider;
  const model = process.env.AI_MODEL?.trim() || config.model;

  if (provider === "none") {
    return { enabled: false, reason: "AI uitgeschakeld (AI_PROVIDER=none).", provider, model };
  }
  if (!model) {
    return {
      enabled: false,
      reason: "Geen model ingesteld. Zet AI_MODEL in .env.local of model in projectradar.config.json.",
      provider,
      model: "",
    };
  }
  const keyEnv =
    provider === "openai"
      ? "OPENAI_API_KEY"
      : provider === "anthropic"
        ? "ANTHROPIC_API_KEY"
        : null;
  if (!keyEnv) {
    return {
      enabled: false,
      reason: `Onbekende provider: ${provider}.`,
      provider,
      model,
    };
  }
  if (!process.env[keyEnv]?.trim()) {
    return {
      enabled: false,
      reason: `Geen API key gevonden (${keyEnv}). AI-features zijn uitgeschakeld.`,
      provider,
      model,
    };
  }
  return { enabled: true, provider, model };
}
