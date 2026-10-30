import Link from "next/link";

// The logo is a small platform board: ट्रैवल भारत above TRAVELBHARAT.
export function Logo({ href = "/", label = "TravelBharat home" }: { href?: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className="inline-block shrink-0 rounded-[3px] bg-yellow p-[3px] text-board-ink">
      <span className="grid rounded-[2px] border-[1.5px] border-board-ink px-2.5 pb-1 pt-0.5 text-center leading-none">
        <span lang="hi" className="type-small-print text-[0.6875rem] font-semibold">
          ट्रैवल भारत
        </span>
        <span className="type-board text-lg">TravelBharat</span>
      </span>
    </Link>
  );
}
