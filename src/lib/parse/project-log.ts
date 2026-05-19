import type { LogEntry, ProjectLogFile } from "@/types/project";
import { parseMarkdown } from "./markdown-sections";

const DATE_RE = /^(\d{4}-\d{2}-\d{2})\b/;

export function parseProjectLog(raw: string): ProjectLogFile {
  const parsed = parseMarkdown(raw);
  const entries: LogEntry[] = [];
  for (const s of parsed.sections) {
    if (s.level !== 2) continue;
    const dateMatch = DATE_RE.exec(s.heading.trim());
    entries.push({
      date: dateMatch ? dateMatch[1] : null,
      heading: s.heading,
      body: s.body.trim(),
    });
  }
  // Newest first when dates are present; otherwise document order.
  entries.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
  return { title: parsed.title, entries, raw };
}
