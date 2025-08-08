'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { sidebarGroups } from '../docs/sidebar';

interface SearchResult {
  title: string;
  path: string;
  description: string;
  category: string;
}

const searchData: SearchResult[] = sidebarGroups.flatMap(group =>
  group.items.map(item => ({
    title: item.title,
    path: item.path,
    description: getPageDescription(item.title),
    category: group.title
  }))
);

function getPageDescription(title: string): string {
  const descriptions: Record<string, string> = {
    'Introduction': 'Welcome to SPT Teams platform overview and key features',
    'Getting Started': 'Quick setup guide for new users and workspace configuration',
    'Workspace Management': 'Hierarchical workspace setup and cross-workspace management',
    'Roles & Permissions': 'Role-based access control and granular permission management',
    'Team Management': 'Team creation, collaboration, and performance tracking',
    'Reporting & Analytics': 'Dynamic reporting and analytics features',
    'Document Management': 'File storage, organization, and collaboration',
    'Financial Management': 'Expenses, budgets, invoices, and financial tracking',
    'HR Management': 'Employee management, payroll, attendance, and recruitment',
    'Calendar & Tasks': 'Calendar management and task tracking',
    'AI Assistant': 'AI-powered intelligence and recommendations',
    'Security': 'Security features and best practices',
    'Troubleshooting & FAQs': 'Common issues and solutions',
    'Changelog': 'Platform updates and new features'
  };
  
  return descriptions[title] || 'Learn more about this feature';
}

interface DocsSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsSearch({ isOpen, onClose }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const filtered = searchData.filter(item => {
      const searchTerms = searchQuery.toLowerCase().split(' ');
      const searchableText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });

    // Sort by relevance (exact title matches first)
    filtered.sort((a, b) => {
      const queryLower = searchQuery.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
      if (!aTitle.includes(queryLower) && bTitle.includes(queryLower)) return 1;
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
      if (!aTitle.startsWith(queryLower) && bTitle.startsWith(queryLower)) return 1;
      
      return 0;
    });

    setResults(filtered.slice(0, 10)); // Limit to 10 results
  }, []);

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  const handleResultClick = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Documentation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for features, guides, or topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={result.path}
                  onClick={handleResultClick}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {result.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {result.category}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-2">
                Try searching for topics like &quot;workspace&quot;, &quot;permissions&quot;, &quot;reports&quot;, or &quot;AI&quot;
              </p>
            </div>
          )}

          {!query && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['Getting Started', 'Workspaces', 'Permissions', 'Financial', 'HR', 'AI Assistant'].map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(topic)}
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Browse by Category</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sidebarGroups.map((group, index) => (
                    <div key={index} className="p-2 rounded border">
                      <h4 className="text-sm font-medium text-primary">{group.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {group.items.length} guide{group.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DocsSearchTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="justify-between w-full max-w-sm text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search docs...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <DocsSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}