"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { seedDemoProject } from "@/lib/projects/seed-demo";

export type SeedDemoState = {
  error?: string;
};

export async function seedDemoAction(
  _prev: SeedDemoState,
  _formData: FormData,
): Promise<SeedDemoState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const result = await seedDemoProject(cfg.root);
  if (!result.ok) return { error: result.message };

  revalidatePath("/projects");
  redirect(`/projects/${result.slug}`);
}
