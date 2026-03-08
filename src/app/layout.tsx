import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "Aesthetic Lounge",
  alternateName: "Aesthetic Lounge Official",
  url: "https://aestheticloungeofficial.com",
  logo: "https://aestheticloungeofficial.com/logo.png",
  image: "https://aestheticloungeofficial.com/og-image.jpg",
  description:
    "Premium medical aesthetics clinic offering 80+ treatments at Plaza-126, BWB Phase 8, DHA Lahore Cantt. Expert doctors delivering personalized care with advanced solutions.",
  telephone: "+92-327-6620000",
  email: "info@aestheticloungeofficial.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plaza-126, BWB Phase 8",
    addressLocality: "DHA Lahore Cantt",
    addressRegion: "Punjab",
    addressCountry: "PK",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 31.4697,
    longitude: 74.3762,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "21:00",
    },
  ],
  medicalSpecialty: "Dermatology",
  priceRange: "$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "1000",
    bestRating: "5",
  },
  sameAs: [
    "https://instagram.com/aestheticloungeofficial/",
    "https://facebook.com/people/Aestheticloungeofficial/61567387603705/",
    "https://youtube.com/@aestheticloungeofficial",
  ],
  founder: {
    "@type": "Person",
    name: "Dr. Huma",
    jobTitle: "Aesthetic Physician",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${cormorant.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
