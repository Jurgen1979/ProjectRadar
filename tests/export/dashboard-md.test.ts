import { test } from "node:test";
import assert from "node:assert/strict";
import { renderDashboardMarkdown } from "../../src/lib/export/dashboard-md";
import type { DashboardData } from "../../src/lib/projects/dashboard-data";

function data(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    cards: [],
    broken: [],
    skipped: [],
    staleDays: 14,
    ...overrides,
  };
}

test("renderDashboardMarkdown shows empty state when no cards", () => {
  const md = renderDashboardMarkdown({
    data: data(),
    generatedAt: new Date("2030-06-15"),
  });
  assert.match(md, /^# projectradar dashboard — 2030-06-15/);
  assert.match(md, /geen valide projecten geladen/);
});

test("renderDashboardMarkdown lists cards with metadata and signals", () => {
  const md = renderDashboardMarkdown({
    data: data({
      cards: [
        {
          slug: "denkmachine",
          name: "Denkmachine",
          client: "intern",
          type: "product",
          status: "active",
          phase: "positionering",
          priority: "high",
          riskLevel: "medium",
          waitingOn: "me",
          tags: ["ai", "strategie"],
          nextAction: "Logo kiezen",
          dashboardzin: "Positionering bijna rond.",
          lastSignal: "2026-05-18",
          ageDays: 1,
          signals: ["waiting-on-me"],
          hasStatus: true,
          hasLinks: true,
          updatesCount: 3,
        },
      ],
    }),
    generatedAt: new Date("2026-05-19"),
  });
  assert.match(md, /### Denkmachine/);
  assert.match(md, /slug: `denkmachine`/);
  assert.match(md, /klant\/type: intern \/ product/);
  assert.match(md, /dashboardzin: Positionering bijna rond/);
  assert.match(md, /volgende actie: Logo kiezen/);
  assert.match(md, /wacht op: me/);
  assert.match(md, /risico: medium/);
  assert.match(md, /signalen: wacht op mij/);
  assert.match(md, /tags: ai, strategie/);
});

test("renderDashboardMarkdown includes broken + skipped sections", () => {
  const md = renderDashboardMarkdown({
    data: data({
      broken: [
        {
          slug: "kapot",
          dir: "/tmp/x/kapot",
          warnings: [
            { level: "error", file: "project.meta.json", message: "Ongeldig" },
          ],
        },
      ],
      skipped: ["Slechte Naam"],
    }),
    generatedAt: new Date("2030-01-01"),
  });
  assert.match(md, /## broken projecten/);
  assert.match(md, /### kapot/);
  assert.match(md, /Ongeldig/);
  assert.match(md, /## niet-slug-veilige mapnamen/);
  assert.match(md, /Slechte Naam/);
});
