import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "What TravelBharat is, where its information comes from and how it is checked.",
  alternates: { canonical: "/about" },
};

const sections = [
  {
    title: "What this is",
    body: "TravelBharat is a guide to tourist places across all 28 states and 8 union territories of India. Each place has its history, the best months to visit, timings, entry fees, a map and nearby attractions, organised by state and city so you can plan a trip region by region.",
  },
  {
    title: "Where the information comes from",
    body: "Every place lists its sources at the bottom of its page: official tourism and Archaeological Survey of India sites, UNESCO listings and encyclopaedia entries. Photos come from Wikimedia Commons under free licences, and each one names its photographer and licence.",
  },
  {
    title: "Why the yellow boards",
    body: "Every railway station in India announces its name on a yellow board, in the regional script, in Hindi and in English. TravelBharat introduces each state the same way, so Kerala appears as കേരളം, केरल and KERALA. The lettering is Anek, a typeface designed in India by EkType for Latin and ten Indian scripts.",
  },
  {
    title: "How it is checked",
    body: "New and edited places go through a review step before they are published: an editor checks the facts against the listed sources and the location on the map. Fees and timings change, so please confirm them with the official site before you travel.",
  },
  {
    title: "The map",
    body: "State boundaries on the home page map come from the DataMeet community's state layer, which follows the official Survey of India map, including Jammu & Kashmir and Ladakh.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="type-title text-[clamp(2.5rem,5.5vw,4rem)]">About TravelBharat</h1>
      <div className="mt-8 flex flex-col gap-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="type-section mb-2 text-[1.75rem]">{s.title}</h2>
            <p className="text-lg leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
      <Link
        href="/explore"
        className="mt-10 inline-flex h-12 items-center rounded bg-brand px-6 font-semibold text-on-brand hover:opacity-90"
      >
        Start exploring
      </Link>
    </div>
  );
}
