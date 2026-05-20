import { test } from "node:test";
import assert from "node:assert/strict";
import { renderProjectMarkdown } from "../../src/lib/export/project-md";
import type { Project } from "../../src/types/project";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    slug: "demo",
    dir: "/tmp/x/demo",
    meta: {
      id: "demo",
      name: "Demo",
      client: "intern",
      type: "demo",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "me",
      nextAction: "doe iets",
      riskLevel: "low",
      lastUpdated: "2030-01-15",
      createdAt: "2030-01-01",
    },
    status: null,
    links: null,
    log: null,
    decisions: null,
    updates: [],
    sources: [],
    warnings: [],
    ...overrides,
  };
}

test("renderProjectMarkdown includes meta JSON and section placeholders", () => {
  const md = renderProjectMarkdown({
    project: makeProject(),
    generatedAt: new Date("2030-06-15T10:30:00Z"),
  });
  assert.match(md, /^# project export — Demo \(demo\)/);
  assert.match(md, /Geëxporteerd op 2030-06-15/);
  assert.match(md, /## meta\n\n```json/);
  assert.match(md, /"id": "demo"/);
  assert.match(md, /## status\n\n_\(geen project-status.md\)_/);
  assert.match(md, /## links/);
  assert.match(md, /## log/);
  assert.match(md, /## decisions/);
  assert.match(md, /## updates\n\n_\(geen updates\)_/);
});

test("renderProjectMarkdown lists updates newest-first with raw bodies", () => {
  const md = renderProjectMarkdown({
    project: makeProject({
      updates: [
        {
          filename: "2030-01-15-chatgpt-x.md",
          mtime: 0,
          title: "x",
          datum: "2030-01-15",
          bron: "ChatGPT",
          korteContext: null,
          beslissingen: [],
          argumentatie: [],
          openVragen: [],
          volgendeActies: [],
          risicos: [],
          belangrijkeOutputs: [],
          dashboardzin: null,
          raw: "# u\n\n## datum\n2030-01-15\n\n## bron\nChatGPT\n",
        },
      ],
      sources: ["briefing.pdf"],
    }),
    generatedAt: new Date("2030-06-15"),
  });
  assert.match(md, /## updates \(1, nieuwste eerst\)/);
  assert.match(md, /### 2030-01-15-chatgpt-x.md/);
  assert.match(md, /## bronnen in \/sources/);
  assert.match(md, /- briefing\.pdf/);
});
