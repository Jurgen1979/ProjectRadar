import type { ProjectLinksFile } from "@/types/project";
import { Section } from "./section";

export function LinksSection({ links }: { links: ProjectLinksFile | null }) {
  if (!links || links.groups.length === 0) {
    return (
      <Section title="Links">
        <p className="text-sm text-muted-foreground italic">
          Geen project-links.md (of het bestand bevat geen secties).
        </p>
      </Section>
    );
  }
  return (
    <Section title="Links">
      <div className="space-y-4">
        {links.groups.map((g) => (
          <div key={g.heading}>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              {g.heading}
            </h3>
            {g.links.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                geen items
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {g.links.map((l, i) => (
                  <li key={i} className="flex items-baseline gap-2">
                    <span className="text-muted-foreground min-w-0 max-w-[40%] truncate">
                      {l.label}
                    </span>
                    {l.url ? (
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:underline font-mono text-xs truncate"
                      >
                        {l.url}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        geen url
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
