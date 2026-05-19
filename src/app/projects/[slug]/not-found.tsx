import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-muted-foreground font-mono">projecten / ?</p>
      <h1 className="text-2xl font-semibold tracking-tight">Project niet gevonden</h1>
      <p className="text-sm text-muted-foreground leading-6">
        Dit project bestaat niet of de slug bevat tekens die niet zijn toegelaten
        (alleen lowercase letters, cijfers en streepjes).
      </p>
      <Link
        href="/projects"
        className="inline-block text-sm text-foreground hover:underline"
      >
        ← terug naar projecten
      </Link>
    </div>
  );
}
