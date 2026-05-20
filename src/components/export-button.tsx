"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useUnifiedAction } from "@/lib/io/use-unified-action";
import { cn } from "@/lib/utils";

export type ExportActionState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export type ExportAction = (
  prev: ExportActionState,
  formData: FormData,
) => Promise<ExportActionState>;

/**
 * Generic export button + status banner. Both web (server action) and Tauri
 * (client function) variants are passed; the runtime decides at call time.
 * Hidden fields are inlined into the form so each handler can read them.
 */
export function ExportButton({
  webAction,
  tauriAction,
  label,
  pendingLabel = "Exporteren…",
  hiddenFields = {},
  className,
}: {
  webAction: ExportAction;
  tauriAction: ExportAction;
  label: string;
  pendingLabel?: string;
  hiddenFields?: Record<string, string>;
  className?: string;
}) {
  const dispatch = useUnifiedAction<ExportActionState>(webAction, tauriAction);
  const [state, run] = useActionState<ExportActionState, FormData>(dispatch, {});

  return (
    <div className="space-y-2">
      <form action={run} className="inline-flex">
        {Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <SubmitButton
          label={label}
          pendingLabel={pendingLabel}
          className={className}
        />
      </form>
      {state.error ? (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-1.5">
          {state.error}
        </div>
      ) : null}
      {state.saved ? (
        <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5">
          Opgeslagen in{" "}
          <code className="font-mono">{state.saved.relativeToRoot}</code>
        </div>
      ) : null}
    </div>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
