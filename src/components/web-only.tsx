"use client";

import { useAppConfig } from "./app-config-provider";
import type { ReactNode } from "react";

/** Render children only when we're NOT running inside Tauri (web/dev mode). */
export function WebOnly({ children }: { children: ReactNode }) {
  const { runtime, loading } = useAppConfig();
  if (loading || runtime === "tauri") return null;
  return <>{children}</>;
}

/** Render children only when we ARE running inside Tauri. */
export function TauriOnly({ children }: { children: ReactNode }) {
  const { runtime, loading } = useAppConfig();
  if (loading) return null;
  if (runtime !== "tauri") return null;
  return <>{children}</>;
}
