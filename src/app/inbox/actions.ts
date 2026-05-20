"use server";
import { serverFsIO } from "@/lib/server-io";

import { revalidatePath } from "next/cache";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug } from "@/lib/io/paths";
import { addUpdate } from "@/lib/projects/add-update";

export type InboxFormState = {
  error?: string;
  saved?: {
    slug: string;
    filename: string;
  };
  values?: {
    slug: string;
    bron: string;
    datum: string;
    title: string;
    body: string;
    raw: boolean;
  };
};

export async function inboxSaveAction(
  _prev: InboxFormState,
  formData: FormData,
): Promise<InboxFormState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const values = {
    slug: String(formData.get("slug") ?? "").trim(),
    bron: String(formData.get("bron") ?? "").trim() || "eigen notitie",
    datum: String(formData.get("datum") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    raw: formData.get("raw") === "on",
  };

  if (!values.slug) return { error: "Kies eerst een project.", values };
  if (!isSafeSlug(values.slug)) return { error: "Ongeldige projectslug.", values };

  // Title is optional in the inbox flow — fall back to "inbox" so the
  // saved file gets a sensible name like 2026-05-19-chatgpt-inbox.md.
  const title = values.title || "inbox";

  const result = await addUpdate(serverFsIO, cfg.root, values.slug, {
    title,
    bron: values.bron,
    datum: values.datum,
    body: values.body,
    raw: values.raw,
  });

  if (!result.ok) return { error: result.message, values };

  revalidatePath(`/projects/${values.slug}`);
  revalidatePath("/projects");

  return {
    saved: { slug: values.slug, filename: result.filename },
    values: { ...values, title: "", body: "" }, // retain project + bron, clear text
  };
}
