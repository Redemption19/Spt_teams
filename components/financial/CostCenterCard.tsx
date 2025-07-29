'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import Link from 'next/link';
import type { CostCenterWithDetails } from './types';

interface CostCenterCardProps {
  center: CostCenterWithDetails;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (center: CostCenterWithDetails) => void;
  onDelete: (center: CostCenterWithDetails) => void;
}

// Helper functions
const getBudgetStatus = (spent: number, budget: number) => {
  if (!budget) return 'no-budget';
  const percentage = (spent / budget) * 100;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 80) return 'warning';
  if (percentage >= 60) return 'caution';
  return 'good';
};

const getBudgetStatusColor = (status: string) => {
  switch (status) {
    case 'exceeded': return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'warning': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'caution': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'good': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    default: return 'text-muted-foreground bg-muted border-border';
  }
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export function CostCenterCard({ 
  center, 
  canEdit, 
  canDelete, 
  onEdit, 
  onDelete 
}: CostCenterCardProps) {
  const { defaultCurrency } = useCurrency();
  
  const budgetStatus = getBudgetStatus(center.currentSpent || 0, center.budget || 0);
  const budgetPercentage = center.budget ? ((center.currentSpent || 0) / center.budget) * 100 : 0;

  return (
    <Card className="card-enhanced card-interactive">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{center.name}</h3>
                <Badge 
                  variant={center.isActive ? 'default' : 'secondary'}
                  className={center.isActive ? 'bg-green-100 text-green-800' : ''}
                >
                  {center.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{center.code}</p>
              <p className="text-sm">{center.description}</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold">
                  {formatCurrency(center.budget || 0, defaultCurrency?.code || 'USD')}
                </div>
                <Badge className={getBudgetStatusColor(budgetStatus)}>
                  {budgetStatus.replace('-', ' ')}
                </Badge>
              </div>
              
              {/* Action Buttons */}
              {(canEdit || canDelete) && (
                              <div className="flex items-center gap-1">
                <Link href={`/dashboard/financial/cost-centers/${center.id}`} passHref>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(center)}
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(center)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              )}
            </div>
          </div>
          
          {center.budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Usage</span>
                <span>{budgetPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={budgetPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Spent: {formatCurrency(center.currentSpent || 0, defaultCurrency?.code || 'USD')}</span>
                <span>Remaining: {formatCurrency((center.budget || 0) - (center.currentSpent || 0), defaultCurrency?.code || 'USD')}</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Department</div>
              <div className="font-medium">{center.departmentName || 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Manager</div>
              <div className="font-medium">{center.managerName || 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Employees</div>
              <div className="font-medium">{center.employees || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Projects</div>
              <div className="font-medium">{center.projects || 0}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
