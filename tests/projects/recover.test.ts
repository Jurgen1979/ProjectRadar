import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProject } from "../../src/lib/projects/create";
import {
  detectMissing,
  previewRecoveryContent,
  recoverFile,
  recoverFolders,
} from "../../src/lib/projects/recover";

async function makeProject() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-recover-"));
  await createProject(root, {
    slug: "demo",
    name: "Demo",
    client: "intern",
    type: "demo",
    status: "active",
    phase: "build",
    priority: "high",
    tags: [],
    waitingOn: "me",
    nextAction: "",
    riskLevel: "low",
  });
  return root;
}

test("detectMissing reports a freshly created project as fully present", async () => {
  const root = await makeProject();
  try {
    const m = await detectMissing(root, "demo");
    assert.deepEqual(m.files, []);
    assert.deepEqual(m.folders, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("detectMissing finds removed files and folders", async () => {
  const root = await makeProject();
  try {
    const dir = path.join(root, "projects", "demo");
    await fs.rm(path.join(dir, "project-status.md"));
    await fs.rm(path.join(dir, "project-log.md"));
    await fs.rm(path.join(dir, "updates"), { recursive: true });
    const m = await detectMissing(root, "demo");
    assert.deepEqual(m.files.sort(), ["project-log.md", "project-status.md"]);
    assert.deepEqual(m.folders, ["updates"]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("recoverFile creates file from template, refuses overwrite", async () => {
  const root = await makeProject();
  try {
    const dir = path.join(root, "projects", "demo");
    await fs.rm(path.join(dir, "project-status.md"));
    const r = await recoverFile(root, "demo", "project-status.md");
    assert.ok(r.ok);
    const content = await fs.readFile(path.join(dir, "project-status.md"), "utf8");
    assert.ok(content.startsWith("# projectstatus – Demo"));

    // Second call must refuse, not overwrite.
    const again = await recoverFile(root, "demo", "project-status.md");
    assert.equal(again.ok, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("recoverFile rejects file names outside the whitelist", async () => {
  const root = await makeProject();
  try {
    const r = await recoverFile(root, "demo", "secrets.env");
    assert.equal(r.ok, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("recoverFolders creates only the missing folders", async () => {
  const root = await makeProject();
  try {
    const dir = path.join(root, "projects", "demo");
    await fs.rm(path.join(dir, "updates"), { recursive: true });
    await fs.rm(path.join(dir, "exports"), { recursive: true });
    const r = await recoverFolders(root, "demo");
    assert.ok(r.ok);
    assert.deepEqual((r as { created: string[] }).created.sort(), ["exports", "updates"]);
    assert.deepEqual(
      (r as { alreadyExisted: string[] }).alreadyExisted.sort(),
      ["sources"],
    );

    // All present now → second call creates nothing.
    const again = await recoverFolders(root, "demo");
    assert.ok(again.ok);
    assert.deepEqual((again as { created: string[] }).created, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("previewRecoveryContent matches what recoverFile would write", async () => {
  const root = await makeProject();
  try {
    const dir = path.join(root, "projects", "demo");
    await fs.rm(path.join(dir, "project-links.md"));
    const preview = await previewRecoveryContent(root, "demo", "project-links.md");
    const r = await recoverFile(root, "demo", "project-links.md");
    assert.ok(r.ok);
    const written = await fs.readFile(path.join(dir, "project-links.md"), "utf8");
    assert.equal(written, preview);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
