"use client";

import { useEffect, useState } from "react";
import { useResolvedIO } from "@/lib/io/use-resolved-io";
import {
  loadDashboardData,
  type DashboardData,
} from "@/lib/projects/dashboard-data";
import { ProjectsDashboard } from "@/components/projects/dashboard";
import { BrokenProjectsList } from "@/components/projects/broken-list";
import {
  NoProjectsState,
  NoRootState,
} from "@/components/projects/empty-state";

export function TauriDashboard() {
  const resolved = useResolvedIO();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolved.status !== "ready") return;
    let cancelled = false;
    setError(null);
    void loadDashboardData(resolved.io, resolved.root, resolved.config)
      .then((d) => {
        if (!cancelled) setData(d);
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
    return (
      <NoRootState message="Geen projectroot gekozen. Open Instellingen of doorloop het welkomstscherm." />
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
        Kon dashboard niet laden: {error}
      </div>
    );
  }
  if (!data) return <Loading />;

  if (data.cards.length === 0 && data.broken.length === 0) {
    return <NoProjectsState root={resolved.root} />;
  }

  return (
    <div className="space-y-6">
      <ProjectsDashboard data={data} />
      <BrokenProjectsList broken={data.broken} skipped={data.skipped} />
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
