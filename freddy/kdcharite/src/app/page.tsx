import HeroSection from "@/components/sections/HeroSection";
import ImpactSection from "@/components/sections/ImpactSection";
import HowItWorks from "@/components/sections/HowItWorks";
import FeaturedStories from "@/components/sections/FeaturedStories";
import PartnerShowcase from "@/components/sections/PartnerShowcase";
import TransparencyPreview from "@/components/sections/TransparencyPreview";
import CTASection from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ImpactSection />
      <HowItWorks />
      <FeaturedStories />
      <PartnerShowcase />
      <TransparencyPreview />
      <CTASection />
    </>
  );
}
