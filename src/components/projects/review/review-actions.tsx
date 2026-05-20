"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  generateAiReviewAction,
  type AiReviewState,
} from "@/app/review/actions";
import { exportReviewAction } from "@/app/review/export-actions";
import { ExportButton } from "@/components/export-button";
import { renderReviewMarkdown } from "@/lib/export/review-md";
import type { ReviewData } from "@/lib/projects/review";
import { MarkdownBlocks } from "@/components/projects/detail/blocks";
import { cn } from "@/lib/utils";

export function ReviewActions({
  data,
  aiEnabled,
  aiReason,
}: {
  data: ReviewData;
  aiEnabled: boolean;
  aiReason: string | null;
}) {
  const [state, action] = useActionState<AiReviewState, FormData>(
    generateAiReviewAction,
    {},
  );
  const [copied, setCopied] = useState(false);

  function copyMarkdown() {
    const md = renderReviewMarkdown({
      data,
      generatedAt: new Date(),
      aiText: state.text ?? null,
    });
    void navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        {aiEnabled ? (
          <form action={action}>
            <GenerateAiButton hasText={!!state.text} />
          </form>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded px-3 py-1.5">
            AI-review uit — {aiReason}
          </div>
        )}
        <button
          type="button"
          onClick={copyMarkdown}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted"
        >
          {copied ? "Gekopieerd ✓" : "Kopieer als markdown"}
        </button>
        <ExportButton
          action={exportReviewAction}
          label="Exporteer naar /exports"
          pendingLabel="Exporteren…"
          hiddenFields={{ aiText: state.text ?? "" }}
        />
      </div>

      {state.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      {state.text ? (
        <section className="rounded-lg border border-border bg-background p-4 space-y-3">
          <header className="space-y-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              AI-review
            </h2>
            {state.truncationNote ? (
              <p className="text-xs text-amber-700">
                Niet alle projecten zijn meegenomen. {state.truncationNote}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Op basis van {state.projectsIncluded ?? "?"} actieve project(en).
              </p>
            )}
          </header>
          <MarkdownBlocks body={state.text} />
          {state.meta ? <MetaAccordion meta={state.meta} /> : null}
        </section>
      ) : null}
    </div>
  );
}

function GenerateAiButton({ hasText }: { hasText: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md bg-accent text-accent-foreground hover:opacity-90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {pending
        ? "Bezig…"
        : hasText
          ? "Opnieuw genereren"
          : "AI-review genereren"}
    </button>
  );
}

function MetaAccordion({ meta }: { meta: NonNullable<AiReviewState["meta"]> }) {
  return (
    <details className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground select-none">
        AI-info · {meta.model} · {meta.durationMs}ms
        {meta.inputTokens !== null ? ` · ${meta.inputTokens} in` : ""}
        {meta.outputTokens !== null ? ` / ${meta.outputTokens} out` : ""}
      </summary>
      <dl className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1 mt-2 font-mono text-[11px]">
        <dt className="text-muted-foreground">provider</dt>
        <dd>{meta.provider}</dd>
        <dt className="text-muted-foreground">model</dt>
        <dd>{meta.model}</dd>
        <dt className="text-muted-foreground">duur</dt>
        <dd>{meta.durationMs} ms</dd>
        <dt className="text-muted-foreground">input tokens</dt>
        <dd>{meta.inputTokens ?? "—"}</dd>
        <dt className="text-muted-foreground">output tokens</dt>
        <dd>{meta.outputTokens ?? "—"}</dd>
        <dt className="text-muted-foreground">prompt chars (~)</dt>
        <dd>{meta.promptCharsApprox}</dd>
      </dl>
    </details>
  );
}
