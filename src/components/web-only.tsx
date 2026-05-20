"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAppConfig } from "./app-config-provider";

/**
 * Render children only when we're NOT running inside Tauri (web/dev mode).
 * Suspends until mounted to keep SSR + client output identical (renders
 * null on both sides) and avoid hydration mismatches.
 */
export function WebOnly({ children }: { children: ReactNode }) {
  const { runtime, loading } = useAppConfig();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || loading || runtime === "tauri") return null;
  return <>{children}</>;
}

/** Render children only when we ARE running inside Tauri. */
export function TauriOnly({ children }: { children: ReactNode }) {
  const { runtime, loading } = useAppConfig();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || loading) return null;
  if (runtime !== "tauri") return null;
  return <>{children}</>;
}
