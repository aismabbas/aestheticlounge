import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import AboutIntro from "@/components/AboutIntro";
import ServicesGrid from "@/components/ServicesGrid";
import StatsBar from "@/components/StatsBar";
import DoctorsSection from "@/components/DoctorsSection";
import BeforeAfter from "@/components/BeforeAfter";
import Testimonials from "@/components/Testimonials";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Marquee />
      <AboutIntro />
      <ServicesGrid />
      <StatsBar />
      <DoctorsSection />
      <BeforeAfter />
      <Testimonials />
      <CTABanner />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
