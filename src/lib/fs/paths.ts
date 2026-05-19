import "server-only";
import path from "node:path";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function isSafeSlug(slug: string): boolean {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 80 && SLUG_PATTERN.test(slug);
}

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Resolve a path under root and verify it doesn't escape via .. or symlinks.
 * Throws when the resolved path is outside root.
 */
export function resolveUnderRoot(root: string, ...segments: string[]): string {
  const absRoot = path.resolve(root);
  const target = path.resolve(absRoot, ...segments);
  const rel = path.relative(absRoot, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Pad valt buiten projectroot: ${target}`);
  }
  return target;
}

export function projectDir(root: string, slug: string): string {
  if (!isSafeSlug(slug)) {
    throw new Error(`Onveilige of ongeldige slug: ${slug}`);
  }
  return resolveUnderRoot(root, "projects", slug);
}
