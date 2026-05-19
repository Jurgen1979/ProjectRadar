import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { atomicWrite } from "@/lib/fs/atomic-write";
import { projectDir, toSlug } from "@/lib/fs/paths";
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
  const updatesDir = path.join(dir, "updates");

  // Project must exist.
  try {
    await fs.access(path.join(dir, "project.meta.json"));
  } catch {
    return { ok: false, message: `Project ${slug} bestaat niet.` };
  }
  await fs.mkdir(updatesDir, { recursive: true });

  const titleSlug = toSlug(title) || "update";
  const bronSlug = sanitizeBronForFilename(bron);
  const base = `${input.datum}-${bronSlug}-${titleSlug}`;
  const filename = await uniqueFilename(updatesDir, base);
  const filePath = path.join(updatesDir, filename);

  const content = input.raw
    ? `# projectupdate – ${title}\n\n${body}\n`
    : updateTemplate({ title, datum: input.datum, bron, body });

  await atomicWrite(filePath, content);
  await bumpLastUpdated(dir, input.datum);

  return { ok: true, filename, path: filePath };
}

async function uniqueFilename(dir: string, base: string): Promise<string> {
  let candidate = `${base}.md`;
  let n = 2;
  while (await pathExists(path.join(dir, candidate))) {
    candidate = `${base}-${n}.md`;
    n++;
    if (n > 99) throw new Error("Te veel updates met dezelfde naam vandaag.");
  }
  return candidate;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function bumpLastUpdated(dir: string, date: string): Promise<void> {
  const metaPath = path.join(dir, "project.meta.json");
  let raw: string;
  try {
    raw = await fs.readFile(metaPath, "utf8");
  } catch {
    return;
  }
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
  await atomicWrite(metaPath, serializeMeta(next));
}

export const UPDATE_SOURCES = KNOWN_SOURCES;
