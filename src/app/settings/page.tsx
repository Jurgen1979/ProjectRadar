import { getAiStatus, getConfigStatus } from "@/lib/config";
import { DEFAULT_CONFIG } from "@/lib/schema/config";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-baseline gap-4 border-b border-border py-3 last:border-b-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-mono break-all">{value}</div>
    </div>
  );
}

export default function SettingsPage() {
  const cfg = getConfigStatus();
  const effective = cfg.kind === "ok" ? cfg.config : DEFAULT_CONFIG;
  const ai = getAiStatus(effective);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Read-only weergave van de actieve configuratie. Pas waarden aan via{" "}
          <code className="px-1 rounded bg-muted">.env.local</code> of{" "}
          <code className="px-1 rounded bg-muted">projectradar.config.json</code>
          {" "}in de projectroot.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          Projectroot
        </div>
        <div className="px-4">
          <Row
            label="PROJECTRADAR_ROOT"
            value={
              cfg.kind === "no-root" ? (
                <span className="text-amber-700">niet ingesteld</span>
              ) : (
                cfg.root
              )
            }
          />
          <Row
            label="Configbestand"
            value={
              cfg.kind === "ok"
                ? cfg.configPath ?? "(niet aanwezig — defaults actief)"
                : cfg.kind === "config-invalid"
                  ? `${cfg.configPath} — ongeldig`
                  : "—"
            }
          />
          <Row label="Status" value={
            cfg.kind === "ok" ? (
              <span className="text-emerald-700">OK</span>
            ) : (
              <span className="text-amber-700">{cfg.message}</span>
            )
          } />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          AI
        </div>
        <div className="px-4">
          <Row label="Provider" value={ai.provider} />
          <Row label="Model" value={ai.model || <em className="text-muted-foreground">leeg</em>} />
          <Row
            label="Aan/uit"
            value={
              ai.enabled ? (
                <span className="text-emerald-700">ingeschakeld</span>
              ) : (
                <span className="text-amber-700">uit — {ai.reason}</span>
              )
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          Overige
        </div>
        <div className="px-4">
          <Row label="Taal" value={effective.defaultLanguage} />
          <Row label="Stale (dagen)" value={effective.staleDays} />
          <Row label="Review-venster (dagen)" value={effective.reviewWindowDays} />
          <Row
            label="Max updates voor statusgeneratie"
            value={effective.maxUpdatesForStatusGeneration}
          />
          <Row
            label="Backup bij status-overschrijven"
            value={effective.backupOnStatusOverwrite ? "aan" : "uit"}
          />
          <Row label="Datumformaat" value={effective.dateFormat} />
        </div>
      </section>
    </div>
  );
}
