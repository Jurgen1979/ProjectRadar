import type { DecisionLogFile } from "@/types/project";
import { Section } from "./section";
import { TextBlock } from "./blocks";

export function DecisionsSection({ decisions }: { decisions: DecisionLogFile | null }) {
  if (!decisions || decisions.entries.length === 0) {
    return (
      <Section title="Beslissingen" subtitle="decision-log.md ontbreekt of is leeg">
        <p className="text-sm text-muted-foreground italic">
          Geen beslissingen vastgelegd.
        </p>
      </Section>
    );
  }
  return (
    <Section
      title="Beslissingen"
      subtitle={`${decisions.entries.length} beslissing${decisions.entries.length === 1 ? "" : "en"}`}
    >
      <ul className="space-y-4">
        {decisions.entries.map((d, i) => (
          <li key={i} className="rounded border border-border bg-muted/30 p-3 space-y-2">
            <div>
              <h3 className="text-sm font-medium leading-tight">{d.title}</h3>
              {d.date ? (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {d.date}
                </p>
              ) : null}
            </div>
            {d.decision ? (
              <Field label="beslissing">
                <TextBlock text={d.decision} />
              </Field>
            ) : null}
            {d.why ? (
              <Field label="waarom">
                <TextBlock text={d.why} />
              </Field>
            ) : null}
            {d.impact ? (
              <Field label="impact">
                <TextBlock text={d.impact} />
              </Field>
            ) : null}
            {d.revise ? (
              <Field label="nog te herzien?">
                <TextBlock text={d.revise} />
              </Field>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
