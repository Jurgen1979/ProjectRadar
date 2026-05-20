import { open } from "@tauri-apps/plugin-dialog";

export type FolderPickResult =
  | { ok: true; path: string }
  | { ok: false; cancelled?: boolean };

/**
 * Open the native folder picker. Returns the absolute path of the chosen
 * directory. `cancelled` distinguishes "user closed the dialog" from a
 * real error so the UI can stay silent in the cancel case.
 */
export async function pickFolder(opts?: {
  title?: string;
  defaultPath?: string;
}): Promise<FolderPickResult> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: opts?.title,
      defaultPath: opts?.defaultPath,
    });
    if (selected === null) return { ok: false, cancelled: true };
    // `open` returns string when single, string[] when multiple. We forced single.
    const path = typeof selected === "string" ? selected : selected[0];
    return { ok: true, path };
  } catch (err) {
    console.error("Folder picker failed:", err);
    return { ok: false };
  }
}
