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
    "Lahore's premier medical aesthetics clinic in DHA Phase 7. 80+ treatments including HydraFacial, Botox, fillers, laser hair removal & body contouring. Led by Dr. Huma Abbas.",
  keywords: [
    "medical aesthetics Lahore",
    "aesthetic clinic DHA",
    "HydraFacial Lahore",
    "Botox Lahore",
    "dermal fillers Lahore",
    "laser hair removal Lahore",
    "skin clinic DHA Phase 7",
    "Dr Huma Abbas",
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
      "80+ treatments. Expert care. DHA Phase 7, Lahore. Book your consultation today.",
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
      "80+ treatments. Expert care. DHA Phase 7, Lahore. Book your consultation today.",
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
    "Premium medical aesthetics clinic offering 80+ treatments in DHA Phase 7, Lahore. Led by Dr. Huma Abbas.",
  telephone: "+92-XXX-XXXXXXX",
  address: {
    "@type": "PostalAddress",
    streetAddress: "DHA Phase 7",
    addressLocality: "Lahore",
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
      opens: "11:00",
      closes: "20:00",
    },
  ],
  medicalSpecialty: "Dermatology",
  priceRange: "$$",
  sameAs: [
    "https://www.instagram.com/aestheticloungeofficial",
    "https://www.facebook.com/aestheticloungeofficial",
  ],
  founder: {
    "@type": "Person",
    name: "Dr. Huma Abbas",
    jobTitle: "Medical Director",
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
