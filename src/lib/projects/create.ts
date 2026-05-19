import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { atomicWrite, ensureDir } from "@/lib/fs/atomic-write";
import { isSafeSlug, projectDir } from "@/lib/fs/paths";
import { ProjectMeta } from "@/lib/schema/meta";
import { serializeMeta } from "@/lib/serialize/meta";
import {
  decisionLogTemplate,
  linksTemplate,
  logTemplate,
  statusTemplate,
} from "@/lib/serialize/templates";

export type CreateProjectInput = {
  slug: string;
  name: string;
  client: string;
  type: string;
  status: ProjectMeta["status"];
  phase: string;
  priority: ProjectMeta["priority"];
  tags: string[];
  waitingOn: ProjectMeta["waitingOn"];
  nextAction: string;
  riskLevel: ProjectMeta["riskLevel"];
};

export type CreateProjectResult =
  | { ok: true; slug: string; dir: string }
  | { ok: false; field?: keyof CreateProjectInput; message: string };

export async function createProject(
  root: string,
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  if (!isSafeSlug(input.slug)) {
    return {
      ok: false,
      field: "slug",
      message: "Slug mag alleen lowercase letters, cijfers en streepjes bevatten.",
    };
  }
  if (!input.name.trim()) {
    return { ok: false, field: "name", message: "Naam is verplicht." };
  }

  const dir = projectDir(root, input.slug);

  // Refuse if the directory already exists - we never overwrite.
  try {
    const stat = await fs.stat(dir);
    if (stat) {
      return {
        ok: false,
        field: "slug",
        message: `Er bestaat al een project op ${dir}. Kies een andere slug.`,
      };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  const today = new Date().toISOString().slice(0, 10);
  const meta = ProjectMeta.parse({
    id: input.slug,
    name: input.name.trim(),
    client: input.client.trim() || "intern",
    type: input.type.trim() || "project",
    status: input.status,
    phase: input.phase.trim(),
    priority: input.priority,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    waitingOn: input.waitingOn,
    nextAction: input.nextAction.trim(),
    riskLevel: input.riskLevel,
    lastUpdated: today,
    createdAt: today,
  });

  await ensureDir(dir);
  await Promise.all([
    ensureDir(path.join(dir, "updates")),
    ensureDir(path.join(dir, "sources")),
    ensureDir(path.join(dir, "exports")),
  ]);

  await Promise.all([
    atomicWrite(path.join(dir, "project.meta.json"), serializeMeta(meta)),
    atomicWrite(path.join(dir, "project-status.md"), statusTemplate(meta.name, today)),
    atomicWrite(path.join(dir, "project-links.md"), linksTemplate(meta.name)),
    atomicWrite(path.join(dir, "project-log.md"), logTemplate(meta.name, today)),
    atomicWrite(path.join(dir, "decision-log.md"), decisionLogTemplate(meta.name)),
  ]);

  return { ok: true, slug: input.slug, dir };
}
