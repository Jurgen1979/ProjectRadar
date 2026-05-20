"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isTauriRuntime } from "@/lib/io/detect-runtime";
import {
  DEFAULT_APP_CONFIG,
  type AppConfig,
} from "@/lib/io/app-config";

export type AppRuntime = "tauri" | "web";

export type AppConfigContextValue = {
  runtime: AppRuntime;
  config: AppConfig;
  /** True while we're loading from the Tauri store. */
  loading: boolean;
  /** Replace the entire config blob in store and in memory. */
  setConfig: (next: AppConfig) => Promise<void>;
  /** Partial patch (merges into ai sub-object too). */
  patchConfig: (partial: Partial<AppConfig>) => Promise<AppConfig>;
};

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<AppRuntime>("web");
  const [config, setConfigState] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!isTauriRuntime()) {
        if (!cancelled) {
          setRuntime("web");
          setLoading(false);
        }
        return;
      }
      // Lazy-import the Tauri store module so we never pull it into the
      // web bundle when Tauri isn't there.
      try {
        const { loadAppConfig } = await import("@/lib/io/tauri-store");
        const cfg = await loadAppConfig();
        if (!cancelled) {
          setRuntime("tauri");
          setConfigState(cfg);
        }
      } catch (err) {
        console.error("Failed to load Tauri app config:", err);
        if (!cancelled) setRuntime("tauri");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const setConfig = useCallback(async (next: AppConfig) => {
    const { saveAppConfig } = await import("@/lib/io/tauri-store");
    await saveAppConfig(next);
    setConfigState(next);
  }, []);

  const patchConfig = useCallback(async (partial: Partial<AppConfig>) => {
    const { patchAppConfig } = await import("@/lib/io/tauri-store");
    const next = await patchAppConfig(partial);
    setConfigState(next);
    return next;
  }, []);

  return (
    <AppConfigContext.Provider
      value={{ runtime, config, loading, setConfig, patchConfig }}
    >
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return ctx;
}
