import Link from "next/link";

export function NoRootState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 max-w-2xl space-y-3">
      <h2 className="text-lg font-semibold text-amber-900">Geen projectroot</h2>
      <p className="text-sm text-amber-900 leading-6">{message}</p>
      <ol className="text-sm text-amber-900 list-decimal pl-5 space-y-1">
        <li>
          Kopieer <code className="font-mono bg-amber-100 px-1 rounded">.env.local.example</code>
          {" "}naar <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code>.
        </li>
        <li>
          Zet <code className="font-mono bg-amber-100 px-1 rounded">PROJECTRADAR_ROOT</code>
          {" "}op het absolute pad van een (eventueel lege) map.
        </li>
        <li>
          Herstart de dev-server. Bekijk de actieve configuratie op{" "}
          <Link href="/settings" className="underline">
            /settings
          </Link>.
        </li>
      </ol>
    </div>
  );
}

export function NoProjectsState({ root }: { root: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Nog geen projecten</h2>
        <p className="text-sm text-muted-foreground leading-6 mt-1">
          De projectroot is leeg.
        </p>
        <p className="text-sm text-muted-foreground font-mono break-all mt-1">
          {root}/projects/
        </p>
      </div>
      <Link
        href="/projects/new"
        className="inline-block px-3 py-1.5 text-sm rounded-md bg-accent text-accent-foreground hover:opacity-90"
      >
        + eerste project aanmaken
      </Link>
    </div>
  );
}
