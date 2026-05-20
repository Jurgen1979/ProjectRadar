"use client";

import { useState } from "react";
import { useAppConfig } from "@/components/app-config-provider";
import {
  deriveAiStatus,
  maskApiKey,
  type AppConfig,
} from "@/lib/io/app-config";
import { pickFolder } from "@/lib/io/folder-picker";
import { testAiConnection } from "@/lib/ai/test-connection";
import { cn } from "@/lib/utils";

const PROVIDERS = ["none", "openrouter", "openai"] as const;

export function TauriSettings() {
  const { config, patchConfig, loading } = useAppConfig();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [pickingRoot, setPickingRoot] = useState(false);
  const [savingMsg, setSavingMsg] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-muted-foreground">Laden…</p>;

  const ai = deriveAiStatus(config);

  async function changeRoot() {
    setPickingRoot(true);
    setSavingMsg(null);
    try {
      const r = await pickFolder({ title: "Kies projectroot" });
      if (r.ok) {
        await patchConfig({ projectRoot: r.path });
        setSavingMsg("Projectroot bijgewerkt.");
      }
    } finally {
      setPickingRoot(false);
    }
  }

  async function saveAi(form: FormData) {
    setSavingMsg(null);
    setTestResult(null);
    const provider = String(form.get("provider") ?? "none") as AppConfig["ai"]["provider"];
    const model = String(form.get("model") ?? "").trim();
    const apiKeyRaw = String(form.get("apiKey") ?? "");
    // Only update key if user actually typed something new.
    const newKey = apiKeyRaw.startsWith("•") ? config.ai.apiKey : apiKeyRaw;
    await patchConfig({
      ai: {
        provider,
        model,
        apiKey: newKey,
        openRouterReferer: String(form.get("openRouterReferer") ?? "").trim() || undefined,
        openRouterTitle: String(form.get("openRouterTitle") ?? "").trim() || undefined,
        baseUrlOverride: String(form.get("baseUrlOverride") ?? "").trim() || undefined,
      },
    });
    setSavingMsg("Instellingen opgeslagen.");
  }

  async function runTest() {
    if (!ai.enabled) {
      setTestResult(`Kan niet testen: ${ai.reason}`);
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const r = await testAiConnection(ai.ai);
      if (r.ok) {
        setTestResult(`OK in ${r.durationMs}ms — model antwoordde "${r.sample}".`);
      } else {
        setTestResult(`Mislukt: ${r.message}`);
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-8">
      {savingMsg ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {savingMsg}
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-background p-4 space-y-3">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Projectroot
          </h2>
        </header>
        <p className="text-sm font-mono break-all">
          {config.projectRoot ?? "(niet ingesteld)"}
        </p>
        <button
          type="button"
          disabled={pickingRoot}
          onClick={changeRoot}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
        >
          {pickingRoot ? "Bezig…" : "Wijzig projectroot…"}
        </button>
      </section>

      <section className="rounded-lg border border-border bg-background p-4 space-y-4">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            AI
          </h2>
          <p className="text-xs text-muted-foreground">
            Optioneel. De app blijft zonder AI-key volledig bruikbaar.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveAi(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <Field label="Provider">
            <select name="provider" defaultValue={config.ai.provider} className="pr-input">
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p === "none" ? "uit (geen AI)" : p}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Model"
            hint="bv. anthropic/claude-sonnet-4-6 (OpenRouter) of gpt-4o-mini (OpenAI)"
          >
            <input name="model" defaultValue={config.ai.model} className="pr-input font-mono" />
          </Field>

          <Field label="API key">
            <div className="flex gap-2">
              <input
                name="apiKey"
                type={showKey ? "text" : "password"}
                defaultValue={config.ai.apiKey ? maskApiKey(config.ai.apiKey) : ""}
                className="pr-input font-mono flex-1"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="px-3 text-xs rounded-md border border-border bg-background hover:bg-muted"
              >
                {showKey ? "verberg" : "toon"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Maskering toont de laatste 4 tekens. Voer alleen een nieuwe waarde in om de key te wijzigen.
            </p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="HTTP-Referer (OpenRouter)"
              hint="optioneel — komt in je OpenRouter-dashboard"
            >
              <input
                name="openRouterReferer"
                defaultValue={config.ai.openRouterReferer ?? ""}
                className="pr-input font-mono"
                placeholder="https://projectradar.local"
              />
            </Field>
            <Field
              label="X-Title (OpenRouter)"
              hint="optioneel — verschijnt in je OpenRouter-dashboard"
            >
              <input
                name="openRouterTitle"
                defaultValue={config.ai.openRouterTitle ?? ""}
                className="pr-input"
                placeholder="Projectradar Desktop"
              />
            </Field>
          </div>

          <Field label="Base URL override" hint="zelden nodig — alleen voor eigen proxies">
            <input
              name="baseUrlOverride"
              defaultValue={config.ai.baseUrlOverride ?? ""}
              className="pr-input font-mono"
              placeholder={ai.enabled ? ai.ai.baseURL : ""}
            />
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-accent text-accent-foreground hover:opacity-90"
            >
              Opslaan
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={runTest}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted",
                "disabled:opacity-50",
              )}
            >
              {testing ? "Testen…" : "Test verbinding"}
            </button>
            <span className="text-xs text-muted-foreground">
              status:{" "}
              {ai.enabled ? (
                <span className="text-emerald-700">ingeschakeld</span>
              ) : (
                <span className="text-amber-700">{ai.reason}</span>
              )}
            </span>
          </div>

          {testResult ? (
            <div className="text-sm rounded-md border border-border bg-muted/30 px-3 py-2 font-mono">
              {testResult}
            </div>
          ) : null}
        </form>
      </section>

      <style>{`
        .pr-input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--background);
        }
        .pr-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
