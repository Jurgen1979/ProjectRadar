"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createProjectAction, type CreateProjectFormState } from "./actions";
import { cn } from "@/lib/utils";

const STATUSES = ["active", "paused", "waiting", "done", "archived", "idea"];
const WAITING = ["me", "client", "third-party", "none", "unclear"];
const RISKS = ["none", "low", "medium", "high", "unclear"];
const PRIORITIES = ["low", "medium", "high"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function NewProjectForm() {
  const [state, action] = useActionState<CreateProjectFormState, FormData>(
    createProjectAction,
    {},
  );

  const initial = state.values ?? {
    name: "",
    slug: "",
    client: "intern",
    type: "project",
    status: "active",
    phase: "",
    priority: "medium",
    waitingOn: "unclear",
    nextAction: "",
    riskLevel: "unclear",
    tags: "",
  };

  const [name, setName] = useState(initial.name);
  const [slugTouched, setSlugTouched] = useState(initial.slug !== slugify(initial.name));
  const [slug, setSlug] = useState(initial.slug || slugify(initial.name));

  function onName(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  return (
    <form action={action} className="space-y-5 max-w-2xl">
      {state.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      <Field label="Naam" hint="vrije tekst" error={state.field === "name" ? state.error : null}>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => onName(e.target.value)}
          className="input"
        />
      </Field>

      <Field
        label="Slug"
        hint="lowercase, cijfers en streepjes — bepaalt de mapnaam"
        error={state.field === "slug" ? state.error : null}
      >
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="input font-mono"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Klant / intern">
          <input name="client" defaultValue={initial.client} className="input" />
        </Field>
        <Field label="Type" hint="bv. product, klant, onderzoek">
          <input name="type" defaultValue={initial.type} className="input" />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={initial.status} options={STATUSES} />
        </Field>
        <Field label="Fase" hint="vrije tekst">
          <input name="phase" defaultValue={initial.phase} className="input" />
        </Field>
        <Field label="Prioriteit">
          <Select name="priority" defaultValue={initial.priority} options={PRIORITIES} />
        </Field>
        <Field label="Wacht op">
          <Select name="waitingOn" defaultValue={initial.waitingOn} options={WAITING} />
        </Field>
        <Field label="Risico">
          <Select name="riskLevel" defaultValue={initial.riskLevel} options={RISKS} />
        </Field>
        <Field label="Tags" hint="komma-gescheiden">
          <input name="tags" defaultValue={initial.tags} className="input" />
        </Field>
      </div>

      <Field label="Eerste volgende actie" hint="optioneel">
        <input name="nextAction" defaultValue={initial.nextAction} className="input" />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <p className="text-xs text-muted-foreground">
          Maakt project.meta.json + alle standaard markdownfiles in{" "}
          <code className="font-mono">/projects/{slug || "slug"}/</code>.
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
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
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
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </label>
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <select name={name} defaultValue={defaultValue} className="input">
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
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
      {pending ? "Aanmaken…" : "Project aanmaken"}
    </button>
  );
}
