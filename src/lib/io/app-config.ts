/**
 * App configuration stored in the Tauri store (one JSON blob in the app's
 * data directory). Replaces .env.local for desktop users.
 *
 * In dev mode (npm run dev fallback) the existing env-based getConfigStatus
 * in src/lib/config.ts keeps working; this module is only used from the
 * Tauri webview.
 */

import { z } from "zod";
import { AiProvider } from "@/lib/schema/enums";
import type { AiCallConfig } from "@/lib/ai/generate-status";

/** Schema for the stored config. Strict — unknown keys are dropped. */
export const AppConfigSchema = z.object({
  projectRoot: z.string().nullable().default(null),
  ai: z
    .object({
      provider: AiProvider.default("none"),
      model: z.string().default(""),
      apiKey: z.string().default(""),
      openRouterReferer: z.string().optional(),
      openRouterTitle: z.string().optional(),
      baseUrlOverride: z.string().optional(),
    })
    .default({ provider: "none", model: "", apiKey: "" }),
  staleDays: z.number().int().positive().default(14),
  reviewWindowDays: z.number().int().positive().default(30),
  maxUpdatesForStatusGeneration: z.number().int().positive().default(10),
  backupOnStatusOverwrite: z.boolean().default(true),
  defaultLanguage: z.string().default("nl"),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const DEFAULT_APP_CONFIG: AppConfig = AppConfigSchema.parse({});

/** Key used in the Tauri store. Single-blob avoids race conditions on partial saves. */
export const APP_CONFIG_STORE_KEY = "appConfig";
export const APP_CONFIG_STORE_FILE = "projectradar.json";

const PROVIDER_DEFAULTS: Record<
  Exclude<AppConfig["ai"]["provider"], "none">,
  { baseURL: string; humanName: string }
> = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    humanName: "OpenRouter",
  },
  openai: { baseURL: "https://api.openai.com/v1", humanName: "OpenAI" },
};

export type AppAiStatus =
  | { enabled: true; ai: AiCallConfig; humanName: string }
  | {
      enabled: false;
      provider: AppConfig["ai"]["provider"];
      model: string;
      baseURL: string | null;
      humanName: string;
      reason: string;
    };

/** Derive the runtime AI call config from a stored AppConfig. Pure. */
export function deriveAiStatus(config: AppConfig): AppAiStatus {
  const { provider, model, apiKey, baseUrlOverride } = config.ai;

  if (provider === "none") {
    return {
      enabled: false,
      provider,
      model,
      baseURL: null,
      humanName: "uit",
      reason: "AI staat uit in instellingen.",
    };
  }

  const def = PROVIDER_DEFAULTS[provider];
  const baseURL = baseUrlOverride?.trim() || def.baseURL;

  if (!model.trim()) {
    return {
      enabled: false,
      provider,
      model: "",
      baseURL,
      humanName: def.humanName,
      reason: "Geen model ingesteld in instellingen.",
    };
  }
  if (!apiKey.trim()) {
    return {
      enabled: false,
      provider,
      model,
      baseURL,
      humanName: def.humanName,
      reason: `Geen API key voor ${def.humanName}.`,
    };
  }

  const headers: Record<string, string> = {};
  if (provider === "openrouter") {
    if (config.ai.openRouterReferer?.trim()) {
      headers["HTTP-Referer"] = config.ai.openRouterReferer.trim();
    }
    if (config.ai.openRouterTitle?.trim()) {
      headers["X-Title"] = config.ai.openRouterTitle.trim();
    }
  }

  return {
    enabled: true,
    humanName: def.humanName,
    ai: { provider, model, baseURL, apiKey: apiKey.trim(), headers },
  };
}

/** Mask an API key for UI display: last 4 chars visible. */
export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return trimmed ? "••••" : "";
  return "•".repeat(Math.min(trimmed.length - 4, 12)) + trimmed.slice(-4);
}
