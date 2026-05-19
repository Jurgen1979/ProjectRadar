import type { DecisionEntry, DecisionLogFile } from "@/types/project";
import { parseMarkdown } from "./markdown-sections";

const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})(?:\s*[–\-—:]\s*(.*))?$/;

function extractSub(rawDecisionBody: string, ...keys: string[]): string | null {
  const parsed = parseMarkdown(rawDecisionBody);
  const wanted = new Set(keys.map((k) => k.toLowerCase().trim()));
  for (const s of parsed.sections) {
    if (wanted.has(s.key)) return s.body.trim() || null;
  }
  return null;
}

export function parseDecisionLog(raw: string): DecisionLogFile {
  const parsed = parseMarkdown(raw);
  const entries: DecisionEntry[] = [];

  for (const s of parsed.sections) {
    if (s.level !== 2) continue;
    const m = DATE_PREFIX_RE.exec(s.heading.trim());
    const date = m ? m[1] : null;
    const title = m && m[2] ? m[2].trim() : s.heading.trim();

    entries.push({
      date,
      title,
      decision: extractSub(s.body, "beslissing"),
      why: extractSub(s.body, "waarom"),
      impact: extractSub(s.body, "impact"),
      revise: extractSub(s.body, "nog te herzien", "te herzien"),
      raw: s.body,
    });
  }

  entries.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  return { title: parsed.title, entries, raw };
}
