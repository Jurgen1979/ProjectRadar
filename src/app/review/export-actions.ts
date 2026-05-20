"use server";

import { revalidatePath } from "next/cache";
import { getConfigStatus } from "@/lib/config";
import { buildReviewData } from "@/lib/projects/review";
import { renderReviewMarkdown } from "@/lib/export/review-md";
import {
  rootExportsDir,
  timestamp,
  writeExport,
} from "@/lib/export/write-export";

export type ExportReviewState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportReviewAction(
  _prev: ExportReviewState,
  formData: FormData,
): Promise<ExportReviewState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const aiText = String(formData.get("aiText") ?? "").trim();
  const data = await buildReviewData(cfg.root, cfg.config);
  const content = renderReviewMarkdown({
    data,
    generatedAt: new Date(),
    aiText: aiText ? aiText : null,
  });

  const result = await writeExport(cfg.root, {
    dir: rootExportsDir(cfg.root),
    baseName: `weekly-review-${timestamp()}`,
    content,
  });
  if (!result.ok) return { error: result.message };

  revalidatePath("/review");
  return {
    saved: { path: result.path, relativeToRoot: result.relativeToRoot },
  };
}
