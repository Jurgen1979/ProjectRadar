"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  recoverFileAction,
  recoverFoldersAction,
  type RecoverActionState,
} from "@/app/projects/[slug]/recover/actions";
import {
  recoverFileTauri,
  recoverFoldersTauri,
} from "@/lib/tauri-handlers/projects";
import { useUnifiedAction } from "@/lib/io/use-unified-action";
import { cn } from "@/lib/utils";

export type RecoveryItem = {
  file: string;
  preview: string;
};

export function RecoveryPanel({
  slug,
  files,
  folders,
}: {
  slug: string;
  files: RecoveryItem[];
  folders: string[];
}) {
  if (files.length === 0 && folders.length === 0) return null;

  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
          Herstel ontbrekende onderdelen
        </h2>
        <p className="text-xs text-amber-900/80 mt-1">
          Geen automatische actie — kies per onderdeel of je het wilt aanmaken.
          Bestaande bestanden worden nooit overschreven.
        </p>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((f) => (
            <FilePreview key={f.file} slug={slug} file={f.file} preview={f.preview} />
          ))}
        </div>
      ) : null}

      {folders.length > 0 ? (
        <FolderRecovery slug={slug} folders={folders} />
      ) : null}
    </section>
  );
}

function FilePreview({
  slug,
  file,
  preview,
}: {
  slug: string;
  file: string;
  preview: string;
}) {
  const dispatch = useUnifiedAction<RecoverActionState>(
    recoverFileAction.bind(null, slug),
    recoverFileTauri.bind(null, slug),
  );
  const [state, action] = useActionState<RecoverActionState, FormData>(dispatch, {});
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-amber-200 bg-background p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="font-mono text-sm">{file}</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {open ? "verberg preview" : "toon preview"}
        </button>
      </div>
      {open ? (
        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap bg-muted/40 rounded p-2 max-h-64 overflow-y-auto font-mono">
          {preview}
        </pre>
      ) : null}
      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="file" value={file} />
        <RecoverSubmit label={`Maak ${file} aan`} />
        <ActionMessage state={state} />
      </form>
    </div>
  );
}

function FolderRecovery({ slug, folders }: { slug: string; folders: string[] }) {
  const dispatch = useUnifiedAction<RecoverActionState>(
    recoverFoldersAction.bind(null, slug),
    recoverFoldersTauri.bind(null, slug),
  );
  const [state, action] = useActionState<RecoverActionState, FormData>(dispatch, {});

  return (
    <div className="rounded border border-amber-200 bg-background p-3 space-y-2">
      <div className="text-sm">
        Ontbrekende mappen:{" "}
        <span className="font-mono">{folders.join(", ")}</span>
      </div>
      <form action={action} className="flex items-center gap-3">
        <RecoverSubmit label="Maak ontbrekende mappen aan" />
        <ActionMessage state={state} />
      </form>
    </div>
  );
}

function RecoverSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-3 py-1.5 text-xs rounded-md bg-accent text-accent-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {pending ? "Aanmaken…" : label}
    </button>
  );
}

function ActionMessage({ state }: { state: RecoverActionState }) {
  if (!state.message) return null;
  return (
    <span
      className={cn(
        "text-xs",
        state.error ? "text-red-700" : "text-emerald-700",
      )}
    >
      {state.message}
    </span>
  );
}
