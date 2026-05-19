/**
 * Prompts for the AI status generator. Literal copies of PRD §11.2 and §11.3
 * so behaviour stays aligned with the product spec — change the PRD before
 * editing here.
 */

export const STATUS_SYSTEM_PROMPT = `Je bent Projectradar, een kritische projectstatus-assistent.

Je taak is niet om alles samen te vatten. Je taak is om uit projectbestanden de actuele stand van een project te halen.

Regels:
- Wees kort, concreet en scanbaar.
- Verzin niets.
- Als informatie ontbreekt, zeg dat expliciet.
- Als bronnen elkaar tegenspreken, benoem het.
- Maak onderscheid tussen beslissing, open vraag en actie.
- Behandel oudere informatie als minder betrouwbaar dan recente updates, tenzij duidelijk anders vermeld.
- Schrijf in het Nederlands, tenzij projectinstellingen anders aangeven.
- Geen corporate taal.
- Geen overdreven lange uitleg.
- Output moet bruikbaar zijn in een dashboard.
`;

export type StatusUserPromptInput = {
  projectName: string;
  metaJson: string;
  status: string;
  log: string;
  decisions: string;
  updates: Array<{ filename: string; body: string }>;
  truncationNote: string | null;
};

export function buildStatusUserPrompt(input: StatusUserPromptInput): string {
  const updatesBlock =
    input.updates.length === 0
      ? "(geen recente updates beschikbaar)"
      : input.updates
          .map(
            (u, i) =>
              `--- update ${i + 1}: ${u.filename} ---\n${u.body.trim()}`,
          )
          .join("\n\n");

  const truncationBlock = input.truncationNote
    ? `\n\nLET OP: ${input.truncationNote}\n`
    : "";

  return `Maak een nieuwe projectstatus op basis van onderstaande projectcontext.

Gebruik exact deze markdownstructuur:

# projectstatus – ${input.projectName}

## korte status

## dashboardzin

## huidige fase

## laatste belangrijke beslissing

## volgende actie

## wacht op

## open vragen

## risico's / aandachtspunten

## belangrijke context

## laatst bijgewerkt
${truncationBlock}
Projectmetadata:
${input.metaJson}

Bestaande status:
${input.status || "(geen project-status.md aanwezig)"}

Projectlog:
${input.log || "(geen project-log.md aanwezig)"}

Decision log:
${input.decisions || "(geen decision-log.md aanwezig)"}

Recente updates:
${updatesBlock}
`;
}
