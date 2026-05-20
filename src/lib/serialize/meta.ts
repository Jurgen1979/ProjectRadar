import type { ProjectMeta } from "@/lib/schema/meta";

/**
 * Serialize meta to stable, pretty JSON. Keys in a fixed order so the
 * file stays diff-friendly when written from different places.
 */
const ORDER: Array<keyof ProjectMeta> = [
  "id",
  "name",
  "client",
  "type",
  "status",
  "phase",
  "priority",
  "tags",
  "waitingOn",
  "nextAction",
  "riskLevel",
  "lastUpdated",
  "createdAt",
];

export function serializeMeta(meta: ProjectMeta): string {
  const ordered: Record<string, unknown> = {};
  for (const key of ORDER) {
    const value = meta[key];
    if (value === undefined) continue;
    ordered[key] = value;
  }
  return JSON.stringify(ordered, null, 2) + "\n";
}
