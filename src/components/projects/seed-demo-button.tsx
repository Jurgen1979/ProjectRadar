"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { seedDemoAction, type SeedDemoState } from "@/app/projects/seed-demo/actions";
import { cn } from "@/lib/utils";

export function SeedDemoButton() {
  const [state, action] = useActionState<SeedDemoState, FormData>(
    seedDemoAction,
    {},
  );
  return (
    <form action={action} className="contents">
      <SubmitInner />
      {state.error ? (
        <span className="text-xs text-red-700 ml-2">{state.error}</span>
      ) : null}
    </form>
  );
}

function SubmitInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {pending ? "Kopiëren…" : "of: gebruik voorbeeldproject"}
    </button>
  );
}
