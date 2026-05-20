import {
  copyFile,
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  stat,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import type { DirEntry, FsIO, StatInfo } from "./types";
import { basename, dirname, joinPath } from "./paths";

function isEnoent(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as Error)?.message ?? err);
  return (
    msg.includes("os error 2") ||
    msg.includes("No such file") ||
    msg.includes("not found") ||
    msg.includes("forbidden path")
  );
}

function randomHex(n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function copyDirRecursive(from: string, to: string): Promise<void> {
  await mkdir(to, { recursive: true });
  const entries = await readDir(from);
  for (const e of entries) {
    const src = joinPath(from, e.name);
    const dst = joinPath(to, e.name);
    if (e.isDirectory) {
      await copyDirRecursive(src, dst);
    } else {
      await copyFile(src, dst);
    }
  }
}

export const tauriFsIO: FsIO = {
  join(...parts: string[]): string {
    return joinPath(...parts);
  },
  basename(p: string): string {
    return basename(p);
  },
  dirname(p: string): string {
    return dirname(p);
  },

  async readText(p: string): Promise<string | null> {
    try {
      return await readTextFile(p);
    } catch (err) {
      if (isEnoent(err)) return null;
      throw err;
    }
  },

  async readDir(p: string): Promise<DirEntry[]> {
    try {
      const entries = await readDir(p);
      return entries.map((e) => ({
        name: e.name,
        isFile: e.isFile,
        isDirectory: e.isDirectory,
      }));
    } catch (err) {
      if (isEnoent(err)) return [];
      throw err;
    }
  },

  async stat(p: string): Promise<StatInfo | null> {
    try {
      const s = await stat(p);
      return {
        isFile: s.isFile,
        isDirectory: s.isDirectory,
        size: Number(s.size),
        mtimeMs: s.mtime ? s.mtime.getTime() : 0,
      };
    } catch (err) {
      if (isEnoent(err)) return null;
      throw err;
    }
  },

  async exists(p: string): Promise<boolean> {
    try {
      return await exists(p);
    } catch {
      return false;
    }
  },

  async writeText(p: string, content: string): Promise<void> {
    await writeTextFile(p, content);
  },

  async atomicWriteText(p: string, content: string): Promise<void> {
    const dir = dirname(p);
    await mkdir(dir, { recursive: true });
    const base = basename(p);
    const tmp = joinPath(dir, `.${base}.${randomHex(6)}.tmp`);
    try {
      await writeTextFile(tmp, content);
      await rename(tmp, p);
    } catch (err) {
      try {
        await remove(tmp);
      } catch {
        /* swallow */
      }
      throw err;
    }
  },

  async mkdir(p: string, opts?: { recursive?: boolean }): Promise<void> {
    await mkdir(p, { recursive: opts?.recursive !== false });
  },

  async copyDir(from: string, to: string): Promise<void> {
    await copyDirRecursive(from, to);
  },
};
