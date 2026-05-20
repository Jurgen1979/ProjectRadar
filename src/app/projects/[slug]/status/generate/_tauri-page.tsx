"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useResolvedIO } from "@/lib/io/use-resolved-io";
import { deriveAiStatus } from "@/lib/io/app-config";
import { projectDir, isSafeSlug } from "@/lib/io/paths";
import { StatusGeneratorForm } from "./form";

export function TauriStatusGenerate({ slug }: { slug: string }) {
  const resolved = useResolvedIO();
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (resolved.status !== "ready") return;
    if (!isSafeSlug(slug)) return;
    let cancelled = false;
    const dir = projectDir(resolved.root, slug);
    void resolved.io
      .readText(resolved.io.join(dir, "project-status.md"))
      .then((text) => {
        if (!cancelled) {
          setCurrentStatus(text);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, resolved]);

  if (resolved.status === "loading") return <Loading />;
  if (resolved.status === "no-root") {
    return <p className="text-sm text-muted-foreground">Geen projectroot ingesteld.</p>;
  }
  if (!loaded) return <Loading />;

  const ai = deriveAiStatus(resolved.appConfig);

  return (
    <>
      <StatusGeneratorForm
        slug={slug}
        currentStatus={currentStatus}
        aiEnabled={ai.enabled}
        aiReason={ai.enabled ? null : ai.reason}
        provider={ai.enabled ? ai.ai.provider : ai.provider}
        model={ai.enabled ? ai.ai.model : ai.model}
        baseURL={ai.enabled ? ai.ai.baseURL : ai.baseURL}
      />
      <p className="text-xs text-muted-foreground mt-6">
        <Link href={`/projects/${slug}`} className="hover:underline">
          ← terug naar project
        </Link>
      </p>
    </>
  );
}

function Loading() {
  return (
    <div className="text-sm text-muted-foreground py-12 text-center">
      Laden…
    </div>
  );
}
