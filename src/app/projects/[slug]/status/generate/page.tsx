import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAiStatus, getConfigStatus } from "@/lib/config";
import { isSafeSlug, projectDir } from "@/lib/fs/paths";
import { NoRootState } from "@/components/projects/empty-state";
import { StatusGeneratorForm } from "./form";

export default async function GenerateStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) notFound();

  const cfg = getConfigStatus();
  if (cfg.kind !== "ok") return <NoRootState message={cfg.message} />;

  const dir = projectDir(cfg.root, slug);
  try {
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) notFound();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err;
  }

  let currentStatus: string | null = null;
  try {
    currentStatus = await fs.readFile(
      path.join(dir, "project-status.md"),
      "utf8",
    );
  } catch {
    /* missing is fine */
  }

  const ai = getAiStatus(cfg.config);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">
          projecten / {slug} / status genereren
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nieuwe status laten voorstellen
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          AI leest <code className="font-mono">project.meta.json</code>,{" "}
          <code className="font-mono">project-status.md</code>,{" "}
          <code className="font-mono">project-log.md</code>,{" "}
          <code className="font-mono">decision-log.md</code> en de laatste
          updates, en stelt een nieuwe status voor. De huidige status wordt
          pas overschreven als jij goedkeurt. De oude versie wordt gebackupt
          in <code className="font-mono">/exports/status-backups/</code>.
        </p>
      </header>

      <StatusGeneratorForm
        slug={slug}
        currentStatus={currentStatus}
        aiEnabled={ai.enabled}
        aiReason={ai.enabled ? null : ai.reason}
        provider={ai.provider}
        model={ai.model}
        baseURL={ai.baseURL}
      />

      <p className="text-xs text-muted-foreground">
        <Link href={`/projects/${slug}`} className="hover:underline">
          ← terug naar project
        </Link>
      </p>
    </div>
  );
}
