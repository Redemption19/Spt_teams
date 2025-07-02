'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  Shield,
  FileText,
  Calendar,
  User,
  Loader2,
  Plus
} from 'lucide-react';

import { Folder } from '@/lib/types';
import { useFolderPermissions } from '@/lib/rbac-hooks';

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

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    );
  }

  if (folders.length === 0) {
    return null; // Let the parent component handle empty state
  }

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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {folders.map((folder) => {
        const permissions = useFolderPermissions(folder);
        
        return (
          <Card 
            key={folder.id} 
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 border border-border/30 hover:border-primary/20"
            onClick={() => onFolderClick(folder)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge className={getTypeColor(folder.type)}>
                      {folder.type}
                    </Badge>
                    {folder.isSystemFolder && (
                      <Badge variant="outline" className="ml-1">
                        <Shield className="h-3 w-3 mr-1" />
                        System
                      </Badge>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {permissions.canOpen && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFolderClick(folder); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                    )}
                    {permissions.canEdit && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {permissions.canUpload && onUploadToFolder && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUploadToFolder(folder); }}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </DropdownMenuItem>
                    )}
                    {permissions.canShare && onShareFolder && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShareFolder(folder); }}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                    )}
                    {permissions.canDownload && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}
                    {permissions.canDelete && (
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardTitle className="text-lg text-foreground truncate">
                {folder.name}
              </CardTitle>
              
              {folder.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {folder.description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium text-foreground ml-auto">{folder.fileCount}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getVisibilityIcon(folder.visibility)}
                  <span className="text-muted-foreground capitalize">{folder.visibility}</span>
                </div>
              </div>

              {/* Size info */}
              {folder.totalSize > 0 && (
                <div className="text-xs text-muted-foreground">
                  Total size: {formatFileSize(folder.totalSize)}
                </div>
              )}

              {/* Tags */}
              {folder.tags && folder.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {folder.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {folder.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{folder.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Owner</span>
                  </div>
                  <span className="truncate max-w-[120px]">
                    {folder.ownerId === 'current-user' ? 'You' : 'Team member'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Modified</span>
                  </div>
                  <span>{formatDate(folder.updatedAt)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2 pt-2">
                {permissions.canOpen && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); onFolderClick(folder); }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                )}
                {permissions.canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
