import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { timestamp, writeExport } from "../../src/lib/export/write-export";

async function tmpRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "projectradar-write-"));
}

test("writeExport creates dir and writes content", async () => {
  const root = await tmpRoot();
  try {
    const dir = path.join(root, "exports");
    const r = await writeExport(root, {
      dir,
      baseName: "test-2030-01-01-1200",
      content: "# hi\n",
    });
    assert.ok(r.ok);
    assert.equal(
      (r as { relativeToRoot: string }).relativeToRoot,
      path.join("exports", "test-2030-01-01-1200.md"),
    );
    const content = await fs.readFile((r as { path: string }).path, "utf8");
    assert.equal(content, "# hi\n");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("writeExport refuses empty content", async () => {
  const root = await tmpRoot();
  try {
    const r = await writeExport(root, {
      dir: path.join(root, "exports"),
      baseName: "x",
      content: "   ",
    });
    assert.equal(r.ok, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("writeExport suffixes on collision instead of overwriting", async () => {
  const root = await tmpRoot();
  try {
    const dir = path.join(root, "exports");
    const a = await writeExport(root, { dir, baseName: "x", content: "a" });
    const b = await writeExport(root, { dir, baseName: "x", content: "b" });
    const c = await writeExport(root, { dir, baseName: "x", content: "c" });
    assert.ok(a.ok && b.ok && c.ok);
    assert.equal(path.basename((a as { path: string }).path), "x.md");
    assert.equal(path.basename((b as { path: string }).path), "x-2.md");
    assert.equal(path.basename((c as { path: string }).path), "x-3.md");
    assert.equal(await fs.readFile((a as { path: string }).path, "utf8"), "a");
    assert.equal(await fs.readFile((b as { path: string }).path, "utf8"), "b");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("timestamp() produces YYYY-MM-DD-HHMM", () => {
  const ts = timestamp(new Date("2030-06-15T09:07:00"));
  assert.match(ts, /^2030-06-15-\d{4}$/);
});
