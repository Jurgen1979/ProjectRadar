import { load, type Store } from "@tauri-apps/plugin-store";
import {
  APP_CONFIG_STORE_FILE,
  APP_CONFIG_STORE_KEY,
  AppConfigSchema,
  DEFAULT_APP_CONFIG,
  type AppConfig,
} from "./app-config";

let storePromise: Promise<Store> | null = null;

async function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(APP_CONFIG_STORE_FILE, {
      defaults: {},
      autoSave: true,
    });
  }
  return storePromise;
}

/**
 * Load the app config from the Tauri store. Missing or invalid entries
 * fall back to defaults so the app always boots into a working state.
 */
export async function loadAppConfig(): Promise<AppConfig> {
  const store = await getStore();
  const raw = await store.get<unknown>(APP_CONFIG_STORE_KEY);
  if (raw === null || raw === undefined) {
    return DEFAULT_APP_CONFIG;
  }
  const parsed = AppConfigSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("App config invalid, falling back to defaults:", parsed.error);
    return DEFAULT_APP_CONFIG;
  }
  return parsed.data;
}

/** Save the entire app config blob. Caller is responsible for the merge. */
export async function saveAppConfig(config: AppConfig): Promise<void> {
  const parsed = AppConfigSchema.parse(config);
  const store = await getStore();
  await store.set(APP_CONFIG_STORE_KEY, parsed);
  await store.save();
}

/** Merge `partial` into the current config and save. */
export async function patchAppConfig(
  partial: Partial<AppConfig>,
): Promise<AppConfig> {
  const current = await loadAppConfig();
  const next = AppConfigSchema.parse({
    ...current,
    ...partial,
    ai: { ...current.ai, ...(partial.ai ?? {}) },
  });
  await saveAppConfig(next);
  return next;
}
