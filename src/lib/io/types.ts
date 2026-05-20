/**
 * Filesystem IO abstraction.
 *
 * Two implementations:
 * - `nodeFsIO` (src/lib/io/node-fs.ts) wraps `node:fs/promises`. Used by
 *   tests, dev-mode server actions, and any place that runs in a Node
 *   process.
 * - `tauriFsIO` (src/lib/io/tauri-fs.ts) wraps `@tauri-apps/plugin-fs`.
 *   Used by Tauri webview client code in the desktop app.
 *
 * Loaders, writers, and exporters take an `FsIO` parameter so the same
 * pure business logic runs in either context. No environment sniffing
 * inside the loaders.
 */

export type StatInfo = {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  /** Milliseconds since epoch. Best-effort — Tauri may have lower resolution. */
  mtimeMs: number;
};

export type DirEntry = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
};

export interface FsIO {
  /** Pure path joining, forward-slash output, handles drive letters and \. */
  join(...parts: string[]): string;
  /** Basename of an absolute or relative path. */
  basename(path: string): string;
  /** Directory name. */
  dirname(path: string): string;

  /**
   * Read a file as UTF-8 text. Returns null when the file does not exist
   * (ENOENT), throws on any other error.
   */
  readText(path: string): Promise<string | null>;

  /**
   * List directory entries. Returns [] when the directory does not exist.
   * Throws on permission errors etc.
   */
  readDir(path: string): Promise<DirEntry[]>;

  /** Stat a path. Returns null when it does not exist. */
  stat(path: string): Promise<StatInfo | null>;

  /** Cheap existence check. */
  exists(path: string): Promise<boolean>;

  /** Write text. Caller is responsible for creating the directory. */
  writeText(path: string, content: string): Promise<void>;

  /**
   * Write text atomically: write to a sibling temp file, then rename.
   * On POSIX this is atomic; on Windows it is best-effort.
   */
  atomicWriteText(path: string, content: string): Promise<void>;

  /** Create a directory. Recursive by default. */
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;

  /** Recursive copy of a directory tree. */
  copyDir(from: string, to: string): Promise<void>;
}
