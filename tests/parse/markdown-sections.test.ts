import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bodyAsList,
  findSection,
  normalizeKey,
  parseMarkdown,
} from "../../src/lib/parse/markdown-sections";

test("normalizeKey strips accents and punctuation", () => {
  assert.equal(normalizeKey("Risico's / aandachtspunten"), "risico s aandachtspunten");
  assert.equal(normalizeKey("HUIDIGE  FASE"), "huidige fase");
  assert.equal(normalizeKey("café"), "cafe");
});

test("parseMarkdown captures title and H2 sections", () => {
  const md = `# projectstatus – Test

## korte status
Een paragraaf.

## volgende actie
Doe X.
`;
  const parsed = parseMarkdown(md);
  assert.equal(parsed.title, "projectstatus – Test");
  assert.equal(parsed.sections.length, 2);
  assert.equal(parsed.sections[0].heading, "korte status");
  assert.equal(parsed.sections[0].body, "Een paragraaf.");
  assert.equal(parsed.sections[1].heading, "volgende actie");
  assert.equal(parsed.sections[1].body, "Doe X.");
});

test("parseMarkdown ignores headings inside fenced code blocks", () => {
  const md = `# title

## echte sectie
Inhoud.

\`\`\`
## nep heading binnen code
\`\`\`

## tweede echte sectie
Meer.
`;
  const parsed = parseMarkdown(md);
  assert.equal(parsed.sections.length, 2);
  assert.equal(parsed.sections[0].heading, "echte sectie");
  assert.equal(parsed.sections[1].heading, "tweede echte sectie");
});

test("findSection matches via normalized keys", () => {
  const md = `## Risico's / Aandachtspunten\n- één\n- twee\n`;
  const parsed = parseMarkdown(md);
  const s = findSection(parsed, "risico's / aandachtspunten");
  assert.ok(s, "section gevonden");
  assert.equal(s?.key, "risico s aandachtspunten");
});

test("bodyAsList parses bullets and ignores blank items", () => {
  const items = bodyAsList(`- één\n- twee\n\n- drie met\n  vervolg\n`);
  assert.deepEqual(items, ["één", "twee", "drie met vervolg"]);
});
