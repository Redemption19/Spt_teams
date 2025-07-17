import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const menuItems = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full border-b border-border fixed top-0 left-0 z-50 backdrop-blur-md bg-transparent">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          {/* You can replace with your logo image if available */}
          <span className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold">S</span>
          <span>Spt Teams</span>
        </Link>
        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-8 items-center text-base font-medium">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} className="hover:text-accent text-white transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        {/* Sign Up Button */}
        <Link href="/register" className="hidden md:inline-block px-6 py-2 rounded-full bg-white text-primary font-semibold shadow hover:bg-accent hover:text-white transition-colors ml-4">
          Sign Up
        </Link>
        {/* Mobile Hamburger */}
        <button className="md:hidden ml-2 p-2 rounded hover:bg-white/10" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </nav>
      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-background/90 border-t border-border px-4 py-4 space-y-2 shadow-lg">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block py-2 text-base font-medium hover:text-accent text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link href="/register" className="block mt-2 px-6 py-2 rounded-full bg-white text-primary font-semibold shadow hover:bg-accent hover:text-white transition-colors text-center">
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
} 