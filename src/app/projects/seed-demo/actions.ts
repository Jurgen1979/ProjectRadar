// Web-mode stub.

export type SeedDemoState = { error?: string };

export async function seedDemoAction(..._args: unknown[]): Promise<SeedDemoState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
