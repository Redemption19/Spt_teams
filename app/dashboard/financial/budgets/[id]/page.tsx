"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { BudgetTrackingService } from "@/lib/budget-tracking-service";
import { DepartmentService } from "@/lib/department-service";
import { formatNumber, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserService } from '@/lib/user-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { PermissionsService } from '@/lib/permissions-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';

export default function BudgetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const budgetId = params?.id as string;

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityName, setEntityName] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    const fetchBudget = async () => {
      setLoading(true);
      setError(null);
      try {
        const b = await BudgetTrackingService.getBudget(budgetId);
        setBudget(b);
        // Fetch entity name based on budget type
        if (b?.entityId) {
          try {
            let name = null;
            switch (b.type) {
               case 'department':
                 const department = await DepartmentService.getDepartment(b.workspaceId, b.entityId);
                 name = department?.name || null;
                 break;
              case 'project':
                // Import ProjectService dynamically to avoid circular dependencies
                const { ProjectService } = await import('@/lib/project-service');
                const project = await ProjectService.getProject(b.entityId);
                name = project?.name || null;
                break;
              case 'team':
                // Import TeamService dynamically to avoid circular dependencies
                const { TeamService } = await import('@/lib/team-service');
                const team = await TeamService.getTeam(b.entityId);
                name = team?.name || null;
                break;
              case 'workspace':
                // Import WorkspaceService dynamically to avoid circular dependencies
                const { WorkspaceService } = await import('@/lib/workspace-service');
                const workspace = await WorkspaceService.getWorkspace(b.entityId);
                name = workspace?.name || null;
                break;
              case 'costCenter':
                // For cost centers, we might need a CostCenterService or use the entityId as name
                name = `Cost Center ${b.entityId}`;
                break;
              default:
                name = null;
            }
            setEntityName(name);
          } catch (error) {
            console.error(`Error fetching ${b.type} name:`, error);
            setEntityName(null);
          }
        }
        // Fetch creator name
        if (b?.createdBy) {
          const user = await UserService.getUserById(b.createdBy);
          setCreatorName(user?.name || user?.email || b.createdBy);
        }
        // Fetch workspace name
        if (b?.workspaceId) {
          const ws = await WorkspaceService.getWorkspace(b.workspaceId);
          setWorkspaceName(ws?.name || b.workspaceId);
        }
      } catch (err) {
        setError("Failed to load budget details.");
      } finally {
        setLoading(false);
      }
    };
    if (budgetId) fetchBudget();
  }, [budgetId]);

  useEffect(() => {
    async function checkPermissions() {
      if (user && currentWorkspace) {
        if (userProfile?.role === 'owner') {
          setCanView(true);
          setCanEdit(true);
          setCanDelete(true);
          setCanApprove(true);
        } else {
          setCanView(await PermissionsService.hasPermission(user.uid, currentWorkspace.id, 'budgets.view'));
          setCanEdit(await PermissionsService.hasPermission(user.uid, currentWorkspace.id, 'budgets.edit'));
          setCanDelete(await PermissionsService.hasPermission(user.uid, currentWorkspace.id, 'budgets.delete'));
          setCanApprove(await PermissionsService.hasPermission(user.uid, currentWorkspace.id, 'budgets.approve'));
        }
      }
    }
    checkPermissions();
  }, [user, userProfile, currentWorkspace]);

  if (!canView) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view this budget.</div>;
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error || !budget) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-red-500">
        {error || "Budget not found."}
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  // Budget status helpers
  const spentPercent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const status = spentPercent >= 100 ? "overbudget" : spentPercent >= 80 ? "warning" : "on-track";
  const statusColor =
    status === "on-track"
      ? "text-green-600"
      : status === "warning"
      ? "text-yellow-600"
      : "text-red-600";
  const statusIcon =
    status === "on-track" ? <TrendingUp className="w-4 h-4" /> : status === "warning" ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Details</h1>
          <p className="text-muted-foreground">View all details for this budget</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{budget.currency} {formatNumber(budget.amount)}</div>
            <p className="text-xs text-muted-foreground">Allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            {statusIcon}
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${statusColor}`}>{budget.currency} {formatNumber(budget.spent)}</div>
            <p className="text-xs text-muted-foreground">{spentPercent.toFixed(1)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{budget.currency} {formatNumber(budget.remaining)}</div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {budget.name}
            <Badge variant="outline" className="ml-2 capitalize">{budget.type}</Badge>
            {status === "overbudget" && <Badge variant="destructive" className="ml-2">Overbudget</Badge>}
          </CardTitle>
          <CardDescription>{budget.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Period</div>
              <div className="font-medium capitalize">{budget.period}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className={`font-medium flex items-center gap-2 ${statusColor}`}>{statusIcon} {status.replace("-", " ")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-medium">{formatDate(budget.startDate)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">End Date</div>
              <div className="font-medium">{formatDate(budget.endDate)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {budget.type === 'department' ? 'Department' :
                 budget.type === 'project' ? 'Project' :
                 budget.type === 'team' ? 'Team' :
                 budget.type === 'workspace' ? 'Workspace' :
                 budget.type === 'costCenter' ? 'Cost Center' :
                 'Entity'}
              </div>
              <div className="font-medium">
                {entityName || `${budget.type.charAt(0).toUpperCase() + budget.type.slice(1)} ID: ${budget.entityId}`}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created By</div>
              <div className="font-medium">{creatorName || budget.createdBy}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Workspace</div>
              <div className="mt-2 font-medium flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                  {workspaceName || budget.workspaceId}
                </Badge>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {budget.alerts && budget.alerts.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold mb-2">Alerts</div>
              <div className="space-y-2">
                {budget.alerts.map((alert: any) => (
                  <div key={alert.id} className={`flex items-center gap-2 p-2 rounded border ${alert.triggered ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'}`}>
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Threshold: {alert.threshold}%</span>
                    {alert.triggered && <Badge variant="destructive">Triggered</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
