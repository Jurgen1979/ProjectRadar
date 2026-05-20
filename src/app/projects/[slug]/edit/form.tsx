"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { editMetaAction, type EditMetaFormState } from "./actions";
import { useUnifiedAction } from "@/lib/io/use-unified-action";
import { editMetaTauri } from "@/lib/tauri-handlers/projects";
import { Field, FormStyles, Select, SubmitButton } from "@/components/form-fields";
import type { ProjectMeta } from "@/lib/schema/meta";

type FormState = EditMetaFormState & { redirectSlug?: string };

const STATUSES = ["active", "paused", "waiting", "done", "archived", "idea"] as const;
const WAITING = ["me", "client", "third-party", "none", "unclear"] as const;
const RISKS = ["none", "low", "medium", "high", "unclear"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

export function EditMetaForm({ slug, meta }: { slug: string; meta: ProjectMeta }) {
  const router = useRouter();
  const boundWeb = editMetaAction.bind(null, slug);
  const boundTauri = editMetaTauri.bind(null, slug);
  const dispatch = useUnifiedAction<FormState>(boundWeb, boundTauri);
  const [state, action] = useActionState<FormState, FormData>(dispatch, {});

  useEffect(() => {
    if (state.redirectSlug) router.push(`/projects/${state.redirectSlug}`);
  }, [state.redirectSlug, router]);

  const initial = state.values ?? {
    name: meta.name,
    client: meta.client,
    type: meta.type,
    status: meta.status,
    phase: meta.phase,
    priority: meta.priority,
    waitingOn: meta.waitingOn,
    nextAction: meta.nextAction,
    riskLevel: meta.riskLevel,
    tags: meta.tags.join(", "),
  };

  return (
    <form action={action} className="space-y-5 max-w-2xl">
      <FormStyles />
      {state.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      <Field label="Naam" error={state.field === "name" ? state.error : null}>
        <input name="name" required defaultValue={initial.name} className="pr-input" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Klant / intern">
          <input name="client" defaultValue={initial.client} className="pr-input" />
        </Field>
        <Field label="Type" hint="bv. product, klant, onderzoek">
          <input name="type" defaultValue={initial.type} className="pr-input" />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={initial.status} options={STATUSES} />
        </Field>
        <Field label="Fase" hint="vrije tekst">
          <input name="phase" defaultValue={initial.phase} className="pr-input" />
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
          <input name="tags" defaultValue={initial.tags} className="pr-input" />
        </Field>
      </div>

      <Field label="Volgende actie">
        <input
          name="nextAction"
          defaultValue={initial.nextAction}
          className="pr-input"
        />
      </Field>

      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <div className="font-mono">id: {meta.id}</div>
        <div className="font-mono">createdAt: {meta.createdAt ?? "—"}</div>
        <div className="font-mono">lastUpdated: {meta.lastUpdated ?? "—"}</div>
        <div className="mt-1">
          Worden behouden. <code className="font-mono">lastUpdated</code> wijzigt
          alleen wanneer je nieuwe updates toevoegt.
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SubmitInner />
      </div>
    </form>
  );
}

function SubmitInner() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending} label="Wijzigingen opslaan" pendingLabel="Opslaan…" />;
}
