// Web-mode stub.

export type GenerateState = {
  proposal?: string;
  truncationNote?: string | null;
  meta?: {
    model: string;
    provider: string;
    durationMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    promptCharsApprox: number;
    updatesIncluded: number;
    updatesDropped: string[];
    updatesTruncated: string[];
  };
  error?: string;
};

export type ApproveState = {
  error?: string;
  saved?: { statusPath: string; backupPath: string | null };
};

export async function generateStatusAction(..._args: unknown[]): Promise<GenerateState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
export async function approveStatusAction(..._args: unknown[]): Promise<ApproveState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
