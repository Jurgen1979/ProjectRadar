import { basename, projectDir } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";
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

async function loadMetaName(io: FsIO, dir: string): Promise<string> {
  const raw = await io.readText(io.join(dir, "project.meta.json"));
  if (raw !== null) {
    try {
      const result = ProjectMeta.safeParse(JSON.parse(raw));
      if (result.success) return result.data.name;
    } catch {
      /* fall through */
    }
  }
  return basename(dir);
}

/** Build the exact content we would write — used both for preview and for write. */
export async function previewRecoveryContent(
  io: FsIO,
  root: string,
  slug: string,
  file: RecoverableFile,
): Promise<string> {
  const dir = projectDir(root, slug);
  const name = await loadMetaName(io, dir);
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
  io: FsIO,
  root: string,
  slug: string,
  file: string,
): Promise<RecoverFileResult> {
  if (!isRecoverableFile(file)) {
    return { ok: false, message: `Onbekend bestand: ${file}` };
  }
  const dir = projectDir(root, slug);
  const target = io.join(dir, file);

  if (await io.exists(target)) {
    return { ok: false, message: `${file} bestaat al — wordt niet overschreven.` };
  }

  const content = await previewRecoveryContent(io, root, slug, file);
  await io.atomicWriteText(target, content);
  return { ok: true, file, path: target };
}

export type FolderName = "updates" | "sources" | "exports";
export const RECOVERABLE_FOLDERS: FolderName[] = ["updates", "sources", "exports"];

export type RecoverFoldersResult =
  | { ok: true; created: FolderName[]; alreadyExisted: FolderName[] }
  | { ok: false; message: string };

export async function recoverFolders(
  io: FsIO,
  root: string,
  slug: string,
): Promise<RecoverFoldersResult> {
  const dir = projectDir(root, slug);
  if (!(await io.exists(dir))) {
    return { ok: false, message: `Project ${slug} bestaat niet.` };
  }
  const created: FolderName[] = [];
  const existed: FolderName[] = [];
  for (const folder of RECOVERABLE_FOLDERS) {
    const target = io.join(dir, folder);
    const stat = await io.stat(target);
    if (stat?.isDirectory) {
      existed.push(folder);
      continue;
    }
    await io.mkdir(target, { recursive: true });
    created.push(folder);
  }
  return { ok: true, created, alreadyExisted: existed };
}

export type MissingState = {
  files: RecoverableFile[];
  folders: FolderName[];
};

export async function detectMissing(
  io: FsIO,
  root: string,
  slug: string,
): Promise<MissingState> {
  const dir = projectDir(root, slug);
  const files: RecoverableFile[] = [];
  for (const f of RECOVERABLE_FILES) {
    if (!(await io.exists(io.join(dir, f)))) files.push(f);
  }
  const folders: FolderName[] = [];
  for (const fd of RECOVERABLE_FOLDERS) {
    const stat = await io.stat(io.join(dir, fd));
    if (!stat?.isDirectory) folders.push(fd);
  }
  return { files, folders };
}
