export function Placeholder({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  next?: string;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-2xl text-sm leading-6">
        {description}
      </p>
      {next ? (
        <p className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Volgende fase:</span>
          <span>{next}</span>
        </p>
      ) : null}
    </div>
  );
}
