import { getConfigStatus } from "@/lib/config";
import { NoRootState } from "@/components/projects/empty-state";
import { TauriOnly, WebOnly } from "@/components/web-only";
import { NewProjectForm } from "./form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">projecten / nieuw</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nieuw project</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Maakt een projectmap aan met standaard markdown- en JSON-bestanden.
          Bestaande mappen worden nooit overschreven.
        </p>
      </header>
      <TauriOnly>
        <NewProjectForm />
      </TauriOnly>
      <WebOnly>
        <WebView />
      </WebOnly>
    </div>
  );
}

function WebView() {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") {
    return <NoRootState message={cfg.message} />;
  }
  return <NewProjectForm />;
}
