import { test } from "node:test";
import { nodeFsIO } from "../../src/lib/io/node-fs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProject } from "../../src/lib/projects/create";
import { updateProjectMeta } from "../../src/lib/projects/update-meta";

async function makeProject() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-meta-"));
  await createProject(nodeFsIO, root, {
    slug: "demo",
    name: "Demo",
    client: "intern",
    type: "demo",
    status: "active",
    phase: "build",
    priority: "high",
    tags: ["old"],
    waitingOn: "me",
    nextAction: "doe iets",
    riskLevel: "low",
  });
  return root;
}

test("updateProjectMeta writes new values, preserves id and createdAt", async () => {
  const root = await makeProject();
  try {
    const metaPath = path.join(root, "projects", "demo", "project.meta.json");
    const before = JSON.parse(await fs.readFile(metaPath, "utf8"));

    const r = await updateProjectMeta(nodeFsIO, root, "demo", {
      name: "Demo (hernoemd)",
      client: "Acme BV",
      type: "klant",
      status: "waiting",
      phase: "feedback",
      priority: "medium",
      tags: ["new", "edit"],
      waitingOn: "client",
      nextAction: "wachten op klant",
      riskLevel: "medium",
    });
    assert.ok(r.ok);
    const after = JSON.parse(await fs.readFile(metaPath, "utf8"));

    assert.equal(after.id, "demo"); // preserved
    assert.equal(after.createdAt, before.createdAt); // preserved
    assert.equal(after.lastUpdated, before.lastUpdated); // not bumped on meta edit
    assert.equal(after.name, "Demo (hernoemd)");
    assert.equal(after.client, "Acme BV");
    assert.equal(after.status, "waiting");
    assert.deepEqual(after.tags, ["new", "edit"]);
    assert.equal(after.waitingOn, "client");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("updateProjectMeta refuses empty name", async () => {
  const root = await makeProject();
  try {
    const r = await updateProjectMeta(nodeFsIO, root, "demo", {
      name: "   ",
      client: "x",
      type: "x",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "unclear",
      nextAction: "",
      riskLevel: "unclear",
    });
    assert.equal(r.ok, false);
    assert.equal((r as { field: string }).field, "name");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("updateProjectMeta reports bad JSON instead of crashing", async () => {
  const root = await makeProject();
  try {
    await fs.writeFile(
      path.join(root, "projects", "demo", "project.meta.json"),
      "{ niet valide",
    );
    const r = await updateProjectMeta(nodeFsIO, root, "demo", {
      name: "ok",
      client: "intern",
      type: "demo",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "unclear",
      nextAction: "",
      riskLevel: "unclear",
    });
    assert.equal(r.ok, false);
    assert.match((r as { message: string }).message, /JSON/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
