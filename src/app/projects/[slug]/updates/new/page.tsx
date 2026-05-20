import { getConfigStatus } from "@/lib/config";
import { isSafeSlug, projectDir } from "@/lib/io/paths";
import { serverFsIO } from "@/lib/server-io";
import { NoRootState } from "@/components/projects/empty-state";
import { TauriOnly, WebOnly } from "@/components/web-only";
import { AddUpdateForm } from "./form";

// For static export: no slugs known at build time. Tauri client
// reads the slug via useParams() at runtime.
export const dynamicParams = false;
export async function generateStaticParams() {
  return [];
}

export default async function NewUpdatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">
          projecten / {slug} / nieuwe update
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Update toevoegen</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Plak een AI-output of typ een notitie. De inhoud wordt opgeslagen
          als markdownbestand in <code className="font-mono">/updates</code>
          {" "}en de <code className="font-mono">lastUpdated</code> van het
          project wordt bijgewerkt.
        </p>
      </header>
      <TauriOnly>
        <AddUpdateForm slug={slug} defaultDate={today} />
      </TauriOnly>
      <WebOnly>
        <WebPage slug={slug} defaultDate={today} />
      </WebOnly>
    </div>
  );
}

async function WebPage({ slug, defaultDate }: { slug: string; defaultDate: string }) {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;
  if (!(await serverFsIO.exists(projectDir(cfg.root, slug)))) return null;
  return <AddUpdateForm slug={slug} defaultDate={defaultDate} />;
}