// Web-mode stub.

export type ExportReviewState = {
  saved?: { path: string; relativeToRoot: string };
  error?: string;
};

export async function exportReviewAction(..._args: unknown[]): Promise<ExportReviewState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
