import type { Metadata } from "next";
import {
  Anek_Bangla,
  Anek_Devanagari,
  Anek_Gujarati,
  Anek_Gurmukhi,
  Anek_Kannada,
  Anek_Latin,
  Anek_Malayalam,
  Anek_Odia,
  Anek_Tamil,
  Anek_Telugu,
  Noto_Naskh_Arabic,
  Noto_Sans_Meetei_Mayek,
  Noto_Serif_Tibetan,
} from "next/font/google";
import "./globals.css";

// Anek (EkType) covers Latin and ten Indian scripts with one design. Only Latin is preloaded, as a variable
// font for the width axis. The scripts appear only on boards, so each loads just its semibold weight (a full
// variable Devanagari font is ~700 KB), and only when a page shows that script, e.g. Malayalam on Kerala's board.
const latin = Anek_Latin({ variable: "--font-anek-latin", subsets: ["latin"], axes: ["wdth"] });
const devanagari = Anek_Devanagari({ variable: "--font-anek-devanagari", subsets: ["devanagari"], weight: "600", preload: false });
const tamil = Anek_Tamil({ variable: "--font-anek-tamil", subsets: ["tamil"], weight: "600", preload: false });
const malayalam = Anek_Malayalam({ variable: "--font-anek-malayalam", subsets: ["malayalam"], weight: "600", preload: false });
const bangla = Anek_Bangla({ variable: "--font-anek-bangla", subsets: ["bengali"], weight: "600", preload: false });
const telugu = Anek_Telugu({ variable: "--font-anek-telugu", subsets: ["telugu"], weight: "600", preload: false });
const kannada = Anek_Kannada({ variable: "--font-anek-kannada", subsets: ["kannada"], weight: "600", preload: false });
const gujarati = Anek_Gujarati({ variable: "--font-anek-gujarati", subsets: ["gujarati"], weight: "600", preload: false });
const gurmukhi = Anek_Gurmukhi({ variable: "--font-anek-gurmukhi", subsets: ["gurmukhi"], weight: "600", preload: false });
const odia = Anek_Odia({ variable: "--font-anek-odia", subsets: ["oriya"], weight: "600", preload: false });
const urdu = Noto_Naskh_Arabic({ variable: "--font-noto-urdu", subsets: ["arabic"], weight: "600", preload: false });
const tibetan = Noto_Serif_Tibetan({ variable: "--font-noto-tibetan", subsets: ["tibetan"], weight: "600", preload: false });
const meitei = Noto_Sans_Meetei_Mayek({ variable: "--font-noto-meitei", subsets: ["meetei-mayek"], weight: "600", preload: false });
const scripts = [devanagari, tamil, malayalam, bangla, telugu, kannada, gujarati, gurmukhi, odia, urdu, tibetan, meitei];

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "TravelBharat: Explore India State by State",
    template: "%s · TravelBharat",
  },
  description:
    "Discover tourist places across all 28 states and 8 union territories of India: heritage, nature, religious and adventure destinations with verified travel details.",
  openGraph: { siteName: "TravelBharat", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${latin.variable} ${scripts.map((f) => f.variable).join(" ")} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded bg-brand px-4 py-2 font-medium text-on-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
