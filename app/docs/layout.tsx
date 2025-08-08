'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sidebarGroups } from '../../docs/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, X, BookOpen } from 'lucide-react';

import { DocsProviders } from './providers';
import { DocsSearchTrigger } from '@/components/docs-search';
import { MobileToc } from '@/components/docs/mobile-toc';
import { DocsNavigation } from '@/components/docs/docs-navigation';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  const isActive = (path: string) => pathname === path;

  // Handle swipe gestures for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const deltaX = touchCurrentX.current - touchStartX.current;
      const threshold = 100; // Minimum swipe distance

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && touchStartX.current < 50) {
          // Swipe right from left edge - open sidebar
          setSidebarOpen(true);
        } else if (deltaX < 0 && sidebarOpen) {
          // Swipe left when sidebar is open - close sidebar
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-50 h-screen w-80 bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:fixed lg:z-auto lg:h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-xl lg:shadow-none
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <Link href="/docs/introduction" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SPT Teams Docs
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <div className="p-6 space-y-4">
            <DocsSearchTrigger />
            
            {/* Mobile quick actions */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Quick Navigation</span>
              <span className="bg-muted px-2 py-1 rounded text-xs">
                {sidebarGroups.flatMap(g => g.items).length} pages
              </span>
            </div>
          </div>
          <nav className="px-6 pb-6 space-y-6">
            {sidebarGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={itemIndex}
                        href={item.path}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg text-sm transition-all duration-200
                          ${isActive(item.path)
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:shadow-sm'
                          }
                          active:scale-95 touch-manipulation
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.title}</span>
                          {isActive(item.path) && (
                            <span className="text-xs text-primary/70 block text-left">Currently viewing</span>
                          )}
                        </div>
                        {isActive(item.path) && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-80 min-h-screen flex flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border lg:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-primary/10"
              >
                <Menu className="h-4 w-4" />
                <span className="ml-2 font-medium">Menu</span>
              </Button>
            </div>
            <Link href="/docs/introduction" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">SPT Teams Docs</span>
            </Link>
          </div>
          
          {/* Mobile breadcrumb */}
          <div className="px-4 pb-2">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Link href="/docs/introduction" className="hover:text-primary transition-colors">
                Docs
              </Link>
              {pathname !== '/docs/introduction' && (
                <>
                  <span>/</span>
                  <span className="text-foreground font-medium truncate">
                    {sidebarGroups
                      .flatMap(group => group.items)
                      .find(item => item.path === pathname)?.title || 'Current Page'}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:pl-8 lg:pr-12 lg:py-8 lg:mx-auto lg:max-w-6xl">
          <DocsProviders>
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
              {children}
              <DocsNavigation />
            </div>
          </DocsProviders>
          <MobileToc />
        </main>
      </div>
    </div>
  );
}