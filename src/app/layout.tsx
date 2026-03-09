import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import {
  generateLocalBusinessSchema,
  generateMedicalBusinessSchema,
} from "@/lib/structured-data";
import CookieConsent from "@/components/CookieConsent";
import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import TrackingProvider from "@/components/TrackingProvider";
import { PublicHeader, PublicFooter } from "@/components/PublicShell";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aestheticloungeofficial.com"),
  title: {
    default: "Aesthetic Lounge — Premium Medical Aesthetics in Lahore",
    template: "%s | Aesthetic Lounge",
  },
  description:
    "Lahore's premier medical aesthetics clinic at Plaza-126, BWB Phase 8, DHA Lahore Cantt. 80+ treatments including HydraFacial, Botox, fillers, laser hair removal & body contouring. Expert doctors delivering personalized care.",
  keywords: [
    "medical aesthetics Lahore",
    "aesthetic clinic DHA",
    "HydraFacial Lahore",
    "Botox Lahore",
    "dermal fillers Lahore",
    "laser hair removal Lahore",
    "skin clinic DHA Phase 8",
    "Dr Huma",
    "Dr Zulfiqar",
    "Dr Zonera",
    "Aesthetic Lounge",
    "body contouring Lahore",
    "PRP treatment Lahore",
    "chemical peel Lahore",
  ],
  authors: [{ name: "Aesthetic Lounge Official" }],
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aestheticloungeofficial.com",
    siteName: "Aesthetic Lounge",
    title: "Aesthetic Lounge — Premium Medical Aesthetics in Lahore",
    description:
      "80+ treatments. Expert care. DHA Phase 8, Lahore. Book your consultation today.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Aesthetic Lounge — Premium Medical Aesthetics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aesthetic Lounge — Premium Medical Aesthetics in Lahore",
    description:
      "80+ treatments. Expert care. DHA Phase 8, Lahore. Book your consultation today.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://aestheticloungeofficial.com",
  },
};

const localBusinessJsonLd = generateLocalBusinessSchema();
const medicalBusinessJsonLd = generateMedicalBusinessSchema();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalBusinessJsonLd) }}
        />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${cormorant.variable} font-sans antialiased`}
      >
        <MetaPixel />
        <GoogleAnalytics />
        <TrackingProvider>
          <PublicHeader />
          {children}
          <PublicFooter />
        </TrackingProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
