import Link from "next/link";
import { JsonLd, SITE_URL } from "./JsonLd.tsx";

// Visible breadcrumbs plus the matching BreadcrumbList for search results.
// The last item is the current page; pass its `href` too so search engines get its URL.
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  const trail = [{ name: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            ...(item.href && { item: new URL(item.href, SITE_URL).href }),
          })),
        }}
      />
    </nav>
  );
}
