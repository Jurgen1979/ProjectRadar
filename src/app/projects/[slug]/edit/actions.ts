// Web-mode stub — see src/app/projects/new/actions.ts for context.

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

export async function editMetaAction(..._args: unknown[]): Promise<EditMetaFormState> {
  return { error: "Web-mode write actions zijn uitgeschakeld in deze build. Gebruik de Tauri desktop-app." };
}
