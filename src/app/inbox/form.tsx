"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inboxSaveAction, type InboxFormState } from "./actions";
import { Field, FormStyles, SubmitButton } from "@/components/form-fields";

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

export type ProjectChoice = {
  slug: string;
  name: string;
  status: string;
};

export function InboxForm({
  projects,
  defaultSlug,
  today,
}: {
  projects: ProjectChoice[];
  defaultSlug: string | null;
  today: string;
}) {
  const [state, action] = useActionState<InboxFormState, FormData>(
    inboxSaveAction,
    {},
  );

  const initial = state.values ?? {
    slug: defaultSlug ?? "",
    bron: "ChatGPT",
    datum: today,
    title: "",
    body: "",
    raw: false,
  };

  const savedProject = state.saved
    ? projects.find((p) => p.slug === state.saved!.slug)
    : null;

  return (
    <form action={action} className="space-y-5 max-w-3xl">
      <FormStyles />

      {state.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      {state.saved && savedProject ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-baseline justify-between gap-3 flex-wrap">
          <span>
            Opgeslagen in{" "}
            <strong className="font-semibold">{savedProject.name}</strong>{" "}
            <span className="font-mono text-xs text-emerald-800">
              · {state.saved.filename}
            </span>
          </span>
          <Link
            href={`/projects/${state.saved.slug}`}
            className="text-xs underline hover:no-underline"
          >
            open project →
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-4">
        <Field label="Project">
          <select
            name="slug"
            required
            defaultValue={initial.slug}
            className="pr-input"
          >
            <option value="">-- kies project --</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
                {p.status !== "active" ? ` · ${p.status}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bron">
          <input
            name="bron"
            list="inbox-bron"
            defaultValue={initial.bron}
            className="pr-input"
          />
          <datalist id="inbox-bron">
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
            className="pr-input font-mono"
          />
        </Field>
      </div>

      <Field label="Titel" hint="optioneel — leeg = inbox">
        <input
          name="title"
          defaultValue={initial.title}
          placeholder="bv. logo-richting"
          className="pr-input"
        />
      </Field>

      <Field label="Inhoud" hint="plak je AI-output of typ je notitie">
        <textarea
          name="body"
          required
          rows={14}
          defaultValue={initial.body}
          className="pr-input font-mono leading-relaxed"
          placeholder={`Plak hier de output van je AI-sessie.\n\nTip: gebruik eerst de "einde-van-chat updateprompt" (zie /templates).`}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="raw" defaultChecked={initial.raw} />
        <span>Bewaar als ruwe update (sla template-secties over)</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitInner />
        <p className="text-xs text-muted-foreground">
          Schrijft een markdownfile in <code className="font-mono">/projects/&lt;slug&gt;/updates/</code> en bumpt{" "}
          <code className="font-mono">lastUpdated</code>.
        </p>
      </div>
    </form>
  );
}

function SubmitInner() {
  const { pending } = useFormStatus();
  return (
    <SubmitButton
      pending={pending}
      label="Opslaan als update"
      pendingLabel="Opslaan…"
    />
  );
}
