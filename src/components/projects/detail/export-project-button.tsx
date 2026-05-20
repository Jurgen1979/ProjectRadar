"use client";

import { exportProjectAction } from "@/app/projects/[slug]/exports/actions";
import { exportProjectTauri } from "@/lib/tauri-handlers/projects";
import { ExportButton, type ExportAction } from "@/components/export-button";

export function ExportProjectButton({ slug }: { slug: string }) {
  const boundWeb = exportProjectAction.bind(null, slug) as ExportAction;
  const boundTauri = exportProjectTauri.bind(null, slug) as ExportAction;
  return (
    <ExportButton
      webAction={boundWeb}
      tauriAction={boundTauri}
      label="Exporteer project"
      pendingLabel="Exporteren…"
      className="text-xs px-3 py-1.5"
    />
  );
}
