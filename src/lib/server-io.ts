import "server-only";
import { nodeFsIO } from "@/lib/io/node-fs";
import { getAiStatus, resolveApiKey } from "@/lib/ai/provider";
import type { AiCallConfig } from "@/lib/ai/generate-status";
import type { ProjectradarConfig } from "@/lib/schema/config";

export const serverFsIO = nodeFsIO;

export type ResolvedAi =
  | { enabled: true; ai: AiCallConfig }
  | { enabled: false; reason: string };

/** Resolve AI config + key for server-side calls (dev mode, server actions). */
export function resolveServerAi(config: ProjectradarConfig): ResolvedAi {
  const status = getAiStatus(config);
  if (!status.enabled) {
    return { enabled: false, reason: status.reason };
  }
  const apiKey = resolveApiKey(status.provider);
  if (!apiKey) {
    return {
      enabled: false,
      reason: `Geen API key voor ${status.provider}.`,
    };
  }
  return {
    enabled: true,
    ai: {
      provider: status.provider,
      model: status.model,
      baseURL: status.baseURL,
      apiKey,
      headers: status.headers,
    },
  };
}
