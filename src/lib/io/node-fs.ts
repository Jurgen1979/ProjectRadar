import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { DirEntry, FsIO, StatInfo } from "./types";

function isEnoent(err: unknown): boolean {
  return (err as NodeJS.ErrnoException)?.code === "ENOENT";
}

/** Normalize OS path to forward slashes for return values consistent with TauriFsIO. */
function fwd(p: string): string {
  return p.replace(/\\/g, "/");
}

export const nodeFsIO: FsIO = {
  join(...parts: string[]): string {
    return fwd(path.join(...parts));
  },
  basename(p: string): string {
    return path.basename(fwd(p));
  },
  dirname(p: string): string {
    return fwd(path.dirname(p));
  },

  async readText(p: string): Promise<string | null> {
    try {
      return await fs.readFile(p, "utf8");
    } catch (err) {
      if (isEnoent(err)) return null;
      throw err;
    }
  },

  async readDir(p: string): Promise<DirEntry[]> {
    try {
      const entries = await fs.readdir(p, { withFileTypes: true });
      return entries.map((e) => ({
        name: e.name,
        isFile: e.isFile(),
        isDirectory: e.isDirectory(),
      }));
    } catch (err) {
      if (isEnoent(err)) return [];
      throw err;
    }
  },

  async stat(p: string): Promise<StatInfo | null> {
    try {
      const s = await fs.stat(p);
      return {
        isFile: s.isFile(),
        isDirectory: s.isDirectory(),
        size: s.size,
        mtimeMs: s.mtimeMs,
      };
    } catch (err) {
      if (isEnoent(err)) return null;
      throw err;
    }
  },

  async exists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  },

  async writeText(p: string, content: string): Promise<void> {
    await fs.writeFile(p, content, "utf8");
  },

  async atomicWriteText(p: string, content: string): Promise<void> {
    const dir = path.dirname(p);
    await fs.mkdir(dir, { recursive: true });
    const tmp = path.join(
      dir,
      `.${path.basename(p)}.${crypto.randomBytes(6).toString("hex")}.tmp`,
    );
    try {
      await fs.writeFile(tmp, content, "utf8");
      await fs.rename(tmp, p);
    } catch (err) {
      await fs.rm(tmp, { force: true }).catch(() => {});
      throw err;
    }
  },

  async mkdir(p: string, opts?: { recursive?: boolean }): Promise<void> {
    await fs.mkdir(p, { recursive: opts?.recursive !== false });
  },

  async copyDir(from: string, to: string): Promise<void> {
    await fs.cp(from, to, { recursive: true });
  },
};
