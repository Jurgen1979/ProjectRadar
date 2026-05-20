// Web-mode stub.

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

export async function generateAiReviewAction(..._args: unknown[]): Promise<AiReviewState> {
  return { error: "Web-mode AI actions uit; gebruik de Tauri desktop-app." };
}
