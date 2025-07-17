// components/settings/profile-settings.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Upload, 
  Crown, 
  UserCheck, 
  Info, 
  Edit3, 
  Save 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  userRole: 'owner' | 'admin' | 'member';
  getRoleIcon: (role: string) => JSX.Element;
  getRoleBadgeColor: (role: string) => string;
  userProfile: any; // Assuming userProfile is passed from auth-context
}

export function ProfileSettings({ 
  profile, 
  setProfile, 
  userRole, 
  getRoleIcon, 
  getRoleBadgeColor,
  userProfile
}: ProfileSettingsProps) {

  // Save profile function
  const handleSaveProfile = async () => {
    try {
      // Get the current user ID
      const userId = userProfile?.id;
      if (!userId) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
        return;
      }

      // Update the full name if first/last name changed
      const fullName = profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : profile.name;

      // Import ProfileService dynamically
      const { ProfileService } = await import('@/lib/profile-service');
      
      // Update profile in database
      await ProfileService.updateProfile(userId, {
        ...profile,
        name: fullName,
      });

      // Update local state with the new name
      setProfile((prev: any) => ({
        ...prev,
        name: fullName
      }));

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  return (
    <TabsContent value="profile" className="space-y-6">
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <span className="text-foreground">Profile Information</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getRoleBadgeColor(profile.role)} flex items-center space-x-1 border`}>
                {getRoleIcon(profile.role)}
                <span className="capitalize">{profile.role}</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="text-xs"
              >
                <Link href="/dashboard/profile">
                  <Edit3 className="h-3 w-3 mr-1" />
                  Advanced
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role info alert */}
          <Alert className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              Your role determines which settings and features you can access. Contact an administrator to change your role.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={profile.firstName}
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                className="border-border bg-background focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={profile.lastName}
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                className="border-border bg-background focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="border-border bg-background focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="border-border bg-background focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input 
                id="jobTitle" 
                value={profile.jobTitle}
                onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
                className="border-border bg-background focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={profile.department} onValueChange={(value) => setProfile({...profile, department: value})}>
                <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              placeholder="Tell us about yourself..."
              className="border-border bg-background focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex justify-end">
            <Button 
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              onClick={handleSaveProfile}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}