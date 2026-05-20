import { formatAge } from "@/lib/projects/format";
import type { DashboardCard, DashboardData } from "@/lib/projects/dashboard-data";
import { SIGNAL_LABELS } from "@/lib/projects/signals";
import type { ProjectWarning } from "@/types/project";

function fmtCard(c: DashboardCard): string {
  const lines = [
    `### ${c.name}`,
    `- slug: \`${c.slug}\``,
    `- klant/type: ${c.client} / ${c.type}`,
    `- status: ${c.status}${c.phase ? ` · fase: ${c.phase}` : ""}`,
  ];
  if (c.dashboardzin) lines.push(`- dashboardzin: ${c.dashboardzin}`);
  if (c.nextAction) lines.push(`- volgende actie: ${c.nextAction}`);
  lines.push(`- wacht op: ${c.waitingOn}`);
  lines.push(`- risico: ${c.riskLevel}`);
  lines.push(
    `- laatste signaal: ${c.lastSignal ?? "onbekend"} (${formatAge(c.ageDays)})`,
  );
  if (c.signals.length > 0) {
    lines.push(
      `- signalen: ${c.signals.map((s) => SIGNAL_LABELS[s]).join(", ")}`,
    );
  }
  if (c.tags.length > 0) lines.push(`- tags: ${c.tags.join(", ")}`);
  return lines.join("\n");
}

function fmtBroken(b: {
  slug: string;
  dir: string;
  warnings: ProjectWarning[];
}): string {
  const lines = [
    `### ${b.slug}`,
    `- map: \`${b.dir}\``,
    "- fouten:",
    ...b.warnings.map((w) => `  - \`${w.file}\`: ${w.message}`),
  ];
  return lines.join("\n");
}

export function renderDashboardMarkdown(opts: {
  data: DashboardData;
  generatedAt: Date;
}): string {
  const date = opts.generatedAt.toISOString().slice(0, 10);
  const { cards, broken, skipped, staleDays } = opts.data;

  const sections: string[] = [];
  sections.push(`# projectradar dashboard — ${date}`);
  sections.push("");
  sections.push(
    `_${cards.length} project${cards.length === 1 ? "" : "en"} geladen, ${broken.length} broken, ${skipped.length} skipped folders, stale-drempel ${staleDays} dagen._`,
  );
  sections.push("");

  if (cards.length === 0) {
    sections.push("## projecten");
    sections.push("");
    sections.push("_(geen valide projecten geladen)_");
  } else {
    sections.push("## projecten");
    sections.push("");
    sections.push(cards.map(fmtCard).join("\n\n"));
  }

  if (broken.length > 0) {
    sections.push("");
    sections.push("## broken projecten");
    sections.push("");
    sections.push(broken.map(fmtBroken).join("\n\n"));
  }
  if (skipped.length > 0) {
    sections.push("");
    sections.push("## niet-slug-veilige mapnamen");
    sections.push("");
    sections.push(skipped.map((s) => `- \`${s}\``).join("\n"));
  }

  return sections.join("\n") + "\n";
}
