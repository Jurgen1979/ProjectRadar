import Link from "next/link";
import { RiskIndicator, SignalPill, StatusPill, TagPill, WaitingPill } from "./pills";
import type { DashboardCard } from "@/lib/projects/dashboard-data";
import { formatAge, truncate } from "@/lib/projects/format";

export function ProjectCard({ card }: { card: DashboardCard }) {
  return (
    <Link
      href={`/projects/${card.slug}`}
      className="group block rounded-lg border border-border bg-background p-4 hover:border-foreground/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-medium text-base leading-tight truncate group-hover:underline underline-offset-2">
            {card.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {card.client} · {card.type}
            {card.phase ? ` · ${card.phase}` : ""}
          </p>
        </div>
        <StatusPill status={card.status} />
      </div>

      {card.dashboardzin ? (
        <p className="text-sm text-foreground/90 mb-3 leading-snug">
          {truncate(card.dashboardzin, 140)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic mb-3">
          Geen dashboardzin ingesteld.
        </p>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs mb-3">
        <dt className="text-muted-foreground">Volgende actie</dt>
        <dd className={card.nextAction ? "" : "text-muted-foreground italic"}>
          {truncate(card.nextAction, 80) || "niet ingesteld"}
        </dd>
        <dt className="text-muted-foreground">Laatste update</dt>
        <dd className="font-mono">
          {formatAge(card.ageDays)}
          {card.lastSignal ? (
            <span className="text-muted-foreground ml-1.5">
              ({card.lastSignal})
            </span>
          ) : null}
        </dd>
      </dl>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <WaitingPill waitingOn={card.waitingOn} />
        <RiskIndicator level={card.riskLevel} />
      </div>

      {card.signals.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-2 pt-2 border-t border-border">
          {card.signals.map((s) => (
            <SignalPill key={s} signal={s} />
          ))}
        </div>
      ) : null}

      {card.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {card.tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      ) : null}
    </Link>
  );
}
