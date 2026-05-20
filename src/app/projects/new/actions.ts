// Web-mode server actions are intentionally stubbed in this build.
// The Tauri desktop build uses pure client-side handlers in
// src/lib/tauri-handlers/projects.ts and never reaches these stubs.

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

export async function createProjectAction(..._args: unknown[]): Promise<CreateProjectFormState> {
  return {
    error: "Web-mode write actions zijn uitgeschakeld in deze build. Gebruik de Tauri desktop-app.",
  };
}
