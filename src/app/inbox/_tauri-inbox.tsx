"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useResolvedIO } from "@/lib/io/use-resolved-io";
import { loadAllProjects } from "@/lib/projects/load-all";
import { InboxForm, type ProjectChoice } from "./form";

export function TauriInbox() {
  const resolved = useResolvedIO();
  const searchParams = useSearchParams();
  const projectQuery = searchParams.get("project");
  const [projects, setProjects] = useState<ProjectChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolved.status !== "ready") return;
    let cancelled = false;
    void loadAllProjects(resolved.io, resolved.root)
      .then((idx) => {
        if (cancelled) return;
        setProjects(
          idx.projects
            .map((p) => ({
              slug: p.slug,
              name: p.meta.name,
              status: p.meta.status,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  if (resolved.status === "loading") return <Loading />;
  if (resolved.status === "no-root") {
    return <p className="text-sm text-muted-foreground">Geen projectroot ingesteld.</p>;
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
        Kon projecten niet laden: {error}
      </div>
    );
  }
  if (!projects) return <Loading />;

  if (projects.length === 0) {
    return (
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
    );
  }

  const defaultSlug =
    projectQuery && projects.some((p) => p.slug === projectQuery)
      ? projectQuery
      : null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <InboxForm projects={projects} defaultSlug={defaultSlug} today={today} />
  );
}

function Loading() {
  return (
    <div className="text-sm text-muted-foreground py-12 text-center">
      Laden…
    </div>
  );
}
