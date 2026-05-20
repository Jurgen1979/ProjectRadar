import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { seedDemoProject } from "../../src/lib/projects/seed-demo";
import { loadProject } from "../../src/lib/projects/load-one";

async function tmpRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "projectradar-seed-"));
}

test("seedDemoProject copies the bundled example into projects/", async () => {
  const root = await tmpRoot();
  try {
    const r = await seedDemoProject(root);
    assert.ok(r.ok);
    const dir = (r as { dir: string }).dir;
    assert.ok(dir.endsWith("denkmachine-demo"));

    // Files we expect to find.
    const entries = (await fs.readdir(dir)).sort();
    assert.ok(entries.includes("project.meta.json"));
    assert.ok(entries.includes("project-status.md"));
    assert.ok(entries.includes("project-links.md"));
    assert.ok(entries.includes("project-log.md"));
    assert.ok(entries.includes("decision-log.md"));
    assert.ok(entries.includes("updates"));

    // Project can be loaded back end-to-end.
    const loaded = await loadProject(root, "denkmachine-demo");
    assert.ok(loaded.ok);
    if (loaded.ok) {
      assert.equal(loaded.project.meta.name, "Denkmachine");
      assert.ok(loaded.project.updates.length >= 1);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("seedDemoProject refuses to overwrite an existing slug", async () => {
  const root = await tmpRoot();
  try {
    const first = await seedDemoProject(root);
    assert.ok(first.ok);
    const second = await seedDemoProject(root);
    assert.equal(second.ok, false);
    assert.match((second as { message: string }).message, /bestaat al/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
