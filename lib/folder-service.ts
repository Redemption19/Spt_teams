import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Folder, 
  FolderFile, 
  FolderActivity, 
  MemberFolderStructure,
  Project,
  User
} from './types';
import { cleanFirestoreData, createDocumentData, createUpdateData, sortByDateDesc, toDate } from './firestore-utils';

export class FolderService {
  /**
   * RBAC-based folder creation with automated member folder setup
   */
  static async createFolder(
    folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<string> {
    try {
      const folderRef = doc(collection(db, 'folders'));
      const folderId = folderRef.id;

      const folder: Folder = {
        ...folderData,
        id: folderId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        fileCount: 0,
        totalSize: 0,
        status: 'active',
        isShared: false,
        sharedWith: [],
        tags: [],
        settings: {
          allowSubfolders: true,
          maxSubfolders: 50,
          notifyOnUpload: false,
          requireApproval: false,
          autoArchive: false,
        }
      };

      await setDoc(folderRef, cleanFirestoreData(folder));

      // Log folder creation activity
      await this.logFolderActivity(folderId, userId, 'created', `Created folder "${folder.name}"`);

      // If this is a project folder, automatically create member folders structure
      if (folder.type === 'project' && folder.projectId) {
        await this.createMemberFoldersStructure(folder.projectId, folder.workspaceId, userId);
      }

      return folderId;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Create member folders structure for a project
   * Projects/Project A/Member Folders/[Member Name]/
   */
  static async createMemberFoldersStructure(
    projectId: string, 
    workspaceId: string, 
    createdBy: string
  ): Promise<void> {
    try {
      // Get project details
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      const project = projectDoc.data() as Project;

      // Create "Member Folders" system folder
      const memberFoldersRef = doc(collection(db, 'folders'));
      const memberFoldersId = memberFoldersRef.id;

      const memberFoldersFolder: Folder = {
        id: memberFoldersId,
        name: 'Member Folders',
        description: `Private folders for ${project.name} team members`,
        workspaceId,
        mainWorkspaceId: workspaceId,
        subWorkspaceId: workspaceId,
        projectId,
        ownerId: createdBy,
        type: 'project',
        folderPath: `Projects/${project.name}/Member Folders`,
        level: 2,
        isSystemFolder: true,
        visibility: 'project',
        inheritPermissions: false,
        permissions: {
          read: [createdBy, ...project.projectAdmins, ...project.projectMembers],
          write: [createdBy, ...project.projectAdmins],
          admin: [createdBy, ...project.projectAdmins],
          delete: [createdBy]
        },
        fileCount: 0,
        totalSize: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        status: 'active',
        isShared: false,
        sharedWith: [],
        tags: ['system', 'member-folders'],
        settings: {
          allowSubfolders: true,
          maxSubfolders: 100,
          notifyOnUpload: true,
          requireApproval: false,
          autoArchive: false,
        }
      };

      await setDoc(memberFoldersRef, cleanFirestoreData(memberFoldersFolder));

      // Create individual folders for each project member
      const adminIds = Array.from(project.projectAdmins || []);
      const memberIds = Array.from(project.projectMembers || []);
      const allMemberIds = Array.from(new Set([...adminIds, ...memberIds]));
      
      for (const memberId of allMemberIds) {
        await this.createMemberPersonalFolder(memberId, memberFoldersId, project, workspaceId, createdBy);
      }

      await this.logFolderActivity(memberFoldersId, createdBy, 'created', `Created member folders structure for project "${project.name}"`);
    } catch (error) {
      console.error('Error creating member folders structure:', error);
      throw error;
    }
  }

  /**
   * Create individual member folder
   */
  static async createMemberPersonalFolder(
    memberId: string,
    parentFolderId: string,
    project: Project,
    workspaceId: string,
    createdBy: string
  ): Promise<string> {
    try {
      // Get member details
      const memberDoc = await getDoc(doc(db, 'users', memberId));
      if (!memberDoc.exists()) {
        console.warn(`Member ${memberId} not found, skipping folder creation`);
        return '';
      }
      const member = memberDoc.data() as User;

      const memberFolderRef = doc(collection(db, 'folders'));
      const memberFolderId = memberFolderRef.id;

      const memberFolder: Folder = {
        id: memberFolderId,
        name: member.name,
        description: `Private folder for ${member.name}`,
        parentId: parentFolderId,
        workspaceId,
        mainWorkspaceId: workspaceId,
        subWorkspaceId: workspaceId,
        projectId: project.id,
        memberId,
        ownerId: memberId, // Member owns their folder
        type: 'member',
        folderPath: `Projects/${project.name}/Member Folders/${member.name}`,
        level: 3,
        isSystemFolder: false,
        visibility: 'private',
        inheritPermissions: false,
        // RBAC: Only member + admins/owners can access
        permissions: {
          read: [memberId, createdBy, ...project.projectAdmins],
          write: [memberId, createdBy, ...project.projectAdmins],
          admin: [createdBy, ...project.projectAdmins],
          delete: [createdBy] // Only system owners can delete member folders
        },
        fileCount: 0,
        totalSize: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        status: 'active',
        isShared: false,
        sharedWith: [],
        tags: ['member-folder', member.name.toLowerCase().replace(/\s+/g, '-')],
        settings: {
          allowSubfolders: true,
          maxSubfolders: 20,
          notifyOnUpload: true,
          requireApproval: false,
          autoArchive: false,
          archiveAfterDays: 365,
        }
      };

      await setDoc(memberFolderRef, cleanFirestoreData(memberFolder));
      await this.logFolderActivity(memberFolderId, createdBy, 'created', `Created personal folder for ${member.name}`);

      return memberFolderId;
    } catch (error) {
      console.error('Error creating member personal folder:', error);
      throw error;
    }
  }

  /**
   * Get folders with RBAC filtering
   */
  static async getFoldersForUser(
    userId: string, 
    workspaceId: string,
    userRole: string
  ): Promise<Folder[]> {
    try {
      console.log('📊 FolderService.getFoldersForUser called:', {
        userId,
        workspaceId,
        userRole
      });

      const foldersRef = collection(db, 'folders');
      const q = query(
        foldersRef,
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      console.log('🔍 Raw folders from DB:', {
        totalDocs: snapshot.docs.length,
        workspaceId: workspaceId
      });

      let folders = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: toDate(docSnapshot.data().createdAt),
        updatedAt: toDate(docSnapshot.data().updatedAt),
        lastAccessedAt: docSnapshot.data().lastAccessedAt ? toDate(docSnapshot.data().lastAccessedAt) : undefined,
        archivedAt: docSnapshot.data().archivedAt ? toDate(docSnapshot.data().archivedAt) : undefined,
      } as Folder));

      console.log('📁 Folders before RBAC filtering:', {
        totalFolders: folders.length,
        folders: folders.map(f => ({ 
          id: f.id, 
          name: f.name, 
          type: f.type, 
          ownerId: f.ownerId,
          workspaceId: f.workspaceId,
          status: f.status
        }))
      });

      // For owners, skip RBAC filtering to ensure they see everything
      if (userRole === 'owner') {
        console.log('👑 Owner detected - returning ALL folders without RBAC filtering');
        return folders;
      }

      // Apply RBAC filtering for non-owners
      console.log('🔒 Applying RBAC filtering for role:', userRole);
      const originalCount = folders.length;
      folders = folders.filter(folder => this.canUserAccessFolder(folder, userId, userRole));
      
      console.log('✅ Folders after RBAC filtering:', {
        originalCount,
        filteredCount: folders.length,
        removedCount: originalCount - folders.length
      });

      return folders;
    } catch (error) {
      console.error('❌ Error fetching folders:', error);
      throw error;
    }
  }

  /**
   * Get member folder structure for a project
   */
  static async getMemberFolderStructure(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<MemberFolderStructure | null> {
    try {
      // Find the "Member Folders" system folder for this project
      const foldersRef = collection(db, 'folders');
      const q = query(
        foldersRef,
        where('projectId', '==', projectId),
        where('isSystemFolder', '==', true),
        where('name', '==', 'Member Folders')
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const memberFoldersDoc = snapshot.docs[0];
      const memberFoldersFolder = memberFoldersDoc.data() as Folder;

      // Check if user can access this structure
      if (!this.canUserAccessFolder(memberFoldersFolder, userId, userRole)) {
        return null;
      }

      // Get project details
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        return null;
      }
      const project = projectDoc.data() as Project;

      // Get all member folders under this structure
      const memberFoldersQuery = query(
        foldersRef,
        where('parentId', '==', memberFoldersFolder.id),
        where('type', '==', 'member')
      );

      const memberFoldersSnapshot = await getDocs(memberFoldersQuery);
      const memberFolders = [];

      for (const folderDoc of memberFoldersSnapshot.docs) {
        const folder = folderDoc.data() as Folder;
        
        // Apply RBAC - owners/admins see all, members see only their own
        if (userRole === 'owner' || userRole === 'admin' || 
            folder.memberId === userId || 
            this.canUserAccessFolder(folder, userId, userRole)) {
          
          // Get member details
          let userName = 'Unknown User';
          if (folder.memberId) {
            const memberDoc = await getDoc(doc(db, 'users', folder.memberId));
            if (memberDoc.exists()) {
              userName = (memberDoc.data() as User).name;
            }
          }

          memberFolders.push({
            userId: folder.memberId || '',
            userName,
            folderId: folder.id,
            folderName: folder.name,
            lastActivity: folder.lastAccessedAt || folder.updatedAt,
            fileCount: folder.fileCount,
            totalSize: folder.totalSize,
            hasNewContent: this.hasRecentActivity(folder)
          });
        }
      }

      return {
        id: memberFoldersFolder.id,
        projectId,
        projectName: project.name,
        memberFoldersId: memberFoldersFolder.id,
        memberFolders
      };
    } catch (error) {
      console.error('Error fetching member folder structure:', error);
      return null;
    }
  }

  /**
   * RBAC: Check if user can access folder
   */
  static canUserAccessFolder(folder: Folder, userId: string, userRole: string): boolean {
    // Owner and Admin have access to all folders
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Folder owner can always access their folder
    if (folder.ownerId === userId) {
      return true;
    }

    // Member folder: only the member can access (admins/owners already handled above)
    if (folder.type === 'member' && folder.memberId === userId) {
      return true;
    }

    // Check explicit permissions
    if (folder.permissions.read.includes(userId) || 
        folder.permissions.write.includes(userId) || 
        folder.permissions.admin.includes(userId)) {
      return true;
    }

    // Check visibility settings
    if (folder.visibility === 'public') {
      return true;
    }

    if (folder.visibility === 'team' && folder.teamId) {
      // Would need to check if user is in the team - simplified for now
      return true;
    }

    return false;
  }

  /**
   * Update folder with RBAC checks
   */
  static async updateFolder(
    folderId: string,
    updates: Partial<Folder>,
    userId: string,
    userRole: string
  ): Promise<void> {
    try {
      // Get current folder
      const folder = await this.getFolder(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Check permissions
      if (!this.canUserEditFolder(folder, userId, userRole)) {
        throw new Error('Insufficient permissions to edit this folder');
      }

      const folderRef = doc(db, 'folders', folderId);
      const updateData = {
        ...createUpdateData(cleanFirestoreData(updates)),
        updatedAt: new Date()
      };

      await updateDoc(folderRef, updateData);
      await this.logFolderActivity(folderId, userId, 'updated', `Updated folder "${folder.name}"`);
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  }

  /**
   * Delete folder with RBAC checks
   */
  static async deleteFolder(folderId: string, userId: string, userRole: string): Promise<void> {
    try {
      const folder = await this.getFolder(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Check permissions
      if (!this.canUserDeleteFolder(folder, userId, userRole)) {
        throw new Error('Insufficient permissions to delete this folder');
      }

      // Soft delete - mark as deleted instead of removing
      await updateDoc(doc(db, 'folders', folderId), {
        status: 'deleted',
        updatedAt: new Date(),
        archivedAt: new Date(),
        archivedBy: userId
      });

      await this.logFolderActivity(folderId, userId, 'deleted', `Deleted folder "${folder.name}"`);
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  /**
   * Permission checks
   */
  static canUserEditFolder(folder: Folder, userId: string, userRole: string): boolean {
    if (userRole === 'owner' || userRole === 'admin') return true;
    if (folder.ownerId === userId) return true;
    return folder.permissions.write.includes(userId) || folder.permissions.admin.includes(userId);
  }

  static canUserDeleteFolder(folder: Folder, userId: string, userRole: string): boolean {
    if (userRole === 'owner') return true;
    if (userRole === 'admin' && !folder.isSystemFolder) return true;
    return folder.permissions.delete.includes(userId);
  }

  /**
   * Get single folder
   */
  static async getFolder(folderId: string): Promise<Folder | null> {
    try {
      const folderDoc = await getDoc(doc(db, 'folders', folderId));
      if (!folderDoc.exists()) return null;

      const data = folderDoc.data();
      return {
        id: folderDoc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        lastAccessedAt: data.lastAccessedAt ? toDate(data.lastAccessedAt) : undefined,
        archivedAt: data.archivedAt ? toDate(data.archivedAt) : undefined,
      } as Folder;
    } catch (error) {
      console.error('Error fetching folder:', error);
      return null;
    }
  }

  /**
   * Log folder activity for audit trail
   */
  static async logFolderActivity(
    folderId: string,
    userId: string,
    action: FolderActivity['action'],
    description: string,
    targetId?: string,
    targetName?: string
  ): Promise<void> {
    try {
      const activityRef = doc(collection(db, 'folderActivities'));
      
      // Get user details for the log
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userName = userDoc.exists() ? (userDoc.data() as User).name : 'Unknown User';

      const activity: Omit<FolderActivity, 'id'> = {
        folderId,
        userId,
        userName,
        action,
        description,
        timestamp: new Date(),
        targetId,
        targetName,
        workspaceId: '', // Will be populated from folder context
      };

      await setDoc(activityRef, activity);
    } catch (error) {
      console.warn('Failed to log folder activity:', error);
      // Don't throw - activity logging is not critical
    }
  }

  /**
   * Helper methods
   */
  private static hasRecentActivity(folder: Folder): boolean {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return folder.lastAccessedAt ? folder.lastAccessedAt > threeDaysAgo : false;
  }

  /**
   * Get folder hierarchy path
   */
  static async getFolderPath(folderId: string): Promise<Folder[]> {
    try {
      const path: Folder[] = [];
      let currentFolderId = folderId;

      while (currentFolderId) {
        const folder = await this.getFolder(currentFolderId);
        if (!folder) break;

        path.unshift(folder);
        currentFolderId = folder.parentId || '';
      }

      return path;
    } catch (error) {
      console.error('Error getting folder path:', error);
      return [];
    }
  }

  /**
   * Auto-create member folder when new member joins project
   */
  static async onMemberAddedToProject(
    projectId: string,
    memberId: string,
    addedBy: string
  ): Promise<void> {
    try {
      // Find the project's member folders structure
      const foldersRef = collection(db, 'folders');
      const q = query(
        foldersRef,
        where('projectId', '==', projectId),
        where('isSystemFolder', '==', true),
        where('name', '==', 'Member Folders')
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const memberFoldersDoc = snapshot.docs[0];
        const memberFoldersFolder = memberFoldersDoc.data() as Folder;

        // Get project details
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const project = projectDoc.data() as Project;
          
          // Create member folder
          await this.createMemberPersonalFolder(
            memberId, 
            memberFoldersFolder.id, 
            project, 
            memberFoldersFolder.workspaceId, 
            addedBy
          );
        }
      }
    } catch (error) {
      console.error('Error creating member folder on project join:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get files in a folder with RBAC checks
   */
  static async getFolderFiles(
    folderId: string,
    userId: string,
    userRole: string
  ): Promise<FolderFile[]> {
    try {
      // First check if user can access the folder
      const folder = await this.getFolder(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }

      if (!this.canUserAccessFolder(folder, userId, userRole)) {
        throw new Error('Insufficient permissions to access this folder');
      }

      // Query files for this folder
      const filesRef = collection(db, 'files');
      const q = query(
        filesRef,
        where('folderId', '==', folderId),
        where('status', '==', 'active'),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const files = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        uploadedAt: toDate(docSnapshot.data().uploadedAt),
        lastModified: toDate(docSnapshot.data().lastModified),
      } as FolderFile));

      return files;
    } catch (error) {
      console.error('Error fetching folder files:', error);
      throw error;
    }
  }

  /**
   * Get report statistics for a folder
   */
  static async getFolderReports(
    folderId: string,
    userId: string,
    userRole: string
  ): Promise<{
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
  }> {
    try {
      // Check folder access first
      const folder = await this.getFolder(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }

      if (!this.canUserAccessFolder(folder, userId, userRole)) {
        throw new Error('Insufficient permissions to access this folder');
      }

      // Query reports associated with this folder
      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef,
        where('folderId', '==', folderId),
        orderBy('submittedAt', 'desc'),
        limit(50) // Limit to recent reports for performance
      );

      const snapshot = await getDocs(q);
      const reports = [];
      let totalReports = 0;
      let pendingReports = 0;
      let approvedReports = 0;
      let rejectedReports = 0;

      for (const docSnapshot of snapshot.docs) {
        const reportData = docSnapshot.data();
        
        totalReports++;
        switch (reportData.status) {
          case 'pending':
            pendingReports++;
            break;
          case 'approved':
            approvedReports++;
            break;
          case 'rejected':
            rejectedReports++;
            break;
        }

        // Get author name
        let authorName = 'Unknown Author';
        if (reportData.authorId) {
          try {
            const authorDoc = await getDoc(doc(db, 'users', reportData.authorId));
            if (authorDoc.exists()) {
              authorName = authorDoc.data().name || 'Unknown Author';
            }
          } catch (error) {
            console.warn('Could not fetch author name:', error);
          }
        }

        reports.push({
          id: docSnapshot.id,
          title: reportData.title || 'Untitled Report',
          authorId: reportData.authorId || '',
          authorName,
          submittedAt: toDate(reportData.submittedAt),
          status: reportData.status || 'pending',
          type: reportData.type || 'custom'
        });
      }

      return {
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports,
        recentReports: reports.slice(0, 10) // Return top 10 most recent
      };
    } catch (error) {
      console.error('Error fetching folder reports:', error);
      throw error;
    }
  }

  /**
   * Upload file to folder with RBAC checks
   */
  static async uploadFileToFolder(
    folderId: string,
    file: File,
    userId: string,
    userRole: string,
    description?: string,
    tags?: string[]
  ): Promise<string> {
    try {
      // Check folder access and upload permissions
      const folder = await this.getFolder(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }

      if (!this.canUserUploadToFolder(folder, userId, userRole)) {
        throw new Error('Insufficient permissions to upload to this folder');
      }

      // Create file record
      const fileRef = doc(collection(db, 'files'));
      const fileId = fileRef.id;

      const fileData: FolderFile = {
        id: fileId,
        name: file.name,
        originalName: file.name,
        type: this.determineFileType(file.type),
        size: file.size,
        uploadedBy: userId,
        uploadedAt: new Date(),
        folderId,
        ownerId: userId,
        downloadUrl: '', // Would be set after actual file upload to storage
        thumbnailUrl: undefined,
        mimeType: file.type,
        status: 'active',
        tags: tags || [],
        description: description || '',
        lastModified: new Date(),
        lastModifiedBy: userId,
        version: 1,
        isEncrypted: false,
        requiresApproval: folder.settings?.requireApproval || false
      };

      await setDoc(fileRef, cleanFirestoreData(fileData));

      // Update folder file count and size
      await updateDoc(doc(db, 'folders', folderId), {
        fileCount: (folder.fileCount || 0) + 1,
        totalSize: (folder.totalSize || 0) + file.size,
        updatedAt: new Date()
      });

      // Log activity
      await this.logFolderActivity(folderId, userId, 'uploaded', `Uploaded file "${file.name}"`);

      return fileId;
    } catch (error) {
      console.error('Error uploading file to folder:', error);
      throw error;
    }
  }

  /**
   * Permission check: Can user upload to folder
   */
  static canUserUploadToFolder(folder: Folder, userId: string, userRole: string): boolean {
    // Owner and Admin can upload to any folder
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Folder owner can upload
    if (folder.ownerId === userId) {
      return true;
    }

    // Check explicit write permissions
    if (folder.permissions.write.includes(userId)) {
      return true;
    }

    return false;
  }

  /**
   * Helper: Determine file type from MIME type
   */
  private static determineFileType(mimeType: string): FolderFile['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'document';
  }
} 