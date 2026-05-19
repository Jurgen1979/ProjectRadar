import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { projectDir } from "@/lib/fs/paths";
import type { ProjectradarConfig } from "@/lib/schema/config";

/**
 * Conservative char budget for the assembled user prompt. ~80 000 chars is
 * roughly 20 000 tokens — safe for almost every modern chat model and well
 * inside OpenRouter's default per-request limit. The system prompt and the
 * model's reply land on top, so we leave headroom.
 */
const DEFAULT_PROMPT_CHAR_BUDGET = 80_000;

/** Fixed cost we reserve for the prompt structure, even before content. */
const FIXED_OVERHEAD = 2_000;

export type RawUpdate = {
  filename: string;
  body: string;
};

export type GatheredContext = {
  projectName: string;
  metaJson: string;
  status: string;
  log: string;
  decisions: string;
  updates: RawUpdate[];
  /** Updates that exist on disk but were dropped to stay inside the budget. */
  droppedUpdates: string[];
  /** Update bodies that were tail-trimmed to fit. */
  truncatedUpdates: string[];
  /** Human-readable summary if anything was cut — null when full input fit. */
  truncationNote: string | null;
};

async function readUtf8(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

type UpdateMeta = {
  filename: string;
  body: string;
  mtime: number;
  isoDate: string | null;
};

async function loadUpdates(dir: string): Promise<UpdateMeta[]> {
  const updatesDir = path.join(dir, "updates");
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(updatesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: UpdateMeta[] = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith(".md")) continue;
    const full = path.join(updatesDir, e.name);
    try {
      const [body, stat] = await Promise.all([
        fs.readFile(full, "utf8"),
        fs.stat(full),
      ]);
      const m = /^(\d{4}-\d{2}-\d{2})/.exec(e.name);
      out.push({ filename: e.name, body, mtime: stat.mtimeMs, isoDate: m?.[1] ?? null });
    } catch {
      /* skip unreadable */
    }
  }
  // Newest first by filename date, then by mtime.
  out.sort((a, b) => {
    if (a.isoDate && b.isoDate && a.isoDate !== b.isoDate)
      return b.isoDate.localeCompare(a.isoDate);
    if (a.isoDate && !b.isoDate) return -1;
    if (!a.isoDate && b.isoDate) return 1;
    return b.mtime - a.mtime;
  });
  return out;
}

function summary(parts: string[]): string | null {
  if (parts.length === 0) return null;
  return parts.join(" ");
}

export async function gatherStatusContext(
  root: string,
  slug: string,
  config: ProjectradarConfig,
): Promise<GatheredContext> {
  const dir = projectDir(root, slug);

  const [metaRaw, status, log, decisions, allUpdates] = await Promise.all([
    readUtf8(path.join(dir, "project.meta.json")),
    readUtf8(path.join(dir, "project-status.md")),
    readUtf8(path.join(dir, "project-log.md")),
    readUtf8(path.join(dir, "decision-log.md")),
    loadUpdates(dir),
  ]);

  if (metaRaw === null) {
    throw new Error("project.meta.json ontbreekt — kan geen status genereren.");
  }
  let projectName = slug;
  try {
    const parsed = JSON.parse(metaRaw) as { name?: string };
    if (parsed.name) projectName = parsed.name;
  } catch {
    /* keep slug as fallback */
  }

  // Honor maxUpdatesForStatusGeneration up front.
  const maxByConfig = Math.max(1, config.maxUpdatesForStatusGeneration);
  const considered = allUpdates.slice(0, maxByConfig);
  const droppedByConfig = allUpdates.slice(maxByConfig).map((u) => u.filename);

  // Build the budget around the fixed parts (meta + status + log + decisions).
  const fixedBytes =
    metaRaw.length +
    (status?.length ?? 0) +
    (log?.length ?? 0) +
    (decisions?.length ?? 0);

  const budget = DEFAULT_PROMPT_CHAR_BUDGET - FIXED_OVERHEAD - fixedBytes;

  const truncationParts: string[] = [];
  const updates: RawUpdate[] = [];
  const droppedByBudget: string[] = [];
  const truncatedNames: string[] = [];

  let remaining = Math.max(0, budget);
  for (const u of considered) {
    if (u.body.length <= remaining) {
      updates.push({ filename: u.filename, body: u.body });
      remaining -= u.body.length;
      continue;
    }
    if (remaining < 500) {
      droppedByBudget.push(u.filename);
      continue;
    }
    // Take a head excerpt and mark it as truncated.
    const slice = u.body.slice(0, remaining - 80) +
      "\n\n[…afgekapt wegens lengte…]";
    updates.push({ filename: u.filename, body: slice });
    truncatedNames.push(u.filename);
    remaining = 0;
  }

  if (droppedByConfig.length > 0) {
    truncationParts.push(
      `${droppedByConfig.length} oudere update(s) overgeslagen volgens maxUpdatesForStatusGeneration=${maxByConfig}.`,
    );
  }
  if (droppedByBudget.length > 0) {
    truncationParts.push(
      `${droppedByBudget.length} extra update(s) weggelaten om binnen het promptbudget te blijven.`,
    );
  }
  if (truncatedNames.length > 0) {
    truncationParts.push(
      `${truncatedNames.length} update(s) ingekort tot het promptbudget paste.`,
    );
  }

  return {
    projectName,
    metaJson: metaRaw,
    status: status ?? "",
    log: log ?? "",
    decisions: decisions ?? "",
    updates,
    droppedUpdates: [...droppedByConfig, ...droppedByBudget],
    truncatedUpdates: truncatedNames,
    truncationNote: summary(truncationParts),
  };
}
