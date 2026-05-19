import { renderBlocks } from "@/lib/markdown/render-blocks";

export function MarkdownBlocks({ body, empty }: { body: string | null; empty?: string }) {
  const trimmed = body?.trim() ?? "";
  if (!trimmed) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {empty ?? "Geen inhoud."}
      </p>
    );
  }
  const blocks = renderBlocks(trimmed);
  return (
    <div className="space-y-2 text-sm leading-6">
      {blocks.map((b, i) => {
        if (b.kind === "list") {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {b.lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}

export function ListBlock({ items, empty }: { items: string[]; empty?: string }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {empty ?? "Niets ingevuld."}
      </p>
    );
  }
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm leading-6">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function TextBlock({ text, empty }: { text: string | null; empty?: string }) {
  const t = text?.trim() ?? "";
  if (!t) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {empty ?? "Niet ingevuld."}
      </p>
    );
  }
  return <p className="text-sm leading-6 whitespace-pre-wrap">{t}</p>;
}
