import { projectDir } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";
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
  io: FsIO,
  root: string,
  slug: string,
  input: UpdateMetaInput,
): Promise<UpdateMetaResult> {
  if (!input.name.trim()) {
    return { ok: false, message: "Naam is verplicht.", field: "name" };
  }

  const dir = projectDir(root, slug);
  const metaPath = io.join(dir, "project.meta.json");

  const raw = await io.readText(metaPath);
  if (raw === null) {
    return { ok: false, message: "project.meta.json ontbreekt." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, message: `Ongeldige JSON: ${(err as Error).message}` };
  }

  const result = ProjectMeta.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      message: `Huidige meta is ongeldig: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    };
  }
  const existing = result.data;

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

  await io.atomicWriteText(metaPath, serializeMeta(next));
  return { ok: true, meta: next };
}
