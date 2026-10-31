import Image from "next/image";
import { CategorySymbol } from "./CategorySymbol.tsx";

type Props = {
  image?: { url: string; alt: string };
  name: string;
  category?: { slug: string; name: string };
  sizes: string;
  priority?: boolean;
  className?: string;
};

// Cards are small, so they use a lower quality; a priority image is the page's lead photo.

// The place's photo, or a quiet placeholder with its category symbol until a photo is added.
export function PlaceImage({ image, name, category, sizes, priority, className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-sm bg-surface ${className}`}>
      {image ? (
        <Image src={image.url} alt={image.alt} fill sizes={sizes} priority={priority} quality={priority ? 75 : 60} className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
      ) : (
        <div role="img" aria-label={`${name} (photo coming soon)`} className="absolute inset-0 grid place-items-center">
          {category && <CategorySymbol slug={category.slug} name={category.name} className="size-10 opacity-40" />}
        </div>
      )}
    </div>
  );
}
