"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppConfig } from "@/components/app-config-provider";
import { pickFolder } from "@/lib/io/folder-picker";
import { cn } from "@/lib/utils";

export default function WelcomePage() {
  const { runtime, config, loading, patchConfig } = useAppConfig();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If somehow we get here in web mode (npm run dev without Tauri), just bounce.
  useEffect(() => {
    if (!loading && runtime === "web") {
      router.replace("/projects");
    }
  }, [loading, runtime, router]);

  // Already configured? Skip the welcome screen.
  useEffect(() => {
    if (!loading && runtime === "tauri" && config.projectRoot) {
      router.replace("/projects");
    }
  }, [loading, runtime, config.projectRoot, router]);

  async function chooseRoot(title: string) {
    setError(null);
    setBusy(true);
    try {
      const result = await pickFolder({ title });
      if (!result.ok) {
        if (!result.cancelled) {
          setError("Geen map gekozen.");
        }
        return;
      }
      await patchConfig({ projectRoot: result.path });
      router.replace("/projects");
    } catch (err) {
      setError(`Kon map niet opslaan: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
          Welkom
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Projectradar</h1>
        <p className="text-sm text-muted-foreground leading-6">
          Local-first projectdashboard. Je projectdata blijft als gewone
          markdown- en JSON-bestanden in een map die jij kiest. Geen cloud,
          geen login, geen database.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-background p-6 space-y-4">
        <h2 className="text-lg font-semibold">Kies een projectmap</h2>
        <p className="text-sm text-muted-foreground leading-6">
          Projectradar werkt met één <em>projectroot</em>-map. Daarin maakt de
          app een <code className="font-mono">/projects</code>-submap waar al
          je projecten in komen te staan. Je kunt deze map later weer
          aanpassen via Instellingen.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            primary
            disabled={busy}
            onClick={() => chooseRoot("Kies bestaande Projectradar-map")}
          >
            {busy ? "Bezig…" : "Kies bestaande Projectradar-map"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => chooseRoot("Maak nieuwe Projectradar-map")}
          >
            {busy ? "Bezig…" : "Maak nieuwe Projectradar-map"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: gebruik in de native dialoog de "Nieuwe map"-knop wanneer je
          op een lege locatie wilt starten.
        </p>

        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-6">
        <p>
          <strong className="text-foreground">AI is optioneel.</strong> Je kunt
          de app volledig zonder AI gebruiken. Wanneer je later AI wilt
          inschakelen (bv. om een statusvoorstel te genereren), open je{" "}
          <em>Instellingen</em> en voeg je een API-key toe voor OpenRouter of
          OpenAI.
        </p>
      </section>
    </div>
  );
}

function Button({
  children,
  primary,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm rounded-md transition-colors",
        primary
          ? "bg-accent text-accent-foreground hover:opacity-90"
          : "border border-border bg-background hover:bg-muted",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}
