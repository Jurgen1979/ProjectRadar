// Web-mode stub.

export type RecoverActionState = { message?: string; error?: boolean };

export async function recoverFileAction(..._args: unknown[]): Promise<RecoverActionState> {
  return { message: "Web-mode write actions uit; gebruik de desktop-app.", error: true };
}
export async function recoverFoldersAction(..._args: unknown[]): Promise<RecoverActionState> {
  return { message: "Web-mode write actions uit; gebruik de desktop-app.", error: true };
}
