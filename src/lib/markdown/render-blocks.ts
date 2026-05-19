/**
 * Tiny "good enough" markdown renderer for project file bodies.
 *
 * Handles only what shows up in v1 project content:
 * - blank line → paragraph break
 * - lines starting with `- ` / `* ` / `+ ` → bullet list
 * - everything else → paragraph with line breaks preserved
 *
 * Returns a list of typed blocks; rendering is the caller's job.
 * We deliberately don't support inline emphasis or links — keep
 * content honest and writable, no surprises.
 */

export type RenderedBlock =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[] };

const BULLET_RE = /^\s*[-*+]\s+(.*)$/;

export function renderBlocks(body: string): RenderedBlock[] {
  const blocks: RenderedBlock[] = [];
  const paragraphs = body.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trimEnd()).filter((l) => l.length > 0);
    if (lines.length === 0) continue;

    const allBullets = lines.every((l) => BULLET_RE.test(l));
    if (allBullets) {
      blocks.push({
        kind: "list",
        items: lines.map((l) => BULLET_RE.exec(l)![1].trim()),
      });
    } else {
      blocks.push({ kind: "paragraph", lines });
    }
  }
  return blocks;
}
