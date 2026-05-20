"use client";

import { useEffect, useState } from "react";
import { useResolvedIO } from "@/lib/io/use-resolved-io";
import { loadProject } from "@/lib/projects/load-one";
import { isSafeSlug } from "@/lib/io/paths";
import type { ProjectMeta } from "@/lib/schema/meta";
import { EditMetaForm } from "./form";
import { WarningsBanner } from "@/components/projects/detail/warnings-banner";

export function TauriEdit({ slug }: { slug: string }) {
  const resolved = useResolvedIO();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; meta: ProjectMeta }
    | { kind: "err"; warnings: Array<{ level: string; file: string; message: string }> }
  >({ kind: "loading" });

  useEffect(() => {
    if (resolved.status !== "ready") return;
    if (!isSafeSlug(slug)) {
      setState({ kind: "err", warnings: [{ level: "error", file: "(slug)", message: "Ongeldige slug." }] });
      return;
    }
    let cancelled = false;
    void loadProject(resolved.io, resolved.root, slug).then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: "ok", meta: r.project.meta });
      else setState({ kind: "err", warnings: r.warnings });
    });
    return () => {
      cancelled = true;
    };
  }, [slug, resolved]);

  if (resolved.status === "loading" || state.kind === "loading") {
    return <p className="text-sm text-muted-foreground">Laden…</p>;
  }
  if (resolved.status === "no-root") {
    return <p className="text-sm text-muted-foreground">Geen projectroot ingesteld.</p>;
  }
  if (state.kind === "err") {
    return (
      <div className="space-y-3">
        <WarningsBanner warnings={state.warnings as never} />
      </div>
    );
  }
  return <EditMetaForm slug={slug} meta={state.meta} />;
}
