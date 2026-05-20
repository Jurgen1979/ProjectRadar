/**
 * Detect whether we're running inside a Tauri webview.
 *
 * Tauri v2 sets `window.__TAURI_INTERNALS__` (and the older
 * `window.__TAURI__` alias). When neither is present we're in a plain
 * browser — fall back to env-based config (npm run dev).
 */

export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return "__TAURI_INTERNALS__" in w || "__TAURI__" in w;
}
