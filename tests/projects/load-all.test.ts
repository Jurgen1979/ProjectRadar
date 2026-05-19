import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadAllProjects } from "../../src/lib/projects/load-all";

async function makeFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-test-"));
  const projects = path.join(root, "projects");
  await fs.mkdir(projects, { recursive: true });

  // valid project
  const valid = path.join(projects, "valid-demo");
  await fs.mkdir(path.join(valid, "updates"), { recursive: true });
  await fs.writeFile(
    path.join(valid, "project.meta.json"),
    JSON.stringify(
      {
        id: "valid-demo",
        name: "Valid Demo",
        client: "intern",
        type: "product",
        status: "active",
        phase: "build",
        priority: "high",
        tags: ["test"],
        waitingOn: "me",
        nextAction: "schrijf parser",
        riskLevel: "low",
        lastUpdated: "2026-05-18",
        createdAt: "2026-05-10",
      },
      null,
      2,
    ),
  );
  await fs.writeFile(
    path.join(valid, "project-status.md"),
    "# projectstatus – Valid Demo\n\n## dashboardzin\nWerkt.\n\n## volgende actie\nschrijf parser\n",
  );
  await fs.writeFile(
    path.join(valid, "updates", "2026-05-18-eigen-notitie-eerste.md"),
    "# update\n\n## datum\n2026-05-18\n\n## bron\neigen notitie\n",
  );

  // project with invalid meta
  const broken = path.join(projects, "broken-meta");
  await fs.mkdir(broken, { recursive: true });
  await fs.writeFile(path.join(broken, "project.meta.json"), "{ not valid json");

  // project with unsafe directory name (must be skipped)
  await fs.mkdir(path.join(projects, "Bad Name"), { recursive: true });

  return root;
}

test("loadAllProjects loads valid, flags broken, skips unsafe", async () => {
  const root = await makeFixture();
  try {
    const idx = await loadAllProjects(root);
    assert.equal(idx.projects.length, 1, "één valide project geladen");
    assert.equal(idx.projects[0].slug, "valid-demo");
    assert.equal(idx.projects[0].meta.name, "Valid Demo");
    assert.equal(idx.projects[0].updates.length, 1);

    assert.equal(idx.broken.length, 1, "één broken meta");
    assert.equal(idx.broken[0].slug, "broken-meta");
    assert.ok(idx.broken[0].warnings[0].message.includes("JSON"));

    assert.deepEqual(idx.skipped, ["Bad Name"]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("loadAllProjects on empty root returns empty index", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-empty-"));
  try {
    const idx = await loadAllProjects(root);
    assert.deepEqual(idx.projects, []);
    assert.deepEqual(idx.broken, []);
    assert.deepEqual(idx.skipped, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
