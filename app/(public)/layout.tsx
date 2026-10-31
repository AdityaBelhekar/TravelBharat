import Link from "next/link";
import { Logo } from "@/components/Logo.tsx";
import { SearchBox } from "@/components/SearchBox.tsx";

const nav = [
  { href: "/states", label: "States" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
] as const;

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[77.5rem] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3.5 sm:px-6">
          <Logo />
          <SearchBox className="order-last w-full sm:order-none sm:w-auto sm:max-w-md sm:flex-1" />
          <nav aria-label="Main" className="ml-auto flex gap-6 font-medium">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>

      <footer className="mt-16 border-t-[6px] border-yellow bg-brand text-[0.9375rem] text-on-brand">
        <div className="mx-auto flex max-w-[77.5rem] flex-wrap justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="max-w-[60ch]">
            TravelBharat is a guide to tourist places in all 28 states and 8 union territories. Photos are from Wikimedia
            Commons, with the photographer and licence credited on each place page.
          </p>
          <nav aria-label="Footer" className="flex gap-6">
            <Link href="/states" className="underline underline-offset-4 hover:text-yellow">
              All states
            </Link>
            <Link href="/about" className="underline underline-offset-4 hover:text-yellow">
              About and sources
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
