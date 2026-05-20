"use server";

import { getConfigStatus } from "@/lib/config";
import { generateReview } from "@/lib/ai/review";

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
  const result = await generateReview(cfg.root, cfg.config);
  if (!result.ok) return { error: result.message };
  return {
    text: result.text,
    truncationNote: result.truncationNote,
    projectsConsidered: result.projectsConsidered,
    projectsIncluded: result.projectsIncluded,
    meta: result.meta,
  };
}
