import { tagColor, type TagColorKey } from "@/lib/tag-colors";

export function TagPill({
  name,
  color,
  onClick,
  onRemove,
  href,
  size = "sm",
}: {
  name: string;
  color?: TagColorKey | string | null;
  onClick?: () => void;
  onRemove?: () => void;
  href?: string;
  size?: "sm" | "md";
}) {
  const c = tagColor(name, color);
  const style = { backgroundColor: c.bg, color: c.text, borderColor: c.border };
  const pad = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";

  const content = (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 rounded-pill border font-medium ${pad}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: c.dot }}
      />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="ml-0.5 rounded-full px-1 leading-none hover:opacity-70"
          aria-label={`Quitar ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="inline-flex">
        {content}
      </button>
    );
  }
  return content;
}
