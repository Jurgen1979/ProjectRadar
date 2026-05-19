import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { atomicWrite } from "@/lib/fs/atomic-write";
import { projectDir } from "@/lib/fs/paths";
import { ProjectMeta } from "@/lib/schema/meta";
import { serializeMeta } from "@/lib/serialize/meta";

export type UpdateMetaInput = {
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

export type UpdateMetaResult =
  | { ok: true; meta: ProjectMeta }
  | { ok: false; message: string; field?: string };

export async function updateProjectMeta(
  root: string,
  slug: string,
  input: UpdateMetaInput,
): Promise<UpdateMetaResult> {
  if (!input.name.trim()) {
    return { ok: false, message: "Naam is verplicht.", field: "name" };
  }

  const dir = projectDir(root, slug);
  const metaPath = path.join(dir, "project.meta.json");

  let existing: ProjectMeta;
  try {
    const raw = await fs.readFile(metaPath, "utf8");
    const parsed = JSON.parse(raw);
    const result = ProjectMeta.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        message: `Huidige meta is ongeldig: ${result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      };
    }
    existing = result.data;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return { ok: false, message: "project.meta.json ontbreekt." };
    }
    if (err instanceof SyntaxError) {
      return { ok: false, message: `Ongeldige JSON: ${err.message}` };
    }
    throw err;
  }

  // Preserve id (slug == folder name), createdAt and lastUpdated.
  // Editing metadata is not a content change, so we don't bump lastUpdated.
  const next = ProjectMeta.parse({
    ...existing,
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
  });

  await atomicWrite(metaPath, serializeMeta(next));
  return { ok: true, meta: next };
}
