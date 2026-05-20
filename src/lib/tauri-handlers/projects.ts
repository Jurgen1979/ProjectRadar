"use client";

import { loadAppConfig, patchAppConfig } from "@/lib/io/tauri-store";
import { tauriFsIO } from "@/lib/io/tauri-fs";
import { isSafeSlug, toSlug } from "@/lib/io/paths";
import { createProject } from "@/lib/projects/create";
import { addUpdate } from "@/lib/projects/add-update";
import { updateProjectMeta } from "@/lib/projects/update-meta";
import { recoverFile, recoverFolders } from "@/lib/projects/recover";
import { saveStatusWithBackup } from "@/lib/projects/save-status";
import { seedDemoProject, DEMO_SLUG } from "@/lib/projects/seed-demo";
import {
  generateStatus,
  type GenerateStatusResult,
} from "@/lib/ai/generate-status";
import {
  generateReview,
  type GenerateReviewResult,
} from "@/lib/ai/review";
import { loadDashboardData } from "@/lib/projects/dashboard-data";
import { buildReviewData } from "@/lib/projects/review";
import { loadProject } from "@/lib/projects/load-one";
import { writeExport, timestamp, rootExportsDir } from "@/lib/export/write-export";
import { renderDashboardMarkdown } from "@/lib/export/dashboard-md";
import { renderReviewMarkdown } from "@/lib/export/review-md";
import { renderProjectMarkdown } from "@/lib/export/project-md";
import { deriveAiStatus } from "@/lib/io/app-config";
import { appConfigToProjectConfig } from "@/lib/io/use-resolved-io";
import { resolveResourcePath } from "@/lib/io/resource";
import type { ProjectMeta } from "@/lib/schema/meta";

type StatusValue = ProjectMeta["status"];
type WaitingValue = ProjectMeta["waitingOn"];
type RiskValue = ProjectMeta["riskLevel"];
type PriorityValue = ProjectMeta["priority"];

function pickStatus(s: string): StatusValue {
  return ["active", "paused", "waiting", "done", "archived", "idea"].includes(s)
    ? (s as StatusValue)
    : "active";
}
function pickWaiting(s: string): WaitingValue {
  return ["me", "client", "third-party", "none", "unclear"].includes(s)
    ? (s as WaitingValue)
    : "unclear";
}
function pickRisk(s: string): RiskValue {
  return ["none", "low", "medium", "high", "unclear"].includes(s)
    ? (s as RiskValue)
    : "unclear";
}
function pickPriority(s: string): PriorityValue {
  return ["low", "medium", "high"].includes(s) ? (s as PriorityValue) : "medium";
}

async function requireRoot(): Promise<string> {
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) {
    throw new Error("Geen projectroot ingesteld. Open /welcome om er een te kiezen.");
  }
  return cfg.projectRoot;
}

/* ---------- create project ---------- */

export type CreateProjectTauriState = {
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
  /** If set, the form should redirect to /projects/<slug>. */
  redirectSlug?: string;
};

export async function createProjectTauri(
  _prev: CreateProjectTauriState,
  formData: FormData,
): Promise<CreateProjectTauriState> {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput || toSlug(name);

  const values = {
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

  let root: string;
  try {
    root = await requireRoot();
  } catch (e) {
    return { error: (e as Error).message, values };
  }

  const result = await createProject(tauriFsIO, root, {
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
  return { redirectSlug: result.slug };
}

/* ---------- edit project meta ---------- */

export type EditMetaTauriState = {
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
  redirectSlug?: string;
};

export async function editMetaTauri(
  slug: string,
  _prev: EditMetaTauriState,
  formData: FormData,
): Promise<EditMetaTauriState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };

  const values: EditMetaTauriState["values"] = {
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

  let root: string;
  try {
    root = await requireRoot();
  } catch (e) {
    return { error: (e as Error).message, values };
  }

  const r = await updateProjectMeta(tauriFsIO, root, slug, {
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

  if (!r.ok) return { error: r.message, field: r.field, values };
  return { redirectSlug: slug };
}

/* ---------- add update ---------- */

export type AddUpdateTauriState = {
  error?: string;
  values?: {
    title: string;
    bron: string;
    datum: string;
    body: string;
    raw: boolean;
  };
  redirectSlug?: string;
};

export async function addUpdateTauri(
  slug: string,
  _prev: AddUpdateTauriState,
  formData: FormData,
): Promise<AddUpdateTauriState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };

  const values = {
    title: String(formData.get("title") ?? "").trim(),
    bron: String(formData.get("bron") ?? "").trim(),
    datum: String(formData.get("datum") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    raw: formData.get("raw") === "on",
  };

  let root: string;
  try {
    root = await requireRoot();
  } catch (e) {
    return { error: (e as Error).message, values };
  }

  const r = await addUpdate(tauriFsIO, root, slug, {
    title: values.title,
    bron: values.bron,
    datum: values.datum,
    body: values.body,
    raw: values.raw,
  });
  if (!r.ok) return { error: r.message, values };
  return { redirectSlug: slug };
}

/* ---------- inbox ---------- */

export type InboxTauriState = {
  error?: string;
  saved?: { slug: string; filename: string };
  values?: {
    slug: string;
    bron: string;
    datum: string;
    title: string;
    body: string;
    raw: boolean;
  };
};

export async function inboxSaveTauri(
  _prev: InboxTauriState,
  formData: FormData,
): Promise<InboxTauriState> {
  const values = {
    slug: String(formData.get("slug") ?? "").trim(),
    bron: String(formData.get("bron") ?? "").trim() || "eigen notitie",
    datum: String(formData.get("datum") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    raw: formData.get("raw") === "on",
  };
  if (!values.slug) return { error: "Kies eerst een project.", values };
  if (!isSafeSlug(values.slug))
    return { error: "Ongeldige projectslug.", values };

  let root: string;
  try {
    root = await requireRoot();
  } catch (e) {
    return { error: (e as Error).message, values };
  }

  const title = values.title || "inbox";
  const r = await addUpdate(tauriFsIO, root, values.slug, {
    title,
    bron: values.bron,
    datum: values.datum,
    body: values.body,
    raw: values.raw,
  });
  if (!r.ok) return { error: r.message, values };
  return {
    saved: { slug: values.slug, filename: r.filename },
    values: { ...values, title: "", body: "" },
  };
}

/* ---------- recover ---------- */

export type RecoverTauriState = { message?: string; error?: boolean };

export async function recoverFileTauri(
  slug: string,
  _prev: RecoverTauriState,
  formData: FormData,
): Promise<RecoverTauriState> {
  if (!isSafeSlug(slug)) return { message: "Ongeldige slug.", error: true };
  const file = String(formData.get("file") ?? "");
  let root: string;
  try {
    root = await requireRoot();
  } catch (e) {
    return { message: (e as Error).message, error: true };
  }
  const r = await recoverFile(tauriFsIO, root, slug, file);
  if (!r.ok) return { message: r.message, error: true };
  return { message: `${r.file} aangemaakt.` };
}

export async function recoverFoldersTauri(
  slug: string,
  _prev: RecoverTauriState,
): Promise<RecoverTauriState> {
  if (!isSafeSlug(slug)) return { message: "Ongeldige slug.", error: true };
  let root: string;
  try {
    root = await requireRoot();
  } catch (e) {
    return { message: (e as Error).message, error: true };
  }
  const r = await recoverFolders(tauriFsIO, root, slug);
  if (!r.ok) return { message: r.message, error: true };
  if (r.created.length === 0) return { message: "Alle mappen bestonden al." };
  return { message: `Aangemaakt: ${r.created.join(", ")}` };
}

/* ---------- status generate + approve ---------- */

type GenerateOk = Extract<GenerateStatusResult, { ok: true }>;

export type GenerateTauriState = {
  proposal?: string;
  truncationNote?: string | null;
  meta?: GenerateOk["meta"];
  error?: string;
};

export async function generateStatusTauri(
  slug: string,
  _prev: GenerateTauriState,
  _formData: FormData,
): Promise<GenerateTauriState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };

  const ai = deriveAiStatus(cfg);
  if (!ai.enabled) return { error: `AI staat uit: ${ai.reason}` };

  const result = await generateStatus(
    tauriFsIO,
    cfg.projectRoot,
    slug,
    appConfigToProjectConfig(cfg),
    ai.ai,
  );
  if (!result.ok)
    return {
      error: result.message,
      truncationNote: result.truncationNote ?? undefined,
    };
  return {
    proposal: result.text,
    truncationNote: result.truncationNote,
    meta: result.meta,
  };
}

export type ApproveTauriState = {
  error?: string;
  saved?: { statusPath: string; backupPath: string | null };
  redirectSlug?: string;
};

export async function approveStatusTauri(
  slug: string,
  _prev: ApproveTauriState,
  formData: FormData,
): Promise<ApproveTauriState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };

  const proposal = String(formData.get("proposal") ?? "");
  if (!proposal.trim()) return { error: "Geen status om op te slaan." };

  const r = await saveStatusWithBackup(
    tauriFsIO,
    cfg.projectRoot,
    slug,
    proposal,
    { backup: cfg.backupOnStatusOverwrite },
  );
  if (!r.ok) return { error: r.message };
  return { saved: { statusPath: r.statusPath, backupPath: r.backupPath }, redirectSlug: slug };
}

/* ---------- review ---------- */

type ReviewOk = Extract<GenerateReviewResult, { ok: true }>;

export type ReviewTauriState = {
  text?: string;
  truncationNote?: string | null;
  projectsConsidered?: number;
  projectsIncluded?: number;
  meta?: ReviewOk["meta"];
  error?: string;
};

export async function generateReviewTauri(
  _prev: ReviewTauriState,
  _formData: FormData,
): Promise<ReviewTauriState> {
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };
  const ai = deriveAiStatus(cfg);
  if (!ai.enabled) return { error: `AI staat uit: ${ai.reason}` };
  const r = await generateReview(
    tauriFsIO,
    cfg.projectRoot,
    appConfigToProjectConfig(cfg),
    ai.ai,
  );
  if (!r.ok) return { error: r.message };
  return {
    text: r.text,
    truncationNote: r.truncationNote,
    projectsConsidered: r.projectsConsidered,
    projectsIncluded: r.projectsIncluded,
    meta: r.meta,
  };
}

/* ---------- exports ---------- */

export type ExportTauriState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportDashboardTauri(
  _prev: ExportTauriState,
  _formData: FormData,
): Promise<ExportTauriState> {
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };
  const data = await loadDashboardData(
    tauriFsIO,
    cfg.projectRoot,
    appConfigToProjectConfig(cfg),
  );
  const content = renderDashboardMarkdown({ data, generatedAt: new Date() });
  const r = await writeExport(tauriFsIO, cfg.projectRoot, {
    dir: rootExportsDir(cfg.projectRoot),
    baseName: `dashboard-${timestamp()}`,
    content,
  });
  if (!r.ok) return { error: r.message };
  return { saved: { path: r.path, relativeToRoot: r.relativeToRoot } };
}

export async function exportReviewTauri(
  _prev: ExportTauriState,
  formData: FormData,
): Promise<ExportTauriState> {
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };
  const aiText = String(formData.get("aiText") ?? "").trim();
  const data = await buildReviewData(
    tauriFsIO,
    cfg.projectRoot,
    appConfigToProjectConfig(cfg),
  );
  const content = renderReviewMarkdown({
    data,
    generatedAt: new Date(),
    aiText: aiText || null,
  });
  const r = await writeExport(tauriFsIO, cfg.projectRoot, {
    dir: rootExportsDir(cfg.projectRoot),
    baseName: `weekly-review-${timestamp()}`,
    content,
  });
  if (!r.ok) return { error: r.message };
  return { saved: { path: r.path, relativeToRoot: r.relativeToRoot } };
}

export async function exportProjectTauri(
  slug: string,
  _prev: ExportTauriState,
  _formData: FormData,
): Promise<ExportTauriState> {
  if (!isSafeSlug(slug)) return { error: "Ongeldige projectslug." };
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };
  const loaded = await loadProject(tauriFsIO, cfg.projectRoot, slug);
  if (!loaded.ok)
    return {
      error: `Kan project niet laden: ${loaded.warnings[0]?.message ?? "onbekende fout"}`,
    };
  const content = renderProjectMarkdown({
    project: loaded.project,
    generatedAt: new Date(),
  });
  const dir = tauriFsIO.join(loaded.project.dir, "exports");
  const r = await writeExport(tauriFsIO, cfg.projectRoot, {
    dir,
    baseName: `project-export-${timestamp()}`,
    content,
  });
  if (!r.ok) return { error: r.message };
  return { saved: { path: r.path, relativeToRoot: r.relativeToRoot } };
}

/* ---------- seed demo ---------- */

export type SeedDemoTauriState = {
  error?: string;
  redirectSlug?: string;
};

export async function seedDemoTauri(
  _prev: SeedDemoTauriState,
  _formData: FormData,
): Promise<SeedDemoTauriState> {
  const cfg = await loadAppConfig();
  if (!cfg.projectRoot) return { error: "Geen projectroot ingesteld." };
  // Tauri rewrites parent-dir resources under `_up_/`.
  const sourceDir = await resolveResourcePath("_up_", "examples", DEMO_SLUG);
  const r = await seedDemoProject(tauriFsIO, cfg.projectRoot, sourceDir);
  if (!r.ok) return { error: r.message };
  return { redirectSlug: r.slug };
}

/* ---------- app config patch helpers (settings) ---------- */

export async function setProjectRoot(path: string): Promise<void> {
  await patchAppConfig({ projectRoot: path });
}
