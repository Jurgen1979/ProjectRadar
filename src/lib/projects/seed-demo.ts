import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { projectDir } from "@/lib/fs/paths";
import { ensureDir } from "@/lib/fs/atomic-write";

const DEMO_SLUG = "denkmachine-demo";

export type SeedDemoResult =
  | { ok: true; slug: string; dir: string }
  | { ok: false; message: string };

/**
 * Copy the bundled demo project into <root>/projects/denkmachine-demo.
 *
 * We refuse if the slug already exists; never overwrite. The bundled
 * source lives in `examples/denkmachine-demo/` and is part of the repo
 * so the path is resolved relative to process.cwd() at runtime.
 */
export async function seedDemoProject(root: string): Promise<SeedDemoResult> {
  const target = projectDir(root, DEMO_SLUG);
  try {
    await fs.access(target);
    return {
      ok: false,
      message: `Project ${DEMO_SLUG} bestaat al op ${target}. Geen actie.`,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  const source = path.join(process.cwd(), "examples", DEMO_SLUG);
  try {
    await fs.access(source);
  } catch {
    return {
      ok: false,
      message: `Demoproject niet gevonden op ${source}. Is dit een gebouwde versie zonder examples/-map?`,
    };
  }

  await ensureDir(path.dirname(target));
  await fs.cp(source, target, { recursive: true });
  return { ok: true, slug: DEMO_SLUG, dir: target };
}
