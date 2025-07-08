'use client';

import React, { useState, useMemo, memo } from 'react'; // Import memo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox for bulk operations

import {
  FolderOpen,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share2,
  Download,
  Upload,
  Lock,
  Users,
  Globe,
  FileText,
  Calendar,
  User,
  Loader2,
  Plus
} from 'lucide-react';

import { Folder } from '@/lib/types';
import { useFolderPermissions } from '@/lib/rbac-hooks';
import { useUserNames } from '@/hooks/use-user-names';

// --- Helper Functions (Moved outside components) ---

const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'public': return <Globe className="h-4 w-4 text-blue-500" />;
    case 'team': return <Users className="h-4 w-4 text-green-500" />;
    case 'project': return <FolderOpen className="h-4 w-4 text-purple-500" />;
    default: return <Lock className="h-4 w-4 text-gray-500" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'team': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'member': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    case 'project': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'shared': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// --- FolderCard Component (Moved outside and memoized) ---

interface FolderCardProps {
  folder: Folder;
  onFolderClick: (folder: Folder) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onShareFolder?: (folder: Folder) => void;
  onUploadToFolder?: (folder: Folder) => void;
  userNames: Map<string, string>;
  userNamesLoading: boolean;
  selectedFolders?: string[];
  onSelectFolder?: (folderId: string, checked: boolean) => void;
  allowBulkOperations?: boolean;
}

const FolderCard = memo(function FolderCard({ // Wrapped with React.memo
  folder,
  onFolderClick,
  onEditFolder,
  onDeleteFolder,
  onShareFolder,
  onUploadToFolder,
  userNames,
  userNamesLoading,
  selectedFolders,
  onSelectFolder,
  allowBulkOperations
}: FolderCardProps) {
  const permissions = useFolderPermissions(folder);
  const userName = userNames.get(folder.createdBy) || folder.createdBy;
  const isSelected = selectedFolders?.includes(folder.id) || false;

  return (
    <Card
      key={folder.id}
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 border border-border/30 hover:border-primary/20 relative"
      onClick={() => onFolderClick(folder)}
    >
      {/* Selection Checkbox for Bulk Operations */}
      {allowBulkOperations && onSelectFolder && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectFolder(folder.id, checked as boolean)}
            onClick={(e) => e.stopPropagation()} // Prevent card click when checkbox is clicked
            className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-sm"
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{folder.name}</CardTitle>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onFolderClick(folder);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Folder
              </DropdownMenuItem>

              {permissions.canEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEditFolder(folder);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}

              {onShareFolder && permissions.canShare && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onShareFolder(folder);
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}

              {onUploadToFolder && permissions.canUpload && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onUploadToFolder(folder);
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </DropdownMenuItem>
              )}

              {permissions.canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {folder.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {folder.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>{folder.fileCount || 0} files</span>
            </span>
            <span>{formatFileSize(folder.totalSize || 0)}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{folder.memberCount || 0} members</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{folder.updatedAt ? formatDate(folder.updatedAt) : 'N/A'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {folder.visibility === 'public' ? (
              <Badge variant="secondary" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}

            {folder.department && (
              <Badge variant="outline" className="text-xs">
                {folder.department}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{userNamesLoading ? folder.createdBy : userName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// --- FolderCardGrid Component ---

interface FolderCardGridProps {
  folders: Folder[];
  loading: boolean;
  onFolderClick: (folder: Folder) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onShareFolder?: (folder: Folder) => void;
  onUploadToFolder?: (folder: Folder) => void;
  onCreateSampleFolders?: () => void;
  searchTerm: string;
  userRole?: string | null;
  submitting?: boolean;
  selectedFolders?: string[];
  onSelectFolder?: (folderId: string, checked: boolean) => void;
  allowBulkOperations?: boolean;
}

export default function FolderCardGrid({
  folders,
  loading,
  onFolderClick,
  onEditFolder,
  onDeleteFolder,
  onShareFolder,
  onUploadToFolder,
  onCreateSampleFolders,
  searchTerm,
  userRole,
  submitting,
  selectedFolders,
  onSelectFolder,
  allowBulkOperations
}: FolderCardGridProps) {

  // Batch resolve all user names at the grid level
  const userIds = useMemo(() => Array.from(new Set(folders.map(f => f.createdBy))), [folders]);
  const { userNames, loading: userNamesLoading } = useUserNames(userIds);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (folders.length === 0) {
    return null; // Let the parent component handle empty state
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onFolderClick={onFolderClick}
            onEditFolder={onEditFolder}
            onDeleteFolder={onDeleteFolder}
            onShareFolder={onShareFolder}
            onUploadToFolder={onUploadToFolder}
            userNames={userNames}
            userNamesLoading={userNamesLoading}
            selectedFolders={selectedFolders}
            onSelectFolder={onSelectFolder}
            allowBulkOperations={allowBulkOperations}
          />
        ))}
      </div>

      {/* Show empty state or create button */}
      {folders.length === 0 && !loading && (
        <div className="col-span-full">
          <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/5">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searchTerm ? 'No folders found' : 'No folders yet'}
              </h3>
              <p className="text-sm text-muted-foreground/80 mb-4 max-w-sm">
                {searchTerm
                  ? `No folders match "${searchTerm}". Try adjusting your search.`
                  : "Get started by creating your first folder or uploading some content."
                }
              </p>
              {!searchTerm && onCreateSampleFolders && (
                <Button onClick={onCreateSampleFolders} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sample Folders
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
