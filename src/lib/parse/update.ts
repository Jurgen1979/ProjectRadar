import type { UpdateFile } from "@/types/project";
import { bodyAsList, bodyAsText, findSection, parseMarkdown } from "./markdown-sections";

const FILENAME_DATE_RE = /^(\d{4}-\d{2}-\d{2})/;

function text(parsed: ReturnType<typeof parseMarkdown>, ...keys: string[]): string | null {
  const s = findSection(parsed, ...keys);
  if (!s) return null;
  const t = bodyAsText(s.body);
  return t.length > 0 ? t : null;
}

function list(parsed: ReturnType<typeof parseMarkdown>, ...keys: string[]): string[] {
  const s = findSection(parsed, ...keys);
  if (!s) return [];
  const items = bodyAsList(s.body);
  if (items.length > 0) return items;
  const t = bodyAsText(s.body);
  return t.length > 0 ? [t] : [];
}

export function parseUpdate(opts: {
  raw: string;
  filename: string;
  mtime: number;
}): UpdateFile {
  const parsed = parseMarkdown(opts.raw);

  const datumFromSection = text(parsed, "datum");
  const datumFromFilename = FILENAME_DATE_RE.exec(opts.filename)?.[1] ?? null;
  const datum = datumFromSection ?? datumFromFilename;

  return {
    filename: opts.filename,
    mtime: opts.mtime,
    title: parsed.title,
    datum,
    bron: text(parsed, "bron"),
    korteContext: text(parsed, "korte context"),
    beslissingen: list(parsed, "beslissingen"),
    argumentatie: list(parsed, "argumentatie"),
    openVragen: list(parsed, "open vragen"),
    volgendeActies: list(parsed, "volgende acties"),
    risicos: list(
      parsed,
      "risico's of aandachtspunten",
      "risico's",
      "risicos",
      "aandachtspunten",
    ),
    belangrijkeOutputs: list(parsed, "belangrijke outputs"),
    dashboardzin: text(parsed, "dashboardzin"),
    raw: opts.raw,
  };
}
