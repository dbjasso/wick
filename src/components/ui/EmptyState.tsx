export function EmptyState({
  title,
  help,
  className,
}: {
  title: string;
  help?: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-card border border-dashed border-border-strong bg-surface px-6 py-12 text-center",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-sm font-medium text-text">{title}</p>
      {help && <p className="mx-auto mt-1 max-w-xs text-sm text-text-2">{help}</p>}
    </div>
  );
}
