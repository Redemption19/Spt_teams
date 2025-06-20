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
import { Bell, Search, User, LogOut, ChevronDown, FileText, Users, FolderOpen, CheckSquare, Building2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Region, Branch, Team, User as UserType } from '@/lib/types';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  
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
        
        // Load all regions and branches for the workspace
        const [regionsData, branchesData] = await Promise.all([
          RegionService.getWorkspaceRegions(currentWorkspace.id),
          BranchService.getBranches(currentWorkspace.id)
        ]);
        
        setRegions(regionsData);
        setBranches(branchesData);

        // Set current region and branch based on user profile
        if (userProfile?.regionId) {
          const userRegion = regionsData.find(r => r.id === userProfile.regionId);
          setCurrentRegion(userRegion || null);
        } else {
          // Default to first region if user doesn't have one assigned
          setCurrentRegion(regionsData[0] || null);
        }

        if (userProfile?.branchId) {
          const userBranch = branchesData.find(b => b.id === userProfile.branchId);
          setCurrentBranch(userBranch || null);
        } else {
          // Default to first branch if user doesn't have one assigned
          setCurrentBranch(branchesData[0] || null);
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
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Handle search input key events
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
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
    <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center space-x-2">
          {loading ? (
            <>
              <div className="w-40 h-8 bg-muted rounded animate-pulse" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <div className="w-36 h-8 bg-muted rounded animate-pulse" />
            </>
          ) : (
            <>
              <Select 
                value={currentRegion?.id || "none"} 
                onValueChange={handleRegionChange}
              >
                <SelectTrigger className="w-40 h-8 text-sm border-border">
                  <SelectValue placeholder="Select Region">
                    {currentRegion?.name || "No Region"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Region</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={currentBranch?.id || "none"} 
                onValueChange={handleBranchChange}
              >
                <SelectTrigger className="w-36 h-8 text-sm border-border">
                  <SelectValue placeholder="Select Branch">
                    {currentBranch?.name || "No Branch"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {getCurrentRegionBranches().map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        
        <div className="relative flex-1 max-w-md ml-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, tasks, or reports..."
            className="pl-10 h-8 bg-background border-border"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {showSearchResults && (
            <div
              ref={searchDropdownRef}
              className="absolute top-12 left-0 w-full bg-background border border-border rounded-md shadow-md"
            >
              {searchLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center p-2 hover:bg-card cursor-pointer"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="mr-2">{result.icon}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-none">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs leading-none text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
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
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}