import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUpdate } from "../../src/lib/parse/update";

const SAMPLE = `# projectupdate – logo-richting

## datum
2026-05-19

## bron
ChatGPT

## korte context
Logo-richtingen besproken.

## beslissingen
- richting A gekozen
- typografie sober

## volgende acties
- mockup maken
- feedback vragen

## dashboardzin
Logo-richting gekozen, mockup volgende stap.
`;

test("parseUpdate extracts standard sections", () => {
  const u = parseUpdate({
    raw: SAMPLE,
    filename: "2026-05-19-chatgpt-logo-richting.md",
    mtime: 0,
  });
  assert.equal(u.datum, "2026-05-19");
  assert.equal(u.bron, "ChatGPT");
  assert.equal(u.korteContext, "Logo-richtingen besproken.");
  assert.deepEqual(u.beslissingen, ["richting A gekozen", "typografie sober"]);
  assert.deepEqual(u.volgendeActies, ["mockup maken", "feedback vragen"]);
  assert.equal(u.dashboardzin, "Logo-richting gekozen, mockup volgende stap.");
});

test("parseUpdate falls back to filename date", () => {
  const u = parseUpdate({
    raw: "# losse update",
    filename: "2026-05-20-eigen-notitie-ruw.md",
    mtime: 0,
  });
  assert.equal(u.datum, "2026-05-20");
  assert.equal(u.title, "losse update");
});
