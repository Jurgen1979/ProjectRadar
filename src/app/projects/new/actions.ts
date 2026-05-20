"use server";
import { serverFsIO } from "@/lib/server-io";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfigStatus } from "@/lib/config";
import { createProject } from "@/lib/projects/create";
import { toSlug } from "@/lib/io/paths";
import type { ProjectMeta } from "@/lib/schema/meta";

export type CreateProjectFormState = {
  error?: string;
  field?: string;
  values?: {
    name: string;
    slug: string;
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

export async function createProjectAction(
  _prev: CreateProjectFormState,
  formData: FormData,
): Promise<CreateProjectFormState> {
  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") {
    return { error: cfg.message };
  }

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput || toSlug(name);

  const values: CreateProjectFormState["values"] = {
    name,
    slug,
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

  const result = await createProject(serverFsIO, cfg.root, {
    slug,
    name,
    client: values.client,
    type: values.type,
    status: pickStatus(values.status),
    phase: values.phase,
    priority: pickPriority(values.priority),
    tags: values.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    waitingOn: pickWaiting(values.waitingOn),
    nextAction: values.nextAction,
    riskLevel: pickRisk(values.riskLevel),
  });

  if (!result.ok) {
    return { error: result.message, field: result.field, values };
  }

  revalidatePath("/projects");
  redirect(`/projects/${result.slug}`);
}
