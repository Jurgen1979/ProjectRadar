import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAiStatus, resolveApiKey } from "@/lib/ai/provider";
import { projectDir } from "@/lib/fs/paths";
import { loadAllProjects } from "@/lib/projects/load-all";
import { computeSignals } from "@/lib/projects/signals";
import type { ProjectradarConfig } from "@/lib/schema/config";

const REVIEW_SYSTEM_PROMPT = `Je bent Projectradar, een kritische projectreview-assistent.

Je taak is om over meerdere projecten te kijken en aan te wijzen waar
deze week aandacht naartoe moet. Niet samenvatten — sorteren naar urgentie.

Regels:
- Wees kort, concreet en scanbaar.
- Verzin niets. Werk alleen met wat in de projectcontext staat.
- Maak onderscheid tussen "wacht op mij", "wacht op klant" en
  "onduidelijk".
- Behandel oudere informatie als minder betrouwbaar dan recente.
- Schrijf in het Nederlands, geen corporate taal.
- Output moet direct bruikbaar zijn als wekelijkse planning.
`;

const PER_PROJECT_STATUS_BUDGET = 1_800;
const TOTAL_BUDGET = 80_000;
const FIXED_OVERHEAD = 4_000;

type ReviewProjectInput = {
  name: string;
  slug: string;
  client: string;
  status: string;
  phase: string;
  waitingOn: string;
  riskLevel: string;
  nextAction: string;
  lastUpdated: string | null;
  ageDays: number | null;
  statusExcerpt: string;
};

export type GenerateReviewOk = {
  ok: true;
  text: string;
  projectsConsidered: number;
  projectsIncluded: number;
  truncationNote: string | null;
  meta: {
    model: string;
    provider: string;
    durationMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    promptCharsApprox: number;
  };
};

export type GenerateReviewErr = { ok: false; message: string };
export type GenerateReviewResult = GenerateReviewOk | GenerateReviewErr;

async function readStatusExcerpt(root: string, slug: string): Promise<string> {
  try {
    const raw = await fs.readFile(
      path.join(projectDir(root, slug), "project-status.md"),
      "utf8",
    );
    if (raw.length <= PER_PROJECT_STATUS_BUDGET) return raw;
    return raw.slice(0, PER_PROJECT_STATUS_BUDGET) + "\n[…afgekapt…]";
  } catch {
    return "(geen project-status.md)";
  }
}

function renderProjectBlock(p: ReviewProjectInput): string {
  return `--- ${p.name} (${p.slug}) ---
client: ${p.client}
status: ${p.status}
fase: ${p.phase || "(leeg)"}
wacht op: ${p.waitingOn}
risico: ${p.riskLevel}
volgende actie: ${p.nextAction || "(leeg)"}
laatste signaal: ${p.lastUpdated ?? "onbekend"} (${p.ageDays !== null ? `${p.ageDays}d geleden` : "?"})

${p.statusExcerpt.trim()}
`;
}

function buildReviewPrompt(inputs: ReviewProjectInput[]): string {
  const blocks = inputs.map(renderProjectBlock).join("\n");
  return `Maak een projectreview over onderstaande actieve projecten.

Doel: toon waar aandacht nodig is, niet gewoon een lijst van alles.

Let vooral op:
- projecten zonder duidelijke volgende actie
- projecten die wachten op mij
- projecten die wachten op klant
- projecten met hoog risico
- projecten die lang niet geüpdatet zijn
- projecten met tegenstrijdige of vage status
- projecten met veel activiteit maar weinig beslissing

Gebruik exact deze structuur:

# projectreview

## eerst aandacht geven aan

## wacht op mij

## wacht op klant

## onduidelijk of rommelig

## risico's

## mogelijk archiveren of pauzeren

## voorstel voor deze week

Projecten:
${blocks}
`;
}

export async function generateReview(
  root: string,
  config: ProjectradarConfig,
): Promise<GenerateReviewResult> {
  const ai = getAiStatus(config);
  if (!ai.enabled) {
    return { ok: false, message: `AI staat uit: ${ai.reason}` };
  }
  const apiKey = resolveApiKey(ai.provider);
  if (!apiKey) {
    return { ok: false, message: `Geen API key voor ${ai.provider}.` };
  }

  const idx = await loadAllProjects(root);
  const active = idx.projects.filter((p) => p.meta.status === "active");
  if (active.length === 0) {
    return { ok: false, message: "Geen actieve projecten om te reviewen." };
  }

  // Sort: oldest first so the most urgent stuff stays even when truncated.
  active.sort((a, b) => {
    const aTs = a.meta.lastUpdated ?? "";
    const bTs = b.meta.lastUpdated ?? "";
    return aTs.localeCompare(bTs);
  });

  const inputs: ReviewProjectInput[] = [];
  let used = FIXED_OVERHEAD;
  let droppedFromBudget = 0;

  for (const p of active) {
    const sig = computeSignals(p, { staleDays: config.staleDays });
    const excerpt = await readStatusExcerpt(root, p.slug);
    const block: ReviewProjectInput = {
      name: p.meta.name,
      slug: p.slug,
      client: p.meta.client,
      status: p.meta.status,
      phase: p.meta.phase,
      waitingOn: p.meta.waitingOn,
      riskLevel: p.meta.riskLevel,
      nextAction:
        p.meta.nextAction.trim() || p.status?.volgendeActie?.trim() || "",
      lastUpdated: p.meta.lastUpdated ?? null,
      ageDays: sig.ageDays,
      statusExcerpt: excerpt,
    };
    const blockSize = renderProjectBlock(block).length;
    if (used + blockSize > TOTAL_BUDGET) {
      droppedFromBudget++;
      continue;
    }
    used += blockSize;
    inputs.push(block);
  }

  if (inputs.length === 0) {
    return {
      ok: false,
      message: "Promptbudget te krap om ook maar één project mee te nemen.",
    };
  }

  const truncationParts: string[] = [];
  if (droppedFromBudget > 0) {
    truncationParts.push(
      `${droppedFromBudget} project(en) overgeslagen wegens promptbudget.`,
    );
  }
  const truncationNote = truncationParts.length > 0 ? truncationParts.join(" ") : null;

  const userPrompt = buildReviewPrompt(inputs);
  const provider = createOpenAI({
    apiKey,
    baseURL: ai.baseURL,
    headers: ai.headers,
  });

  const t0 = Date.now();
  try {
    const result = await generateText({
      model: provider.chat(ai.model),
      system: REVIEW_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4,
    });
    const durationMs = Date.now() - t0;
    return {
      ok: true,
      text: result.text.trim(),
      projectsConsidered: active.length,
      projectsIncluded: inputs.length,
      truncationNote,
      meta: {
        model: ai.model,
        provider: ai.provider,
        durationMs,
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
        promptCharsApprox: REVIEW_SYSTEM_PROMPT.length + userPrompt.length,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: `AI-call mislukt: ${(err as Error).message}`,
    };
  }
}
