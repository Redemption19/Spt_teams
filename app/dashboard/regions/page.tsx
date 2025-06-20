import BranchesManagement from '@/components/branches/branches-management';

export default function RegionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Region Management</h1>
        <p className="text-muted-foreground">Manage your organization&apos;s regional divisions</p>
      </div>
      <BranchesManagement />
    </div>
  );
}