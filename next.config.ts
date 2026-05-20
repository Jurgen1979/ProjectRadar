import type { NextConfig } from "next";

const isDesktopBuild = process.env.PR_BUILD_TARGET === "desktop";

const nextConfig: NextConfig = {
  // When building for the Tauri desktop installer we need a fully static
  // export — no Node server runs inside the webview.
  output: isDesktopBuild ? "export" : undefined,
  // Static export needs trailing slashes so Tauri's file:// loader finds
  // index.html inside each route directory.
  trailingSlash: isDesktopBuild ? true : undefined,
  // Tauri webview serves from the bundled directory. With static export
  // Next emits absolute /_next/... paths, which Tauri's tauri://
  // protocol resolves against the bundle root.
  images: { unoptimized: isDesktopBuild },
};

export default nextConfig;
