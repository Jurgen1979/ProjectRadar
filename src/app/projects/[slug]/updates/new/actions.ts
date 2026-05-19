"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { addUpdate } from "@/lib/projects/add-update";
import { isSafeSlug } from "@/lib/fs/paths";

export type AddUpdateFormState = {
  error?: string;
  values?: {
    title: string;
    bron: string;
    datum: string;
    body: string;
    raw: boolean;
  };
};

export async function addUpdateAction(
  slug: string,
  _prev: AddUpdateFormState,
  formData: FormData,
): Promise<AddUpdateFormState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const values = {
    title: String(formData.get("title") ?? "").trim(),
    bron: String(formData.get("bron") ?? "").trim(),
    datum: String(formData.get("datum") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    raw: formData.get("raw") === "on",
  };

  const result = await addUpdate(cfg.root, slug, {
    title: values.title,
    bron: values.bron,
    datum: values.datum,
    body: values.body,
    raw: values.raw,
  });

  if (!result.ok) {
    return { error: result.message, values };
  }

  revalidatePath(`/projects/${slug}`);
  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}
