// Web-mode stub.

export type InboxFormState = {
  error?: string;
  saved?: { slug: string; filename: string };
  values?: {
    slug: string;
    bron: string;
    datum: string;
    title: string;
    body: string;
    raw: boolean;
  };
};

export async function inboxSaveAction(..._args: unknown[]): Promise<InboxFormState> {
  return { error: "Web-mode write actions uit; gebruik de Tauri desktop-app." };
}
