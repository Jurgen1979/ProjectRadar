// Web-mode stub.

export type ExportProjectState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportProjectAction(..._args: unknown[]): Promise<ExportProjectState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
