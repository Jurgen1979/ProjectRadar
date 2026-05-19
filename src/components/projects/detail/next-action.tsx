import type { Project } from "@/types/project";
import { Section } from "./section";

const WAITING_LABELS: Record<Project["meta"]["waitingOn"], string> = {
  me: "mij",
  client: "klant",
  "third-party": "derde partij",
  none: "niemand",
  unclear: "onduidelijk",
};

export function NextActionSection({ project }: { project: Project }) {
  const fromMeta = project.meta.nextAction?.trim() ?? "";
  const fromStatus = project.status?.volgendeActie?.trim() ?? "";
  const value = fromMeta || fromStatus;
  const showBoth = fromMeta && fromStatus && fromMeta !== fromStatus;

  return (
    <Section title="Volgende actie">
      {value ? (
        <p className="text-base leading-snug">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Geen volgende actie ingesteld.
        </p>
      )}
      {showBoth ? (
        <p className="text-xs text-amber-700 mt-2">
          Tegenstrijdig: meta zegt &ldquo;{fromMeta}&rdquo;, statusfile zegt
          &ldquo;{fromStatus}&rdquo;. Meta wint.
        </p>
      ) : null}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <span>wacht op:</span>
        <span className="font-medium text-foreground">
          {WAITING_LABELS[project.meta.waitingOn]}
        </span>
      </div>
    </Section>
  );
}
