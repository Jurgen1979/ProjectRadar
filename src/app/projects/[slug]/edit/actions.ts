"use server";
import { serverFsIO } from "@/lib/server-io";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { isSafeSlug } from "@/lib/io/paths";
import { updateProjectMeta } from "@/lib/projects/update-meta";
import type { ProjectMeta } from "@/lib/schema/meta";

export type EditMetaFormState = {
  error?: string;
  field?: string;
  values?: {
    name: string;
    client: string;
    type: string;
    status: string;
    phase: string;
    priority: string;
    waitingOn: string;
    nextAction: string;
    riskLevel: string;
    tags: string;
  };
};

function pickStatus(s: string): ProjectMeta["status"] {
  return ["active", "paused", "waiting", "done", "archived", "idea"].includes(s)
    ? (s as ProjectMeta["status"])
    : "active";
}
function pickWaiting(s: string): ProjectMeta["waitingOn"] {
  return ["me", "client", "third-party", "none", "unclear"].includes(s)
    ? (s as ProjectMeta["waitingOn"])
    : "unclear";
}
function pickRisk(s: string): ProjectMeta["riskLevel"] {
  return ["none", "low", "medium", "high", "unclear"].includes(s)
    ? (s as ProjectMeta["riskLevel"])
    : "unclear";
}
function pickPriority(s: string): ProjectMeta["priority"] {
  return ["low", "medium", "high"].includes(s) ? (s as ProjectMeta["priority"]) : "medium";
}

export async function editMetaAction(
  slug: string,
  _prev: EditMetaFormState,
  formData: FormData,
): Promise<EditMetaFormState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return { error: cfg.message };

  const values: EditMetaFormState["values"] = {
    name: String(formData.get("name") ?? "").trim(),
    client: String(formData.get("client") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
    status: String(formData.get("status") ?? "active"),
    phase: String(formData.get("phase") ?? "").trim(),
    priority: String(formData.get("priority") ?? "medium"),
    waitingOn: String(formData.get("waitingOn") ?? "unclear"),
    nextAction: String(formData.get("nextAction") ?? "").trim(),
    riskLevel: String(formData.get("riskLevel") ?? "unclear"),
    tags: String(formData.get("tags") ?? "").trim(),
  };

  const result = await updateProjectMeta(serverFsIO, cfg.root, slug, {
    name: values.name,
    client: values.client,
    type: values.type,
    status: pickStatus(values.status),
    phase: values.phase,
    priority: pickPriority(values.priority),
    tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
    waitingOn: pickWaiting(values.waitingOn),
    nextAction: values.nextAction,
    riskLevel: pickRisk(values.riskLevel),
  });

  if (!result.ok) {
    return { error: result.message, field: result.field, values };
  }

  revalidatePath(`/projects/${slug}`);
  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}
