import type { ProjectWarning } from "@/types/project";

export function BrokenProjectsList({
  broken,
  skipped,
}: {
  broken: Array<{ slug: string; dir: string; warnings: ProjectWarning[] }>;
  skipped: string[];
}) {
  if (broken.length === 0 && skipped.length === 0) return null;
  return (
    <section className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-red-900">
        Niet geladen ({broken.length + skipped.length})
      </h2>
      {broken.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {broken.map((b) => (
            <li key={b.slug} className="rounded border border-red-200 bg-background p-3">
              <div className="font-mono text-xs text-red-900 mb-1">{b.slug}</div>
              <div className="text-xs text-muted-foreground font-mono mb-1 break-all">
                {b.dir}
              </div>
              <ul className="text-xs text-red-900 space-y-0.5 list-disc pl-5">
                {b.warnings.map((w, i) => (
                  <li key={i}>
                    <span className="font-mono">{w.file}</span>: {w.message}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
      {skipped.length > 0 ? (
        <div className="text-xs text-red-900">
          <strong>Genegeerde mapnamen</strong> (niet slug-veilig):{" "}
          <span className="font-mono">{skipped.join(", ")}</span>
        </div>
      ) : null}
    </section>
  );
}
