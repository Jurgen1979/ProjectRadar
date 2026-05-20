"use server";

import { getConfigStatus } from "@/lib/config";
import { generateReview } from "@/lib/ai/review";
import { resolveServerAi, serverFsIO } from "@/lib/server-io";

export type AiReviewState = {
  text?: string;
  truncationNote?: string | null;
  projectsConsidered?: number;
  projectsIncluded?: number;
  meta?: {
    model: string;
    provider: string;
    durationMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    promptCharsApprox: number;
  };
  error?: string;
};

export async function generateAiReviewAction(
  _prev: AiReviewState,
  _formData: FormData,
): Promise<AiReviewState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const ai = resolveServerAi(cfg.config);
  if (!ai.enabled) return { error: `AI staat uit: ${ai.reason}` };

  const result = await generateReview(serverFsIO, cfg.root, cfg.config, ai.ai);
  if (!result.ok) return { error: result.message };
  return {
    text: result.text,
    truncationNote: result.truncationNote,
    projectsConsidered: result.projectsConsidered,
    projectsIncluded: result.projectsIncluded,
    meta: result.meta,
  };
}
