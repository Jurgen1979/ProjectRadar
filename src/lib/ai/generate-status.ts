import "server-only";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAiStatus, resolveApiKey } from "@/lib/ai/provider";
import type { ProjectradarConfig } from "@/lib/schema/config";
import { gatherStatusContext } from "@/lib/ai/gather-context";
import { STATUS_SYSTEM_PROMPT, buildStatusUserPrompt } from "@/lib/ai/prompts";

export type GenerateStatusOk = {
  ok: true;
  /** Markdown body returned by the model. */
  text: string;
  /** Project name we passed in — useful for re-rendering the form. */
  projectName: string;
  /** Truncation warning shown above the preview, null if everything fit. */
  truncationNote: string | null;
  /** Discrete details for the metadata accordion. */
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
  /** Carried over so the UI can still hint the user. */
  truncationNote?: string | null;
};

export type GenerateStatusResult = GenerateStatusOk | GenerateStatusErr;

export async function generateStatus(
  root: string,
  slug: string,
  config: ProjectradarConfig,
): Promise<GenerateStatusResult> {
  const ai = getAiStatus(config);
  if (!ai.enabled) {
    return {
      ok: false,
      message: `AI staat uit: ${ai.reason}`,
    };
  }

  const apiKey = resolveApiKey(ai.provider);
  if (!apiKey) {
    return {
      ok: false,
      message: `Geen API key beschikbaar voor ${ai.provider}.`,
    };
  }

  let context;
  try {
    context = await gatherStatusContext(root, slug, config);
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
    apiKey,
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
