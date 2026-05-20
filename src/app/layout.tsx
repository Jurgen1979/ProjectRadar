import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ConfigBanner } from "@/components/config-banner";
import { AppConfigProvider } from "@/components/app-config-provider";
import { TauriWelcomeGuard } from "@/components/tauri-welcome-guard";
import { WebOnly } from "@/components/web-only";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Projectradar",
  description: "Local-first projectdashboard op markdown en JSON",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppConfigProvider>
          <TauriWelcomeGuard />
          <header className="border-b border-border bg-background">
            <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
              <Link
                href="/projects"
                className="text-sm font-semibold tracking-tight"
              >
                Projectradar
              </Link>
              <Nav />
            </div>
          </header>
          <WebOnly>
            <ConfigBanner />
          </WebOnly>
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
          </main>
          <footer className="border-t border-border text-xs text-muted-foreground">
            <div className="mx-auto max-w-6xl px-6 py-3">
              local-first · markdown + json · v0.1
            </div>
          </footer>
        </AppConfigProvider>
      </body>
    </html>
  );
}
