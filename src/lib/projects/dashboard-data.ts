import "server-only";
import type { ProjectradarConfig } from "@/lib/schema/config";
import { loadAllProjects } from "@/lib/projects/load-all";
import { computeSignals, type Signal } from "@/lib/projects/signals";
import type { Project, ProjectWarning } from "@/types/project";

export type DashboardCard = {
  slug: string;
  name: string;
  client: string;
  type: string;
  status: Project["meta"]["status"];
  phase: string;
  priority: Project["meta"]["priority"];
  riskLevel: Project["meta"]["riskLevel"];
  waitingOn: Project["meta"]["waitingOn"];
  tags: string[];
  nextAction: string;
  dashboardzin: string;
  lastSignal: string | null;
  ageDays: number | null;
  signals: Signal[];
  hasStatus: boolean;
  hasLinks: boolean;
  updatesCount: number;
};

export type DashboardData = {
  cards: DashboardCard[];
  broken: Array<{
    slug: string;
    dir: string;
    warnings: ProjectWarning[];
  }>;
  skipped: string[];
  staleDays: number;
};

function buildCard(project: Project, staleDays: number): DashboardCard {
  const sig = computeSignals(project, { staleDays });
  const next =
    project.meta.nextAction?.trim() ||
    project.status?.volgendeActie?.trim() ||
    "";
  const dash = project.status?.dashboardzin?.trim() || "";

  return {
    slug: project.slug,
    name: project.meta.name,
    client: project.meta.client,
    type: project.meta.type,
    status: project.meta.status,
    phase: project.meta.phase,
    priority: project.meta.priority,
    riskLevel: project.meta.riskLevel,
    waitingOn: project.meta.waitingOn,
    tags: project.meta.tags,
    nextAction: next,
    dashboardzin: dash,
    lastSignal: sig.lastSignal,
    ageDays: sig.ageDays,
    signals: Array.from(sig.set),
    hasStatus: project.status !== null,
    hasLinks: project.links !== null,
    updatesCount: project.updates.length,
  };
}

export async function loadDashboardData(
  root: string,
  config: ProjectradarConfig,
): Promise<DashboardData> {
  const idx = await loadAllProjects(root);
  return {
    cards: idx.projects.map((p) => buildCard(p, config.staleDays)),
    broken: idx.broken,
    skipped: idx.skipped,
    staleDays: config.staleDays,
  };
}
