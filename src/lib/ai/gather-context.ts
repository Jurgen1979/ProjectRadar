import { projectDir } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";
import type { ProjectradarConfig } from "@/lib/schema/config";

const DEFAULT_PROMPT_CHAR_BUDGET = 80_000;
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
  droppedUpdates: string[];
  truncatedUpdates: string[];
  truncationNote: string | null;
};

type UpdateMeta = {
  filename: string;
  body: string;
  mtime: number;
  isoDate: string | null;
};

async function loadUpdates(io: FsIO, dir: string): Promise<UpdateMeta[]> {
  const updatesDir = io.join(dir, "updates");
  const entries = await io.readDir(updatesDir);
  const out: UpdateMeta[] = [];
  for (const e of entries) {
    if (!e.isFile || !e.name.toLowerCase().endsWith(".md")) continue;
    const full = io.join(updatesDir, e.name);
    try {
      const [body, stat] = await Promise.all([io.readText(full), io.stat(full)]);
      if (body === null) continue;
      const m = /^(\d{4}-\d{2}-\d{2})/.exec(e.name);
      out.push({
        filename: e.name,
        body,
        mtime: stat?.mtimeMs ?? 0,
        isoDate: m?.[1] ?? null,
      });
    } catch {
      /* skip unreadable */
    }
  }
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
  io: FsIO,
  root: string,
  slug: string,
  config: ProjectradarConfig,
): Promise<GatheredContext> {
  const dir = projectDir(root, slug);

  const [metaRaw, status, log, decisions, allUpdates] = await Promise.all([
    io.readText(io.join(dir, "project.meta.json")),
    io.readText(io.join(dir, "project-status.md")),
    io.readText(io.join(dir, "project-log.md")),
    io.readText(io.join(dir, "decision-log.md")),
    loadUpdates(io, dir),
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

  const maxByConfig = Math.max(1, config.maxUpdatesForStatusGeneration);
  const considered = allUpdates.slice(0, maxByConfig);
  const droppedByConfig = allUpdates.slice(maxByConfig).map((u) => u.filename);

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
    const slice = u.body.slice(0, remaining - 80) + "\n\n[…afgekapt wegens lengte…]";
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
