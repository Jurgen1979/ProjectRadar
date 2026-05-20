import type { ReviewBuckets, ReviewData, ReviewProject } from "@/lib/projects/review";

function projectLine(p: ReviewProject): string {
  const age =
    p.ageDays === null
      ? "geen update"
      : p.ageDays === 0
        ? "vandaag"
        : `${p.ageDays}d geleden`;
  const tail = p.dashboardzin
    ? ` — ${p.dashboardzin}`
    : p.nextAction
      ? ` — volgende: ${p.nextAction}`
      : "";
  return `- **${p.name}** (${p.slug}) · ${age}${tail}`;
}

function bucket(title: string, items: ReviewProject[]): string {
  if (items.length === 0) return `## ${title}\n\n_(niets te melden)_\n`;
  return `## ${title}\n\n${items.map(projectLine).join("\n")}\n`;
}

export function renderReviewMarkdown(opts: {
  data: ReviewData;
  generatedAt: Date;
  aiText: string | null;
}): string {
  const date = opts.generatedAt.toISOString().slice(0, 10);
  const { buckets, considered, hidden, staleDays } = opts.data;

  const heuristic = [
    `# wekelijkse projectreview — ${date}`,
    "",
    `_${considered.length} projecten bekeken, ${hidden} done/archived overgeslagen, stale-drempel ${staleDays} dagen._`,
    "",
    bucket("wacht op mij", buckets.waitingOnMe),
    bucket("wacht op klant", buckets.waitingOnClient),
    bucket("geen volgende actie", buckets.missingNextAction),
    bucket("stilgevallen", buckets.stale),
    bucket("hoog risico", buckets.highRisk),
    bucket("onduidelijk", buckets.unclear),
  ].join("\n");

  if (opts.aiText) {
    return `${heuristic}\n---\n\n${opts.aiText.trim()}\n`;
  }
  return `${heuristic}\n`;
}

export function bucketsEmpty(buckets: ReviewBuckets): boolean {
  return (
    buckets.waitingOnMe.length === 0 &&
    buckets.waitingOnClient.length === 0 &&
    buckets.missingNextAction.length === 0 &&
    buckets.stale.length === 0 &&
    buckets.highRisk.length === 0 &&
    buckets.unclear.length === 0
  );
}
