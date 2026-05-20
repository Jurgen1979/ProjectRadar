// Web-mode stub.

export type AddUpdateFormState = {
  error?: string;
  values?: {
    title: string;
    bron: string;
    datum: string;
    body: string;
    raw: boolean;
  };
};

export async function addUpdateAction(..._args: unknown[]): Promise<AddUpdateFormState> {
  return { error: "Web-mode write actions zijn uitgeschakeld. Gebruik de Tauri desktop-app." };
}
