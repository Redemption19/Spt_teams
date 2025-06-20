import BranchesManagement from '@/components/branches/branches-management';

export default function BranchesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Branch Management</h1>
        <p className="text-muted-foreground">Manage your organization&apos;s branches and locations</p>
      </div>
      <BranchesManagement />
    </div>
  );
}