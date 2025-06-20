'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { ProfileService } from '@/lib/profile-service';
import { User } from '@/lib/types';
import { toast } from 'sonner';
import { 
  Camera,
  User as UserIcon,
  Crown,
  UserCheck,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Calendar,
  Clock,
  Users,
  Award,
  Plus,
  X,
  Save,
  Upload,
  Edit3,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ProfileManagementProps {
  userId?: string;
  viewMode?: 'edit' | 'view';
}

export function ProfileManagement({ userId, viewMode = 'edit' }: ProfileManagementProps) {
  const { userProfile, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<User>>({});
  const [profileStats, setProfileStats] = useState({
    completeness: 0,
    lastUpdated: null as Date | null,
    accountAge: 0,
    teamCount: 0,
  });
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const currentUserId = userId || user?.uid;
  const isEditable = viewMode === 'edit' && (!userId || userId === user?.uid);
  useEffect(() => {
    const loadData = async () => {
      if (!currentUserId) return;
      
      try {
        const profileData = await ProfileService.getProfile(currentUserId);
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        toast.error('Failed to load profile');
      }

      try {
        const stats = await ProfileService.getProfileStats(currentUserId);
        setProfileStats(stats);
      } catch (error) {
        console.error('Failed to load profile stats:', error);
      }
    };

    loadData();
  }, [currentUserId]);
  const loadProfileStats = async () => {
    if (!currentUserId) return;
    
    try {
      const stats = await ProfileService.getProfileStats(currentUserId);
      setProfileStats(stats);
    } catch (error) {
      console.error('Failed to load profile stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      await ProfileService.updateProfile(currentUserId, profile);
      
      // Reload the profile data from database to ensure UI reflects saved changes
      const updatedProfile = await ProfileService.getProfile(currentUserId);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      
      await loadProfileStats(); // Reload stats to update completeness
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUserId) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setLoading(true);
    try {
      const avatarUrl = await ProfileService.updateAvatar(currentUserId, file);
      setProfile(prev => ({ ...prev, avatar: avatarUrl }));
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !currentUserId) return;

    try {
      await ProfileService.addSkill(currentUserId, newSkill.trim());
      setProfile(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
      toast.success('Skill added successfully!');
    } catch (error) {
      toast.error('Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skill: string) => {
    if (!currentUserId) return;

    try {
      await ProfileService.removeSkill(currentUserId, skill);
      setProfile(prev => ({
        ...prev,
        skills: (prev.skills || []).filter(s => s !== skill)
      }));
      toast.success('Skill removed successfully!');
    } catch (error) {
      toast.error('Failed to remove skill');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'admin':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      default:
        return 'bg-muted';
    }
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="card-enhanced">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 shadow-lg border-4 border-background">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditable && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Profile Completeness */}
              <div className="text-center space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${getCompletenessColor(profileStats.completeness)}`} />
                  <span className={`text-sm font-medium ${getCompletenessColor(profileStats.completeness)}`}>
                    {profileStats.completeness}% Complete
                  </span>
                </div>
                <Progress value={profileStats.completeness} className="w-32" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{profile.name || 'User Profile'}</h2>
                  <Badge className={`${getRoleBadgeColor(profile.role || 'member')} text-white`}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(profile.role || 'member')}
                      <span className="capitalize">{profile.role || 'member'}</span>
                    </div>
                  </Badge>
                </div>
                
                <div className="space-y-2 text-muted-foreground">
                  {profile.jobTitle && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.jobTitle}</span>
                      {profile.department && <span>• {profile.department}</span>}
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold">{profileStats.teamCount}</div>
                  <div className="text-xs text-muted-foreground">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{profileStats.accountAge}</div>
                  <div className="text-xs text-muted-foreground">Days Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{profile.skills?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Skills</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditable}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  disabled={!isEditable}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone || ''}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}
                    disabled={!isEditable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                      <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                      <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                      <SelectItem value="CET">CET (Central European Time)</SelectItem>
                      <SelectItem value="JST">JST (Japan Standard Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="preferredContact">Preferred Contact</Label>
                  <Select
                    value={profile.preferredContactMethod || ''}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, preferredContactMethod: value as any }))}
                    disabled={!isEditable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information */}
        <TabsContent value="professional" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profile.jobTitle || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={profile.department || ''}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, department: value }))}
                    disabled={!isEditable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <Label>Skills</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{skill}</span>
                        {isEditable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {isEditable && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button onClick={handleAddSkill} disabled={!newSkill.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Languages Section */}
              <div>
                <Label>Languages</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {profile.languages?.map((language, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{language}</span>
                        {isEditable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                            onClick={() => {
                              setProfile(prev => ({
                                ...prev,
                                languages: (prev.languages || []).filter(l => l !== language)
                              }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {isEditable && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a language..."
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newLanguage.trim()) {
                            setProfile(prev => ({
                              ...prev,
                              languages: [...(prev.languages || []), newLanguage.trim()]
                            }));
                            setNewLanguage('');
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newLanguage.trim()) {
                            setProfile(prev => ({
                              ...prev,
                              languages: [...(prev.languages || []), newLanguage.trim()]
                            }));
                            setNewLanguage('');
                          }
                        }}
                        disabled={!newLanguage.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditable}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      placeholder="Street Address"
                      value={profile.address?.street || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      disabled={!isEditable}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="City"
                      value={profile.address?.city || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      disabled={!isEditable}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="State/Province"
                      value={profile.address?.state || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      disabled={!isEditable}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Country"
                      value={profile.address?.country || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))}
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="social" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={profile.socialLinks?.linkedin || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/username"
                    value={profile.socialLinks?.twitter || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label htmlFor="github" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    value={profile.socialLinks?.github || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    disabled={!isEditable}
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={profile.socialLinks?.website || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                    disabled={!isEditable}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {isEditable && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveProfile} 
            disabled={loading}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      )}

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
    </div>
  );
}
