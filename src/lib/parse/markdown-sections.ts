/**
 * Minimal markdown section parser.
 *
 * We don't need a full markdown engine for v1. Project files are
 * structured by "## heading" sections, so a regex-based splitter that
 * collects everything between headings is enough.
 *
 * - Detects ATX headings (`#`, `##`, `###`, …) at line start.
 * - Ignores headings inside fenced code blocks.
 * - Returns the section title (first `# heading`) and a flat list of
 *   the remaining headings with their bodies, in document order.
 *
 * Pure: no IO, no globals. Safe to use in tests.
 */

export type Section = {
  level: number;
  /** Raw heading text, with leading `#`s and trailing whitespace stripped. */
  heading: string;
  /** Lowercased, accent-stripped, alphanumeric-only form for matching. */
  key: string;
  /** Body between this heading and the next heading at <= this level. */
  body: string;
};

export type ParsedMarkdown = {
  /** Text of the first H1 (or null if no H1 found). */
  title: string | null;
  /** All H2+ sections in document order. */
  sections: Section[];
};

export function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_RE = /^(```|~~~)/;

type RawHeading = { line: number; level: number; text: string };

function collectHeadings(markdown: string): { headings: RawHeading[]; lines: string[] } {
  const lines = markdown.split(/\r?\n/);
  const headings: RawHeading[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE_RE.test(line.trimStart())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = HEADING_RE.exec(line);
    if (!m) continue;
    headings.push({ line: i, level: m[1].length, text: m[2].trim() });
  }
  return { headings, lines };
}

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const { headings, lines } = collectHeadings(markdown);

  let title: string | null = null;
  const sections: Section[] = [];

  for (let h = 0; h < headings.length; h++) {
    const cur = headings[h];
    if (cur.level === 1 && title === null) {
      title = cur.text;
      continue;
    }
    if (cur.level < 2) continue;

    // body runs until the next heading of equal or shallower level
    let endLine = lines.length;
    for (let j = h + 1; j < headings.length; j++) {
      if (headings[j].level <= cur.level) {
        endLine = headings[j].line;
        break;
      }
    }
    const body = lines.slice(cur.line + 1, endLine).join("\n").trim();
    sections.push({
      level: cur.level,
      heading: cur.text,
      key: normalizeKey(cur.text),
      body,
    });
  }

  return { title, sections };
}

/** Find the first H2 section matching one of the (normalized) keys. */
export function findSection(
  parsed: ParsedMarkdown,
  ...keys: string[]
): Section | null {
  const wanted = new Set(keys.map(normalizeKey));
  for (const section of parsed.sections) {
    if (section.level === 2 && wanted.has(section.key)) return section;
  }
  return null;
}

/** Split a body into bullet-list items. Returns [] if no list found. */
export function bodyAsList(body: string): string[] {
  if (!body) return [];
  const items: string[] = [];
  const lines = body.split(/\r?\n/);
  let current: string | null = null;
  const flush = () => {
    if (current !== null) {
      const trimmed = current.trim();
      if (trimmed.length > 0) items.push(trimmed);
      current = null;
    }
  };
  for (const line of lines) {
    const m = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (m) {
      flush();
      current = m[1];
      continue;
    }
    if (current !== null && /^\s+\S/.test(line)) {
      // continuation line for the current bullet
      current += " " + line.trim();
      continue;
    }
    // anything else ends the current item
    flush();
  }
  flush();
  return items;
}

/** Strip "- " bullets and return the body as a plain paragraph string. */
export function bodyAsText(body: string): string {
  return body.trim();
}
