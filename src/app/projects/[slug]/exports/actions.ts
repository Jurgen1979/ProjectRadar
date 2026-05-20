"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug, projectDir } from "@/lib/fs/paths";
import { loadProject } from "@/lib/projects/load-one";
import { renderProjectMarkdown } from "@/lib/export/project-md";
import { timestamp, writeExport } from "@/lib/export/write-export";

export type ExportProjectState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportProjectAction(
  slug: string,
  _prev: ExportProjectState,
  _formData: FormData,
): Promise<ExportProjectState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const result = await loadProject(cfg.root, slug);
  if (!result.ok) {
    return {
      error: `Kan project niet laden: ${result.warnings[0]?.message ?? "onbekende fout"}`,
    };
  }

  const content = renderProjectMarkdown({
    project: result.project,
    generatedAt: new Date(),
  });

  const dir = path.join(projectDir(cfg.root, slug), "exports");
  const write = await writeExport(cfg.root, {
    dir,
    baseName: `project-export-${timestamp()}`,
    content,
  });
  if (!write.ok) return { error: write.message };

  revalidatePath(`/projects/${slug}`);
  return {
    saved: { path: write.path, relativeToRoot: write.relativeToRoot },
  };
}
