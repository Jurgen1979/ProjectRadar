"use server";
import { serverFsIO } from "@/lib/server-io";

import { revalidatePath } from "next/cache";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug } from "@/lib/io/paths";
import { recoverFile, recoverFolders } from "@/lib/projects/recover";

export type RecoverActionState = {
  message?: string;
  error?: boolean;
};

export async function recoverFileAction(
  slug: string,
  _prev: RecoverActionState,
  formData: FormData,
): Promise<RecoverActionState> {
  if (!isSafeSlug(slug)) return { message: "Ongeldige slug.", error: true };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { message: cfg.message, error: true };

  const file = String(formData.get("file") ?? "");
  const result = await recoverFile(serverFsIO, cfg.root, slug, file);
  if (!result.ok) return { message: result.message, error: true };

  revalidatePath(`/projects/${slug}`);
  revalidatePath("/projects");
  return { message: `${result.file} aangemaakt.` };
}

export async function recoverFoldersAction(
  slug: string,
  _prev: RecoverActionState,
): Promise<RecoverActionState> {
  if (!isSafeSlug(slug)) return { message: "Ongeldige slug.", error: true };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { message: cfg.message, error: true };

  const result = await recoverFolders(serverFsIO, cfg.root, slug);
  if (!result.ok) return { message: result.message, error: true };

  revalidatePath(`/projects/${slug}`);
  const created = result.created.length;
  if (created === 0) {
    return { message: "Alle mappen bestonden al." };
  }
  return {
    message: `Aangemaakt: ${result.created.join(", ")}`,
  };
}
