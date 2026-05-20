"use client";

import { resolveResource } from "@tauri-apps/api/path";

/**
 * Resolve an absolute filesystem path to a bundled resource. In dev mode
 * with Tauri this points into the project's `src-tauri/resources/`
 * directory (when configured); in a built app it points to the resource
 * directory bundled with the installer.
 */
export async function resolveResourcePath(...segments: string[]): Promise<string> {
  const rel = segments.join("/");
  return await resolveResource(rel);
}
