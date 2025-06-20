import { ProfileManagement } from '@/components/profile/profile-management';

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and preferences
        </p>
      </div>
      
      <ProfileManagement viewMode="edit" />
    </div>
  );
}
