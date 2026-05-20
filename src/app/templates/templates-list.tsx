"use client";

import { useState } from "react";
import type { TemplateCard, TemplateGroup } from "./templates-data";
import { cn } from "@/lib/utils";

export function TemplatesList({ groups }: { groups: TemplateGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.title} className="space-y-3">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{g.title}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {g.description}
            </p>
          </header>
          <div className="space-y-4">
            {g.cards.map((c) => (
              <CardItem key={c.id} card={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CardItem({ card }: { card: TemplateCard }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(card.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <article className="rounded-lg border border-border bg-background overflow-hidden">
      <header className="flex items-baseline justify-between gap-3 px-4 py-2 border-b border-border bg-muted/30 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">{card.title}</h3>
          <p className="text-xs text-muted-foreground">{card.description}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "px-3 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted",
            copied ? "text-emerald-700 border-emerald-300" : "",
          )}
        >
          {copied ? "Gekopieerd ✓" : "Kopieer"}
        </button>
      </header>
      <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap p-4 max-h-[400px] overflow-y-auto">
        {card.body}
      </pre>
    </article>
  );
}
