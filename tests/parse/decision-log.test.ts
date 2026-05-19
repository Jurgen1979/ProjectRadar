import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecisionLog } from "../../src/lib/parse/decision-log";

const SAMPLE = `# decision log – Denkmachine

## 2026-05-19 – keuze voor local-first aanpak

### beslissing
Alles in markdown en JSON.

### waarom
Eigenaarschap van data.

### impact
Geen DB nodig.

### nog te herzien?
Nee.

## 2026-05-10 – tweede beslissing

### beslissing
Iets anders.
`;

test("parseDecisionLog parses entries with date and subsecties", () => {
  const r = parseDecisionLog(SAMPLE);
  assert.equal(r.entries.length, 2);

  const first = r.entries[0];
  assert.equal(first.date, "2026-05-19");
  assert.equal(first.title, "keuze voor local-first aanpak");
  assert.equal(first.decision, "Alles in markdown en JSON.");
  assert.equal(first.why, "Eigenaarschap van data.");
  assert.equal(first.impact, "Geen DB nodig.");
  assert.equal(first.revise, "Nee.");

  const second = r.entries[1];
  assert.equal(second.date, "2026-05-10");
  assert.equal(second.decision, "Iets anders.");
  assert.equal(second.why, null);
});
