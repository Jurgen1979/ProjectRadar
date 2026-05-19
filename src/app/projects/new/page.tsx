import { getConfigStatus } from "@/lib/config";
import { NoRootState } from "@/components/projects/empty-state";
import { NewProjectForm } from "./form";

export default function NewProjectPage() {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") {
    return <NoRootState message={cfg.message} />;
  }
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">projecten / nieuw</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nieuw project</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Maakt een projectmap aan in{" "}
          <code className="font-mono">{cfg.root}/projects/</code> met
          standaard markdown- en JSON-bestanden. Bestaande mappen worden
          nooit overschreven.
        </p>
      </header>
      <NewProjectForm />
    </div>
  );
}
