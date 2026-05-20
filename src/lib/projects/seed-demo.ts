import { projectDir } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";

export const DEMO_SLUG = "denkmachine-demo";

export type SeedDemoResult =
  | { ok: true; slug: string; dir: string }
  | { ok: false; message: string };

/**
 * Copy a bundled demo project into <root>/projects/<DEMO_SLUG>.
 *
 * `sourceDir` is environment-specific:
 * - Node/dev: path.join(process.cwd(), "examples", "denkmachine-demo")
 * - Tauri: resolved from the app resource directory
 *
 * Refuses to overwrite an existing slug.
 */
export async function seedDemoProject(
  io: FsIO,
  root: string,
  sourceDir: string,
): Promise<SeedDemoResult> {
  const target = projectDir(root, DEMO_SLUG);

  if (await io.exists(target)) {
    return {
      ok: false,
      message: `Project ${DEMO_SLUG} bestaat al op ${target}. Geen actie.`,
    };
  }

  if (!(await io.exists(sourceDir))) {
    return {
      ok: false,
      message: `Demoproject niet gevonden op ${sourceDir}.`,
    };
  }

  await io.mkdir(io.dirname(target), { recursive: true });
  await io.copyDir(sourceDir, target);
  return { ok: true, slug: DEMO_SLUG, dir: target };
}
