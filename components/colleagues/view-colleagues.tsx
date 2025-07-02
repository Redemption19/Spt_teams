'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  User,
  Shield,
  Info,
} from 'lucide-react';

import { UserService } from '@/lib/user-service';
import { BranchService } from '@/lib/branch-service';
import { RegionService } from '@/lib/region-service';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { User as UserType } from '@/lib/types';

interface ColleagueItem {
  user: UserType;
  role: string;
  branch?: any;
  region?: any;
  isFromSameLocation: boolean;
}

export default function ViewColleagues() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [colleagues, setColleagues] = useState<ColleagueItem[]>([]);
  const [filteredColleagues, setFilteredColleagues] = useState<ColleagueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  // Email functionality for team members
  const handleEmailColleague = (colleague: UserType) => {
    const subject = encodeURIComponent(`Message from ${userProfile?.name || 'Team Member'}`);
    const body = encodeURIComponent(`Hello ${colleague.name || colleague.firstName},\n\nI hope this message finds you well.\n\nBest regards,\n${userProfile?.name || 'Your Teammate'}\n${userProfile?.email || ''}`);
    const mailtoLink = `mailto:${colleague.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  // Load team members data
  const loadColleagues = useCallback(async () => {
    if (!currentWorkspace?.id || !userProfile || userProfile.role !== 'member') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Determine which workspace to load data from for branches/regions
      const sourceWorkspaceId = currentWorkspace.workspaceType === 'sub' 
        ? currentWorkspace.parentWorkspaceId || currentWorkspace.id
        : currentWorkspace.id;

      // Load all users, branches, and regions
      const [allUsers, branchesData, regionsData] = await Promise.all([
        UserService.getUsersByWorkspace(currentWorkspace.id),
        BranchService.getBranches(sourceWorkspaceId),
        RegionService.getWorkspaceRegions(sourceWorkspaceId)
      ]);

      setBranches(branchesData);
      setRegions(regionsData);

      let colleagueUsers: UserType[] = [];

      if (currentWorkspace.workspaceType === 'sub') {
        // Sub-workspace: Show all users in the same sub-workspace (excluding self)
        colleagueUsers = allUsers.filter(u => 
          u.id !== userProfile.id && 
          u.workspaceId === currentWorkspace.id
        );
      } else {
        // Main workspace: Show users in same branch/region (excluding self)
        colleagueUsers = allUsers.filter(u => {
          if (u.id === userProfile.id) return false;
          
          // Same branch takes priority
          if (userProfile.branchId && u.branchId === userProfile.branchId) {
            return true;
          }
          
          // If no branch match, check region
          if (userProfile.regionId && u.regionId === userProfile.regionId) {
            return true;
          }
          
          return false;
        });
      }

      // Create team member items with additional metadata
      const colleagueItems: ColleagueItem[] = colleagueUsers.map(colleague => {
        const branch = branchesData.find(b => b.id === colleague.branchId);
        const region = regionsData.find(r => r.id === colleague.regionId);
        
        let isFromSameLocation = false;
        if (currentWorkspace.workspaceType === 'sub') {
          isFromSameLocation = true; // All are from same sub-workspace
        } else {
          isFromSameLocation = Boolean(
            (userProfile.branchId && colleague.branchId === userProfile.branchId) ||
            (userProfile.regionId && colleague.regionId === userProfile.regionId)
          );
        }

        return {
          user: colleague,
          role: colleague.role || 'member',
          branch,
          region,
          isFromSameLocation
        };
      });

      setColleagues(colleagueItems);
      console.log('Loaded team members:', colleagueItems.length);
      
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, userProfile, toast]);

  useEffect(() => {
    loadColleagues();
  }, [loadColleagues]);

  // Filter team members based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredColleagues(colleagues);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = colleagues.filter(item => {
        const user = item.user;
        return (
          user.name?.toLowerCase().includes(searchLower) ||
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.jobTitle?.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower) ||
          item.branch?.name?.toLowerCase().includes(searchLower) ||
          item.region?.name?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredColleagues(filtered);
    }
  }, [colleagues, searchTerm]);

  // Security check - only allow members
  if (userProfile?.role !== 'member') {
    return (
      <Alert className="max-w-2xl">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This feature is only available for team members. Administrators can access full user management through the Users section.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          {currentWorkspace?.workspaceType === 'sub' 
            ? `You're viewing team members in your ${currentWorkspace.name} workspace.`
            : userProfile?.branchId 
              ? `You're viewing team members in your branch${userProfile?.regionId ? ' and region' : ''}.`
              : userProfile?.regionId
                ? 'You\'re viewing team members in your region.'
                : 'You\'re viewing team members in your workspace.'
          }
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{filteredColleagues.length} team member{filteredColleagues.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredColleagues.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-muted/20 rounded-lg p-6">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {colleagues.length === 0 ? 'No Team Members Found' : 'No Search Results'}
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            {colleagues.length === 0 
              ? 'There are no other team members in your current workspace or location. You may be the only team member assigned here.'
              : 'No team members match your search criteria. Try a different search term.'
            }
          </p>
        </div>
      )}

      {/* Team Members Grid */}
      {!loading && filteredColleagues.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredColleagues.map((item) => {
            const colleague = item.user;
            
            return (
              <Card key={colleague.id} className="transition-all duration-200 hover:shadow-lg border border-border/50 hover:border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-medium">
                          {(colleague.name || colleague.firstName || colleague.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {colleague.name || `${colleague.firstName} ${colleague.lastName}`.trim() || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-muted-foreground">{colleague.jobTitle || 'Team Member'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmailColleague(colleague)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                      title="Send Email to Team Member"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{colleague.email}</span>
                    </div>
                    
                    {colleague.phone && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{colleague.phone}</span>
                      </div>
                    )}
                    
                    {colleague.department && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{colleague.department}</span>
                      </div>
                    )}

                    {item.branch && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{item.branch.name}</span>
                      </div>
                    )}

                    {item.region && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{item.region.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <Badge 
                      variant={item.role === 'admin' ? 'default' : 'secondary'}
                      className={`${
                        item.role === 'admin' 
                          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
                          : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                      }`}
                    >
                      {item.role === 'admin' ? 'Admin' : 'Member'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${
                        colleague.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                      }`}
                    >
                      {colleague.status || 'active'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 