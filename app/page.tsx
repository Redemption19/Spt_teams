'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import Partners from '@/components/landing/Partners';
import FeatureStats from '@/components/landing/FeatureStats';
import FeaturesShowcase from '@/components/landing/FeaturesShowcase';
import FeatureDetails from '@/components/landing/FeatureDetails';
import ProductivityHighlight from '@/components/landing/ProductivityHighlight';
import ScreenshotsCarousel from '@/components/landing/ScreenshotsCarousel';
import Testimonials from '@/components/landing/Testimonials';
import PricingPlans from '@/components/landing/PricingPlans';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Gradient and hexagon background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary/80" />
        {/* Hexagon SVG */}
        <svg width="100%" height="100%" className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex" width="40" height="34.64" patternUnits="userSpaceOnUse">
              <polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#hex)" />
        </svg>
      </div>
      <div className="relative z-10">
        <Navbar />
        <main className="space-y-6 pt-20">
          <HeroSection />
          <Partners />
          <FeatureStats />
          <FeaturesShowcase />
          <FeatureDetails />
          <ProductivityHighlight />
          <ScreenshotsCarousel />
          <Testimonials />
          <PricingPlans />
          <CallToAction />
          <Footer />
        </main>
      </div>
    </div>
  );
}