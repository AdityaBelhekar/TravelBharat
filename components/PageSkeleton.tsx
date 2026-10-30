// Shown while a page's content streams in (only for pages not prerendered at build time).
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[77.5rem] animate-pulse px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-40 rounded bg-border" />
      <div className="mt-6 h-10 w-2/3 rounded bg-border" />
      <div className="mt-4 h-4 w-full max-w-2xl rounded bg-border" />
      <div className="mt-2 h-4 w-full max-w-xl rounded bg-border" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/3] rounded-sm bg-surface" />
        ))}
      </div>
    </div>
  );
}
