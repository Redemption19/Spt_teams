import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="space-y-6 pt-20">{children}</main>
      <Footer />
    </div>
  );
} 