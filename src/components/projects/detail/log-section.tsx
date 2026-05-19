import type { ProjectLogFile } from "@/types/project";
import { Section } from "./section";
import { MarkdownBlocks } from "./blocks";

export function LogSection({ log }: { log: ProjectLogFile | null }) {
  if (!log || log.entries.length === 0) {
    return (
      <Section title="Projectlog" subtitle="project-log.md ontbreekt of is leeg">
        <p className="text-sm text-muted-foreground italic">
          Nog geen logboek.
        </p>
      </Section>
    );
  }
  return (
    <Section
      title="Projectlog"
      subtitle={`${log.entries.length} entr${log.entries.length === 1 ? "y" : "ies"}, nieuwste eerst`}
    >
      <ul className="space-y-3">
        {log.entries.map((e, i) => (
          <li key={i} className="rounded border border-border bg-muted/30 p-3">
            <div className="text-xs font-mono text-muted-foreground mb-1.5">
              {e.heading}
            </div>
            <MarkdownBlocks body={e.body} empty="(leeg)" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
