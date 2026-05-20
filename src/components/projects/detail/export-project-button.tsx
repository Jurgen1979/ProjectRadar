"use client";

import { exportProjectAction } from "@/app/projects/[slug]/exports/actions";
import { ExportButton, type ExportAction } from "@/components/export-button";

export function ExportProjectButton({ slug }: { slug: string }) {
  const bound = exportProjectAction.bind(null, slug) as ExportAction;
  return (
    <ExportButton
      action={bound}
      label="Exporteer project"
      pendingLabel="Exporteren…"
      className="text-xs px-3 py-1.5"
    />
  );
}
