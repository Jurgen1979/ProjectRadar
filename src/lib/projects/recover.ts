import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { atomicWrite, ensureDir } from "@/lib/fs/atomic-write";
import { projectDir } from "@/lib/fs/paths";
import { ProjectMeta } from "@/lib/schema/meta";
import {
  decisionLogTemplate,
  linksTemplate,
  logTemplate,
  statusTemplate,
} from "@/lib/serialize/templates";

export const RECOVERABLE_FILES = [
  "project-status.md",
  "project-links.md",
  "project-log.md",
  "decision-log.md",
] as const;

export type RecoverableFile = (typeof RECOVERABLE_FILES)[number];

export function isRecoverableFile(name: string): name is RecoverableFile {
  return (RECOVERABLE_FILES as readonly string[]).includes(name);
}

async function loadMetaName(dir: string): Promise<string> {
  try {
    const raw = await fs.readFile(path.join(dir, "project.meta.json"), "utf8");
    const parsed = JSON.parse(raw);
    const result = ProjectMeta.safeParse(parsed);
    if (result.success) return result.data.name;
  } catch {
    /* fall through to slug */
  }
  return path.basename(dir);
}

/** Build the exact content we would write — used both for preview and for write. */
export async function previewRecoveryContent(
  root: string,
  slug: string,
  file: RecoverableFile,
): Promise<string> {
  const dir = projectDir(root, slug);
  const name = await loadMetaName(dir);
  const today = new Date().toISOString().slice(0, 10);
  switch (file) {
    case "project-status.md":
      return statusTemplate(name, today);
    case "project-links.md":
      return linksTemplate(name);
    case "project-log.md":
      return logTemplate(name, today);
    case "decision-log.md":
      return decisionLogTemplate(name);
  }
}

export type RecoverFileResult =
  | { ok: true; file: RecoverableFile; path: string }
  | { ok: false; message: string };

export async function recoverFile(
  root: string,
  slug: string,
  file: string,
): Promise<RecoverFileResult> {
  if (!isRecoverableFile(file)) {
    return { ok: false, message: `Onbekend bestand: ${file}` };
  }
  const dir = projectDir(root, slug);
  const target = path.join(dir, file);

  // Never overwrite an existing file.
  try {
    await fs.access(target);
    return {
      ok: false,
      message: `${file} bestaat al — wordt niet overschreven.`,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  const content = await previewRecoveryContent(root, slug, file);
  await atomicWrite(target, content);
  return { ok: true, file, path: target };
}

export type FolderName = "updates" | "sources" | "exports";
export const RECOVERABLE_FOLDERS: FolderName[] = ["updates", "sources", "exports"];

export type RecoverFoldersResult =
  | { ok: true; created: FolderName[]; alreadyExisted: FolderName[] }
  | { ok: false; message: string };

export async function recoverFolders(
  root: string,
  slug: string,
): Promise<RecoverFoldersResult> {
  const dir = projectDir(root, slug);
  try {
    await fs.access(dir);
  } catch {
    return { ok: false, message: `Project ${slug} bestaat niet.` };
  }
  const created: FolderName[] = [];
  const existed: FolderName[] = [];
  for (const folder of RECOVERABLE_FOLDERS) {
    const target = path.join(dir, folder);
    try {
      const stat = await fs.stat(target);
      if (stat.isDirectory()) {
        existed.push(folder);
        continue;
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    await ensureDir(target);
    created.push(folder);
  }
  return { ok: true, created, alreadyExisted: existed };
}

export type MissingState = {
  files: RecoverableFile[];
  folders: FolderName[];
};

export async function detectMissing(root: string, slug: string): Promise<MissingState> {
  const dir = projectDir(root, slug);
  const files: RecoverableFile[] = [];
  for (const f of RECOVERABLE_FILES) {
    try {
      await fs.access(path.join(dir, f));
    } catch {
      files.push(f);
    }
  }
  const folders: FolderName[] = [];
  for (const fd of RECOVERABLE_FOLDERS) {
    try {
      const stat = await fs.stat(path.join(dir, fd));
      if (!stat.isDirectory()) folders.push(fd);
    } catch {
      folders.push(fd);
    }
  }
  return { files, folders };
}
