"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppConfig } from "./app-config-provider";

const ALLOWED_WITHOUT_ROOT = new Set(["/welcome", "/settings"]);

/**
 * When running in Tauri and no project root is configured, redirect to
 * /welcome. In web mode we do nothing — env-based config handles
 * NoRootState directly in each page.
 */
export function TauriWelcomeGuard() {
  const { runtime, config, loading } = useAppConfig();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (runtime !== "tauri") return;
    if (config.projectRoot) return;
    if (ALLOWED_WITHOUT_ROOT.has(pathname)) return;
    if (pathname.startsWith("/welcome")) return;
    router.replace("/welcome");
  }, [runtime, config.projectRoot, loading, pathname, router]);

  return null;
}
