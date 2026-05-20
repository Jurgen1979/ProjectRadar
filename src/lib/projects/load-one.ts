import { projectDir } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";
import { ProjectMeta } from "@/lib/schema/meta";
import { parseProjectStatus } from "@/lib/parse/project-status";
import { parseProjectLinks } from "@/lib/parse/project-links";
import { parseProjectLog } from "@/lib/parse/project-log";
import { parseDecisionLog } from "@/lib/parse/decision-log";
import { parseUpdate } from "@/lib/parse/update";
import type { Project, ProjectWarning, UpdateFile } from "@/types/project";

const META_FILE = "project.meta.json";
const STATUS_FILE = "project-status.md";
const LINKS_FILE = "project-links.md";
const LOG_FILE = "project-log.md";
const DECISIONS_FILE = "decision-log.md";

async function readUpdates(
  io: FsIO,
  dir: string,
): Promise<{ updates: UpdateFile[]; warnings: ProjectWarning[] }> {
  const updatesDir = io.join(dir, "updates");
  const entries = await io.readDir(updatesDir);
  const updates: UpdateFile[] = [];
  const warnings: ProjectWarning[] = [];
  for (const e of entries) {
    if (!e.isFile) continue;
    if (!e.name.toLowerCase().endsWith(".md")) continue;
    const full = io.join(updatesDir, e.name);
    try {
      const [raw, stat] = await Promise.all([io.readText(full), io.stat(full)]);
      if (raw === null) continue;
      updates.push(
        parseUpdate({ raw, filename: e.name, mtime: stat?.mtimeMs ?? 0 }),
      );
    } catch (err) {
      warnings.push({
        level: "warning",
        file: `updates/${e.name}`,
        message: `Kon updatebestand niet lezen: ${(err as Error).message}`,
      });
    }
  }
  updates.sort((a, b) => {
    if (a.datum && b.datum && a.datum !== b.datum) return b.datum.localeCompare(a.datum);
    if (a.datum && !b.datum) return -1;
    if (!a.datum && b.datum) return 1;
    return b.mtime - a.mtime;
  });
  return { updates, warnings };
}

async function listSources(io: FsIO, dir: string): Promise<string[]> {
  const sourcesDir = io.join(dir, "sources");
  const entries = await io.readDir(sourcesDir);
  return entries.filter((e) => e.isFile).map((e) => e.name).sort();
}

export type LoadProjectResult =
  | { ok: true; project: Project }
  | { ok: false; slug: string; dir: string; warnings: ProjectWarning[] };

export async function loadProject(
  io: FsIO,
  root: string,
  slug: string,
): Promise<LoadProjectResult> {
  const dir = projectDir(root, slug);
  const warnings: ProjectWarning[] = [];

  const metaRaw = await io.readText(io.join(dir, META_FILE));
  if (metaRaw === null) {
    return {
      ok: false,
      slug,
      dir,
      warnings: [
        {
          level: "error",
          file: META_FILE,
          message: "project.meta.json ontbreekt — project niet volledig geladen.",
        },
      ],
    };
  }

  let metaParsedJson: unknown;
  try {
    metaParsedJson = JSON.parse(metaRaw);
  } catch (err) {
    return {
      ok: false,
      slug,
      dir,
      warnings: [
        {
          level: "error",
          file: META_FILE,
          message: `Ongeldige JSON: ${(err as Error).message}`,
        },
      ],
    };
  }

  const metaResult = ProjectMeta.safeParse(metaParsedJson);
  if (!metaResult.success) {
    return {
      ok: false,
      slug,
      dir,
      warnings: [
        {
          level: "error",
          file: META_FILE,
          message: metaResult.error.issues
            .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; "),
        },
      ],
    };
  }
  const meta = metaResult.data;

  const [statusRaw, linksRaw, logRaw, decisionsRaw] = await Promise.all([
    io.readText(io.join(dir, STATUS_FILE)),
    io.readText(io.join(dir, LINKS_FILE)),
    io.readText(io.join(dir, LOG_FILE)),
    io.readText(io.join(dir, DECISIONS_FILE)),
  ]);

  if (statusRaw === null) {
    warnings.push({
      level: "warning",
      file: STATUS_FILE,
      message: "project-status.md ontbreekt — maak een standaardstatus aan.",
    });
  }
  if (linksRaw === null) {
    warnings.push({ level: "info", file: LINKS_FILE, message: "project-links.md ontbreekt." });
  }
  if (logRaw === null) {
    warnings.push({ level: "info", file: LOG_FILE, message: "project-log.md ontbreekt." });
  }
  if (decisionsRaw === null) {
    warnings.push({ level: "info", file: DECISIONS_FILE, message: "decision-log.md ontbreekt." });
  }

  const { updates, warnings: updateWarnings } = await readUpdates(io, dir);
  warnings.push(...updateWarnings);

  const sources = await listSources(io, dir);

  return {
    ok: true,
    project: {
      slug,
      dir,
      meta,
      status: statusRaw ? parseProjectStatus(statusRaw) : null,
      links: linksRaw ? parseProjectLinks(linksRaw) : null,
      log: logRaw ? parseProjectLog(logRaw) : null,
      decisions: decisionsRaw ? parseDecisionLog(decisionsRaw) : null,
      updates,
      sources,
      warnings,
    },
  };
}
