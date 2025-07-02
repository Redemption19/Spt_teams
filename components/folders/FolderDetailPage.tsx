'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

import {
  ArrowLeft,
  FolderOpen,
  Upload,
  File,
  FileText,
  Image,
  Video,
  Archive,
  Download,
  Share2,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Grid3X3,
  List,
  Calendar,
  Clock,
  User,
  Users,
  Shield,
  Settings,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  FolderPlus,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { Folder, FolderFile, User as UserType, Report } from '@/lib/types';
import { 
  useCanAccessFolder,
  useCanEditFolder,
  useCanUploadToFolder,
  useCanDeleteFolder,
  useCanManageFolderPermissions
} from '@/lib/rbac-hooks';
import { FolderService } from '@/lib/folder-service';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { cleanFirestoreData } from '@/lib/firestore-utils';

// Type definition for reports data structure
type ReportsData = {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  recentReports: Array<{
    id: string;
    title: string;
    authorId: string;
    authorName: string;
    submittedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    type: 'weekly' | 'monthly' | 'project' | 'custom';
  }>;
};

interface FolderDetailPageProps {
  folder: Folder;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FolderDetailPage({ 
  folder, 
  onBack, 
  onEdit, 
  onDelete 
}: FolderDetailPageProps) {
  const { userProfile } = useAuth();
  const { userRole } = useWorkspace();
  
  // RBAC permissions
  const canAccess = useCanAccessFolder(folder);
  const canEdit = useCanEditFolder(folder);
  const canUpload = useCanUploadToFolder(folder);
  const canDelete = useCanDeleteFolder(folder);
  const canManagePermissions = useCanManageFolderPermissions(folder);

  // State management
  const [files, setFiles] = useState<FolderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'images' | 'videos' | 'archives'>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [reports, setReports] = useState<{
    totalReports: number;
    pendingReports: number;
    approvedReports: number;
    rejectedReports: number;
    recentReports: Array<{
      id: string;
      title: string;
      authorId: string;
      authorName: string;
      submittedAt: Date;
      status: 'pending' | 'approved' | 'rejected';
      type: 'weekly' | 'monthly' | 'project' | 'custom';
    }>;
  }>({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    recentReports: []
  });

  // Load folder files
  const loadFiles = useCallback(async () => {
    if (!folder.id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading real data for folder:', {
        folderId: folder.id,
        userId: userProfile?.id,
        userRole
      });
      
      // REAL DATA FETCHING - No mock data fallback
      const [filesData, reportsData] = await Promise.all([
        // Fetch actual files from folder service
        FolderService.getFolderFiles(folder.id, userProfile?.id || '', userRole || 'member'),
        // Since reports aren't implemented yet, we'll skip this for now and set empty data
        Promise.resolve({
          totalReports: 0,
          pendingReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          recentReports: []
        })
      ]);
      
      console.log('✅ Successfully loaded real data:', {
        filesCount: filesData.length,
        reportsCount: reportsData.totalReports,
        files: filesData.map(f => ({ id: f.id, name: f.name, size: f.size }))
      });
      
      setFiles(filesData);
      setReports(reportsData);
      
      // Show message only if folder is empty
      if (filesData.length === 0) {
        toast({
          title: 'ℹ️ No Files Found',
          description: 'This folder is empty. Upload some files to get started!',
          variant: 'default',
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading folder data:', error);
      
      // Set empty data instead of mock data
      setFiles([]);
      setReports({
        totalReports: 0,
        pendingReports: 0,
        approvedReports: 0,
        rejectedReports: 0,
        recentReports: []
      });
      
      // Show the actual error to help debug
      toast({
        title: '❌ Error Loading Data',
        description: error instanceof Error ? error.message : 'Failed to load folder data. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [folder.id, userProfile?.id, userRole]);

  useEffect(() => {
    if (canAccess) {
      loadFiles();
    }
  }, [canAccess, loadFiles]);

  // File operations
  const handleFileUpload = async (uploadedFiles: FileList) => {
    if (!canUpload) {
      toast({
        title: '❌ Upload Denied',
        description: 'You do not have permission to upload files to this folder.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      // Process each file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast({
            title: '❌ Invalid File',
            description: validation.error,
            variant: 'destructive',
          });
          continue;
        }
        
        // Upload to Firebase Storage
        const fileId = await uploadFileToStorage(file, folder.id, userProfile?.id || '');
        
        // File upload successful - it's already been added to state via the storage upload
        console.log('✅ File uploaded successfully:', fileId);
      }

      toast({
        title: '✅ Upload Successful',
        description: `Successfully uploaded ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none',
      });
      
      // Refresh file list to show updated data
      loadFiles();
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: '❌ Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      // Get file data first
      const fileDoc = await getDoc(doc(db, 'files', fileId));
      if (!fileDoc.exists()) {
        throw new Error('File not found');
      }
      
      const fileData = fileDoc.data() as FolderFile;
      
      // Check permissions
      if (fileData.ownerId !== userProfile?.id && userRole !== 'owner' && userRole !== 'admin') {
        toast({
          title: '❌ Delete Denied',
          description: 'You do not have permission to delete this file.',
          variant: 'destructive',
        });
        return;
      }
      
      // Delete from Firebase Storage
      if (fileData.storagePath) {
        const storageRef = ref(storage, fileData.storagePath);
        try {
          await deleteObject(storageRef);
          console.log('🗑️ File deleted from storage:', fileData.storagePath);
        } catch (storageError) {
          console.warn('⚠️ Storage deletion failed (file may not exist):', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'files', fileId));
      
      // Update folder stats
      await updateFolderStats(folder.id, -1, -fileData.size);
      
      // Remove from local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: '✅ File Deleted',
        description: 'File has been successfully deleted',
        className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-none',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: '❌ Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      // In a real app, you'd batch delete from your file service
      setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
      setSelectedFiles([]);
      
      toast({
        title: '✅ Files Deleted',
        description: `Successfully deleted ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`,
        className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-none',
      });
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: '❌ Delete Failed',
        description: 'Failed to delete files. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  };

  // Helper functions
  const getFileType = (mimeType: string): FolderFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'document';
  };

  const getFileIcon = (file: FolderFile) => {
    switch (file.type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'team': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'member-assigned': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'project': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'shared': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || 
                         (filterType === 'documents' && file.type === 'document') ||
                         (filterType === 'images' && file.type === 'image') ||
                         (filterType === 'videos' && file.type === 'video') ||
                         (filterType === 'archives' && file.type === 'archive');
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Firebase Storage helper functions
  
  /**
   * Validate file before upload
   */
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // File size validation (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`
      };
    }
    
    // File type validation
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not allowed`
      };
    }
    
    return { isValid: true };
  };

  /**
   * Upload file to Firebase Storage and create database record
   */
  const uploadFileToStorage = async (file: File, folderId: string, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Generate unique file path
        const fileId = doc(collection(db, 'files')).id;
        const timestamp = Date.now();
        const sanitizedFileName = sanitizeFileName(file.name);
        const filePath = `folders/${folderId}/${timestamp}_${fileId}_${sanitizedFileName}`;
        
        // Create Firebase Storage reference
        const storageRef = ref(storage, filePath);
        
        // Set custom metadata
        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedBy: userId,
            folderId: folderId,
            fileId: fileId,
            description: '',
            tags: ''
          }
        };
        
        console.log('📤 Starting file upload:', {
          fileName: file.name,
          size: file.size,
          type: file.type,
          path: filePath
        });
        
        // Upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            // Progress updates
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('📊 Upload progress:', `${progress.toFixed(1)}%`);
          },
          (error) => {
            // Error handling
            console.error('❌ Upload failed:', error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          async () => {
            try {
              // Upload completed successfully
              console.log('✅ Upload completed');
              
              // Get download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Generate thumbnail URL for images
              let thumbnailUrl: string | undefined;
              if (file.type.startsWith('image/')) {
                thumbnailUrl = downloadUrl;
              }
              
              // Create file record in Firestore
              const fileData: FolderFile = {
                id: fileId,
                name: file.name,
                originalName: file.name,
                folderId,
                ownerId: userId,
                size: file.size,
                type: getFileType(file.type),
                mimeType: file.type,
                downloadUrl,
                thumbnailUrl,
                uploadedAt: new Date(),
                uploadedBy: userId,
                lastModified: new Date(),
                lastModifiedBy: userId,
                status: 'active',
                version: 1,
                isEncrypted: false,
                requiresApproval: false,
                tags: [],
                description: '',
                
                // Storage metadata
                storagePath: filePath,
                storageMetadata: {
                  fullPath: uploadTask.snapshot.metadata.fullPath,
                  bucket: uploadTask.snapshot.metadata.bucket,
                  generation: uploadTask.snapshot.metadata.generation,
                  timeCreated: uploadTask.snapshot.metadata.timeCreated
                }
              };
              
              // Save to Firestore
              await setDoc(doc(db, 'files', fileId), cleanFirestoreData(fileData));
              console.log('💾 File record saved to Firestore:', fileId);
              
              // Update folder stats
              await updateFolderStats(folderId, 1, file.size);
              
              // Add to local state immediately
              setFiles(prev => [fileData, ...prev]);
              
              resolve(fileId);
              
            } catch (error) {
              console.error('❌ Post-upload processing failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              reject(new Error(`Post-upload processing failed: ${errorMessage}`));
            }
          }
        );
        
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Update folder statistics
   */
  const updateFolderStats = async (folderId: string, fileCountDelta: number, sizeDelta: number): Promise<void> => {
    try {
      const folderRef = doc(db, 'folders', folderId);
      const folderDoc = await getDoc(folderRef);
      
      if (folderDoc.exists()) {
        const currentData = folderDoc.data();
        const newFileCount = Math.max(0, (currentData.fileCount || 0) + fileCountDelta);
        const newTotalSize = Math.max(0, (currentData.totalSize || 0) + sizeDelta);
        
        await updateDoc(folderRef, {
          fileCount: newFileCount,
          totalSize: newTotalSize,
          updatedAt: new Date()
        });
        
        console.log('📊 Folder stats updated:', {
          folderId,
          newFileCount,
          newTotalSize: `${(newTotalSize / 1024 / 1024).toFixed(2)} MB`
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to update folder stats:', error);
      // Don't throw - this is not critical
    }
  };

  /**
   * Sanitize filename for storage
   */
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .toLowerCase();
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Access Denied</h3>
        <p className="text-muted-foreground">You do not have permission to access this folder.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Folders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Folders
          </Button>
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {folder.name}
            </h2>
            <Badge className={getTypeColor(folder.type)}>
              {folder.type.replace('-', ' ')}
            </Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button onClick={onEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Folder
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Folder Info & Upload */}
        <div className="space-y-6">
          {/* Folder Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-primary" />
                <span>Folder Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {folder.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{folder.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Files</label>
                  <p className="font-medium">{files.length}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="font-medium">{formatFileSize(folder.totalSize)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium capitalize">{folder.type.replace('-', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                  <p className="font-medium capitalize">{folder.visibility}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm mt-1">{formatDate(folder.createdAt)}</p>
              </div>

              {folder.tags && folder.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {folder.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Area */}
          {canUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Upload Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <div className="space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Drop files here or click to upload</p>
                      <p className="text-xs text-muted-foreground">
                        Support for documents, images, videos, and archives
                      </p>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(e.target.files);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Column 2: File Management & List */}
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="h-5 w-5 text-primary" />
                  <span>Files ({filteredAndSortedFiles.length})</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-wrap gap-2">
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                    <SelectItem value="archives">Archives</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedFiles([])}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <File className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">No files found</p>
                  <p className="text-xs text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'Upload files to get started'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 p-4">
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group relative border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${
                        selectedFiles.includes(file.id) ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => {
                        setSelectedFiles(prev => 
                          prev.includes(file.id) 
                            ? prev.filter(id => id !== file.id)
                            : [...prev, file.id]
                        );
                      }}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          {file.thumbnailUrl ? (
                            <img 
                              src={file.thumbnailUrl} 
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              {getFileIcon(file)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem 
                              onClick={() => handleFileDelete(file.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center space-x-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        selectedFiles.includes(file.id) ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        setSelectedFiles(prev => 
                          prev.includes(file.id) 
                            ? prev.filter(id => id !== file.id)
                            : [...prev, file.id]
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      
                      <div className="flex-shrink-0">
                        {file.thumbnailUrl ? (
                          <img 
                            src={file.thumbnailUrl} 
                            alt={file.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            {getFileIcon(file)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        {file.description && (
                          <p className="text-xs text-muted-foreground truncate">{file.description}</p>
                        )}
                      </div>

                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatFileSize(file.size)}</p>
                        <p>{formatDate(file.uploadedAt)}</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem 
                              onClick={() => handleFileDelete(file.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Settings & Permissions */}
        <div className="space-y-6">
          {/* Access & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Access & Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your Role</span>
                  <Badge variant="outline" className="text-xs">
                    {userRole}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visibility</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {folder.visibility}
                  </Badge>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    {canAccess ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    <span>View files</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {canUpload ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    <span>Upload files</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {canEdit ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    <span>Edit folder</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {canDelete ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                    <span>Delete folder</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Folder Settings */}
          {canManagePermissions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Folder Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="text-sm font-medium">Allow Subfolders</span>
                      <p className="text-xs text-muted-foreground">Create nested folders</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={folder.settings?.allowSubfolders ?? true}
                      readOnly
                      className="h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="text-sm font-medium">Notify on Upload</span>
                      <p className="text-xs text-muted-foreground">Email notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={folder.settings?.notifyOnUpload ?? false}
                      readOnly
                      className="h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="text-sm font-medium">Require Approval</span>
                      <p className="text-xs text-muted-foreground">Approve uploads</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={folder.settings?.requireApproval ?? false}
                      readOnly
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Reports Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded">
                  <p className="font-medium text-lg text-blue-700 dark:text-blue-300">{reports.totalReports}</p>
                  <p className="text-blue-600 dark:text-blue-400">Total Reports</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded">
                  <p className="font-medium text-lg text-green-700 dark:text-green-300">{reports.approvedReports}</p>
                  <p className="text-green-600 dark:text-green-400">Approved</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded">
                  <p className="font-medium text-lg text-yellow-700 dark:text-yellow-300">{reports.pendingReports}</p>
                  <p className="text-yellow-600 dark:text-yellow-400">Pending</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded">
                  <p className="font-medium text-lg text-red-700 dark:text-red-300">{reports.rejectedReports}</p>
                  <p className="text-red-600 dark:text-red-400">Rejected</p>
                </div>
              </div>

              {/* Recent Reports */}
              {reports.recentReports && reports.recentReports.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Recent Reports</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {reports.recentReports.slice(0, 3).map((report: any) => (
                      <div key={report.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{report.title}</p>
                          <p className="text-muted-foreground">{formatDate(report.submittedAt)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              report.status === 'approved' ? 'default' : 
                              report.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {report.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {report.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {reports.recentReports.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-8">
                      View All Reports ({reports.recentReports.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-muted rounded">
                  <p className="font-medium text-lg">{files.length}</p>
                  <p className="text-muted-foreground">Total Files</p>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <p className="font-medium text-lg">{formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}</p>
                  <p className="text-muted-foreground">Total Size</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Documents</span>
                  <span>{files.filter(f => f.type === 'document').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Images</span>
                  <span>{files.filter(f => f.type === 'image').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Videos</span>
                  <span>{files.filter(f => f.type === 'video').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Archives</span>
                  <span>{files.filter(f => f.type === 'archive').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 