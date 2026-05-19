import type { ProjectWarning } from "@/types/project";

const STYLE: Record<ProjectWarning["level"], string> = {
  info: "border-zinc-300 bg-zinc-50 text-zinc-700",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

export function WarningsBanner({ warnings }: { warnings: ProjectWarning[] }) {
  if (warnings.length === 0) return null;
  // Sort: errors > warnings > info
  const order: Record<ProjectWarning["level"], number> = { error: 0, warning: 1, info: 2 };
  const sorted = [...warnings].sort((a, b) => order[a.level] - order[b.level]);
  const worst = sorted[0].level;
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${STYLE[worst]}`}>
      <strong className="font-semibold capitalize">
        {worst === "error" ? "fout" : worst === "warning" ? "waarschuwing" : "info"}
      </strong>
      <ul className="mt-1 space-y-0.5 text-xs">
        {sorted.map((w, i) => (
          <li key={i}>
            <span className="font-mono">{w.file}</span>: {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
