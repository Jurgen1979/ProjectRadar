import type { UpdateFile } from "@/types/project";
import { Section } from "./section";
import { ListBlock, TextBlock } from "./blocks";

const RECENT_LIMIT = 5;

export function UpdatesSection({ updates }: { updates: UpdateFile[] }) {
  if (updates.length === 0) {
    return (
      <Section title="Recente updates" subtitle="nog geen updates">
        <p className="text-sm text-muted-foreground italic">
          Er staan nog geen bestanden in <code className="font-mono">/updates</code>.
        </p>
      </Section>
    );
  }

  const recent = updates.slice(0, RECENT_LIMIT);
  const rest = updates.length - recent.length;

  return (
    <Section
      title="Recente updates"
      subtitle={`${updates.length} update${updates.length === 1 ? "" : "s"} totaal`}
    >
      <ul className="space-y-4">
        {recent.map((u) => (
          <li
            key={u.filename}
            className="rounded border border-border bg-muted/30 p-3 space-y-2"
          >
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-medium leading-tight truncate">
                  {u.title ?? u.filename}
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {u.datum ?? "geen datum"}
                  {u.bron ? ` · ${u.bron}` : ""}
                  {" · "}
                  <span className="text-muted-foreground/80">{u.filename}</span>
                </p>
              </div>
            </div>

            {u.dashboardzin ? (
              <p className="text-sm font-medium">{u.dashboardzin}</p>
            ) : null}

            {u.korteContext ? (
              <UpdateField label="korte context">
                <TextBlock text={u.korteContext} />
              </UpdateField>
            ) : null}
            {u.beslissingen.length > 0 ? (
              <UpdateField label="beslissingen">
                <ListBlock items={u.beslissingen} />
              </UpdateField>
            ) : null}
            {u.volgendeActies.length > 0 ? (
              <UpdateField label="volgende acties">
                <ListBlock items={u.volgendeActies} />
              </UpdateField>
            ) : null}
            {u.openVragen.length > 0 ? (
              <UpdateField label="open vragen">
                <ListBlock items={u.openVragen} />
              </UpdateField>
            ) : null}
            {u.risicos.length > 0 ? (
              <UpdateField label="risico's">
                <ListBlock items={u.risicos} />
              </UpdateField>
            ) : null}
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="text-xs text-muted-foreground mt-3">
          + {rest} oudere update{rest === 1 ? "" : "s"}
        </p>
      ) : null}
    </Section>
  );
}

function UpdateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
