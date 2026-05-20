import { projectDir } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";

export type SaveStatusOk = {
  ok: true;
  statusPath: string;
  backupPath: string | null;
};

export type SaveStatusErr = { ok: false; message: string };
export type SaveStatusResult = SaveStatusOk | SaveStatusErr;

/** YYYY-MM-DD-HHMM-project-status.md per PRD §10.7. */
function backupFilename(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}-project-status.md`
  );
}

export async function saveStatusWithBackup(
  io: FsIO,
  root: string,
  slug: string,
  newContent: string,
  opts: { backup: boolean; now?: Date } = { backup: true },
): Promise<SaveStatusResult> {
  if (typeof newContent !== "string" || newContent.trim().length === 0) {
    return { ok: false, message: "Lege status — weiger te schrijven." };
  }

  const dir = projectDir(root, slug);
  const statusPath = io.join(dir, "project-status.md");

  if (!(await io.exists(io.join(dir, "project.meta.json")))) {
    return { ok: false, message: `Project ${slug} bestaat niet.` };
  }

  let backupPath: string | null = null;
  if (opts.backup) {
    const existing = await io.readText(statusPath);
    if (existing !== null) {
      const backupsDir = io.join(dir, "exports", "status-backups");
      await io.mkdir(backupsDir, { recursive: true });
      const now = opts.now ?? new Date();
      let candidate = backupFilename(now);
      let n = 2;
      while (await io.exists(io.join(backupsDir, candidate))) {
        const base = backupFilename(now).replace(/\.md$/, "");
        candidate = `${base}-${n}.md`;
        n++;
        if (n > 99) {
          return { ok: false, message: "Te veel backups binnen dezelfde minuut." };
        }
      }
      backupPath = io.join(backupsDir, candidate);
      await io.atomicWriteText(backupPath, existing);
    }
  }

  const out = newContent.endsWith("\n") ? newContent : newContent + "\n";
  await io.atomicWriteText(statusPath, out);

  return { ok: true, statusPath, backupPath };
}
