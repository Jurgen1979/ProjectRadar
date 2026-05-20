import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { AiCallConfig } from "./generate-status";

export type TestConnectionResult =
  | { ok: true; durationMs: number; sample: string; model: string }
  | { ok: false; message: string };

/**
 * Minimal "is the key + baseURL working?" check. Sends a 1-word prompt to
 * the configured model so the user only pays for ~5 tokens.
 */
export async function testAiConnection(
  ai: AiCallConfig,
): Promise<TestConnectionResult> {
  const provider = createOpenAI({
    apiKey: ai.apiKey,
    baseURL: ai.baseURL,
    headers: ai.headers,
  });
  const t0 = Date.now();
  try {
    const result = await generateText({
      model: provider.chat(ai.model),
      prompt: "Antwoord met één woord: pong",
      temperature: 0,
    });
    return {
      ok: true,
      durationMs: Date.now() - t0,
      sample: result.text.trim().slice(0, 80),
      model: ai.model,
    };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}
