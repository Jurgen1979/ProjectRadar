"use client";

import { useEffect, useState } from "react";
import { useResolvedIO } from "@/lib/io/use-resolved-io";
import { deriveAiStatus } from "@/lib/io/app-config";
import { buildReviewData, type ReviewData } from "@/lib/projects/review";
import { ReviewBucket } from "@/components/projects/review/review-bucket";
import { ReviewActions } from "@/components/projects/review/review-actions";
import { bucketsEmpty } from "@/lib/export/review-md";

export function TauriReview() {
  const resolved = useResolvedIO();
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolved.status !== "ready") return;
    let cancelled = false;
    void buildReviewData(resolved.io, resolved.root, resolved.config)
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
    return <p className="text-sm text-muted-foreground">Geen projectroot ingesteld.</p>;
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
        Kon review niet laden: {error}
      </div>
    );
  }
  if (!data) return <Loading />;

  const ai = deriveAiStatus(resolved.appConfig);
  const allClear = bucketsEmpty(data.buckets);

  return (
    <>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Heuristische review over {data.considered.length}{" "}
        niet-gearchiveerde project{data.considered.length === 1 ? "" : "en"}.
        Stale-drempel{" "}
        <span className="font-mono">{data.staleDays}</span> dagen.
        {data.hidden > 0
          ? ` (${data.hidden} gearchiveerd projecten verborgen.)`
          : ""}
      </p>

      <ReviewActions
        data={data}
        aiEnabled={ai.enabled}
        aiReason={ai.enabled ? null : ai.reason}
      />

      {allClear ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-6 text-center">
          <p className="text-sm text-emerald-900">
            Niets vraagt direct aandacht — alles op koers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewBucket
            title="wacht op mij"
            description="actie aan jouw kant"
            items={data.buckets.waitingOnMe}
            emptyText="Niemand wacht op jou."
          />
          <ReviewBucket
            title="wacht op klant"
            description="bal ligt buitenhuis"
            items={data.buckets.waitingOnClient}
            emptyText="Geen wachters op klant."
          />
          <ReviewBucket
            title="geen volgende actie"
            description="ontbrekende nextAction"
            items={data.buckets.missingNextAction}
            emptyText="Alle projecten hebben een volgende actie."
          />
          <ReviewBucket
            title="stilgevallen"
            description={`>${data.staleDays} dagen geen update`}
            items={data.buckets.stale}
            emptyText="Geen stilgevallen projecten."
          />
          <ReviewBucket
            title="hoog risico"
            description="riskLevel = high"
            items={data.buckets.highRisk}
            emptyText="Geen hoog-risico-projecten."
          />
          <ReviewBucket
            title="onduidelijk"
            description="geen status, geen dashboardzin of tegenstrijdig"
            items={data.buckets.unclear}
            emptyText="Geen onduidelijke projecten."
          />
        </div>
      )}
    </>
  );
}

function Loading() {
  return (
    <div className="text-sm text-muted-foreground py-12 text-center">
      Laden…
    </div>
  );
}
