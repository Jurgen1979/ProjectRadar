import "server-only";
import type { AiProvider } from "@/lib/schema/enums";
import type { ProjectradarConfig } from "@/lib/schema/config";

/**
 * Resolved AI configuration. Two flavours:
 * - disabled: app keeps working, UI shows the reason
 * - enabled: provider + model + baseURL + headers, ready for Fase 7
 *
 * The actual API key never leaves the server. Pages that render config
 * (settings) get this struct; only AI call sites also call resolveApiKey().
 */
export type AiStatus =
  | {
      enabled: false;
      provider: AiProvider;
      model: string;
      baseURL: string | null;
      reason: string;
    }
  | {
      enabled: true;
      provider: Exclude<AiProvider, "none">;
      model: string;
      baseURL: string;
      headers: Record<string, string>;
    };

const DEFAULTS: Record<
  Exclude<AiProvider, "none">,
  { baseURL: string; keyEnv: string; humanName: string }
> = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    humanName: "OpenRouter",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    humanName: "OpenAI",
  },
};

function readProvider(config: ProjectradarConfig): AiProvider {
  const fromEnv = process.env.AI_PROVIDER?.trim();
  if (fromEnv === "openrouter" || fromEnv === "openai" || fromEnv === "none") {
    return fromEnv;
  }
  return config.aiProvider;
}

function readModel(config: ProjectradarConfig): string {
  return process.env.AI_MODEL?.trim() || config.model;
}

function readBaseUrlOverride(provider: Exclude<AiProvider, "none">): string {
  // Allow ops override; default to the provider's standard URL.
  return (
    process.env.AI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    DEFAULTS[provider].baseURL
  );
}

function readOpenRouterHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const referer = process.env.OPENROUTER_REFERER?.trim();
  const title = process.env.OPENROUTER_TITLE?.trim();
  if (referer) headers["HTTP-Referer"] = referer;
  if (title) headers["X-Title"] = title;
  return headers;
}

export function getAiStatus(config: ProjectradarConfig): AiStatus {
  const provider = readProvider(config);
  const model = readModel(config);

  if (provider === "none") {
    return {
      enabled: false,
      provider,
      model,
      baseURL: null,
      reason: "AI uitgeschakeld (AI_PROVIDER=none).",
    };
  }

  const def = DEFAULTS[provider];
  const baseURL = readBaseUrlOverride(provider);

  if (!model) {
    return {
      enabled: false,
      provider,
      model: "",
      baseURL,
      reason: `Geen model ingesteld. Zet AI_MODEL in .env.local of model in projectradar.config.json.`,
    };
  }

  const apiKey = process.env[def.keyEnv]?.trim();
  if (!apiKey) {
    return {
      enabled: false,
      provider,
      model,
      baseURL,
      reason: `Geen API key gevonden (${def.keyEnv}). AI-features zijn uitgeschakeld.`,
    };
  }

  const headers: Record<string, string> = {};
  if (provider === "openrouter") {
    Object.assign(headers, readOpenRouterHeaders());
  }

  return { enabled: true, provider, model, baseURL, headers };
}

/**
 * Resolve the API key for the configured provider. Returns null when AI is
 * disabled or no key is present. Only call this from places that actually
 * make an AI request — never pass the result to the client.
 */
export function resolveApiKey(provider: AiProvider): string | null {
  if (provider === "none") return null;
  const env = DEFAULTS[provider].keyEnv;
  return process.env[env]?.trim() || null;
}

export function providerLabel(provider: AiProvider): string {
  if (provider === "none") return "uit";
  return DEFAULTS[provider].humanName;
}
