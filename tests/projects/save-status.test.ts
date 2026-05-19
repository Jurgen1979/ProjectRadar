import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProject } from "../../src/lib/projects/create";
import { saveStatusWithBackup } from "../../src/lib/projects/save-status";

async function makeProject() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-save-"));
  await createProject(root, {
    slug: "p",
    name: "P",
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
  return root;
}

test("saveStatusWithBackup writes new content and backs up old", async () => {
  const root = await makeProject();
  try {
    const statusPath = path.join(root, "projects", "p", "project-status.md");
    const original = await fs.readFile(statusPath, "utf8");

    const r = await saveStatusWithBackup(
      root,
      "p",
      "# projectstatus – P\n\n## korte status\nnieuw\n",
      { backup: true, now: new Date("2030-06-15T10:30:00Z") },
    );
    assert.ok(r.ok);

    const after = await fs.readFile(statusPath, "utf8");
    assert.ok(after.includes("nieuw"));
    assert.equal(after, "# projectstatus – P\n\n## korte status\nnieuw\n");

    assert.ok((r as { backupPath: string }).backupPath !== null);
    const backup = await fs.readFile(
      (r as { backupPath: string }).backupPath,
      "utf8",
    );
    assert.equal(backup, original);

    // Backup path is in /exports/status-backups/ with timestamp shape.
    const backupName = path.basename((r as { backupPath: string }).backupPath);
    assert.match(backupName, /^\d{4}-\d{2}-\d{2}-\d{4}-project-status\.md$/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("saveStatusWithBackup refuses empty content", async () => {
  const root = await makeProject();
  try {
    const r = await saveStatusWithBackup(root, "p", "   ", { backup: true });
    assert.equal(r.ok, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("saveStatusWithBackup skips backup when option is false", async () => {
  const root = await makeProject();
  try {
    const r = await saveStatusWithBackup(root, "p", "# x\n", { backup: false });
    assert.ok(r.ok);
    assert.equal((r as { backupPath: string | null }).backupPath, null);
    const backupsDir = path.join(root, "projects", "p", "exports", "status-backups");
    try {
      await fs.access(backupsDir);
      assert.fail("backups folder should not exist");
    } catch {
      /* ok */
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("saveStatusWithBackup writes first version when no previous file", async () => {
  const root = await makeProject();
  try {
    const statusPath = path.join(root, "projects", "p", "project-status.md");
    await fs.rm(statusPath);
    const r = await saveStatusWithBackup(root, "p", "# nieuw\n");
    assert.ok(r.ok);
    assert.equal((r as { backupPath: string | null }).backupPath, null);
    const content = await fs.readFile(statusPath, "utf8");
    assert.equal(content, "# nieuw\n");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("saveStatusWithBackup adds counter when two backups collide", async () => {
  const root = await makeProject();
  try {
    const now = new Date("2030-06-15T10:30:00Z");
    const a = await saveStatusWithBackup(root, "p", "# v1\n", {
      backup: true,
      now,
    });
    const b = await saveStatusWithBackup(root, "p", "# v2\n", {
      backup: true,
      now,
    });
    assert.ok(a.ok && b.ok);
    const aName = path.basename((a as { backupPath: string }).backupPath);
    const bName = path.basename((b as { backupPath: string }).backupPath);
    assert.notEqual(aName, bName);
    assert.match(bName, /-2\.md$/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
