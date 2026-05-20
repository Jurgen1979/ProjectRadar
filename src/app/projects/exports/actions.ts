"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { getConfigStatus } from "@/lib/config";
import { loadDashboardData } from "@/lib/projects/dashboard-data";
import { renderDashboardMarkdown } from "@/lib/export/dashboard-md";
import {
  rootExportsDir,
  timestamp,
  writeExport,
} from "@/lib/export/write-export";

export type ExportState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportDashboardAction(
  _prev: ExportState,
  _formData: FormData,
): Promise<ExportState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const data = await loadDashboardData(cfg.root, cfg.config);
  const content = renderDashboardMarkdown({
    data,
    generatedAt: new Date(),
  });

  const result = await writeExport(cfg.root, {
    dir: rootExportsDir(cfg.root),
    baseName: `dashboard-${timestamp()}`,
    content,
  });
  if (!result.ok) return { error: result.message };

  revalidatePath("/projects");
  return {
    saved: { path: result.path, relativeToRoot: path.join(result.relativeToRoot) },
  };
}
