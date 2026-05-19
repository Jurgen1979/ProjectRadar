import { Placeholder } from "@/components/placeholder";
import { getConfigStatus } from "@/lib/config";

export default function ProjectsPage() {
  const status = getConfigStatus();
  const rootInfo =
    status.kind === "ok"
      ? `Projectroot actief: ${status.root}`
      : "Geen actieve projectroot. Stel PROJECTRADAR_ROOT in via .env.local.";

  return (
    <div className="space-y-6">
      <Placeholder
        title="Projecten"
        description="Het dashboard met alle projectkaarten, filters en signalen. In fase 0 nog leeg — eerst configuratie en helpers, daarna parsing en dashboard."
        next="Fase 1 — markdown/JSON parsers en projecten uitlezen."
      />
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground font-mono">
        {rootInfo}
      </div>
    </div>
  );
}
