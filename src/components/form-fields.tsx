"use client";

import { cn } from "@/lib/utils";

export function Field({
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

export function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: readonly string[];
}) {
  return (
    <select name={name} defaultValue={defaultValue} className="pr-input">
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-4 py-2 text-sm rounded-md bg-accent text-accent-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {pending ? (pendingLabel ?? "Bezig…") : label}
    </button>
  );
}

/** Shared input styles used by the form fields above. Add to any page that uses Field. */
export function FormStyles() {
  return (
    <style>{`
      .pr-input {
        width: 100%;
        padding: 0.4rem 0.6rem;
        font-size: 0.875rem;
        border-radius: 0.375rem;
        border: 1px solid var(--border);
        background: var(--background);
      }
      .pr-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.15); }
      textarea.pr-input { resize: vertical; }
    `}</style>
  );
}
