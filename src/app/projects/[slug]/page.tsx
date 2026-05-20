import { notFound } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { loadProject } from "@/lib/projects/load-one";
import { computeSignals } from "@/lib/projects/signals";
import { isSafeSlug, projectDir } from "@/lib/io/paths";
import { serverFsIO } from "@/lib/server-io";
import { NoRootState } from "@/components/projects/empty-state";
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
import { detectMissing, previewRecoveryContent } from "@/lib/projects/recover";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) notFound();

  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") {
    return <NoRootState message={cfg.message} />;
  }

  // 404 cleanly when the project directory doesn't exist at all,
  // so we don't confuse "ontbreekt op disk" with "meta corrupt".
  const dir = projectDir(cfg.root, slug);
  const dirStat = await serverFsIO.stat(dir);
  if (!dirStat || !dirStat.isDirectory) notFound();

  const result = await loadProject(serverFsIO, cfg.root, slug);
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
        <p className="text-sm text-muted-foreground">
          De map bestaat op{" "}
          <code className="font-mono">{result.dir}</code>, maar het
          project kan niet volledig geladen worden.
        </p>
      </div>
    );
  }

  const { project } = result;
  const signals = computeSignals(project, { staleDays: cfg.config.staleDays });
  const missing = await detectMissing(serverFsIO, cfg.root, slug);
  const previews = await Promise.all(
    missing.files.map(async (file) => ({
      file,
      preview: await previewRecoveryContent(serverFsIO, cfg.root, slug, file),
    })),
  );

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        signals={Array.from(signals.set)}
        ageDays={signals.ageDays}
        lastSignal={signals.lastSignal}
      />
      <WarningsBanner warnings={project.warnings} />
      <RecoveryPanel slug={slug} files={previews} folders={missing.folders} />

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
