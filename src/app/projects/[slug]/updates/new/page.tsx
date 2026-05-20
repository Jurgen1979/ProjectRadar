import { notFound } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug, projectDir } from "@/lib/io/paths";
import { serverFsIO } from "@/lib/server-io";
import { NoRootState } from "@/components/projects/empty-state";
import { AddUpdateForm } from "./form";

export default async function NewUpdatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) notFound();

  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;

  if (!(await serverFsIO.exists(projectDir(cfg.root, slug)))) notFound();

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
      <AddUpdateForm slug={slug} defaultDate={today} />
    </div>
  );
}
