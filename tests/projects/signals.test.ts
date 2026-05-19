import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSignals } from "../../src/lib/projects/signals";
import type { Project } from "../../src/types/project";

function makeProject(overrides: Partial<Project> = {}): Project {
  const base: Project = {
    slug: "demo",
    dir: "/tmp/demo",
    meta: {
      id: "demo",
      name: "Demo",
      client: "intern",
      type: "project",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "unclear",
      nextAction: "",
      riskLevel: "unclear",
    },
    status: null,
    links: null,
    log: null,
    decisions: null,
    updates: [],
    sources: [],
    warnings: [],
  };
  return { ...base, ...overrides, meta: { ...base.meta, ...overrides.meta } };
}

const now = Date.parse("2026-05-19T12:00:00Z");

test("signals: brand-new project without updates is stale and unclear", () => {
  const p = makeProject();
  const s = computeSignals(p, { staleDays: 14, now });
  assert.ok(s.set.has("stale"));
  assert.ok(s.set.has("missing-next-action"));
  assert.ok(s.set.has("unclear"));
  assert.equal(s.lastSignal, null);
  assert.equal(s.ageDays, null);
});

test("signals: recent lastUpdated removes stale flag", () => {
  const p = makeProject({
    meta: {
      id: "demo",
      name: "Demo",
      client: "intern",
      type: "project",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "me",
      nextAction: "Logo klaar maken",
      riskLevel: "high",
      lastUpdated: "2026-05-18",
    },
  });
  const s = computeSignals(p, { staleDays: 14, now });
  assert.ok(!s.set.has("stale"), "niet stale");
  assert.ok(!s.set.has("missing-next-action"));
  assert.ok(s.set.has("waiting-on-me"));
  assert.ok(s.set.has("high-risk"));
  assert.equal(s.lastSignal, "2026-05-18");
  assert.equal(s.ageDays, 1);
});

test("signals: client waiting flag", () => {
  const p = makeProject({
    meta: {
      id: "demo",
      name: "Demo",
      client: "intern",
      type: "project",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "client",
      nextAction: "wachten",
      riskLevel: "low",
      lastUpdated: "2026-05-18",
    },
  });
  const s = computeSignals(p, { staleDays: 14, now });
  assert.ok(s.set.has("waiting-on-client"));
  assert.ok(!s.set.has("waiting-on-me"));
  assert.ok(!s.set.has("high-risk"));
});
