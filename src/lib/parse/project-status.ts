import type { ProjectStatusFile } from "@/types/project";
import { bodyAsList, bodyAsText, findSection, parseMarkdown } from "./markdown-sections";

const KNOWN_KEYS = new Set([
  "korte status",
  "dashboardzin",
  "huidige fase",
  "laatste belangrijke beslissing",
  "volgende actie",
  "wacht op",
  "open vragen",
  "risico s aandachtspunten",
  "risico s",
  "aandachtspunten",
  "belangrijke context",
  "laatst bijgewerkt",
]);

function textSection(parsed: ReturnType<typeof parseMarkdown>, ...keys: string[]): string | null {
  const s = findSection(parsed, ...keys);
  if (!s) return null;
  const t = bodyAsText(s.body);
  return t.length > 0 ? t : null;
}

function listSection(parsed: ReturnType<typeof parseMarkdown>, ...keys: string[]): string[] {
  const s = findSection(parsed, ...keys);
  if (!s) return [];
  const list = bodyAsList(s.body);
  if (list.length > 0) return list;
  const text = bodyAsText(s.body);
  return text.length > 0 ? [text] : [];
}

export function parseProjectStatus(raw: string): ProjectStatusFile {
  const parsed = parseMarkdown(raw);

  const unknown: Array<{ heading: string; body: string }> = [];
  for (const s of parsed.sections) {
    if (s.level !== 2) continue;
    if (!KNOWN_KEYS.has(s.key)) {
      unknown.push({ heading: s.heading, body: s.body });
    }
  }

  return {
    title: parsed.title,
    korteStatus: textSection(parsed, "korte status"),
    dashboardzin: textSection(parsed, "dashboardzin"),
    huidigeFase: textSection(parsed, "huidige fase"),
    laatsteBelangrijkeBeslissing: textSection(
      parsed,
      "laatste belangrijke beslissing",
    ),
    volgendeActie: textSection(parsed, "volgende actie"),
    wachtOp: textSection(parsed, "wacht op"),
    openVragen: listSection(parsed, "open vragen"),
    risicos: listSection(
      parsed,
      "risico's / aandachtspunten",
      "risico's",
      "risicos",
      "aandachtspunten",
    ),
    belangrijkeContext: listSection(parsed, "belangrijke context"),
    laatstBijgewerkt: textSection(parsed, "laatst bijgewerkt"),
    raw,
    unknownSections: unknown,
  };
}
