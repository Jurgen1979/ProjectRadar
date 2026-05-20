import type { Project } from "@/types/project";

function fenced(body: string, lang: string = ""): string {
  return ["```" + lang, body.replace(/```/g, "``​`"), "```"].join("\n");
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body.trim() || "_(leeg)_"}\n`;
}

export function renderProjectMarkdown(opts: {
  project: Project;
  generatedAt: Date;
}): string {
  const p = opts.project;
  const ts = opts.generatedAt.toISOString().replace("T", " ").slice(0, 16);

  const meta = JSON.stringify(p.meta, null, 2);

  const parts: string[] = [];
  parts.push(`# project export — ${p.meta.name} (${p.slug})`);
  parts.push("");
  parts.push(`_Geëxporteerd op ${ts} uit \`${p.dir}\`._`);
  parts.push("");
  parts.push("## meta");
  parts.push("");
  parts.push(fenced(meta, "json"));

  parts.push("");
  parts.push(section("status", p.status?.raw ?? "_(geen project-status.md)_"));
  parts.push(section("links", p.links?.raw ?? "_(geen project-links.md)_"));
  parts.push(section("log", p.log?.raw ?? "_(geen project-log.md)_"));
  parts.push(
    section("decisions", p.decisions?.raw ?? "_(geen decision-log.md)_"),
  );

  if (p.updates.length === 0) {
    parts.push("## updates");
    parts.push("");
    parts.push("_(geen updates)_");
  } else {
    parts.push(`## updates (${p.updates.length}, nieuwste eerst)`);
    parts.push("");
    for (const u of p.updates) {
      parts.push(`### ${u.filename}`);
      parts.push("");
      parts.push(u.raw.trim());
      parts.push("");
    }
  }

  if (p.sources.length > 0) {
    parts.push("## bronnen in /sources");
    parts.push("");
    for (const s of p.sources) parts.push(`- ${s}`);
    parts.push("");
  }

  if (p.warnings.length > 0) {
    parts.push("## waarschuwingen bij laden");
    parts.push("");
    for (const w of p.warnings) {
      parts.push(`- **${w.level}** \`${w.file}\`: ${w.message}`);
    }
    parts.push("");
  }

  return parts.join("\n") + "\n";
}
