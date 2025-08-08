'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { sidebarGroups } from '../../docs/sidebar';
import { cn } from '@/lib/utils';

interface DocsNavigationProps {
  className?: string;
}

export function DocsNavigation({ className }: DocsNavigationProps) {
  const pathname = usePathname();
  
  // Flatten all navigation items
  const allItems = sidebarGroups.flatMap(group => group.items);
  
  // Find current page index
  const currentIndex = allItems.findIndex(item => item.path === pathname);
  
  // Get previous and next pages
  const prevPage = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextPage = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <div className={cn("mt-12 pt-8 border-t border-border", className)}>
      {/* Mobile Navigation */}
      <div className="lg:hidden space-y-3">
        {prevPage && (
          <Button asChild variant="outline" className="w-full h-auto p-4 justify-start">
            <Link href={prevPage.path}>
              <div className="flex items-center space-x-3">
                <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">Previous</div>
                  <div className="font-medium truncate">{prevPage.title}</div>
                </div>
              </div>
            </Link>
          </Button>
        )}
        
        {nextPage && (
          <Button asChild variant="outline" className="w-full h-auto p-4 justify-start">
            <Link href={nextPage.path}>
              <div className="flex items-center space-x-3">
                <div className="text-left min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Next</div>
                  <div className="font-medium truncate">{nextPage.title}</div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </div>
            </Link>
          </Button>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        {prevPage ? (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href={prevPage.path} className="block group">
                <div className="flex items-center space-x-3">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Previous</div>
                    <div className="font-medium group-hover:text-primary transition-colors">
                      {prevPage.title}
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div />
        )}

        {nextPage ? (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href={nextPage.path} className="block group">
                <div className="flex items-center justify-end space-x-3 text-right">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Next</div>
                    <div className="font-medium group-hover:text-primary transition-colors">
                      {nextPage.title}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default DocsNavigation;
