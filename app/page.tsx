import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import Partners from '@/components/landing/Partners'
import FeatureStats from '@/components/landing/FeatureStats'
import FeaturesShowcase from '@/components/landing/FeaturesShowcase'
import FeatureDetails from '@/components/landing/FeatureDetails'
import ProductivityHighlight from '@/components/landing/ProductivityHighlight'
import ScreenshotsCarousel from '@/components/landing/ScreenshotsCarousel'
import Testimonials from '@/components/landing/Testimonials'
import PricingPlans from '@/components/landing/PricingPlans'
import CallToAction from '@/components/landing/CallToAction'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
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
  )
}