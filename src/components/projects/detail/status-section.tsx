import type { ProjectStatusFile } from "@/types/project";
import { Section } from "./section";
import { ListBlock, TextBlock } from "./blocks";

const HEADINGS: Array<{
  key: keyof ProjectStatusFile;
  label: string;
  type: "text" | "list";
  empty?: string;
}> = [
  { key: "korteStatus", label: "korte status", type: "text" },
  { key: "huidigeFase", label: "huidige fase", type: "text" },
  { key: "laatsteBelangrijkeBeslissing", label: "laatste belangrijke beslissing", type: "text" },
  { key: "openVragen", label: "open vragen", type: "list" },
  { key: "belangrijkeContext", label: "belangrijke context", type: "list" },
];

export function StatusSection({ status }: { status: ProjectStatusFile | null }) {
  if (!status) {
    return (
      <Section
        title="Huidige status"
        subtitle="project-status.md ontbreekt"
      >
        <p className="text-sm text-muted-foreground">
          Er is nog geen statusbestand. In Fase 4 komt er een knop om er een
          standaard versie van aan te maken.
        </p>
      </Section>
    );
  }

  return (
    <Section
      title="Huidige status"
      subtitle={
        status.laatstBijgewerkt
          ? `laatst bijgewerkt: ${status.laatstBijgewerkt}`
          : undefined
      }
    >
      <div className="space-y-5">
        {status.dashboardzin ? (
          <p className="text-base font-medium leading-snug">
            {status.dashboardzin}
          </p>
        ) : null}
        {HEADINGS.map(({ key, label, type, empty }) => {
          const value = status[key];
          return (
            <FieldGroup key={key} label={label}>
              {type === "text" ? (
                <TextBlock text={(value as string | null) ?? null} empty={empty} />
              ) : (
                <ListBlock items={(value as string[]) ?? []} empty={empty} />
              )}
            </FieldGroup>
          );
        })}
        <FieldGroup label="risico's / aandachtspunten">
          <ListBlock items={status.risicos} />
        </FieldGroup>
        {status.unknownSections.length > 0 ? (
          <FieldGroup label={`overige secties (${status.unknownSections.length})`}>
            <div className="space-y-3">
              {status.unknownSections.map((s, i) => (
                <div key={i}>
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    ## {s.heading}
                  </div>
                  <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/40 rounded p-2">
                    {s.body}
                  </pre>
                </div>
              ))}
            </div>
          </FieldGroup>
        ) : null}
      </div>
    </Section>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </h3>
      {children}
    </div>
  );
}
