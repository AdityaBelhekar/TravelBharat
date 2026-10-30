import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-[77.5rem] flex-1 flex-col items-start justify-center gap-4 px-4 py-24 sm:px-6">
      <p className="rounded-sm bg-yellow px-3 py-1 font-semibold text-board-ink">Page not found</p>
      <h1 className="type-title text-[clamp(2.5rem,5.5vw,4rem)]">This platform doesn&apos;t exist.</h1>
      <p className="text-muted">The place may have moved, or the link may be mistyped.</p>
      <Link href="/states" className="inline-flex h-12 items-center rounded bg-brand px-6 font-semibold text-on-brand hover:opacity-90">
        Browse all states
      </Link>
    </main>
  );
}
