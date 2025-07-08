import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Building2, MapPin, Users, Loader2 } from 'lucide-react';
import React from 'react';
import { Region } from '@/lib/types';

interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
}

interface BranchesTabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branchesLength: number;
  regionsLength: number;
  managersLength: number;
  syncBranchAssignments: () => void;
  submitting: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRegion: string;
  setSelectedRegion: (regionId: string) => void;
  regions: Region[];
  isOwner: boolean;
  canManageBranches: boolean;
  isCreateManagerOpen: boolean;
  setIsCreateManagerOpen: (isOpen: boolean) => void;
  managerForm: ManagerFormData;
  setManagerForm: React.Dispatch<React.SetStateAction<ManagerFormData>>;
  handleCreateManager: () => void;
}

export function BranchesTabsNavigation({
  activeTab,
  setActiveTab,
  branchesLength,
  regionsLength,
  managersLength,
  syncBranchAssignments,
  submitting,
  searchTerm,
  setSearchTerm,
  selectedRegion,
  setSelectedRegion,
  regions,
  isOwner,
  canManageBranches,
  isCreateManagerOpen,
  setIsCreateManagerOpen,
  managerForm,
  setManagerForm,
  handleCreateManager,
}: BranchesTabsNavigationProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="branches">
            <Building2 className="h-4 w-4 mr-2" /> Branches ({branchesLength})
          </TabsTrigger>
          <TabsTrigger value="regions">
            <MapPin className="h-4 w-4 mr-2" /> Regions ({regionsLength})
          </TabsTrigger>
          <TabsTrigger value="managers">
            <Users className="h-4 w-4 mr-2" /> Managers ({managersLength})
          </TabsTrigger>          
        </TabsList>          
        <Button 
          onClick={syncBranchAssignments} 
          disabled={submitting}
          variant="outline"
          size="sm"
          className="ml-4"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sync Data
        </Button>
        <div className="relative flex-1 max-w-md ml-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border bg-background"
          />
        </div>
        {activeTab === 'branches' && (
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48 border-border ml-4">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {activeTab === 'managers' && (isOwner || canManageBranches) && (
          <Dialog open={isCreateManagerOpen} onOpenChange={setIsCreateManagerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 ml-4">
                <Plus className="h-4 w-4 mr-2" />
                New Manager
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Manager</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-name-tab">Full Name *</Label>
                    <Input
                      id="manager-name-tab"
                      value={managerForm.name}
                      onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-email-tab">Email *</Label>
                    <Input
                      id="manager-email-tab"
                      type="email"
                      value={managerForm.email}
                      onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-phone-tab">Phone</Label>
                    <Input
                      id="manager-phone-tab"
                      value={managerForm.phone}
                      onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-jobTitle-tab">Job Title</Label>
                    <Input
                      id="manager-jobTitle-tab"
                      value={managerForm.jobTitle}
                      onChange={(e) => setManagerForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="e.g., Branch Manager"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager-department-tab">Department</Label>
                  <Input
                    id="manager-department-tab"
                    value={managerForm.department}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Operations, Sales"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsCreateManagerOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateManager} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Manager
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Tabs>
  );
}