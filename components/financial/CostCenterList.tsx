'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { CostCenterCard } from './CostCenterCard';
import { CostCenterFilters } from './CostCenterFilters';
import { CostCenterEditDialog } from './CostCenterEditDialog';
import { CostCenterDeleteDialog } from './CostCenterDeleteDialog';
import type { CostCenterWithDetails, EditFormData, Department, User } from './types';

interface CostCenterListProps {
  costCenters: CostCenterWithDetails[];
  departments: Department[];
  users: User[];
  userRole: string;
  userId: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCreateClick: () => void;
  onDataChange: () => Promise<void>;
}

export function CostCenterList({
  costCenters,
  departments,
  users,
  userRole,
  userId,
  canCreate,
  canEdit,
  canDelete,
  onCreateClick,
  onDataChange
}: CostCenterListProps) {
  const { toast } = useToast();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // Edit/Delete state
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenterWithDetails | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCostCenter, setDeletingCostCenter] = useState<CostCenterWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    branchId: '',
    managerId: '',
    projectId: '',
    budget: '',
    budgetPeriod: 'quarterly',
    workspaceId: '',
    isActive: true
  });

  // Filter cost centers
  const filteredCostCenters = costCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (center.managerName && center.managerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && center.isActive) ||
                         (statusFilter === 'inactive' && !center.isActive);
    const matchesPeriod = periodFilter === 'all' || center.budgetPeriod === periodFilter;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Edit handlers
  const handleEditCostCenter = (costCenter: CostCenterWithDetails) => {
    setEditingCostCenter(costCenter);
    setEditFormData({
      name: costCenter.name,
      code: costCenter.code || '',
      description: costCenter.description || '',
      departmentId: costCenter.departmentId || '',
      branchId: costCenter.branchId || '',
      managerId: costCenter.managerId || '',
      projectId: costCenter.projectId || '',
      budget: costCenter.budget?.toString() || '',
      budgetPeriod: costCenter.budgetPeriod || 'quarterly',
      workspaceId: costCenter.workspaceId,
      isActive: costCenter.isActive
    });
    setShowEditDialog(true);
  };

  const handleUpdateCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCostCenter) return;

    setIsSubmitting(true);
    try {
      await BudgetTrackingService.updateCostCenter(editingCostCenter.id, {
        name: editFormData.name,
        code: editFormData.code || '',
        description: editFormData.description || undefined,
        workspaceId: editFormData.workspaceId,
        departmentId: editFormData.departmentId || undefined,
        branchId: editFormData.branchId && editFormData.branchId !== 'none' ? editFormData.branchId : undefined,
        managerId: editFormData.managerId || undefined,
        projectId: editFormData.projectId && editFormData.projectId !== 'none' ? editFormData.projectId : undefined,
        budget: editFormData.budget ? parseFloat(editFormData.budget) : undefined,
        budgetPeriod: editFormData.budgetPeriod,
        isActive: editFormData.isActive
      });

      toast({
        title: 'Success',
        description: 'Cost center updated successfully.'
      });

      setShowEditDialog(false);
      setEditingCostCenter(null);
      await onDataChange();
    } catch (error) {
      console.error('Error updating cost center:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cost center. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const handleDeleteCostCenter = (costCenter: CostCenterWithDetails) => {
    setDeletingCostCenter(costCenter);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCostCenter) return;

    setIsSubmitting(true);
    try {
      // Set cost center as inactive instead of deleting
      await BudgetTrackingService.updateCostCenter(deletingCostCenter.id, {
        isActive: false
      });

      toast({
        title: 'Success',
        description: 'Cost center deactivated successfully.'
      });

      setShowDeleteDialog(false);
      setDeletingCostCenter(null);
      await onDataChange();
    } catch (error) {
      console.error('Error deleting/deactivating cost center:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete cost center. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <CostCenterFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
      />

      {/* Cost Centers List */}
      {filteredCostCenters.length === 0 ? (
        <Card className="card-enhanced">
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Cost Centers Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || periodFilter !== 'all'
                ? 'No cost centers match your current filters.'
                : 'Get started by creating your first cost center.'}
            </p>
            {canCreate && (
              <Button onClick={onCreateClick}>
                <Plus className="w-4 h-4 mr-2" />
                Create Cost Center
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCostCenters.map((center) => (
            <CostCenterCard
              key={center.id}
              center={center}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEditCostCenter}
              onDelete={handleDeleteCostCenter}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <CostCenterEditDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        costCenter={editingCostCenter}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onSubmit={handleUpdateCostCenter}
        departments={departments}
        users={users}
        userRole={userRole}
        userId={userId}
        isSubmitting={isSubmitting}
      />

      {/* Delete Dialog */}
      <CostCenterDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        costCenter={deletingCostCenter}
        onConfirm={handleConfirmDelete}
        isDeleting={isSubmitting}
      />
    </div>
  );
}