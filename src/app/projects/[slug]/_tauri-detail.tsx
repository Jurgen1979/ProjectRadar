"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useResolvedIO } from "@/lib/io/use-resolved-io";
import { loadProject, type LoadProjectResult } from "@/lib/projects/load-one";
import { computeSignals } from "@/lib/projects/signals";
import { detectMissing, previewRecoveryContent } from "@/lib/projects/recover";
import type { MissingState, RecoverableFile } from "@/lib/projects/recover";
import { isSafeSlug, projectDir } from "@/lib/io/paths";
import { ProjectHeader } from "@/components/projects/detail/header";
import { WarningsBanner } from "@/components/projects/detail/warnings-banner";
import { StatusSection } from "@/components/projects/detail/status-section";
import { NextActionSection } from "@/components/projects/detail/next-action";
import { LinksSection } from "@/components/projects/detail/links-section";
import { UpdatesSection } from "@/components/projects/detail/updates-section";
import { DecisionsSection } from "@/components/projects/detail/decisions-section";
import { LogSection } from "@/components/projects/detail/log-section";
import { SourcesSection } from "@/components/projects/detail/sources-section";
import { RecoveryPanel } from "@/components/projects/detail/recovery-panel";

type PreviewItem = { file: string; preview: string };

export function TauriProjectDetail({ slug }: { slug: string }) {
  const resolved = useResolvedIO();
  const [result, setResult] = useState<LoadProjectResult | "not-found" | null>(
    null,
  );
  const [missing, setMissing] = useState<MissingState | null>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolved.status !== "ready") return;
    if (!isSafeSlug(slug)) {
      setResult("not-found");
      return;
    }
    let cancelled = false;
    setError(null);
    const { io, root, config } = resolved;
    async function load() {
      try {
        const dir = projectDir(root, slug);
        const stat = await io.stat(dir);
        if (!stat || !stat.isDirectory) {
          if (!cancelled) setResult("not-found");
          return;
        }
        const loaded = await loadProject(io, root, slug);
        if (cancelled) return;
        setResult(loaded);
        const m = await detectMissing(io, root, slug);
        if (cancelled) return;
        setMissing(m);
        const previewsRaw = await Promise.all(
          m.files.map(async (file: RecoverableFile) => ({
            file,
            preview: await previewRecoveryContent(io, root, slug, file),
          })),
        );
        if (!cancelled) setPreviews(previewsRaw);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // Re-run when slug or root changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, resolved.status === "ready" ? resolved.root : null]);

  if (resolved.status === "loading") return <Loading />;
  if (resolved.status === "no-root") {
    return <p className="text-sm text-muted-foreground">Geen projectroot ingesteld.</p>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
        Kon project niet laden: {error}
      </div>
    );
  }

  if (!result) return <Loading />;

  if (result === "not-found") {
    return (
      <div className="space-y-4 max-w-xl">
        <p className="text-sm text-muted-foreground font-mono">projecten / {slug}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Project niet gevonden</h1>
        <Link href="/projects" className="text-sm hover:underline">
          ← terug naar projecten
        </Link>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground font-mono">
          projecten / {slug}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Project niet beschikbaar
        </h1>
        <WarningsBanner warnings={result.warnings} />
      </div>
    );
  }

  const { project } = result;
  const signals = computeSignals(project, {
    staleDays: resolved.config.staleDays,
  });

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        signals={Array.from(signals.set)}
        ageDays={signals.ageDays}
        lastSignal={signals.lastSignal}
      />
      <WarningsBanner warnings={project.warnings} />
      {missing ? (
        <RecoveryPanel
          slug={slug}
          files={previews}
          folders={missing.folders}
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-4 min-w-0">
          <StatusSection status={project.status} />
          <UpdatesSection updates={project.updates} />
          <DecisionsSection decisions={project.decisions} />
          <LogSection log={project.log} />
        </div>
        <aside className="space-y-4 min-w-0">
          <NextActionSection project={project} />
          <LinksSection links={project.links} />
          <SourcesSection sources={project.sources} dir={project.dir} />
        </aside>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="text-sm text-muted-foreground py-12 text-center">
      Laden…
    </div>
  );
}
