import Link from "next/link";
import type { ReviewProject } from "@/lib/projects/review";
import { formatAge, truncate } from "@/lib/projects/format";
import { RiskIndicator, StatusPill, WaitingPill } from "../pills";

export function ReviewBucket({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description?: string;
  items: ReviewProject[];
  emptyText?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-4 space-y-3">
      <header className="space-y-0.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          <span className="ml-2 text-xs text-foreground/80 font-mono">
            {items.length}
          </span>
        </h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {emptyText ?? "Niets te melden."}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li
              key={p.slug}
              className="rounded border border-border bg-muted/30 p-3 space-y-1"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <Link
                  href={`/projects/${p.slug}`}
                  className="text-sm font-medium hover:underline"
                >
                  {p.name}
                </Link>
                <div className="flex items-center gap-2">
                  <StatusPill status={p.status} />
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatAge(p.ageDays)}
                  </span>
                </div>
              </div>
              {p.dashboardzin ? (
                <p className="text-sm leading-snug">{truncate(p.dashboardzin, 160)}</p>
              ) : p.nextAction ? (
                <p className="text-sm leading-snug text-muted-foreground">
                  volgende: {truncate(p.nextAction, 160)}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  geen dashboardzin
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <WaitingPill waitingOn={p.waitingOn} />
                <RiskIndicator level={p.riskLevel} />
                <span className="text-xs text-muted-foreground font-mono">
                  {p.client} · {p.phase || "geen fase"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
