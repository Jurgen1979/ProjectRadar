"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardCard, DashboardData } from "@/lib/projects/dashboard-data";
import type { Signal } from "@/lib/projects/signals";
import { ProjectCard } from "./project-card";
import { cn } from "@/lib/utils";

type SignalFilter = "any" | Signal;
type StatusFilter = "active-only" | "hide-done" | "all";
type SortKey = "last-updated" | "name" | "risk";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active-only", label: "alleen actief" },
  { value: "hide-done", label: "verberg klaar/gearchiveerd" },
  { value: "all", label: "alle statussen" },
];

const SIGNAL_OPTIONS: { value: SignalFilter; label: string }[] = [
  { value: "any", label: "alle signalen" },
  { value: "waiting-on-me", label: "wacht op mij" },
  { value: "waiting-on-client", label: "wacht op klant" },
  { value: "missing-next-action", label: "geen volgende actie" },
  { value: "stale", label: "stilgevallen" },
  { value: "high-risk", label: "hoog risico" },
  { value: "unclear", label: "onduidelijk" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "last-updated", label: "laatst bijgewerkt" },
  { value: "name", label: "alfabetisch" },
  { value: "risk", label: "risico hoog → laag" },
];

const RISK_RANK: Record<DashboardCard["riskLevel"], number> = {
  high: 4,
  medium: 3,
  unclear: 2,
  low: 1,
  none: 0,
};

function applyFilters(
  cards: DashboardCard[],
  q: string,
  status: StatusFilter,
  signal: SignalFilter,
  tag: string | null,
): DashboardCard[] {
  const needle = q.trim().toLowerCase();
  return cards.filter((c) => {
    if (status === "active-only" && c.status !== "active") return false;
    if (
      status === "hide-done" &&
      (c.status === "done" || c.status === "archived")
    )
      return false;
    if (signal !== "any" && !c.signals.includes(signal)) return false;
    if (tag && !c.tags.includes(tag)) return false;
    if (needle) {
      const hay = [
        c.name,
        c.client,
        c.type,
        c.phase,
        c.dashboardzin,
        c.nextAction,
        c.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

function applySort(cards: DashboardCard[], key: SortKey): DashboardCard[] {
  const out = [...cards];
  if (key === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else if (key === "risk") {
    out.sort((a, b) => RISK_RANK[b.riskLevel] - RISK_RANK[a.riskLevel]);
  } else {
    // last-updated: most recent first, undefined ages last
    out.sort((a, b) => {
      if (a.ageDays === null && b.ageDays === null) return 0;
      if (a.ageDays === null) return 1;
      if (b.ageDays === null) return -1;
      return a.ageDays - b.ageDays;
    });
  }
  return out;
}

export function ProjectsDashboard({ data }: { data: DashboardData }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("hide-done");
  const [signal, setSignal] = useState<SignalFilter>("any");
  const [sort, setSort] = useState<SortKey>("last-updated");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of data.cards) for (const t of c.tags) set.add(t);
    return Array.from(set).sort();
  }, [data.cards]);

  const filtered = useMemo(
    () => applySort(applyFilters(data.cards, q, status, signal, activeTag), sort),
    [data.cards, q, status, signal, activeTag, sort],
  );

  const total = data.cards.length;
  const visible = filtered.length;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projecten</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {visible} van {total} project{total === 1 ? "" : "en"} zichtbaar
            {data.staleDays !== 14 ? ` · stale-drempel ${data.staleDays} dagen` : ""}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-3 py-1.5 text-sm rounded-md bg-accent text-accent-foreground hover:opacity-90"
        >
          + nieuw project
        </Link>
      </header>

      <div className="rounded-lg border border-border bg-background p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op naam, klant, fase, tag, dashboardzin…"
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <Select
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={STATUS_OPTIONS}
          />
          <Select
            value={signal}
            onChange={(v) => setSignal(v as SignalFilter)}
            options={SIGNAL_OPTIONS}
          />
          <Select
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={SORT_OPTIONS}
          />
        </div>

        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Tags:</span>
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                "px-2 py-0.5 text-[11px] rounded font-mono border",
                activeTag === null
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              alle
            </button>
            {allTags.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setActiveTag(t === activeTag ? null : t)}
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded font-mono border",
                  activeTag === t
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyResults total={total} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <ProjectCard key={c.slug} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="px-2 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function EmptyResults({ total }: { total: number }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? "Nog geen projecten in deze root. Maak er een aan in Fase 5, of leg al een projectmap aan in /projects/."
          : "Geen projecten matchen deze filters. Pas de filters aan of wis ze."}
      </p>
    </div>
  );
}
