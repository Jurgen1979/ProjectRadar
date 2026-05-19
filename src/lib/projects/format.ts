/**
 * Tiny formatting helpers used by the dashboard. Pure, no IO.
 */

export function formatAge(ageDays: number | null): string {
  if (ageDays === null) return "geen update";
  if (ageDays <= 0) return "vandaag";
  if (ageDays === 1) return "1 dag geleden";
  if (ageDays < 14) return `${ageDays} dagen geleden`;
  if (ageDays < 60) {
    const weeks = Math.floor(ageDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weken"} geleden`;
  }
  const months = Math.floor(ageDays / 30);
  return `${months} ${months === 1 ? "maand" : "maanden"} geleden`;
}

export function truncate(input: string | null | undefined, max: number): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}
