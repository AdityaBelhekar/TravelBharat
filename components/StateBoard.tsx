import type { LocalName } from "@/lib/queries.ts";

const SIZES = {
  lg: { en: "text-[clamp(3rem,8vw,6.5rem)]", scripts: "text-[clamp(1.25rem,2.6vw,2rem)]", pad: "px-6 pb-6 pt-5" },
  md: { en: "text-[clamp(2.75rem,6vw,4.75rem)]", scripts: "text-[clamp(1.125rem,2vw,1.625rem)]", pad: "px-5 pb-5 pt-4" },
  sm: { en: "text-[1.75rem]", scripts: "text-base type-small-print", pad: "px-3 pb-3 pt-2.5" },
};

// A state's name lettered like an Indian railway platform board: the regional script and Hindi above,
// English below. The one bold element of the design (see DESIGN.md). Use `as` to make it the page heading.
export function StateBoard({
  name,
  localName,
  size = "lg",
  as: Tag = "div",
  className = "",
  posts = false,
}: {
  name: string;
  localName: LocalName;
  size?: keyof typeof SIZES;
  as?: "div" | "h1" | "h2" | "h3";
  className?: string;
  /** Stand the board on two posts, as on a real platform. It needs to sit at the bottom edge of its section. */
  posts?: boolean;
}) {
  const s = SIZES[size];
  const board = (
    <Tag className={`block rounded bg-yellow p-2 text-center text-board-ink ${className}`}>
      <span className={`grid gap-2 rounded-sm border-2 border-board-ink ${s.pad}`}>
        <span className={`flex flex-wrap justify-center gap-x-7 gap-y-1 font-semibold leading-tight ${s.scripts}`}>
          {localName.regional && (
            <span lang={localName.lang} dir={localName.dir}>
              {localName.regional}
            </span>
          )}
          <span lang="hi">{localName.hi}</span>
        </span>
        <span className={`type-board text-balance ${s.en}`}>{name}</span>
      </span>
    </Tag>
  );
  if (!posts) return board;
  return (
    <div>
      {board}
      <div aria-hidden className="flex justify-around px-[12%]">
        <span className="h-7 w-2.5 bg-board-ink" />
        <span className="h-7 w-2.5 bg-board-ink" />
      </div>
    </div>
  );
}
