import { test } from "node:test";
import { nodeFsIO } from "../../src/lib/io/node-fs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProject } from "../../src/lib/projects/create";
import { addUpdate } from "../../src/lib/projects/add-update";
import { gatherStatusContext } from "../../src/lib/ai/gather-context";
import { DEFAULT_CONFIG } from "../../src/lib/schema/config";

async function makeProjectWithUpdates(count: number) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-gather-"));
  await createProject(nodeFsIO, root, {
    slug: "p",
    name: "Test Project",
    client: "intern",
    type: "demo",
    status: "active",
    phase: "",
    priority: "medium",
    tags: [],
    waitingOn: "me",
    nextAction: "x",
    riskLevel: "low",
  });
  for (let i = 0; i < count; i++) {
    const day = String(i + 1).padStart(2, "0");
    await addUpdate(nodeFsIO, root, "p", {
      title: `update ${i + 1}`,
      bron: "ChatGPT",
      datum: `2030-01-${day}`,
      body: `body voor update ${i + 1}: ${"x".repeat(50)}`,
    });
  }
  return root;
}

test("gatherStatusContext respects maxUpdatesForStatusGeneration", async () => {
  const root = await makeProjectWithUpdates(15);
  try {
    const ctx = await gatherStatusContext(nodeFsIO, root, "p", {
      ...DEFAULT_CONFIG,
      maxUpdatesForStatusGeneration: 5,
    });
    assert.equal(ctx.updates.length, 5);
    assert.equal(ctx.droppedUpdates.length, 10);
    assert.ok(ctx.truncationNote);
    assert.match(ctx.truncationNote!, /5/);
    // Newest first.
    assert.match(ctx.updates[0].filename, /2030-01-15/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("gatherStatusContext fills meta/status/log/decisions strings", async () => {
  const root = await makeProjectWithUpdates(1);
  try {
    const ctx = await gatherStatusContext(nodeFsIO, root, "p", DEFAULT_CONFIG);
    assert.equal(ctx.projectName, "Test Project");
    assert.ok(ctx.metaJson.includes('"id": "p"'));
    assert.ok(ctx.status.startsWith("# projectstatus"));
    assert.ok(ctx.log.startsWith("# projectlog"));
    assert.equal(ctx.decisions.startsWith("# decision log"), true);
    assert.equal(ctx.truncationNote, null);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("gatherStatusContext throws when meta is missing", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-gather-"));
  await fs.mkdir(path.join(root, "projects", "p"), { recursive: true });
  try {
    await assert.rejects(() => gatherStatusContext(nodeFsIO, root, "p", DEFAULT_CONFIG));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("gatherStatusContext truncates a single huge update", async () => {
  const root = await makeProjectWithUpdates(0);
  try {
    // Write one huge update manually.
    const huge = "X".repeat(120_000);
    await fs.writeFile(
      path.join(root, "projects", "p", "updates", "2030-01-01-bron-huge.md"),
      `# u\n## datum\n2030-01-01\n${huge}`,
    );
    const ctx = await gatherStatusContext(nodeFsIO, root, "p", DEFAULT_CONFIG);
    assert.ok(ctx.truncatedUpdates.includes("2030-01-01-bron-huge.md"));
    assert.ok(ctx.truncationNote);
    assert.ok(
      ctx.updates[0].body.length < 120_000,
      "huge update was clamped",
    );
    assert.ok(ctx.updates[0].body.includes("afgekapt"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
