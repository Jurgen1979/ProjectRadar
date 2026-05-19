import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Write a file atomically: write to a sibling temp file, then rename.
 * Rename within the same filesystem is atomic on POSIX and best-effort on Windows.
 */
export async function atomicWrite(
  filePath: string,
  data: string | Uint8Array,
  encoding: BufferEncoding = "utf8",
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(
    dir,
    `.${path.basename(filePath)}.${crypto.randomBytes(6).toString("hex")}.tmp`,
  );
  try {
    if (typeof data === "string") {
      await fs.writeFile(tmp, data, encoding);
    } else {
      await fs.writeFile(tmp, data);
    }
    await fs.rename(tmp, filePath);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
