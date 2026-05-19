import type { Project } from "@/types/project";

export type Signal =
  | "stale"
  | "missing-next-action"
  | "waiting-on-me"
  | "waiting-on-client"
  | "high-risk"
  | "unclear";

export type ProjectSignals = {
  set: Set<Signal>;
  /** Most recent date we know about (lastUpdated, log, or update file). */
  lastSignal: string | null;
  /** Days since lastSignal, null when unknown. */
  ageDays: number | null;
};

function parseIsoDate(s: string | null | undefined): number | null {
  if (!s) return null;
  const ts = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(ts) ? ts : null;
}

function mostRecentTimestamp(project: Project): { iso: string | null; ms: number | null } {
  const candidates: Array<{ iso: string; ms: number } | null> = [];

  const metaTs = parseIsoDate(project.meta.lastUpdated);
  if (metaTs !== null) candidates.push({ iso: project.meta.lastUpdated!, ms: metaTs });

  for (const u of project.updates) {
    const ts = parseIsoDate(u.datum);
    if (ts !== null) candidates.push({ iso: u.datum!, ms: ts });
    else candidates.push({ iso: new Date(u.mtime).toISOString().slice(0, 10), ms: u.mtime });
  }

  for (const entry of project.log?.entries ?? []) {
    const ts = parseIsoDate(entry.date);
    if (ts !== null) candidates.push({ iso: entry.date!, ms: ts });
  }

  const valid = candidates.filter((c): c is { iso: string; ms: number } => c !== null);
  if (valid.length === 0) return { iso: null, ms: null };
  valid.sort((a, b) => b.ms - a.ms);
  return { iso: valid[0].iso, ms: valid[0].ms };
}

export function computeSignals(
  project: Project,
  opts: { staleDays: number; now?: number } = { staleDays: 14 },
): ProjectSignals {
  const now = opts.now ?? Date.now();
  const set = new Set<Signal>();
  const recent = mostRecentTimestamp(project);
  const ageDays =
    recent.ms !== null ? Math.floor((now - recent.ms) / 86_400_000) : null;

  if (ageDays !== null && ageDays >= opts.staleDays) set.add("stale");
  if (ageDays === null) set.add("stale");

  const nextAction =
    (project.meta.nextAction || "").trim() ||
    (project.status?.volgendeActie || "").trim();
  if (!nextAction) set.add("missing-next-action");

  if (project.meta.waitingOn === "me") set.add("waiting-on-me");
  if (project.meta.waitingOn === "client") set.add("waiting-on-client");

  if (project.meta.riskLevel === "high") set.add("high-risk");

  const dashboard = (project.status?.dashboardzin || "").trim();
  if (!project.status || !dashboard || !nextAction) set.add("unclear");

  return { set, lastSignal: recent.iso, ageDays };
}

export const SIGNAL_LABELS: Record<Signal, string> = {
  stale: "stilgevallen",
  "missing-next-action": "geen volgende actie",
  "waiting-on-me": "wacht op mij",
  "waiting-on-client": "wacht op klant",
  "high-risk": "hoog risico",
  unclear: "onduidelijk",
};
