import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { AiProvider } from "@/lib/schema/enums";
import type { FsIO } from "@/lib/io/types";
import type { ProjectradarConfig } from "@/lib/schema/config";
import { gatherStatusContext } from "@/lib/ai/gather-context";
import { STATUS_SYSTEM_PROMPT, buildStatusUserPrompt } from "@/lib/ai/prompts";

/**
 * Resolved AI call configuration. Caller picks where these come from:
 * - server actions / dev mode: from env via getAiStatus + resolveApiKey
 * - Tauri desktop: from app config store
 */
export type AiCallConfig = {
  provider: Exclude<AiProvider, "none">;
  model: string;
  baseURL: string;
  apiKey: string;
  headers: Record<string, string>;
};

export type GenerateStatusOk = {
  ok: true;
  text: string;
  projectName: string;
  truncationNote: string | null;
  meta: {
    model: string;
    provider: string;
    durationMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    promptCharsApprox: number;
    updatesIncluded: number;
    updatesDropped: string[];
    updatesTruncated: string[];
  };
};

export type GenerateStatusErr = {
  ok: false;
  message: string;
  truncationNote?: string | null;
};

export type GenerateStatusResult = GenerateStatusOk | GenerateStatusErr;

export async function generateStatus(
  io: FsIO,
  root: string,
  slug: string,
  config: ProjectradarConfig,
  ai: AiCallConfig,
): Promise<GenerateStatusResult> {
  let context;
  try {
    context = await gatherStatusContext(io, root, slug, config);
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }

  const userPrompt = buildStatusUserPrompt({
    projectName: context.projectName,
    metaJson: context.metaJson,
    status: context.status,
    log: context.log,
    decisions: context.decisions,
    updates: context.updates,
    truncationNote: context.truncationNote,
  });

  const provider = createOpenAI({
    apiKey: ai.apiKey,
    baseURL: ai.baseURL,
    headers: ai.headers,
  });

  const t0 = Date.now();
  try {
    const result = await generateText({
      model: provider.chat(ai.model),
      system: STATUS_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4,
    });
    const durationMs = Date.now() - t0;

    return {
      ok: true,
      text: result.text.trim(),
      projectName: context.projectName,
      truncationNote: context.truncationNote,
      meta: {
        model: ai.model,
        provider: ai.provider,
        durationMs,
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
        promptCharsApprox: STATUS_SYSTEM_PROMPT.length + userPrompt.length,
        updatesIncluded: context.updates.length,
        updatesDropped: context.droppedUpdates,
        updatesTruncated: context.truncatedUpdates,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: `AI-call mislukt: ${(err as Error).message}`,
      truncationNote: context.truncationNote,
    };
  }
}
