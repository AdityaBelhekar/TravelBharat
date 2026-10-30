import type { LocalName } from "@/lib/queries.ts";

const SIZES = {
  lg: { en: "text-[clamp(3rem,8vw,6.5rem)]", scripts: "text-[clamp(1.25rem,2.6vw,2rem)]", pad: "px-6 pb-6 pt-5" },
  md: { en: "text-[clamp(2.75rem,6vw,4.75rem)]", scripts: "text-[clamp(1.125rem,2vw,1.625rem)]", pad: "px-5 pb-5 pt-4" },
  sm: { en: "text-[1.75rem]", scripts: "text-base", pad: "px-3 pb-3 pt-2.5" },
};

// A state's name lettered like an Indian railway platform board: the regional script and Hindi above,
// English below. The one bold element of the design (see DESIGN.md). Use `as` to make it the page heading.
export function StateBoard({
  name,
  localName,
  size = "lg",
  as: Tag = "div",
  className = "",
}: {
  name: string;
  localName: LocalName;
  size?: keyof typeof SIZES;
  as?: "div" | "h1" | "h2" | "h3";
  className?: string;
}) {
  const s = SIZES[size];
  return (
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
}
