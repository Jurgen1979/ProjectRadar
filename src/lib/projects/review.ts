import { loadAllProjects } from "./load-all";
import { computeSignals } from "./signals";
import type { FsIO } from "@/lib/io/types";
import type { Project } from "@/types/project";
import type { ProjectradarConfig } from "@/lib/schema/config";

/** Compact card we expose to the review UI. Serializable. */
export type ReviewProject = {
  slug: string;
  name: string;
  client: string;
  status: Project["meta"]["status"];
  phase: string;
  waitingOn: Project["meta"]["waitingOn"];
  riskLevel: Project["meta"]["riskLevel"];
  nextAction: string;
  dashboardzin: string;
  lastSignal: string | null;
  ageDays: number | null;
};

/** Heuristic buckets. A project can appear in more than one. */
export type ReviewBuckets = {
  waitingOnMe: ReviewProject[];
  waitingOnClient: ReviewProject[];
  missingNextAction: ReviewProject[];
  stale: ReviewProject[];
  highRisk: ReviewProject[];
  unclear: ReviewProject[];
};

export type ReviewData = {
  /** All projects considered for review (non-archived). */
  considered: ReviewProject[];
  /** Number of done/archived projects we filtered out. */
  hidden: number;
  buckets: ReviewBuckets;
  staleDays: number;
};

const HIDDEN_STATUSES = new Set(["archived"]);

function toReviewProject(p: Project, staleDays: number): {
  card: ReviewProject;
  signals: ReturnType<typeof computeSignals>;
} {
  const sig = computeSignals(p, { staleDays });
  return {
    card: {
      slug: p.slug,
      name: p.meta.name,
      client: p.meta.client,
      status: p.meta.status,
      phase: p.meta.phase,
      waitingOn: p.meta.waitingOn,
      riskLevel: p.meta.riskLevel,
      nextAction:
        p.meta.nextAction.trim() || p.status?.volgendeActie?.trim() || "",
      dashboardzin: p.status?.dashboardzin?.trim() || "",
      lastSignal: sig.lastSignal,
      ageDays: sig.ageDays,
    },
    signals: sig,
  };
}

export async function buildReviewData(
  io: FsIO,
  root: string,
  config: ProjectradarConfig,
): Promise<ReviewData> {
  const idx = await loadAllProjects(io, root);

  const considered: ReviewProject[] = [];
  const buckets: ReviewBuckets = {
    waitingOnMe: [],
    waitingOnClient: [],
    missingNextAction: [],
    stale: [],
    highRisk: [],
    unclear: [],
  };
  let hidden = 0;

  for (const project of idx.projects) {
    if (HIDDEN_STATUSES.has(project.meta.status)) {
      hidden++;
      continue;
    }
    const { card, signals } = toReviewProject(project, config.staleDays);
    considered.push(card);
    if (signals.set.has("waiting-on-me")) buckets.waitingOnMe.push(card);
    if (signals.set.has("waiting-on-client")) buckets.waitingOnClient.push(card);
    if (signals.set.has("missing-next-action"))
      buckets.missingNextAction.push(card);
    if (signals.set.has("stale")) buckets.stale.push(card);
    if (signals.set.has("high-risk")) buckets.highRisk.push(card);
    if (signals.set.has("unclear")) buckets.unclear.push(card);
  }

  // Sort each bucket: oldest signal first (most urgent), then alphabetical.
  const byAge = (a: ReviewProject, b: ReviewProject) => {
    if (a.ageDays === null && b.ageDays === null) return a.name.localeCompare(b.name);
    if (a.ageDays === null) return -1;
    if (b.ageDays === null) return 1;
    return b.ageDays - a.ageDays;
  };
  for (const key of Object.keys(buckets) as (keyof ReviewBuckets)[]) {
    buckets[key].sort(byAge);
  }

  return {
    considered,
    hidden,
    buckets,
    staleDays: config.staleDays,
  };
}
