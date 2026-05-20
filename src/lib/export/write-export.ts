import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { atomicWrite, ensureDir } from "@/lib/fs/atomic-write";
import { resolveUnderRoot } from "@/lib/fs/paths";

export type WriteExportInput = {
  /** Absolute path of the directory the file should land in. */
  dir: string;
  /** Base name without extension, e.g. "dashboard-2026-05-19-1430". */
  baseName: string;
  /** Markdown body. */
  content: string;
};

export type WriteExportResult =
  | { ok: true; path: string; relativeToRoot: string }
  | { ok: false; message: string };

/**
 * Atomic write of an export file. Refuses to overwrite — when the
 * deterministic filename already exists, we append -2, -3, ….
 *
 * `relativeToRoot` is computed against the project root passed in, so the
 * caller can show a friendly path in the UI.
 */
export async function writeExport(
  root: string,
  input: WriteExportInput,
): Promise<WriteExportResult> {
  if (!input.content.trim()) {
    return { ok: false, message: "Lege export — weiger te schrijven." };
  }
  await ensureDir(input.dir);

  let candidate = `${input.baseName}.md`;
  let n = 2;
  while (await pathExists(path.join(input.dir, candidate))) {
    candidate = `${input.baseName}-${n}.md`;
    n++;
    if (n > 99) {
      return {
        ok: false,
        message: "Te veel export-collisions binnen dezelfde minuut.",
      };
    }
  }

  const target = path.join(input.dir, candidate);
  await atomicWrite(target, input.content);
  return { ok: true, path: target, relativeToRoot: path.relative(root, target) };
}

/** Format a Date as YYYY-MM-DD-HHMM for filenames. */
export function timestamp(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`
  );
}

/** Path to the root-level /exports dir, validated against path traversal. */
export function rootExportsDir(root: string): string {
  return resolveUnderRoot(root, "exports");
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
