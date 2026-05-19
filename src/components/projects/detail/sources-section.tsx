import { Section } from "./section";

export function SourcesSection({ sources, dir }: { sources: string[]; dir: string }) {
  if (sources.length === 0) {
    return (
      <Section title="Bronnen" subtitle="map /sources is leeg of ontbreekt">
        <p className="text-sm text-muted-foreground italic">
          Geen bronbestanden gevonden.
        </p>
      </Section>
    );
  }
  return (
    <Section
      title="Bronnen"
      subtitle={`${sources.length} bestand${sources.length === 1 ? "" : "en"} in /sources`}
    >
      <ul className="text-sm font-mono space-y-1">
        {sources.map((f) => (
          <li key={f} className="flex items-center justify-between gap-3">
            <span className="truncate">{f}</span>
            <span className="text-xs text-muted-foreground truncate">
              {dir}/sources/{f}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3">
        Bestanden openen via je editor of bestandsbeheer — browsers blokkeren
        directe <code className="font-mono">file://</code>-links.
      </p>
    </Section>
  );
}
