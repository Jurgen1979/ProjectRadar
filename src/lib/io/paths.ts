/**
 * Browser-safe path + slug helpers.
 *
 * All paths are normalized to forward slashes internally. Tauri's
 * plugin-fs accepts forward-slash paths on all platforms, and node:fs
 * does too — so this is portable.
 *
 * Windows drive letters (C:, D:) are preserved at the start of an
 * absolute path.
 */

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function isSafeSlug(slug: string): boolean {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug.length <= 80 &&
    SLUG_PATTERN.test(slug)
  );
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

/** Join path segments with forward slashes. Preserves leading drive letter or /. */
export function joinPath(...parts: string[]): string {
  const cleaned = parts
    .filter((p) => p && p.length > 0)
    .map((p) => p.replace(/\\/g, "/"));
  if (cleaned.length === 0) return "";

  const first = cleaned[0];
  const rest = cleaned
    .slice(1)
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);

  const base = first.replace(/\/+$/g, "");
  if (rest.length === 0) return base;
  return base + "/" + rest.join("/");
}

/** Basename — last segment after / or \. */
export function basename(p: string): string {
  const norm = p.replace(/\\/g, "/").replace(/\/+$/, "");
  const idx = norm.lastIndexOf("/");
  return idx === -1 ? norm : norm.slice(idx + 1);
}

/** Directory name. */
export function dirname(p: string): string {
  const norm = p.replace(/\\/g, "/").replace(/\/+$/, "");
  const idx = norm.lastIndexOf("/");
  return idx === -1 ? "" : norm.slice(0, idx);
}

/**
 * Collapse "./" and "../" segments. Does not resolve symlinks.
 * Used only for traversal-safety checks, not for actual file access.
 */
export function normalizePath(p: string): string {
  const norm = p.replace(/\\/g, "/");
  const isAbsolute = norm.startsWith("/") || /^[A-Za-z]:\//.test(norm);
  let prefix = "";
  let rest = norm;
  if (norm.startsWith("/")) {
    prefix = "/";
    rest = norm.slice(1);
  } else if (/^[A-Za-z]:\//.test(norm)) {
    prefix = norm.slice(0, 3);
    rest = norm.slice(3);
  }
  const parts = rest.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (out.length > 0) out.pop();
      else if (!isAbsolute) out.push("..");
      continue;
    }
    out.push(part);
  }
  const joined = out.join("/");
  if (!joined) return prefix || ".";
  return prefix + joined;
}

/**
 * Resolve segments under a root and verify the result does not escape via
 * "..". Throws when the resolved path is outside root.
 */
export function resolveUnderRoot(root: string, ...segments: string[]): string {
  const target = joinPath(root, ...segments);
  const normRoot = normalizePath(root);
  const normTarget = normalizePath(target);
  if (
    normTarget !== normRoot &&
    !normTarget.startsWith(normRoot + "/")
  ) {
    throw new Error(`Pad valt buiten projectroot: ${target}`);
  }
  return target;
}

/** Resolve the project directory for a slug under root. Validates the slug. */
export function projectDir(root: string, slug: string): string {
  if (!isSafeSlug(slug)) {
    throw new Error(`Onveilige of ongeldige slug: ${slug}`);
  }
  return resolveUnderRoot(root, "projects", slug);
}
