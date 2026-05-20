"use client";

import { useEffect, useState } from "react";
import { useAppConfig } from "@/components/app-config-provider";
import type { FsIO } from "./types";
import type { AppConfig } from "./app-config";
import type { ProjectradarConfig } from "@/lib/schema/config";

/**
 * Bridge from the stored AppConfig to the file-bound ProjectradarConfig shape
 * that existing loaders accept.
 */
export function appConfigToProjectConfig(c: AppConfig): ProjectradarConfig {
  return {
    version: "1.1.0",
    projectRoot: c.projectRoot ?? "./projects",
    defaultLanguage: c.defaultLanguage,
    aiProvider: c.ai.provider,
    model: c.ai.model,
    reviewWindowDays: c.reviewWindowDays,
    maxUpdatesForStatusGeneration: c.maxUpdatesForStatusGeneration,
    staleDays: c.staleDays,
    dateFormat: "YYYY-MM-DD",
    backupOnStatusOverwrite: c.backupOnStatusOverwrite,
  };
}

export type ResolvedIO =
  | { status: "loading" }
  | { status: "no-root" }
  | {
      status: "ready";
      io: FsIO;
      root: string;
      appConfig: AppConfig;
      config: ProjectradarConfig;
    };

/**
 * Tauri-only IO resolver. Returns `loading` while the store loads,
 * `no-root` if the user hasn't picked one yet (welcome guard will
 * redirect), or `ready` with a resolved io + root + config.
 */
export function useResolvedIO(): ResolvedIO {
  const { runtime, config, loading } = useAppConfig();
  const [io, setIO] = useState<FsIO | null>(null);

  useEffect(() => {
    if (runtime !== "tauri") return;
    let cancelled = false;
    void import("@/lib/io/tauri-fs").then((m) => {
      if (!cancelled) setIO(m.tauriFsIO);
    });
    return () => {
      cancelled = true;
    };
  }, [runtime]);

  if (runtime !== "tauri") return { status: "loading" };
  if (loading || !io) return { status: "loading" };
  if (!config.projectRoot) return { status: "no-root" };
  return {
    status: "ready",
    io,
    root: config.projectRoot,
    appConfig: config,
    config: appConfigToProjectConfig(config),
  };
}
