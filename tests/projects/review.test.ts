import { test } from "node:test";
import { nodeFsIO } from "../../src/lib/io/node-fs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProject } from "../../src/lib/projects/create";
import { updateProjectMeta } from "../../src/lib/projects/update-meta";
import { buildReviewData } from "../../src/lib/projects/review";
import { renderReviewMarkdown } from "../../src/lib/export/review-md";
import { DEFAULT_CONFIG } from "../../src/lib/schema/config";

async function tmpRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "projectradar-review-"));
}

async function makeProject(
  root: string,
  slug: string,
  overrides: Partial<{
    name: string;
    status: "active" | "paused" | "waiting" | "done" | "archived" | "idea";
    waitingOn: "me" | "client" | "third-party" | "none" | "unclear";
    riskLevel: "none" | "low" | "medium" | "high" | "unclear";
    nextAction: string;
    lastUpdated: string;
  }>,
) {
  await createProject(nodeFsIO, root, {
    slug,
    name: overrides.name ?? slug,
    client: "intern",
    type: "demo",
    status: overrides.status ?? "active",
    phase: "",
    priority: "medium",
    tags: [],
    waitingOn: overrides.waitingOn ?? "unclear",
    nextAction: overrides.nextAction ?? "",
    riskLevel: overrides.riskLevel ?? "unclear",
  });
  await updateProjectMeta(nodeFsIO, root, slug, {
    name: overrides.name ?? slug,
    client: "intern",
    type: "demo",
    status: overrides.status ?? "active",
    phase: "",
    priority: "medium",
    tags: [],
    waitingOn: overrides.waitingOn ?? "unclear",
    nextAction: overrides.nextAction ?? "",
    riskLevel: overrides.riskLevel ?? "unclear",
  });
  // Backdate lastUpdated when requested (createProject sets it to today).
  if (overrides.lastUpdated) {
    const dir = path.join(root, "projects", slug);
    const metaPath = path.join(dir, "project.meta.json");
    const raw = JSON.parse(await fs.readFile(metaPath, "utf8"));
    raw.lastUpdated = overrides.lastUpdated;
    await fs.writeFile(metaPath, JSON.stringify(raw, null, 2));
    // The scaffolded project-log.md has a today-stamped entry that would
    // beat our backdated lastUpdated in the signal calculation. Wipe it.
    await fs.writeFile(
      path.join(dir, "project-log.md"),
      `# projectlog – ${overrides.name ?? slug}\n`,
    );
  }
}

test("buildReviewData buckets projects by signals, skips archived", async () => {
  const root = await tmpRoot();
  try {
    await makeProject(root, "a", { waitingOn: "me", nextAction: "x" });
    await makeProject(root, "b", { waitingOn: "client", nextAction: "y" });
    await makeProject(root, "c", {
      riskLevel: "high",
      waitingOn: "none",
      nextAction: "z",
    });
    await makeProject(root, "d", { waitingOn: "none" }); // missing-next-action
    await makeProject(root, "e", {
      waitingOn: "none",
      nextAction: "x",
      lastUpdated: "2020-01-01",
    }); // stale
    await makeProject(root, "f", { status: "archived" });

    const data = await buildReviewData(nodeFsIO, root, DEFAULT_CONFIG);

    assert.equal(data.considered.length, 5);
    assert.equal(data.hidden, 1);
    assert.deepEqual(data.buckets.waitingOnMe.map((p) => p.slug), ["a"]);
    assert.deepEqual(data.buckets.waitingOnClient.map((p) => p.slug), ["b"]);
    assert.deepEqual(data.buckets.highRisk.map((p) => p.slug), ["c"]);
    assert.ok(data.buckets.missingNextAction.some((p) => p.slug === "d"));
    assert.ok(data.buckets.stale.some((p) => p.slug === "e"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("renderReviewMarkdown produces all sections and respects empty buckets", async () => {
  const root = await tmpRoot();
  try {
    await makeProject(root, "alpha", { waitingOn: "me", nextAction: "doe x" });
    const data = await buildReviewData(nodeFsIO, root, DEFAULT_CONFIG);
    const md = renderReviewMarkdown({
      data,
      generatedAt: new Date("2030-06-15"),
      aiText: null,
    });
    assert.match(md, /^# wekelijkse projectreview — 2030-06-15/);
    assert.match(md, /## wacht op mij/);
    assert.match(md, /alpha/);
    assert.match(md, /## wacht op klant\n\n_\(niets te melden\)_/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("renderReviewMarkdown appends AI text after a divider", async () => {
  const root = await tmpRoot();
  try {
    await makeProject(root, "alpha", { waitingOn: "me", nextAction: "doe x" });
    const data = await buildReviewData(nodeFsIO, root, DEFAULT_CONFIG);
    const md = renderReviewMarkdown({
      data,
      generatedAt: new Date("2030-06-15"),
      aiText: "# projectreview\n\nfoo",
    });
    assert.match(md, /---\n\n# projectreview\n\nfoo/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
