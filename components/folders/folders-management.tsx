'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Folder,
  FileText,
  Users,
  Lock,
  Globe,
  Settings,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

const mockFolders = [
  {
    id: '1',
    name: 'Team Reports',
    description: 'Weekly and monthly team reports',
    type: 'team',
    parentId: null,
    ownerId: 'john-doe',
    ownerName: 'John Doe',
    teamId: 'team-1',
    teamName: 'Development Team',
    branchId: 'central-branch',
    branchName: 'Central Branch',
    permissions: {
      read: ['team-1'],
      write: ['john-doe', 'sarah-wilson'],
      admin: ['john-doe'],
    },
    itemCount: 12,
    subfolders: [
      {
        id: '1-1',
        name: 'Weekly Reports',
        itemCount: 8,
        lastModified: '2024-01-20',
      },
      {
        id: '1-2',
        name: 'Monthly Reports',
        itemCount: 4,
        lastModified: '2024-01-18',
      },
    ],
    lastModified: '2024-01-20',
  },
  {
    id: '2',
    name: 'Project Documentation',
    description: 'Technical documentation and specs',
    type: 'team',
    parentId: null,
    ownerId: 'sarah-wilson',
    ownerName: 'Sarah Wilson',
    teamId: 'team-1',
    teamName: 'Development Team',
    branchId: 'central-branch',
    branchName: 'Central Branch',
    permissions: {
      read: ['team-1'],
      write: ['sarah-wilson', 'mike-chen'],
      admin: ['sarah-wilson'],
    },
    itemCount: 25,
    subfolders: [
      {
        id: '2-1',
        name: 'API Documentation',
        itemCount: 15,
        lastModified: '2024-01-19',
      },
      {
        id: '2-2',
        name: 'User Guides',
        itemCount: 10,
        lastModified: '2024-01-17',
      },
    ],
    lastModified: '2024-01-19',
  },
  {
    id: '3',
    name: 'Personal Notes',
    description: 'My personal work notes and drafts',
    type: 'personal',
    parentId: null,
    ownerId: 'john-doe',
    ownerName: 'John Doe',
    teamId: null,
    teamName: null,
    branchId: 'central-branch',
    branchName: 'Central Branch',
    permissions: {
      read: ['john-doe'],
      write: ['john-doe'],
      admin: ['john-doe'],
    },
    itemCount: 7,
    subfolders: [],
    lastModified: '2024-01-21',
  },
];

export function FoldersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  const filteredFolders = mockFolders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         folder.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || folder.type === selectedType;
    const matchesTeam = selectedTeam === 'all' || folder.teamName === selectedTeam;
    
    return matchesSearch && matchesType && matchesTeam;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Folders
          </h1>
          <p className="text-muted-foreground mt-1">Organize your team&apos;s files and documents</p>
        </div>
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input id="folder-name" placeholder="Enter folder name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder-type">Folder Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Team Folder</SelectItem>
                      <SelectItem value="personal">Personal Folder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-description">Description</Label>
                <Textarea id="folder-description" placeholder="Brief description of the folder" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root Level)</SelectItem>
                      {mockFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-assignment">Assign to Team</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team-1">Development Team</SelectItem>
                      <SelectItem value="team-2">Design Team</SelectItem>
                      <SelectItem value="team-3">Analytics Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Read Access</Label>
                    <Select>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team">Team Members</SelectItem>
                        <SelectItem value="branch">Branch Members</SelectItem>
                        <SelectItem value="all">All Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Write Access</Label>
                    <Select>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner Only</SelectItem>
                        <SelectItem value="admins">Team Admins</SelectItem>
                        <SelectItem value="team">Team Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Admin Access</Label>
                    <Select>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner Only</SelectItem>
                        <SelectItem value="leads">Team Leads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateFolderOpen(false)}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border bg-background"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="team">Team Folders</SelectItem>
              <SelectItem value="personal">Personal Folders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="Development Team">Development Team</SelectItem>
              <SelectItem value="Design Team">Design Team</SelectItem>
              <SelectItem value="Analytics Team">Analytics Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'tree')}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="tree">Tree View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFolders.map((folder) => (
            <Card key={folder.id} className="card-interactive border border-border/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <FolderOpen className="h-4 w-4 text-white" />
                    </div>
                    <Badge className={folder.type === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'}>
                      {folder.type}
                    </Badge>
                    {folder.type === 'personal' && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg text-foreground">{folder.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{folder.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium text-foreground">{folder.itemCount}</span>
                </div>

                {folder.subfolders.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Subfolders</div>
                    <div className="space-y-1">
                      {folder.subfolders.slice(0, 2).map((subfolder) => (
                        <div key={subfolder.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Folder className="h-3 w-3" />
                          <span>{subfolder.name}</span>
                          <span className="text-xs text-muted-foreground/70">({subfolder.itemCount})</span>
                        </div>
                      ))}
                      {folder.subfolders.length > 2 && (
                        <div className="text-xs text-muted-foreground/70">
                          +{folder.subfolders.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Owner: {folder.ownerName}</span>
                  </div>
                  {folder.teamName && (
                    <div className="text-sm text-muted-foreground">
                      Team: {folder.teamName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground/70">
                    Modified: {new Date(folder.lastModified).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 border-border hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-border hover:bg-gray-100 dark:hover:bg-gray-800">
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-enhanced border border-border/30">
          <CardContent className="p-6">
            <Accordion type="multiple" className="w-full">
              {filteredFolders.map((folder) => (
                <AccordionItem key={folder.id} value={folder.id} className="border-border">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <FolderOpen className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{folder.name}</span>
                        <Badge className={folder.type === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'}>
                          {folder.type}
                        </Badge>
                        {folder.type === 'personal' && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <span className="text-sm text-muted-foreground">({folder.itemCount} items)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8 space-y-3">
                      <p className="text-sm text-muted-foreground">{folder.description}</p>
                      
                      {folder.subfolders.length > 0 && (
                        <div className="space-y-2">
                          {folder.subfolders.map((subfolder) => (
                            <div key={subfolder.id} className="flex items-center space-x-3 p-2 rounded-lg hover-light-dark transition-colors">
                              <Folder className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{subfolder.name}</span>
                              <span className="text-xs text-muted-foreground">({subfolder.itemCount} items)</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(subfolder.lastModified).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                          Owner: {folder.ownerName} • {folder.teamName || 'Personal'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Settings className="h-4 w-4 mr-1" />
                            Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}