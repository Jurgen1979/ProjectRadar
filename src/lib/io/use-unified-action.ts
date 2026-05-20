"use client";

import { useCallback } from "react";
import { useAppConfig } from "@/components/app-config-provider";

/**
 * Pick between a web server action and a Tauri client handler at call time.
 *
 * Both must have the same `(prevState, formData) => Promise<state>` shape so
 * they can be passed to `useActionState`.
 */
export function useUnifiedAction<R>(
  webAction: (prev: R, fd: FormData) => Promise<R>,
  tauriHandler: (prev: R, fd: FormData) => Promise<R>,
): (prev: R, fd: FormData) => Promise<R> {
  const { runtime } = useAppConfig();
  return useCallback(
    (prev, fd) => (runtime === "tauri" ? tauriHandler(prev, fd) : webAction(prev, fd)),
    [runtime, webAction, tauriHandler],
  );
}
