'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { WorkspaceSelector } from '@/components/layout/workspace-selector';
import { Bell, Search, User, LogOut, ChevronDown, FileText, Users, FolderOpen, CheckSquare, Building2, MapPin, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Region, Branch, Team, User as UserType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationPanel } from './notification-panel';
import { useNotifications } from '@/lib/notification-context';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'project' | 'task' | 'team' | 'user' | 'report' | 'branch' | 'region';
  path: string;
  icon: React.ReactNode;
}

export function Header() {
  const { userProfile, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mobile/responsive state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Load regions and branches data
  useEffect(() => {
    const loadRegionsAndBranches = async () => {
      if (!currentWorkspace) return;

      try {
        setLoading(true);
        
        // Import services dynamically
        const { RegionService } = await import('@/lib/region-service');
        const { BranchService } = await import('@/lib/branch-service');
        
        // Determine which workspace to load regions/branches from
        const sourceWorkspaceId = currentWorkspace.workspaceType === 'sub' 
          ? currentWorkspace.parentWorkspaceId || currentWorkspace.id
          : currentWorkspace.id;
        
        // Load all regions and branches for the source workspace
        const [regionsData, branchesData] = await Promise.all([
          RegionService.getWorkspaceRegions(sourceWorkspaceId),
          BranchService.getBranches(sourceWorkspaceId)
        ]);
        
        // Filter regions and branches for sub-workspaces to only show bound ones
        let filteredRegions = regionsData;
        let filteredBranches = branchesData;
        
        if (currentWorkspace.workspaceType === 'sub') {
          // For sub-workspaces, only show the bound region and branch
          filteredRegions = currentWorkspace.regionId 
            ? regionsData.filter(r => r.id === currentWorkspace.regionId)
            : [];
          
          filteredBranches = currentWorkspace.branchId 
            ? branchesData.filter(b => b.id === currentWorkspace.branchId)
            : [];
        }
        
        setRegions(filteredRegions);
        setBranches(filteredBranches);

        // Handle region and branch selection based on workspace type
        if (currentWorkspace.workspaceType === 'sub') {
          // For sub-workspaces, show the bound region and branch (read-only)
          const boundRegion = filteredRegions.find(r => r.id === currentWorkspace.regionId);
          const boundBranch = filteredBranches.find(b => b.id === currentWorkspace.branchId);
          
          setCurrentRegion(boundRegion || null);
          setCurrentBranch(boundBranch || null);
        } else {
          // For main workspaces, use user profile preferences
          if (userProfile?.regionId) {
            const userRegion = filteredRegions.find(r => r.id === userProfile.regionId);
            setCurrentRegion(userRegion || null);
          } else {
            // Default to first region if user doesn't have one assigned
            setCurrentRegion(filteredRegions[0] || null);
          }

          if (userProfile?.branchId) {
            const userBranch = filteredBranches.find(b => b.id === userProfile.branchId);
            setCurrentBranch(userBranch || null);
          } else {
            // Default to first branch if user doesn't have one assigned
            setCurrentBranch(filteredBranches[0] || null);
          }
        }
      } catch (error) {
        console.error('Error loading regions and branches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRegionsAndBranches();
  }, [currentWorkspace, userProfile]);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || !currentWorkspace) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      if (searchQuery.length < 2) return;

      try {
        setSearchLoading(true);
        const results: SearchResult[] = [];

        // Import services dynamically
        const { TeamService } = await import('@/lib/team-service');
        const { UserService } = await import('@/lib/user-service');
        const { BranchService } = await import('@/lib/branch-service');
        const { RegionService } = await import('@/lib/region-service');

        // Search teams
        try {
          const teams = await TeamService.getWorkspaceTeams(currentWorkspace.id);
          const matchingTeams = teams.filter(team => 
            team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 3);

          matchingTeams.forEach(team => {
            results.push({
              id: team.id,
              title: team.name,
              subtitle: team.description || 'Team',
              type: 'team',
              path: '/dashboard/teams',
              icon: <Users className="h-4 w-4" />
            });
          });
        } catch (error) {
          console.warn('Error searching teams:', error);
        }

        // Search users
        try {
          const users = await UserService.getUsersByWorkspace(currentWorkspace.id);
          const matchingUsers = users.filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 3);

          matchingUsers.forEach(user => {
            results.push({
              id: user.id,
              title: user.name,
              subtitle: user.jobTitle || user.email,
              type: 'user',
              path: '/dashboard/users',
              icon: <User className="h-4 w-4" />
            });
          });
        } catch (error) {
          console.warn('Error searching users:', error);
        }

        // Search branches
        const matchingBranches = branches.filter(branch =>
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 2);

        matchingBranches.forEach(branch => {
          results.push({
            id: branch.id,
            title: branch.name,
            subtitle: branch.description || 'Branch',
            type: 'branch',
            path: '/dashboard/branches',
            icon: <Building2 className="h-4 w-4" />
          });
        });

        // Search regions
        const matchingRegions = regions.filter(region =>
          region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          region.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 2);

        matchingRegions.forEach(region => {
          results.push({
            id: region.id,
            title: region.name,
            subtitle: region.description || 'Region',
            type: 'region',
            path: '/dashboard/regions',
            icon: <MapPin className="h-4 w-4" />
          });
        });

        // Add quick navigation options
        const quickNav = [
          { 
            query: 'task', 
            results: [{ 
              id: 'tasks', 
              title: 'Tasks', 
              subtitle: 'Manage tasks and assignments', 
              type: 'task' as const, 
              path: '/dashboard/tasks',
              icon: <CheckSquare className="h-4 w-4" />
            }]
          },
          { 
            query: 'report', 
            results: [{ 
              id: 'reports', 
              title: 'Reports', 
              subtitle: 'View and create reports', 
              type: 'report' as const, 
              path: '/dashboard/reports',
              icon: <FileText className="h-4 w-4" />
            }]
          },
          { 
            query: 'folder', 
            results: [{ 
              id: 'folders', 
              title: 'Folders', 
              subtitle: 'Organize your documents', 
              type: 'project' as const, 
              path: '/dashboard/folders',
              icon: <FolderOpen className="h-4 w-4" />
            }]
          }
        ];

        quickNav.forEach(nav => {
          if (nav.query.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push(...nav.results);
          }
        });

        setSearchResults(results.slice(0, 8)); // Limit to 8 results
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentWorkspace, branches, regions]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    router.push(result.path);
    setSearchQuery('');
    setShowSearchResults(false);
    setIsSearchExpanded(false); // Close mobile search
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Handle search input key events
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
      setIsSearchExpanded(false); // Close mobile search
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  };

  // Handle region change
  const handleRegionChange = async (regionId: string) => {
    let selectedRegion: Region | null = null;
    let regionBranches: Branch[] = [];

    if (regionId === "none") {
      setCurrentRegion(null);
      setCurrentBranch(null);
    } else {
      selectedRegion = regions.find(r => r.id === regionId) || null;
      setCurrentRegion(selectedRegion);
      
      // Filter branches for the selected region
      regionBranches = branches.filter(b => b.regionId === regionId);
      if (regionBranches.length > 0) {
        setCurrentBranch(regionBranches[0]);
      } else {
        setCurrentBranch(null);
      }
    }

    // Update user profile with new region/branch selection
    if (userProfile?.id) {
      try {
        const { UserService } = await import('@/lib/user-service');
        await UserService.updateUser(userProfile.id, {
          regionId: regionId === "none" ? undefined : regionId,
          branchId: regionId === "none" ? undefined : (regionBranches.length > 0 ? regionBranches[0].id : undefined),
        });
        
        // Show success toast
        const { toast } = await import('@/hooks/use-toast');
        toast({
          title: "Region Updated",
          description: regionId === "none" ? "Cleared region selection" : `Switched to ${selectedRegion?.name}${regionBranches.length > 0 ? ` • ${regionBranches[0].name}` : ''}`,
        });
      } catch (error) {
        console.error('Error updating user region:', error);
        const { toast } = await import('@/hooks/use-toast');
        toast({
          title: "Error",
          description: "Failed to update region selection",
          variant: "destructive",
        });
      }
    }
  };

  // Handle branch change
  const handleBranchChange = async (branchId: string) => {
    if (branchId === "none") {
      setCurrentBranch(null);
    } else {
      const selectedBranch = branches.find(b => b.id === branchId);
      setCurrentBranch(selectedBranch || null);
    }

    // Update user profile with new branch selection
    if (userProfile?.id) {
      try {
        const { UserService } = await import('@/lib/user-service');
        await UserService.updateUser(userProfile.id, {
          branchId: branchId === "none" ? undefined : branchId,
        });
        
        // Show success toast
        const { toast } = await import('@/hooks/use-toast');
        const selectedBranch = branchId === "none" ? null : branches.find(b => b.id === branchId);
        toast({
          title: "Branch Updated",
          description: branchId === "none" ? "Cleared branch selection" : `Switched to ${selectedBranch?.name}`,
        });
      } catch (error) {
        console.error('Error updating user branch:', error);
        const { toast } = await import('@/hooks/use-toast');
        toast({
          title: "Error",
          description: "Failed to update branch selection",
          variant: "destructive",
        });
      }
    }
  };

  // Get branches for current region
  const getCurrentRegionBranches = () => {
    if (!currentRegion) return branches;
    return branches.filter(b => b.regionId === currentRegion.id);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-14 sm:h-16 bg-card/50 backdrop-blur-sm border-b border-border sticky top-2 z-40 mt-2 mx-2 rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-full">
        {/* Left Section - Mobile First */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden p-1.5 sm:p-2">
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 sm:w-96 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                </div>

                {/* Mobile Content */}
                <div className="flex-1 p-4 space-y-6">
                  {/* Workspace Selector Mobile */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Current Workspace</h3>
                    <WorkspaceSelector />
                  </div>

                  {/* Region/Branch Mobile */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {currentWorkspace?.workspaceType === 'sub' ? 'Bound Location' : 'Location'}
                    </h3>
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-10 bg-muted rounded-lg animate-pulse" />
                        <div className="h-10 bg-muted rounded-lg animate-pulse" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Select 
                          value={currentRegion?.id || "none"} 
                          onValueChange={handleRegionChange}
                          disabled={currentWorkspace?.workspaceType === 'sub'}
                        >
                          <SelectTrigger className={`w-full h-10 rounded-lg ${currentWorkspace?.workspaceType === 'sub' ? 'cursor-not-allowed opacity-75' : ''}`}>
                            <SelectValue placeholder="Select Region">
                              {currentRegion?.name || "No Region"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="none">No Region</SelectItem>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id} className="rounded-lg">
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={currentBranch?.id || "none"} 
                          onValueChange={handleBranchChange}
                          disabled={currentWorkspace?.workspaceType === 'sub'}
                        >
                          <SelectTrigger className={`w-full h-10 rounded-lg ${currentWorkspace?.workspaceType === 'sub' ? 'cursor-not-allowed opacity-75' : ''}`}>
                            <SelectValue placeholder="Select Branch">
                              {currentBranch?.name || "No Branch"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="none">No Branch</SelectItem>
                            {getCurrentRegionBranches().map((branch) => (
                              <SelectItem key={branch.id} value={branch.id} className="rounded-lg">
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* User Info Mobile */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                          {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{userProfile?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{userProfile?.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full justify-start rounded-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/dashboard/profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleLogout}
                        className="w-full justify-start rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Workspace Selector */}
          <div className="hidden lg:block">
            <WorkspaceSelector />
          </div>

          {/* Desktop Region/Branch Selectors */}
          <div className="hidden xl:flex items-center space-x-2 border-l pl-4">
            {currentWorkspace?.workspaceType === 'sub' && (
              <div className="text-xs text-muted-foreground mr-2 whitespace-nowrap">
                Bound to:
              </div>
            )}
            {loading ? (
              <>
                <div className="w-32 xl:w-40 h-8 bg-muted rounded-lg animate-pulse" />
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <div className="w-28 xl:w-36 h-8 bg-muted rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                <Select 
                  value={currentRegion?.id || "none"} 
                  onValueChange={handleRegionChange}
                  disabled={currentWorkspace?.workspaceType === 'sub'}
                >
                  <SelectTrigger className={`w-32 xl:w-40 h-8 text-sm border-border rounded-lg ${currentWorkspace?.workspaceType === 'sub' ? 'cursor-not-allowed opacity-75' : ''}`}>
                    <SelectValue placeholder="Select Region">
                      {currentRegion?.name || "No Region"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="none">No Region</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id} className="rounded-lg">
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={currentBranch?.id || "none"} 
                  onValueChange={handleBranchChange}
                  disabled={currentWorkspace?.workspaceType === 'sub'}
                >
                  <SelectTrigger className={`w-28 xl:w-36 h-8 text-sm border-border rounded-lg ${currentWorkspace?.workspaceType === 'sub' ? 'cursor-not-allowed opacity-75' : ''}`}>
                    <SelectValue placeholder="Select Branch">
                      {currentBranch?.name || "No Branch"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="none">No Branch</SelectItem>
                    {getCurrentRegionBranches().map((branch) => (
                      <SelectItem key={branch.id} value={branch.id} className="rounded-lg">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Search - Responsive */}
          <div className="relative flex-1 max-w-sm lg:max-w-md xl:max-w-lg ml-2 sm:ml-4 lg:ml-8">
            {/* Desktop Search - Always visible on sm and up */}
            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, tasks..."
                className="pl-10 h-9 bg-background border-border rounded-lg text-sm"
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {showSearchResults && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-12 left-0 w-full bg-background border border-border rounded-lg shadow-xl z-[100] max-h-80 overflow-y-auto"
                >
                  {searchLoading ? (
                    <div className="p-4 text-center text-sm">Loading...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center p-3 hover:bg-muted cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="mr-3 flex-shrink-0">{result.icon}</div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium leading-tight truncate">{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs leading-tight text-muted-foreground truncate">{result.subtitle}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search - Toggle between icon and input */}
            <div className="sm:hidden">
              {!isSearchExpanded ? (
                /* Search Icon */
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 rounded-lg"
                  onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                    }, 100);
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                /* Search Input */
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 h-8 bg-background border-border rounded-lg text-sm pr-8"
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      handleSearchKeyDown(e);
                      if (e.key === 'Escape') {
                        setIsSearchExpanded(false);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }
                    }}
                    onBlur={(e) => {
                      // Don't close if clicking on search results
                      if (!searchDropdownRef.current?.contains(e.relatedTarget as Node)) {
                        setTimeout(() => {
                          setIsSearchExpanded(false);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }, 150);
                      }
                    }}
                    autoFocus
                  />
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {showSearchResults && (
                    <div
                      ref={searchDropdownRef}
                      className="absolute top-10 left-0 w-full bg-background border border-border rounded-lg shadow-xl z-[100] max-h-80 overflow-y-auto"
                    >
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm">Loading...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center p-3 hover:bg-muted cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                            onClick={() => handleSearchResultClick(result)}
                          >
                            <div className="mr-3 flex-shrink-0">{result.icon}</div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium leading-tight truncate">{result.title}</span>
                              {result.subtitle && (
                                <span className="text-xs leading-tight text-muted-foreground truncate">{result.subtitle}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Always Visible */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {/* Notifications */}
          <NotificationPanel>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 rounded-lg"
              onClick={() => router.push('/dashboard/notifications')}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center min-w-5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </NotificationPanel>

          {/* User Avatar - Desktop */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl border shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {userProfile?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userProfile?.role}
                    </p>
                    {(currentRegion || currentBranch) && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentRegion?.name}{currentBranch && ` • ${currentBranch.name}`}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg mx-1 mb-1">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg mx-1 mb-1">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}