'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  RefreshCw,
  Calendar,
  User,
  Building,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, LeaveBalance } from '@/lib/leave-service';
import { UserService } from '@/lib/user-service';
import { format } from 'date-fns';

interface LeaveBalancesProps {
  workspaceId?: string;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
}

interface EmployeeLeaveBalance {
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  workspaceName?: string;
  leaveBalances: {
    [leaveTypeId: string]: {
      leaveTypeName: string;
      totalDays: number;
      usedDays: number;
      remainingDays: number;
      carriedForwardDays: number;
      utilizationRate: number;
    };
  };
  totalUtilizationRate: number;
}

export default function LeaveBalances({
  workspaceId,
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: LeaveBalancesProps) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [sortBy, setSortBy] = useState('employeeName');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      
      let balances: LeaveBalance[] = [];
      let allUsers: any[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => ws.id);
        
        const [allBalances, allUsersData] = await Promise.all([
          LeaveService.getMultiWorkspaceLeaveBalances(workspaceIds, parseInt(yearFilter)),
          Promise.all(workspaceIds.map(wsId => UserService.getUsersByWorkspace(wsId)))
        ]);

        balances = allBalances;
        allUsers = allUsersData.flat().map(user => ({
          ...user,
          workspaceName: allWorkspaces.find(ws => ws.id === user.workspaceId)?.name || 'Unknown'
        }));
      } else {
        // Load from current workspace
        const [workspaceBalances, workspaceUsers] = await Promise.all([
          LeaveService.getLeaveBalances(workspaceId, parseInt(yearFilter)),
          UserService.getUsersByWorkspace(workspaceId)
        ]);

        balances = workspaceBalances;
        allUsers = workspaceUsers;
      }

      setLeaveBalances(balances);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading leave balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave balances. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, yearFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateBalancesForApproved = async () => {
    if (!workspaceId) return;
    
    try {
      setRefreshing(true);
      await LeaveService.createLeaveBalancesForApprovedRequests(workspaceId);
      
      toast({
        title: 'Success',
        description: 'Leave balances created for existing approved requests.',
        variant: 'default'
      });
      
      // Reload data to show the new balances
      await loadData();
    } catch (error) {
      console.error('Error creating leave balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to create leave balances. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Group balances by employee
  const employeeBalances: EmployeeLeaveBalance[] = users.map(user => {
    const employeeBalances = leaveBalances.filter(balance => balance.employeeId === user.id);
    
    const leaveBalancesMap: { [leaveTypeId: string]: any } = {};
    let totalUtilizationRate = 0;
    let totalLeaveTypes = 0;

    employeeBalances.forEach(balance => {
      const utilizationRate = balance.totalDays > 0 ? (balance.usedDays / balance.totalDays) * 100 : 0;
      leaveBalancesMap[balance.leaveTypeId] = {
        leaveTypeName: balance.leaveTypeName,
        totalDays: balance.totalDays,
        usedDays: balance.usedDays,
        remainingDays: balance.remainingDays,
        carriedForwardDays: balance.carriedForwardDays,
        utilizationRate
      };
      totalUtilizationRate += utilizationRate;
      totalLeaveTypes++;
    });

    // Handle different name formats (firstName/lastName vs name)
    const employeeName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';

    return {
      employeeId: user.id,
      employeeName,
      workspaceId: user.workspaceId,
      workspaceName: user.workspaceName,
      leaveBalances: leaveBalancesMap,
      totalUtilizationRate: totalLeaveTypes > 0 ? totalUtilizationRate / totalLeaveTypes : 0
    };
  });

  // Filter and sort employee balances
  const filteredBalances = employeeBalances
    .filter(balance => {
      const matchesSearch = balance.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = employeeFilter === 'all' || balance.employeeId === employeeFilter;
      return matchesSearch && matchesEmployee;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'employeeName':
          return a.employeeName.localeCompare(b.employeeName);
        case 'utilizationRate':
          return b.totalUtilizationRate - a.totalUtilizationRate;
        case 'workspace':
          return (a.workspaceName || '').localeCompare(b.workspaceName || '');
        default:
          return 0;
      }
    });

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600';
    if (rate >= 60) return 'text-orange-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationIcon = (rate: number) => {
    if (rate >= 80) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (rate >= 60) return <TrendingUp className="w-4 h-4 text-orange-600" />;
    return <TrendingDown className="w-4 h-4 text-green-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
              <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-2 w-full bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 focus:border-primary"
                />
              </div>
            </div>
            
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[180px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.firstName || user.name} {user.lastName || ''}</span>
                      {shouldShowCrossWorkspace && user.workspaceName && (
                        <Badge variant="outline" className="text-xs">
                          {user.workspaceName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] border-border/50 focus:border-primary">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employeeName">Employee Name</SelectItem>
                <SelectItem value="utilizationRate">Utilization Rate</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateBalancesForApproved}
              disabled={refreshing}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Create Balances
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredBalances.length} employee{filteredBalances.length !== 1 ? 's' : ''} found
        </p>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            Cross-Workspace View
          </Badge>
        )}
      </div>

      {/* Leave Balances List */}
      <div className="space-y-4">
        {filteredBalances.length > 0 ? (
          filteredBalances.map((employeeBalance) => (
            <Card key={employeeBalance.employeeId} className="card-enhanced">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{employeeBalance.employeeName}</CardTitle>
                      {employeeBalance.workspaceName && (
                        <CardDescription className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {employeeBalance.workspaceName}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUtilizationIcon(employeeBalance.totalUtilizationRate)}
                    <span className={`text-sm font-medium ${getUtilizationColor(employeeBalance.totalUtilizationRate)}`}>
                      {employeeBalance.totalUtilizationRate.toFixed(1)}% utilized
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(employeeBalance.leaveBalances).map(([leaveTypeId, balance]) => (
                    <div key={leaveTypeId} className="space-y-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{balance.leaveTypeName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {balance.remainingDays}/{balance.totalDays}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Used: {balance.usedDays} days</span>
                          <span>Remaining: {balance.remainingDays} days</span>
                        </div>
                        
                        <Progress 
                          value={balance.utilizationRate} 
                          className="h-2"
                        />
                        
                        {balance.carriedForwardDays > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Carried forward: {balance.carriedForwardDays} days
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(employeeBalance.leaveBalances).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p>No leave balances found for this employee</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-enhanced">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Leave Balances Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || employeeFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No leave balances have been set up yet.'
                }
              </p>
              {searchTerm || employeeFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setEmployeeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 