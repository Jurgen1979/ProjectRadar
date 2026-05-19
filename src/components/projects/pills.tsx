import { cn } from "@/lib/utils";
import type { ProjectStatus, RiskLevel, WaitingOn } from "@/lib/schema/enums";
import { SIGNAL_LABELS, type Signal } from "@/lib/projects/signals";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  paused: "bg-amber-50 text-amber-800 border-amber-200",
  waiting: "bg-sky-50 text-sky-800 border-sky-200",
  done: "bg-zinc-100 text-zinc-700 border-zinc-200",
  archived: "bg-stone-100 text-stone-600 border-stone-200",
  idea: "bg-violet-50 text-violet-800 border-violet-200",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "actief",
  paused: "gepauzeerd",
  waiting: "wachtend",
  done: "klaar",
  archived: "gearchiveerd",
  idea: "idee",
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const RISK_STYLES: Record<RiskLevel, string> = {
  none: "text-zinc-400",
  low: "text-emerald-700",
  medium: "text-amber-700",
  high: "text-red-700",
  unclear: "text-zinc-500",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  none: "geen risico",
  low: "laag risico",
  medium: "midden risico",
  high: "hoog risico",
  unclear: "onduidelijk risico",
};

const RISK_DOTS: Record<RiskLevel, string> = {
  none: "bg-zinc-300",
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
  unclear: "bg-zinc-400",
};

export function RiskIndicator({ level }: { level: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        RISK_STYLES[level],
      )}
      title={RISK_LABELS[level]}
    >
      <span className={cn("inline-block size-2 rounded-full", RISK_DOTS[level])} />
      {RISK_LABELS[level]}
    </span>
  );
}

const WAITING_LABELS: Record<WaitingOn, string> = {
  me: "wacht op mij",
  client: "wacht op klant",
  "third-party": "wacht op derde",
  none: "wacht op niets",
  unclear: "wacht-op onduidelijk",
};

export function WaitingPill({ waitingOn }: { waitingOn: WaitingOn }) {
  if (waitingOn === "none") return null;
  const tone =
    waitingOn === "me"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : waitingOn === "client"
        ? "bg-purple-50 text-purple-800 border-purple-200"
        : waitingOn === "third-party"
          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
          : "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border",
        tone,
      )}
    >
      {WAITING_LABELS[waitingOn]}
    </span>
  );
}

const SIGNAL_STYLES: Record<Signal, string> = {
  stale: "bg-amber-50 text-amber-800 border-amber-200",
  "missing-next-action": "bg-red-50 text-red-800 border-red-200",
  "waiting-on-me": "bg-blue-50 text-blue-800 border-blue-200",
  "waiting-on-client": "bg-purple-50 text-purple-800 border-purple-200",
  "high-risk": "bg-red-50 text-red-800 border-red-200",
  unclear: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function SignalPill({ signal }: { signal: Signal }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border",
        SIGNAL_STYLES[signal],
      )}
    >
      {SIGNAL_LABELS[signal]}
    </span>
  );
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] rounded bg-muted text-muted-foreground font-mono">
      {tag}
    </span>
  );
}
