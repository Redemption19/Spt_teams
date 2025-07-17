import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <div className="relative z-10">
      <main className="px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Avatars with arrows */}
            <div className="flex justify-center items-center mb-8 relative h-20">
              <div className="absolute left-1/4 top-0 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-primary" />
                </div>
                <svg width="48" height="48" className="-mt-2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44V4M24 4l-12 12M24 4l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="absolute right-1/4 top-0 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-primary" />
                </div>
                <svg width="48" height="48" className="-mt-2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44V4M24 4l-12 12M24 4l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Organize Work, Set Priorities,<br />and Get Results Faster
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Empower your team to stay focused on high-impact tasks with adjustable priorities,
              deadlines, and manage meetings with your team project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" passHref legacyBehavior>
                <a className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-accent transition-colors font-semibold shadow-lg border-2 border-white/10">
                  Register
                </a>
              </Link>
              <Link href="/auth/action" passHref legacyBehavior>
                <a className="bg-white text-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold shadow-lg border-2 border-white/10">
                  Login
                </a>
              </Link>
            </div>
          </div>
          {/* Dashboard Preview Image */}
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-5xl w-full -mb-24 relative z-20">
              <Image
                src="/images/hero-screenshot.png"
                alt="System Screenshot"
                width={1200}
                height={400}
                className="w-full rounded-xl object-cover min-h-[300px] max-h-[400px]"
                style={{ background: '#f3f4f6' }}
                priority
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HeroSection; 