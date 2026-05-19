import fs from "node:fs/promises";
import { notFound } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug, projectDir } from "@/lib/fs/paths";
import { loadProject } from "@/lib/projects/load-one";
import { NoRootState } from "@/components/projects/empty-state";
import { EditMetaForm } from "./form";
import { WarningsBanner } from "@/components/projects/detail/warnings-banner";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) notFound();

  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;

  try {
    const stat = await fs.stat(projectDir(cfg.root, slug));
    if (!stat.isDirectory()) notFound();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err;
  }

  const result = await loadProject(cfg.root, slug);
  if (!result.ok) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground font-mono">
          projecten / {slug} / bewerken
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Metadata niet bewerkbaar
        </h1>
        <WarningsBanner warnings={result.warnings} />
        <p className="text-sm text-muted-foreground">
          De huidige meta is niet leesbaar. Herstel het bestand handmatig of
          maak het project opnieuw aan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">
          projecten / {slug} / bewerken
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Metadata bewerken
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Wijzigt <code className="font-mono">project.meta.json</code>.
          Slug, id en aanmaakdatum blijven ongewijzigd.
        </p>
      </header>
      <EditMetaForm slug={slug} meta={result.project.meta} />
    </div>
  );
}
