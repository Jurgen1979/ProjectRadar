import { buildTemplateGroups } from "./templates-data";
import { TemplatesList } from "./templates-list";

export default function TemplatesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const groups = buildTemplateGroups(today);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Kopieerbare prompts en file-templates. De prompts plak je in
          ChatGPT, Claude of Gemini om bruikbare projectupdates te krijgen.
          De file-templates zijn dezelfde die de app gebruikt bij{" "}
          <em>Project aanmaken</em> en <em>Herstel ontbrekende files</em>.
        </p>
      </header>
      <TemplatesList groups={groups} />
    </div>
  );
}
