import { test } from "node:test";
import { nodeFsIO } from "../../src/lib/io/node-fs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProject } from "../../src/lib/projects/create";

async function tmpRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "projectradar-create-"));
}

test("createProject scaffolds all files and folders", async () => {
  const root = await tmpRoot();
  try {
    const r = await createProject(nodeFsIO, root, {
      slug: "alpha",
      name: "Alpha",
      client: "intern",
      type: "demo",
      status: "active",
      phase: "build",
      priority: "high",
      tags: ["t"],
      waitingOn: "me",
      nextAction: "doe iets",
      riskLevel: "low",
    });
    assert.ok(r.ok, "create succeeded");
    const dir = path.join(root, "projects", "alpha");
    const entries = (await fs.readdir(dir)).sort();
    assert.deepEqual(entries, [
      "decision-log.md",
      "exports",
      "project-links.md",
      "project-log.md",
      "project-status.md",
      "project.meta.json",
      "sources",
      "updates",
    ]);
    const meta = JSON.parse(await fs.readFile(path.join(dir, "project.meta.json"), "utf8"));
    assert.equal(meta.id, "alpha");
    assert.equal(meta.name, "Alpha");
    assert.equal(meta.lastUpdated, new Date().toISOString().slice(0, 10));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("createProject refuses unsafe slug", async () => {
  const root = await tmpRoot();
  try {
    const r = await createProject(nodeFsIO, root, {
      slug: "Bad Name",
      name: "x",
      client: "",
      type: "",
      status: "active",
      phase: "",
      priority: "medium",
      tags: [],
      waitingOn: "unclear",
      nextAction: "",
      riskLevel: "unclear",
    });
    assert.equal(r.ok, false);
    assert.equal((r as { field: string }).field, "slug");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("createProject refuses duplicate", async () => {
  const root = await tmpRoot();
  try {
    const a = await createProject(nodeFsIO, root, {
      slug: "dup",
      name: "Dup",
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
    assert.ok(a.ok);
    const b = await createProject(nodeFsIO, root, {
      slug: "dup",
      name: "Dup 2",
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
    assert.equal(b.ok, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
