
export function statusTemplate(name: string, today: string): string {
  return `# projectstatus – ${name}

## korte status


## dashboardzin


## huidige fase


## laatste belangrijke beslissing


## volgende actie


## wacht op


## open vragen
-

## risico's / aandachtspunten
-

## belangrijke context
-

## laatst bijgewerkt
${today}
`;
}

export function linksTemplate(name: string): string {
  return `# projectlinks – ${name}

## werkplekken
- lokale map:
- Google Drive:
- Gmail label/search:
- ChatGPT project:
- Claude project:
- Gemini:
- Replit:
- GitHub:
- Figma:
- website:
- staging:

## documenten
- briefing:
- PRD:
- design:
- copy:
- planning:

## losse links
-
`;
}

export function logTemplate(name: string, today: string): string {
  return `# projectlog – ${name}

## ${today}
Project aangemaakt in Projectradar.
`;
}

export function decisionLogTemplate(name: string): string {
  return `# decision log – ${name}

`;
}

export type UpdateInput = {
  title: string;
  datum: string;
  bron: string;
  body: string;
};

/**
 * Wrap pasted text as an update markdown file. If the user already pasted
 * structured content with `## datum` / `## bron` headers, we keep their text
 * but add a `# projectupdate` title and the missing standard fields.
 */
export function updateTemplate(input: UpdateInput): string {
  const body = input.body.trim();
  const hasStructure = /^##\s+(datum|bron|korte context|beslissingen)/im.test(body);

  if (hasStructure) {
    return `# projectupdate – ${input.title}\n\n${body}\n`;
  }

  return `# projectupdate – ${input.title}

## datum
${input.datum}

## bron
${input.bron}

## korte context
${body}

## beslissingen
-

## argumentatie
-

## open vragen
-

## volgende acties
-

## risico's of aandachtspunten
-

## belangrijke outputs
-

## dashboardzin

`;
}
