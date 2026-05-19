import type { ProjectLinkGroup, ProjectLinksFile } from "@/types/project";
import { parseMarkdown } from "./markdown-sections";

const URL_RE = /(https?:\/\/[^\s)]+|file:\/\/[^\s)]+)/i;
const MD_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/;
const LIST_ITEM_RE = /^\s*[-*+]\s+(.*)$/;

function parseGroupBody(body: string): ProjectLinkGroup["links"] {
  const links: ProjectLinkGroup["links"] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const m = LIST_ITEM_RE.exec(rawLine);
    if (!m) continue;
    const item = m[1].trim();
    if (item.length === 0) continue;

    // markdown link?
    const md = MD_LINK_RE.exec(item);
    if (md) {
      links.push({ label: md[1].trim(), url: md[2].trim() });
      continue;
    }

    // "label: url" form?
    const colonIdx = item.indexOf(":");
    if (colonIdx > 0) {
      const labelCandidate = item.slice(0, colonIdx).trim();
      const rest = item.slice(colonIdx + 1).trim();
      const urlMatch = URL_RE.exec(rest);
      if (urlMatch) {
        links.push({ label: labelCandidate, url: urlMatch[1] });
        continue;
      }
      // colon present but no url: keep label, url=null (placeholder line)
      if (rest.length === 0) {
        links.push({ label: labelCandidate, url: null });
        continue;
      }
    }

    // bare url?
    const urlOnly = URL_RE.exec(item);
    if (urlOnly) {
      links.push({ label: urlOnly[1], url: urlOnly[1] });
      continue;
    }

    // fallback: plain text bullet, no url
    links.push({ label: item, url: null });
  }
  return links;
}

export function parseProjectLinks(raw: string): ProjectLinksFile {
  const parsed = parseMarkdown(raw);
  const groups: ProjectLinkGroup[] = [];
  for (const s of parsed.sections) {
    if (s.level !== 2) continue;
    groups.push({
      heading: s.heading,
      key: s.key,
      links: parseGroupBody(s.body),
    });
  }
  return { title: parsed.title, groups, raw };
}
