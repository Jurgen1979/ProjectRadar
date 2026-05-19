import Link from "next/link";
import type { Project } from "@/types/project";
import type { Signal } from "@/lib/projects/signals";
import { RiskIndicator, SignalPill, StatusPill, TagPill, WaitingPill } from "../pills";
import { formatAge } from "@/lib/projects/format";

export function ProjectHeader({
  project,
  signals,
  ageDays,
  lastSignal,
}: {
  project: Project;
  signals: Signal[];
  ageDays: number | null;
  lastSignal: string | null;
}) {
  const meta = project.meta;
  return (
    <header className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground font-mono">
            <Link href="/projects" className="hover:underline">
              projecten
            </Link>
            {" / "}
            <span>{project.slug}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{meta.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {meta.client} · {meta.type}
            {meta.phase ? ` · ${meta.phase}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href={`/projects/${project.slug}/updates/new`}
            className="px-3 py-1.5 text-xs rounded-md bg-accent text-accent-foreground hover:opacity-90"
          >
            Update toevoegen
          </Link>
          <Link
            href={`/projects/${project.slug}/edit`}
            className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted"
          >
            Metadata bewerken
          </Link>
          <Link
            href={`/projects/${project.slug}/status/generate`}
            className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted"
          >
            Status genereren
          </Link>
          <ActionButton label="Exporteren" hint="Fase 9" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusPill status={meta.status} />
        <WaitingPill waitingOn={meta.waitingOn} />
        <RiskIndicator level={meta.riskLevel} />
        <span className="text-xs text-muted-foreground font-mono">
          laatst: {formatAge(ageDays)}
          {lastSignal ? ` (${lastSignal})` : ""}
        </span>
        {meta.tags.length > 0 ? (
          <div className="flex items-center gap-1 ml-1">
            {meta.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        ) : null}
      </div>

      {signals.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {signals.map((s) => (
            <SignalPill key={s} signal={s} />
          ))}
        </div>
      ) : null}
    </header>
  );
}

function ActionButton({ label, hint }: { label: string; hint: string }) {
  return (
    <button
      type="button"
      disabled
      title={`${hint} — nog niet beschikbaar`}
      className="px-3 py-1.5 text-xs rounded-md border border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
    >
      {label}
      <span className="ml-1.5 text-[10px] font-mono opacity-60">{hint}</span>
    </button>
  );
}
