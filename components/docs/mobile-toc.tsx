'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { List, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface MobileTocProps {
  className?: string;
}

export function MobileToc({ className }: MobileTocProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Extract headings from the current page
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      // Create an id if it doesn't exist
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }

      const level = parseInt(heading.tagName.charAt(1));
      items.push({
        id: heading.id,
        title: heading.textContent || '',
        level,
      });
    });

    setTocItems(items);

    // Set up intersection observer for active heading tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0.5,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setIsOpen(false);
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("lg:hidden", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 bg-background shadow-lg border-border/40 backdrop-blur-sm"
          >
            <List className="h-4 w-4 mr-2" />
            Contents
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[340px]">
          <SheetHeader>
            <SheetTitle className="text-left">Table of Contents</SheetTitle>
            <SheetDescription className="text-left">
              Jump to any section on this page
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "flex items-center w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  activeId === item.id
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground",
                  item.level > 1 && "ml-4",
                  item.level > 2 && "ml-8",
                  item.level > 3 && "ml-12"
                )}
              >
                <ChevronRight 
                  className={cn(
                    "h-3 w-3 mr-2 flex-shrink-0 transition-transform",
                    activeId === item.id ? "rotate-90" : "rotate-0"
                  )} 
                />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
          
          {/* Quick actions */}
          <div className="mt-8 pt-4 border-t border-border">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setIsOpen(false);
                }}
              >
                <ChevronRight className="h-3 w-3 mr-2 -rotate-90" />
                Back to top
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileToc;
