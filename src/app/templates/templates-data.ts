import {
  STATUS_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import {
  decisionLogTemplate,
  linksTemplate,
  logTemplate,
  statusTemplate,
  updateTemplate,
} from "@/lib/serialize/templates";

const STATUS_USER_PROMPT = `Maak een nieuwe projectstatus op basis van onderstaande projectcontext.

Gebruik exact deze markdownstructuur:

# projectstatus – [projectnaam]

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

Projectmetadata:
[project.meta.json]

Bestaande status:
[project-status.md]

Projectlog:
[project-log.md]

Decision log:
[decision-log.md]

Recente updates:
[laatste updatefiles]
`;

const END_OF_CHAT_PROMPT = `Maak een Projectradar-update voor dit project.

Schrijf geen lange samenvatting van het hele gesprek. Haal alleen de bruikbare projectinformatie eruit.

Gebruik exact deze structuur:

## datum
[vandaag]

## bron
[ChatGPT / Claude / Gemini / Codex / Replit / eigen notitie]

## korte context
Waar ging deze sessie over?

## beslissingen
Welke keuzes zijn gemaakt?

## argumentatie
Waarom zijn die keuzes gemaakt?

## open vragen
Wat is nog niet beslist?

## volgende acties
Wat moet er concreet gebeuren?

## risico's of aandachtspunten
Wat kan fout lopen of verwarren?

## belangrijke outputs
Welke teksten, bestanden, prompts, links of richtingen zijn belangrijk?

## dashboardzin
Eén zin die de huidige stand van dit project samenvat.
`;

const WEEKLY_REVIEW_PROMPT = `Maak een projectreview over alle actieve projecten.

Doel: toon waar aandacht nodig is, niet gewoon een lijst van alles.

Let vooral op:
- projecten zonder duidelijke volgende actie
- projecten die wachten op mij
- projecten die wachten op klant
- projecten met hoog risico
- projecten die lang niet geüpdatet zijn
- projecten met tegenstrijdige of vage status
- projecten met veel activiteit maar weinig beslissing

Gebruik deze structuur:

# projectreview

## eerst aandacht geven aan

## wacht op mij

## wacht op klant

## onduidelijk of rommelig

## risico's

## mogelijk archiveren of pauzeren

## voorstel voor deze week
`;

export type TemplateCard = {
  id: string;
  title: string;
  description: string;
  language: string;
  body: string;
};

export type TemplateGroup = {
  title: string;
  description: string;
  cards: TemplateCard[];
};

export function buildTemplateGroups(today: string): TemplateGroup[] {
  return [
    {
      title: "Prompts voor je AI-chat",
      description:
        "Plak deze in ChatGPT, Claude, Gemini of Codex om bruikbare output voor Projectradar te krijgen.",
      cards: [
        {
          id: "end-of-chat",
          title: "Einde-van-chat updateprompt",
          description:
            "Vraag op het einde van een sessie om een gestructureerde projectupdate. De output kun je plakken in de inbox of in /projects/[slug]/updates/new.",
          language: "text",
          body: END_OF_CHAT_PROMPT,
        },
        {
          id: "review-prompt",
          title: "Wekelijkse reviewprompt",
          description:
            "Plak dit met je projectmetadata om handmatig een review te krijgen wanneer de ingebouwde AI-review niet beschikbaar is.",
          language: "text",
          body: WEEKLY_REVIEW_PROMPT,
        },
      ],
    },
    {
      title: "Interne AI-prompts",
      description:
        "Dit zijn de prompts die de app zelf gebruikt bij Status genereren. Handig om te lezen of aan te passen voor experimenten.",
      cards: [
        {
          id: "status-system",
          title: "AI-statusgenerator — system prompt",
          description: "Definieert de toon en regels van de status-AI.",
          language: "text",
          body: STATUS_SYSTEM_PROMPT,
        },
        {
          id: "status-user",
          title: "AI-statusgenerator — user prompt-template",
          description:
            "De plekken tussen [haakjes] worden runtime ingevuld met de actuele projectbestanden.",
          language: "text",
          body: STATUS_USER_PROMPT,
        },
      ],
    },
    {
      title: "File-templates",
      description:
        "Dezelfde templates die de app gebruikt bij Project aanmaken en Herstel ontbrekende files.",
      cards: [
        {
          id: "status-md",
          title: "project-status.md",
          description: "Lege statusfile met alle PRD-secties.",
          language: "markdown",
          body: statusTemplate("[projectnaam]", today),
        },
        {
          id: "links-md",
          title: "project-links.md",
          description: "Lege linksfile met de standaardgroepen.",
          language: "markdown",
          body: linksTemplate("[projectnaam]"),
        },
        {
          id: "log-md",
          title: "project-log.md",
          description: "Eerste log-entry.",
          language: "markdown",
          body: logTemplate("[projectnaam]", today),
        },
        {
          id: "decision-md",
          title: "decision-log.md",
          description: "Lege decision-log header.",
          language: "markdown",
          body: decisionLogTemplate("[projectnaam]"),
        },
        {
          id: "update-md",
          title: "update markdownfile",
          description:
            "Structuur die de Inbox en Update toevoegen gebruiken wanneer raw-mode uit staat.",
          language: "markdown",
          body: updateTemplate({
            title: "[titel]",
            datum: today,
            bron: "[bron]",
            body: "[korte context]",
          }),
        },
      ],
    },
  ];
}
