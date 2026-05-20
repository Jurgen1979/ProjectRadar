import { getAiStatus, getConfigStatus } from "@/lib/config";
import { buildReviewData } from "@/lib/projects/review";
import { serverFsIO } from "@/lib/server-io";
import { NoRootState } from "@/components/projects/empty-state";
import { ReviewBucket } from "@/components/projects/review/review-bucket";
import { ReviewActions } from "@/components/projects/review/review-actions";
import { bucketsEmpty } from "@/lib/export/review-md";

export default async function ReviewPage() {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;

  const data = await buildReviewData(serverFsIO, cfg.root, cfg.config);
  const ai = getAiStatus(cfg.config);
  const allClear = bucketsEmpty(data.buckets);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Heuristische review over {data.considered.length}{" "}
          niet-gearchiveerde project{data.considered.length === 1 ? "" : "en"}.
          Stale-drempel{" "}
          <span className="font-mono">{data.staleDays}</span> dagen.
          {data.hidden > 0
            ? ` (${data.hidden} gearchiveerd projecten verborgen.)`
            : ""}
        </p>
      </header>

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
    </div>
  );
}
