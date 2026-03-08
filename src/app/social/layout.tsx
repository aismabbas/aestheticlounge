import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Gallery | Aesthetic Lounge Official",
  description:
    "Browse our Instagram feed and see the latest treatments, transformations, and behind-the-scenes at Aesthetic Lounge, Lahore's premier medical aesthetics clinic.",
  openGraph: {
    title: "Social Gallery | Aesthetic Lounge Official",
    description:
      "Browse our Instagram feed and see the latest treatments and transformations at Aesthetic Lounge.",
    url: "https://aestheticloungeofficial.com/social",
  },
};

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
