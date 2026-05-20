"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { seedDemoProject, DEMO_SLUG } from "@/lib/projects/seed-demo";
import { serverFsIO } from "@/lib/server-io";

export type SeedDemoState = {
  error?: string;
};

export async function seedDemoAction(
  _prev: SeedDemoState,
  _formData: FormData,
): Promise<SeedDemoState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const sourceDir = path.join(process.cwd(), "examples", DEMO_SLUG);
  const result = await seedDemoProject(serverFsIO, cfg.root, sourceDir);
  if (!result.ok) return { error: result.message };

  revalidatePath("/projects");
  redirect(`/projects/${result.slug}`);
}
