// Web-mode stub.

export type ExportState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportDashboardAction(..._args: unknown[]): Promise<ExportState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
