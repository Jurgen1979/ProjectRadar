import { getConfigStatus } from "@/lib/config";
import { isSafeSlug, projectDir } from "@/lib/io/paths";
import { loadProject } from "@/lib/projects/load-one";
import { serverFsIO } from "@/lib/server-io";
import { NoRootState } from "@/components/projects/empty-state";
import { TauriOnly, WebOnly } from "@/components/web-only";
import { EditMetaForm } from "./form";
import { TauriEdit } from "./_tauri-edit";
import { WarningsBanner } from "@/components/projects/detail/warnings-banner";

// For static export: no slugs known at build time. Tauri client
// reads the slug via useParams() at runtime.
export const dynamicParams = false;
export async function generateStaticParams() {
  return [];
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return null;

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
      <TauriOnly>
        <TauriEdit slug={slug} />
      </TauriOnly>
      <WebOnly>
        <WebEdit slug={slug} />
      </WebOnly>
    </div>
  );
}

async function WebEdit({ slug }: { slug: string }) {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;

  const dirStat = await serverFsIO.stat(projectDir(cfg.root, slug));
  if (!dirStat || !dirStat.isDirectory) return null;

  const result = await loadProject(serverFsIO, cfg.root, slug);
  if (!result.ok) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Metadata niet bewerkbaar</h2>
        <WarningsBanner warnings={result.warnings} />
      </div>
    );
  }

  return <EditMetaForm slug={slug} meta={result.project.meta} />;
}