import { projectDir, toSlug } from "@/lib/io/paths";
import type { FsIO } from "@/lib/io/types";
import { ProjectMeta } from "@/lib/schema/meta";
import { serializeMeta } from "@/lib/serialize/meta";
import { updateTemplate } from "@/lib/serialize/templates";

const KNOWN_SOURCES = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Codex",
  "Replit",
  "Gmail",
  "Drive",
  "eigen notitie",
];

export type AddUpdateInput = {
  title: string;
  bron: string;
  datum: string;
  body: string;
  /** If true, the body is written verbatim (with a project-update title). */
  raw?: boolean;
};

export type AddUpdateResult =
  | { ok: true; filename: string; path: string }
  | { ok: false; message: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeBronForFilename(bron: string): string {
  return toSlug(bron) || "bron";
}

export async function addUpdate(
  io: FsIO,
  root: string,
  slug: string,
  input: AddUpdateInput,
): Promise<AddUpdateResult> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false, message: "Titel is verplicht." };
  if (!body) return { ok: false, message: "Inhoud is verplicht." };
  if (!ISO_DATE.test(input.datum)) {
    return { ok: false, message: "Datum moet YYYY-MM-DD zijn." };
  }
  const bron = input.bron.trim() || "eigen notitie";

  const dir = projectDir(root, slug);
  const updatesDir = io.join(dir, "updates");

  if (!(await io.exists(io.join(dir, "project.meta.json")))) {
    return { ok: false, message: `Project ${slug} bestaat niet.` };
  }
  await io.mkdir(updatesDir, { recursive: true });

  const titleSlug = toSlug(title) || "update";
  const bronSlug = sanitizeBronForFilename(bron);
  const base = `${input.datum}-${bronSlug}-${titleSlug}`;
  const filename = await uniqueFilename(io, updatesDir, base);
  const filePath = io.join(updatesDir, filename);

  const content = input.raw
    ? `# projectupdate – ${title}\n\n${body}\n`
    : updateTemplate({ title, datum: input.datum, bron, body });

  await io.atomicWriteText(filePath, content);
  await bumpLastUpdated(io, dir, input.datum);

  return { ok: true, filename, path: filePath };
}

async function uniqueFilename(
  io: FsIO,
  dir: string,
  base: string,
): Promise<string> {
  let candidate = `${base}.md`;
  let n = 2;
  while (await io.exists(io.join(dir, candidate))) {
    candidate = `${base}-${n}.md`;
    n++;
    if (n > 99) throw new Error("Te veel updates met dezelfde naam vandaag.");
  }
  return candidate;
}

async function bumpLastUpdated(
  io: FsIO,
  dir: string,
  date: string,
): Promise<void> {
  const metaPath = io.join(dir, "project.meta.json");
  const raw = await io.readText(metaPath);
  if (raw === null) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  const result = ProjectMeta.safeParse(parsed);
  if (!result.success) return;
  if (result.data.lastUpdated && result.data.lastUpdated >= date) return;
  const next = { ...result.data, lastUpdated: date };
  await io.atomicWriteText(metaPath, serializeMeta(next));
}

export const UPDATE_SOURCES = KNOWN_SOURCES;
