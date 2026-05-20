"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { addUpdateAction, type AddUpdateFormState } from "./actions";
import { useUnifiedAction } from "@/lib/io/use-unified-action";
import { addUpdateTauri } from "@/lib/tauri-handlers/projects";
import { cn } from "@/lib/utils";

type FormState = AddUpdateFormState & { redirectSlug?: string };

const SOURCES = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Codex",
  "Replit",
  "Gmail",
  "Drive",
  "eigen notitie",
];

export function AddUpdateForm({
  slug,
  defaultDate,
}: {
  slug: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const boundWeb = addUpdateAction.bind(null, slug);
  const boundTauri = addUpdateTauri.bind(null, slug);
  const dispatch = useUnifiedAction<FormState>(boundWeb, boundTauri);
  const [state, action] = useActionState<FormState, FormData>(dispatch, {});

  useEffect(() => {
    if (state.redirectSlug) router.push(`/projects/${state.redirectSlug}`);
  }, [state.redirectSlug, router]);

  const initial = state.values ?? {
    title: "",
    bron: "ChatGPT",
    datum: defaultDate,
    body: "",
    raw: false,
  };

  return (
    <form action={action} className="space-y-5 max-w-3xl">
      {state.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      <Field label="Titel" hint="korte beschrijving">
        <input
          name="title"
          required
          defaultValue={initial.title}
          placeholder="bv. logo-richting"
          className="input"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Bron">
          <input
            name="bron"
            list="bron-suggesties"
            defaultValue={initial.bron}
            className="input"
          />
          <datalist id="bron-suggesties">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Datum" hint="YYYY-MM-DD">
          <input
            type="date"
            name="datum"
            required
            defaultValue={initial.datum}
            className="input font-mono"
          />
        </Field>
      </div>

      <Field
        label="Inhoud"
        hint="plak je AI-output of schrijf zelf"
      >
        <textarea
          name="body"
          required
          rows={14}
          defaultValue={initial.body}
          className="input font-mono leading-relaxed"
          placeholder={`Plak hier de output van je AI-sessie of typ je notitie.

Tip: laat AI eerst de "einde-van-chat updateprompt" gebruiken (zie /templates).`}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="raw" defaultChecked={initial.raw} />
        <span>Bewaar als ruwe update (sla template-secties over)</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <p className="text-xs text-muted-foreground">
          Schrijft een nieuw markdownbestand in{" "}
          <code className="font-mono">/projects/{slug}/updates/</code> en
          bumpt <code className="font-mono">lastUpdated</code> in de meta.
        </p>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--background);
        }
        .input:focus { outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.15); }
        textarea.input { resize: vertical; }
      `}</style>
    </form>
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-4 py-2 text-sm rounded-md bg-accent text-accent-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {pending ? "Opslaan…" : "Update opslaan"}
    </button>
  );
}
