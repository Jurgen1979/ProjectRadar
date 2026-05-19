"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveStatusAction,
  generateStatusAction,
  type ApproveState,
  type GenerateState,
} from "./actions";
import { cn } from "@/lib/utils";

export function StatusGeneratorForm({
  slug,
  currentStatus,
  aiEnabled,
  aiReason,
  provider,
  model,
  baseURL,
}: {
  slug: string;
  currentStatus: string | null;
  aiEnabled: boolean;
  aiReason: string | null;
  provider: string;
  model: string;
  baseURL: string | null;
}) {
  const genAction = generateStatusAction.bind(null, slug);
  const approveAction = approveStatusAction.bind(null, slug);
  const [genState, runGenerate] = useActionState<GenerateState, FormData>(
    genAction,
    {},
  );
  const [approveState, runApprove] = useActionState<ApproveState, FormData>(
    approveAction,
    {},
  );
  const [editable, setEditable] = useState<string | null>(null);

  const proposal = editable ?? genState.proposal ?? null;

  if (!aiEnabled) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 max-w-2xl space-y-3">
        <h2 className="text-base font-semibold text-amber-900">
          AI staat uit
        </h2>
        <p className="text-sm text-amber-900">{aiReason}</p>
        <p className="text-xs text-amber-900/80">
          Pas <code className="font-mono">.env.local</code> aan en herstart de
          dev-server. Zonder AI kun je <code className="font-mono">project-status.md</code>{" "}
          direct in je editor bewerken.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
        <span>provider: {provider}</span>
        <span className="mx-2">·</span>
        <span>model: {model}</span>
        {baseURL ? (
          <>
            <span className="mx-2">·</span>
            <span className="break-all">baseURL: {baseURL}</span>
          </>
        ) : null}
      </div>

      {genState.error ? (
        <ErrorBanner message={genState.error} />
      ) : null}
      {approveState.error ? (
        <ErrorBanner message={approveState.error} />
      ) : null}

      {proposal === null ? (
        <form action={runGenerate} className="space-y-3">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Genereert een nieuwe <code className="font-mono">project-status.md</code>{" "}
            op basis van metadata, huidige status, log, beslissingen en de
            laatste updates. Niets wordt geschreven tot je het voorstel
            goedkeurt.
          </p>
          <GenerateButton />
        </form>
      ) : (
        <ProposalView
          slug={slug}
          currentStatus={currentStatus}
          proposal={proposal}
          truncationNote={genState.truncationNote ?? null}
          meta={genState.meta}
          onEdit={(v) => setEditable(v)}
          regenerateAction={runGenerate}
          approveAction={runApprove}
        />
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
      {message}
    </div>
  );
}

function ProposalView({
  slug,
  currentStatus,
  proposal,
  truncationNote,
  meta,
  onEdit,
  regenerateAction,
  approveAction,
}: {
  slug: string;
  currentStatus: string | null;
  proposal: string;
  truncationNote: string | null;
  meta: GenerateState["meta"];
  onEdit: (v: string) => void;
  regenerateAction: (formData: FormData) => void;
  approveAction: (formData: FormData) => void;
}) {
  return (
    <div className="space-y-4">
      {truncationNote ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Niet alle updates zijn meegenomen. {truncationNote}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Side label="Huidige status" subtitle="project-status.md">
          {currentStatus ? (
            <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
              {currentStatus}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Er was nog geen status. Het voorstel wordt straks de eerste versie.
            </p>
          )}
        </Side>

        <Side label="Voorgesteld" subtitle="bewerkbaar voordat je goedkeurt">
          <textarea
            value={proposal}
            onChange={(e) => onEdit(e.target.value)}
            rows={Math.min(40, Math.max(20, proposal.split("\n").length + 2))}
            className="w-full text-xs font-mono leading-relaxed bg-background border border-border rounded p-2 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </Side>
      </div>

      {meta ? <MetaAccordion meta={meta} /> : null}

      <div className="flex items-center gap-3 flex-wrap">
        <form action={approveAction} className="contents">
          <input type="hidden" name="proposal" value={proposal} />
          <ApproveButton />
        </form>
        <form action={regenerateAction} className="contents">
          <RegenerateButton />
        </form>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(proposal);
          }}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted"
        >
          Kopieer naar klembord
        </button>
        <Link
          href={`/projects/${slug}`}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Annuleren
        </Link>
      </div>
    </div>
  );
}

function Side({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <header>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <p className="text-[11px] text-muted-foreground/80">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

function MetaAccordion({ meta }: { meta: NonNullable<GenerateState["meta"]> }) {
  return (
    <details className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground select-none">
        AI-info · {meta.model} · {Math.round(meta.durationMs)}ms
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
        <dt className="text-muted-foreground">updates included</dt>
        <dd>{meta.updatesIncluded}</dd>
        {meta.updatesDropped.length > 0 ? (
          <>
            <dt className="text-muted-foreground">dropped</dt>
            <dd>{meta.updatesDropped.join(", ")}</dd>
          </>
        ) : null}
        {meta.updatesTruncated.length > 0 ? (
          <>
            <dt className="text-muted-foreground">truncated</dt>
            <dd>{meta.updatesTruncated.join(", ")}</dd>
          </>
        ) : null}
      </dl>
    </details>
  );
}

function GenerateButton() {
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
      {pending ? "Bezig met genereren…" : "Genereer nieuwe status"}
    </button>
  );
}

function RegenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted",
        "disabled:opacity-50",
      )}
    >
      {pending ? "Opnieuw genereren…" : "Opnieuw genereren"}
    </button>
  );
}

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {pending ? "Opslaan…" : "Goedkeuren en overschrijven"}
    </button>
  );
}
