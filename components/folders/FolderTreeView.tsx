'use client';

import React, { useState, useMemo, useCallback, memo } from 'react'; // Import memo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share2,
  Upload,
  Plus,
  Search,
  FileText,
  Users,
  Globe,
  Lock,
  Shield,
  TreePine,
  Loader2
} from 'lucide-react';

import { Folder as FolderType } from '@/lib/types';
import { useFolderPermissions } from '@/lib/rbac-hooks';

// --- Helper Functions (Moved outside components) ---

const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'public': return <Globe className="h-3 w-3 text-blue-500" />;
    case 'team': return <Users className="h-3 w-3 text-green-500" />;
    case 'project': return <FolderOpen className="h-3 w-3 text-purple-500" />;
    default: return <Lock className="h-3 w-3 text-gray-500" />;
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

// --- FolderTreeNode Interface ---
interface FolderTreeNode extends FolderType {
  children: FolderTreeNode[];
  isExpanded: boolean;
  level: number;
}

// --- TreeNode Component (Moved outside and memoized) ---

interface TreeNodeProps {
  node: FolderTreeNode;
  expandedNodes: Set<string>;
  onToggleExpanded: (nodeId: string) => void;
  onFolderClick: (folder: FolderType) => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (folder: FolderType) => void;
  onCreateSubfolder?: (parentFolder: FolderType) => void;
}

const TreeNode = memo(function TreeNode({ // Wrapped with React.memo
  node,
  expandedNodes,
  onToggleExpanded,
  onFolderClick,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder
}: TreeNodeProps) {
  const permissions = useFolderPermissions(node);
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div className="select-none">
      <div
        className={`group flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-l-2 ${
          node.level > 0 ? 'ml-2 sm:ml-6' : ''
        } ${
          node.isSystemFolder ? 'border-l-yellow-400' : 'border-l-transparent'
        }`}
        style={{ paddingLeft: `${Math.min(node.level * 16 + 12, 200)}px` }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpanded(node.id);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        {/* Folder Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Folder Info */}
        <div
          className="flex-1 min-w-0 flex items-center space-x-2"
          onClick={() => onFolderClick(node)}
        >
          <span className="font-medium text-sm truncate">{node.name}</span>

          <Badge className={`${getTypeColor(node.type)} text-xs hidden sm:inline-flex`}>
            {node.type}
          </Badge>

          {node.isSystemFolder && (
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              <Shield className="h-3 w-3 mr-1" />
              System
            </Badge>
          )}

          <div className="hidden sm:block">
            {getVisibilityIcon(node.visibility)}
          </div>
        </div>

        {/* File Count */}
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span className="hidden sm:inline">{node.fileCount}</span>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {permissions.canOpen && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFolderClick(node); }}>
                <Eye className="h-4 w-4 mr-2" />
                Open
              </DropdownMenuItem>
            )}
            {permissions.canEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditFolder(node); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {permissions.canUpload && onCreateSubfolder && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateSubfolder(node); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Subfolder
              </DropdownMenuItem>
            )}
            {permissions.canShare && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            {permissions.canDelete && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(node); }}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2 sm:ml-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
              onFolderClick={onFolderClick}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateSubfolder={onCreateSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// --- FolderTreeView Component ---

interface FolderTreeViewProps {
  folders: FolderType[];
  loading: boolean;
  onFolderClick: (folder: FolderType) => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (folder: FolderType) => void;
  onCreateSubfolder?: (parentFolder: FolderType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  userRole?: string | null;
}

export default function FolderTreeView({
  folders,
  loading,
  onFolderClick,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  searchTerm,
  onSearchChange,
  userRole
}: FolderTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from flat folder array
  const treeData = useMemo(() => {
    const nodeMap = new Map<string, FolderTreeNode>();
    const rootNodes: FolderTreeNode[] = [];

    // Create nodes for all folders
    folders.forEach(folder => {
      const node: FolderTreeNode = {
        ...folder,
        children: [],
        isExpanded: expandedNodes.has(folder.id), // Initialize expanded state
        level: 0
      };
      nodeMap.set(folder.id, node);
    });

    // Build parent-child relationships
    folders.forEach(folder => {
      const node = nodeMap.get(folder.id);
      if (!node) return;

      if (folder.parentId && nodeMap.has(folder.parentId)) {
        const parent = nodeMap.get(folder.parentId)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootNodes.push(node);
      }
    });

    // Sort nodes by name
    const sortNodes = (nodes: FolderTreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [folders, expandedNodes]); // `expandedNodes` is a dependency because `isExpanded` is derived from it

  // Filter tree based on search term (corrected logic)
  const filteredTreeData = useMemo(() => {
    if (!searchTerm.trim()) return treeData;

    const filterNodesRecursive = (nodes: FolderTreeNode[]): FolderTreeNode[] => {
      const filtered: FolderTreeNode[] = [];
      for (const node of nodes) {
        const matchesNode = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            node.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchedChildren = filterNodesRecursive(node.children); // Recursively filter children

        if (matchesNode || matchedChildren.length > 0) {
          filtered.push({
            ...node,
            children: matchedChildren,
            // If a node or its children match, ensure its path is expanded
            isExpanded: node.isExpanded || matchesNode || matchedChildren.length > 0,
          });
        }
      }
      return filtered;
    };

    return filterNodesRecursive(treeData);
  }, [treeData, searchTerm]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []); // No dependencies needed as `prev` is used for state update

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: FolderTreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpandedNodes(allIds);
  }, [treeData]); // `treeData` is a dependency here

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []); // No dependencies needed

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TreePine className="h-5 w-5 text-primary" />
            <span>Tree View</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading folder tree...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <TreePine className="h-5 w-5 text-primary" />
            <span>Tree View</span>
            <Badge variant="outline" className="text-xs">
              {folders.length} folders
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs"
            >
              Collapse All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search folders in tree..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tree */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredTreeData.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <TreePine className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No folders found</p>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Create some folders to build your tree'}
              </p>
            </div>
          ) : (
            filteredTreeData.map((node) => ( // Removed `index` as it's not used in TreeNodeProps
              <TreeNode
                key={node.id}
                node={node}
                expandedNodes={expandedNodes}
                onToggleExpanded={toggleExpanded}
                onFolderClick={onFolderClick}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
                onCreateSubfolder={onCreateSubfolder}
              />
            ))
          )}
        </div>

        {/* Tree Stats */}
        {filteredTreeData.length > 0 && (
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span>Total folders: {folders.length}</span>
              <span>Expanded: {expandedNodes.size}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
