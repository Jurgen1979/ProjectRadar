import Link from "next/link";
import { getConfigStatus } from "@/lib/config";
import { loadAllProjects } from "@/lib/projects/load-all";
import { NoRootState } from "@/components/projects/empty-state";
import { InboxForm, type ProjectChoice } from "./form";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;

  const idx = await loadAllProjects(cfg.root);
  const projects: ProjectChoice[] = idx.projects
    .map((p) => ({
      slug: p.slug,
      name: p.meta.name,
      status: p.meta.status,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sp = await searchParams;
  const defaultSlug =
    sp.project && projects.some((p) => p.slug === sp.project) ? sp.project : null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Plak losse AI-output of notities, kies een project en bewaar als
          update. Geen aparte inbox-bestanden — alles landt meteen in{" "}
          <code className="font-mono">/updates</code> van het gekozen
          project.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 max-w-2xl space-y-3">
          <h2 className="text-lg font-semibold">Nog geen projecten</h2>
          <p className="text-sm text-muted-foreground leading-6">
            Maak eerst een project aan voordat je iets in de inbox kunt
            opslaan.
          </p>
          <Link
            href="/projects/new"
            className="inline-block px-3 py-1.5 text-sm rounded-md bg-accent text-accent-foreground hover:opacity-90"
          >
            + nieuw project
          </Link>
        </div>
      ) : (
        <InboxForm
          projects={projects}
          defaultSlug={defaultSlug}
          today={today}
        />
      )}
    </div>
  );
}
