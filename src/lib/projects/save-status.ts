import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { atomicWrite, ensureDir } from "@/lib/fs/atomic-write";
import { projectDir } from "@/lib/fs/paths";

export type SaveStatusOk = {
  ok: true;
  /** Absolute path to the rewritten project-status.md. */
  statusPath: string;
  /** Absolute path of the saved backup, null when there was no previous file. */
  backupPath: string | null;
};

export type SaveStatusErr = {
  ok: false;
  message: string;
};

export type SaveStatusResult = SaveStatusOk | SaveStatusErr;

/**
 * Filename for the backup of an existing project-status.md before it gets
 * overwritten. Format follows PRD §10.7: YYYY-MM-DD-HHMM-project-status.md.
 */
function backupFilename(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${y}-${m}-${d}-${h}${min}-project-status.md`;
}

/**
 * Replace project-status.md with `newContent`, backing up the existing
 * file (if any) to /exports/status-backups/ first.
 *
 * Caller responsibilities:
 * - validate that `newContent` is the actual proposal the user approved
 * - require a confirm step in the UI before calling this
 *
 * We never overwrite the same backup twice — if a backup name collides
 * (two saves within the same minute), we append a counter.
 */
export async function saveStatusWithBackup(
  root: string,
  slug: string,
  newContent: string,
  opts: { backup: boolean; now?: Date } = { backup: true },
): Promise<SaveStatusResult> {
  if (typeof newContent !== "string" || newContent.trim().length === 0) {
    return { ok: false, message: "Lege status — weiger te schrijven." };
  }

  const dir = projectDir(root, slug);
  const statusPath = path.join(dir, "project-status.md");

  // Project must exist.
  try {
    await fs.access(path.join(dir, "project.meta.json"));
  } catch {
    return { ok: false, message: `Project ${slug} bestaat niet.` };
  }

  let backupPath: string | null = null;
  if (opts.backup) {
    let existing: string | null = null;
    try {
      existing = await fs.readFile(statusPath, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    if (existing !== null) {
      const backupsDir = path.join(dir, "exports", "status-backups");
      await ensureDir(backupsDir);
      const now = opts.now ?? new Date();
      let candidate = backupFilename(now);
      let n = 2;
      while (await exists(path.join(backupsDir, candidate))) {
        const base = backupFilename(now).replace(/\.md$/, "");
        candidate = `${base}-${n}.md`;
        n++;
        if (n > 99) {
          return {
            ok: false,
            message: "Te veel backups binnen dezelfde minuut.",
          };
        }
      }
      backupPath = path.join(backupsDir, candidate);
      await atomicWrite(backupPath, existing);
    }
  }

  // Make sure the trailing newline is consistent.
  const out = newContent.endsWith("\n") ? newContent : newContent + "\n";
  await atomicWrite(statusPath, out);

  return { ok: true, statusPath, backupPath };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
