'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/workspace-context';
import { BudgetTrackingService } from '@/lib/budget-tracking-service';
import { DepartmentService } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import type { CostCenter } from '@/lib/types/financial-types';

export default function CostCentersPage() {
  const { currentWorkspace } = useWorkspace();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});
  const [managerMap, setManagerMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace?.id) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch cost centers
        const centers = await BudgetTrackingService.getWorkspaceCostCenters(currentWorkspace.id);
        setCostCenters(centers);
        // Fetch departments and managers for mapping
        const [departments, users] = await Promise.all([
          DepartmentService.getWorkspaceDepartments(currentWorkspace.id),
          UserService.getUsersByWorkspace(currentWorkspace.id)
        ]);
        const deptMap: Record<string, string> = {};
        departments.forEach(d => { deptMap[d.id] = d.name; });
        setDepartmentMap(deptMap);
        const mgrMap: Record<string, string> = {};
        users.forEach(u => { mgrMap[u.id] = u.name || u.email || u.id; });
        setManagerMap(mgrMap);
      } catch (err) {
        setError('Failed to load cost centers.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentWorkspace?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Centers</CardTitle>
        <CardDescription>
          Manage organizational cost centers and their budget allocations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button>Add New Cost Center</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Code</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Manager</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Budget</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {loading ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground text-center" colSpan={7}>
                    Loading cost centers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-3 text-red-500 text-center" colSpan={7}>
                    {error}
                  </td>
                </tr>
              ) : costCenters.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <span className="text-muted-foreground">No cost centers found.</span>
                      <span className="text-xs text-muted-foreground mt-2">Cost center management coming soon.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                costCenters.map(center => (
                  <tr key={center.id}>
                    <td className="px-4 py-2 font-medium">{center.name}</td>
                    <td className="px-4 py-2">{center.code}</td>
                    <td className="px-4 py-2">{center.departmentId ? departmentMap[center.departmentId] || center.departmentId : '-'}</td>
                    <td className="px-4 py-2">{center.managerId ? managerMap[center.managerId] || center.managerId : '-'}</td>
                    <td className="px-4 py-2">{center.budget ? center.budget.toLocaleString() : '-'}</td>
                    <td className="px-4 py-2">
                      {center.isActive ? (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">-</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}