"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug } from "@/lib/fs/paths";
import { generateStatus } from "@/lib/ai/generate-status";
import { saveStatusWithBackup } from "@/lib/projects/save-status";

export type GenerateState = {
  /** Markdown text last produced by the AI. */
  proposal?: string;
  truncationNote?: string | null;
  meta?: {
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
  error?: string;
};

export async function generateStatusAction(
  slug: string,
  _prev: GenerateState,
  _formData: FormData,
): Promise<GenerateState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const result = await generateStatus(cfg.root, slug, cfg.config);
  if (!result.ok) {
    return { error: result.message, truncationNote: result.truncationNote ?? undefined };
  }
  return {
    proposal: result.text,
    truncationNote: result.truncationNote,
    meta: result.meta,
  };
}

export type ApproveState = {
  error?: string;
  saved?: { statusPath: string; backupPath: string | null };
};

export async function approveStatusAction(
  slug: string,
  _prev: ApproveState,
  formData: FormData,
): Promise<ApproveState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const proposal = String(formData.get("proposal") ?? "");
  if (!proposal.trim()) {
    return { error: "Geen status om op te slaan." };
  }

  const result = await saveStatusWithBackup(cfg.root, slug, proposal, {
    backup: cfg.config.backupOnStatusOverwrite,
  });
  if (!result.ok) {
    return { error: result.message };
  }

  revalidatePath(`/projects/${slug}`);
  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}
