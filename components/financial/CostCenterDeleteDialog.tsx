'use client';

import { DeleteDialog } from '@/components/ui/delete-dialog';
import type { CostCenterWithDetails } from './types';

interface CostCenterDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  costCenter: CostCenterWithDetails | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function CostCenterDeleteDialog({
  isOpen,
  onClose,
  costCenter,
  onConfirm,
  isDeleting
}: CostCenterDeleteDialogProps) {
  if (!costCenter) return null;

  const itemDetails = [
    { label: 'Code', value: costCenter.code || 'N/A' },
    { label: 'Budget', value: costCenter.budget ? `₵${costCenter.budget.toLocaleString()}` : 'N/A' },
    { label: 'Status', value: costCenter.isActive ? 'Active' : 'Inactive' },
    { label: 'Department', value: costCenter.departmentName || 'Unassigned' },
  ];

  const consequences = [
    'All budget allocations will be removed',
    'Associated expenses will lose their cost center reference',
    'Reports and analytics will no longer include this cost center',
    'This action cannot be undone'
  ];

  return (
    <DeleteDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Cost Center"
      description="You are about to permanently delete this cost center. This will affect all related financial data."
      item={{
        id: costCenter.id,
        name: costCenter.name,
        type: 'Cost Center',
        status: costCenter.isActive ? 'Active' : 'Inactive'
      }}
      itemDetails={itemDetails}
      consequences={consequences}
      confirmText="Delete Cost Center"
      cancelText="Cancel"
      isLoading={isDeleting}
      warningLevel="high"
    />
  );
} 