import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProjectLinks } from "../../src/lib/parse/project-links";

const SAMPLE = `# projectlinks – Denkmachine

## werkplekken
- GitHub: https://github.com/example/denkmachine
- Figma:
- ChatGPT project: https://chat.openai.com/g/foo

## documenten
- briefing: https://drive.google.com/file/d/abc
- PRD: https://example.com/prd

## losse links
- [Inspiratie](https://example.com/inspo)
`;

test("parseProjectLinks groups by H2 sections", () => {
  const r = parseProjectLinks(SAMPLE);
  assert.equal(r.title, "projectlinks – Denkmachine");
  assert.equal(r.groups.length, 3);

  const werk = r.groups[0];
  assert.equal(werk.key, "werkplekken");
  assert.equal(werk.links.length, 3);
  assert.deepEqual(werk.links[0], {
    label: "GitHub",
    url: "https://github.com/example/denkmachine",
  });
  assert.deepEqual(werk.links[1], { label: "Figma", url: null });

  const docs = r.groups[1];
  assert.equal(docs.links[1].label, "PRD");
  assert.equal(docs.links[1].url, "https://example.com/prd");

  const losse = r.groups[2];
  assert.deepEqual(losse.links[0], {
    label: "Inspiratie",
    url: "https://example.com/inspo",
  });
});
