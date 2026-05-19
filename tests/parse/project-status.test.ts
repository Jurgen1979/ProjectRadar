import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProjectStatus } from "../../src/lib/parse/project-status";

const SAMPLE = `# projectstatus – Denkmachine

## korte status
Werken aan positionering.

## dashboardzin
Positionering bijna rond.

## huidige fase
positionering

## laatste belangrijke beslissing
Local-first.

## volgende actie
Logo-richting kiezen.

## wacht op
mij

## open vragen
- subtitel?
- prijspagina?

## risico's / aandachtspunten
- scope creep
- te lange copy

## belangrijke context
- file-first

## laatst bijgewerkt
2026-05-19

## eigen sectie
Iets dat niet in de standaard zit.
`;

test("parseProjectStatus extracts all known sections", () => {
  const r = parseProjectStatus(SAMPLE);
  assert.equal(r.title, "projectstatus – Denkmachine");
  assert.equal(r.korteStatus, "Werken aan positionering.");
  assert.equal(r.dashboardzin, "Positionering bijna rond.");
  assert.equal(r.huidigeFase, "positionering");
  assert.equal(r.laatsteBelangrijkeBeslissing, "Local-first.");
  assert.equal(r.volgendeActie, "Logo-richting kiezen.");
  assert.equal(r.wachtOp, "mij");
  assert.deepEqual(r.openVragen, ["subtitel?", "prijspagina?"]);
  assert.deepEqual(r.risicos, ["scope creep", "te lange copy"]);
  assert.deepEqual(r.belangrijkeContext, ["file-first"]);
  assert.equal(r.laatstBijgewerkt, "2026-05-19");
});

test("parseProjectStatus preserves unknown sections", () => {
  const r = parseProjectStatus(SAMPLE);
  assert.equal(r.unknownSections.length, 1);
  assert.equal(r.unknownSections[0].heading, "eigen sectie");
});

test("parseProjectStatus tolerates missing sections", () => {
  const r = parseProjectStatus("# titel\n\n## korte status\noké\n");
  assert.equal(r.korteStatus, "oké");
  assert.equal(r.dashboardzin, null);
  assert.deepEqual(r.openVragen, []);
});
