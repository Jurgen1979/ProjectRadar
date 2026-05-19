import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { isSafeSlug, resolveUnderRoot } from "@/lib/fs/paths";
import { loadProject, type LoadProjectResult } from "./load-one";
import type { Project, ProjectWarning } from "@/types/project";

export type ProjectsIndex = {
  projects: Project[];
  /** Slugs that exist on disk but couldn't be loaded into a full Project. */
  broken: Array<{
    slug: string;
    dir: string;
    warnings: ProjectWarning[];
  }>;
  /** Slugs that were skipped because the directory name is not slug-safe. */
  skipped: string[];
};

async function listProjectSlugs(root: string): Promise<{ slugs: string[]; skipped: string[] }> {
  const projectsDir = resolveUnderRoot(root, "projects");
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(projectsDir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { slugs: [], skipped: [] };
    }
    throw err;
  }
  const slugs: string[] = [];
  const skipped: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith(".")) continue;
    if (!isSafeSlug(e.name)) {
      skipped.push(e.name);
      continue;
    }
    slugs.push(e.name);
  }
  slugs.sort();
  return { slugs, skipped };
}

export async function loadAllProjects(root: string): Promise<ProjectsIndex> {
  const { slugs, skipped } = await listProjectSlugs(root);
  const results = await Promise.all(slugs.map((slug) => safeLoad(root, slug)));

  const projects: Project[] = [];
  const broken: ProjectsIndex["broken"] = [];
  for (const r of results) {
    if (r.ok) projects.push(r.project);
    else broken.push({ slug: r.slug, dir: r.dir, warnings: r.warnings });
  }

  // Dashboard-friendly sort: most recently updated first, then alphabetical.
  projects.sort((a, b) => {
    const al = a.meta.lastUpdated ?? "";
    const bl = b.meta.lastUpdated ?? "";
    if (al && bl && al !== bl) return bl.localeCompare(al);
    if (al && !bl) return -1;
    if (!al && bl) return 1;
    return a.meta.name.localeCompare(b.meta.name);
  });

  return { projects, broken, skipped };
}

async function safeLoad(root: string, slug: string): Promise<LoadProjectResult> {
  try {
    return await loadProject(root, slug);
  } catch (err) {
    return {
      ok: false,
      slug,
      dir: path.join(root, "projects", slug),
      warnings: [
        {
          level: "error",
          file: "(project)",
          message: `Onverwachte fout bij laden: ${(err as Error).message}`,
        },
      ],
    };
  }
}
