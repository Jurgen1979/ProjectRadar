import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { projectDir } from "@/lib/fs/paths";
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

async function readUtf8(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function readUpdates(dir: string): Promise<{ updates: UpdateFile[]; warnings: ProjectWarning[] }> {
  const updatesDir = path.join(dir, "updates");
  const warnings: ProjectWarning[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(updatesDir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { updates: [], warnings: [] };
    }
    throw err;
  }
  const updates: UpdateFile[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.toLowerCase().endsWith(".md")) continue;
    const full = path.join(updatesDir, e.name);
    try {
      const [raw, stat] = await Promise.all([fs.readFile(full, "utf8"), fs.stat(full)]);
      updates.push(parseUpdate({ raw, filename: e.name, mtime: stat.mtimeMs }));
    } catch (err) {
      warnings.push({
        level: "warning",
        file: path.posix.join("updates", e.name),
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

async function listSources(dir: string): Promise<string[]> {
  const sourcesDir = path.join(dir, "sources");
  try {
    const entries = await fs.readdir(sourcesDir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name).sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export type LoadProjectResult =
  | { ok: true; project: Project }
  | { ok: false; slug: string; dir: string; warnings: ProjectWarning[] };

export async function loadProject(root: string, slug: string): Promise<LoadProjectResult> {
  const dir = projectDir(root, slug);
  const warnings: ProjectWarning[] = [];

  // Meta is the only required file. Without it we can't build a Project.
  const metaRaw = await readUtf8(path.join(dir, META_FILE));
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
    readUtf8(path.join(dir, STATUS_FILE)),
    readUtf8(path.join(dir, LINKS_FILE)),
    readUtf8(path.join(dir, LOG_FILE)),
    readUtf8(path.join(dir, DECISIONS_FILE)),
  ]);

  if (statusRaw === null) {
    warnings.push({
      level: "warning",
      file: STATUS_FILE,
      message: "project-status.md ontbreekt — maak een standaardstatus aan.",
    });
  }
  if (linksRaw === null) {
    warnings.push({
      level: "info",
      file: LINKS_FILE,
      message: "project-links.md ontbreekt.",
    });
  }
  if (logRaw === null) {
    warnings.push({
      level: "info",
      file: LOG_FILE,
      message: "project-log.md ontbreekt.",
    });
  }
  if (decisionsRaw === null) {
    warnings.push({
      level: "info",
      file: DECISIONS_FILE,
      message: "decision-log.md ontbreekt.",
    });
  }

  const { updates, warnings: updateWarnings } = await readUpdates(dir);
  warnings.push(...updateWarnings);

  const sources = await listSources(dir);

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
