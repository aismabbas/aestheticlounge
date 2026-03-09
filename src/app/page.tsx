import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import AboutIntro from "@/components/AboutIntro";
import ServicesGrid from "@/components/ServicesGrid";
import StatsBar from "@/components/StatsBar";
import DoctorsSection from "@/components/DoctorsSection";
import BeforeAfter from "@/components/BeforeAfter";
import Testimonials from "@/components/Testimonials";
import Promotions from "@/components/Promotions";
import InstagramFeed from "@/components/InstagramFeed";
import CTABanner from "@/components/CTABanner";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <AboutIntro />
      <ServicesGrid />
      <StatsBar />
      <DoctorsSection />
      <BeforeAfter />
      <Testimonials />
      <Promotions />
      <InstagramFeed />
      <CTABanner />
      <WhatsAppButton />
    </>
  );
}
