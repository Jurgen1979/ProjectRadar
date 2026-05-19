import { getConfigStatus } from "@/lib/config";

export function ConfigBanner() {
  const status = getConfigStatus();
  if (status.kind === "ok") return null;

  const titleByKind = {
    "no-root": "Geen projectroot ingesteld",
    "root-missing": "Projectroot bestaat niet",
    "config-invalid": "projectradar.config.json is ongeldig",
  } as const;

  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900">
      <div className="mx-auto max-w-6xl px-6 py-3 text-sm">
        <strong className="font-semibold">{titleByKind[status.kind]} — </strong>
        <span>{status.message}</span>
      </div>
    </div>
  );
}
