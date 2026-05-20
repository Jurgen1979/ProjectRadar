"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { seedDemoAction, type SeedDemoState } from "@/app/projects/seed-demo/actions";
import { useUnifiedAction } from "@/lib/io/use-unified-action";
import { seedDemoTauri } from "@/lib/tauri-handlers/projects";
import { cn } from "@/lib/utils";

type State = SeedDemoState & { redirectSlug?: string };

export function SeedDemoButton() {
  const router = useRouter();
  const dispatch = useUnifiedAction<State>(seedDemoAction, seedDemoTauri);
  const [state, action] = useActionState<State, FormData>(dispatch, {});

  useEffect(() => {
    if (state.redirectSlug) router.push(`/projects/${state.redirectSlug}`);
  }, [state.redirectSlug, router]);

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
