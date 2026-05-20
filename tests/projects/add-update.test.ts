import { test } from "node:test";
import { nodeFsIO } from "../../src/lib/io/node-fs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { addUpdate } from "../../src/lib/projects/add-update";
import { createProject } from "../../src/lib/projects/create";

async function makeProject(): Promise<{ root: string; slug: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projectradar-upd-"));
  const slug = "demo";
  await createProject(nodeFsIO, root, {
    slug,
    name: "Demo",
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
  return { root, slug };
}

test("addUpdate creates structured markdown and bumps lastUpdated", async () => {
  const { root, slug } = await makeProject();
  try {
    const r = await addUpdate(nodeFsIO, root, slug, {
      title: "eerste",
      bron: "ChatGPT",
      datum: "2030-01-15",
      body: "lange tekst hier",
    });
    assert.ok(r.ok);
    const expected = "2030-01-15-chatgpt-eerste.md";
    assert.equal((r as { filename: string }).filename, expected);
    const content = await fs.readFile(
      path.join(root, "projects", slug, "updates", expected),
      "utf8",
    );
    assert.ok(content.includes("## datum"));
    assert.ok(content.includes("2030-01-15"));
    assert.ok(content.includes("ChatGPT"));
    assert.ok(content.includes("lange tekst hier"));

    const meta = JSON.parse(
      await fs.readFile(path.join(root, "projects", slug, "project.meta.json"), "utf8"),
    );
    assert.equal(meta.lastUpdated, "2030-01-15");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("addUpdate suffixes duplicate filenames", async () => {
  const { root, slug } = await makeProject();
  try {
    const a = await addUpdate(nodeFsIO, root, slug, {
      title: "x",
      bron: "ChatGPT",
      datum: "2030-01-15",
      body: "a",
    });
    const b = await addUpdate(nodeFsIO, root, slug, {
      title: "x",
      bron: "ChatGPT",
      datum: "2030-01-15",
      body: "b",
    });
    assert.ok(a.ok && b.ok);
    assert.equal((a as { filename: string }).filename, "2030-01-15-chatgpt-x.md");
    assert.equal((b as { filename: string }).filename, "2030-01-15-chatgpt-x-2.md");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("addUpdate raw=true keeps verbatim body", async () => {
  const { root, slug } = await makeProject();
  try {
    const r = await addUpdate(nodeFsIO, root, slug, {
      title: "raw",
      bron: "Claude",
      datum: "2030-01-15",
      body: "## datum\n2030-01-15\n\n## dashboardzin\nok",
      raw: true,
    });
    assert.ok(r.ok);
    const content = await fs.readFile((r as { path: string }).path, "utf8");
    assert.ok(content.startsWith("# projectupdate – raw"));
    assert.ok(!content.includes("## korte context\n"));
    assert.ok(content.includes("## dashboardzin\nok"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("addUpdate refuses missing fields and bad date", async () => {
  const { root, slug } = await makeProject();
  try {
    assert.equal(
      (await addUpdate(nodeFsIO, root, slug, { title: "", bron: "x", datum: "2030-01-15", body: "x" })).ok,
      false,
    );
    assert.equal(
      (await addUpdate(nodeFsIO, root, slug, { title: "x", bron: "x", datum: "2030-01-15", body: "" })).ok,
      false,
    );
    assert.equal(
      (await addUpdate(nodeFsIO, root, slug, { title: "x", bron: "x", datum: "vandaag", body: "x" })).ok,
      false,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("addUpdate does not lower lastUpdated when older date is added", async () => {
  const { root, slug } = await makeProject();
  try {
    await addUpdate(nodeFsIO, root, slug, {
      title: "new",
      bron: "x",
      datum: "2030-06-01",
      body: "a",
    });
    await addUpdate(nodeFsIO, root, slug, {
      title: "old",
      bron: "x",
      datum: "2030-01-01",
      body: "b",
    });
    const meta = JSON.parse(
      await fs.readFile(path.join(root, "projects", slug, "project.meta.json"), "utf8"),
    );
    assert.equal(meta.lastUpdated, "2030-06-01");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
