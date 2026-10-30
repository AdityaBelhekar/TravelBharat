// Categories are map-legend symbols: told apart by shape as well as colour (see DESIGN.md).
const SHAPES: Record<string, React.ReactNode> = {
  heritage: <rect x="1" y="1" width="10" height="10" />,
  nature: <path d="M6 .5 11.5 11H.5Z" />,
  religious: <circle cx="6" cy="6" r="5.3" />,
  adventure: <path d="M6 0 12 6 6 12 0 6Z" />,
};

export function CategorySymbol({ slug, name, className = "size-3" }: { slug: string; name: string; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" role="img" aria-label={name} className={`shrink-0 ${className}`} style={{ fill: `var(--cat-${slug}, currentColor)` }}>
      <title>{name}</title>
      {SHAPES[slug] ?? <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  );
}

// Symbol followed by its name, for filters and legends.
export function CategoryLabel({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 12 12" aria-hidden className="size-3 shrink-0" style={{ fill: `var(--cat-${slug}, currentColor)` }}>
        {SHAPES[slug] ?? <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      </svg>
      {name}
    </span>
  );
}
