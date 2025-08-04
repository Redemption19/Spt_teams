import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { format, parseISO, differenceInDays, startOfYear, endOfYear, isWithinInterval, toDate } from 'date-fns';
import { EmailService } from './email-service';
import { NotificationService } from './notification-service';
import { EmployeeService } from './employee-service';
import { UserService } from './user-service';

// Helper function to safely convert Firestore Timestamps to Date objects
const convertFirestoreTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  
  // If it's already a Date object, return it
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firestore Timestamp, convert it
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    try {
      return new Date(timestamp);
    } catch (error) {
      console.error('Error parsing date string:', timestamp, error);
      return null;
    }
  }
  
  // If it's a number (timestamp), convert it
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  console.error('Unknown timestamp format:', timestamp, typeof timestamp);
  return null;
};

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  workspaceId: string;
  workspaceName?: string;
  leaveType: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  emergency: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  workspaceName?: string;
  year: number;
  leaveTypeId: string;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  carriedForwardDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveType {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  maxDays: number;
  carryForward: boolean;
  carryForwardLimit: number;
  requiresApproval: boolean;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeaveRequestData {
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergency: boolean;
}

export interface AnnualLeaveApplicationData {
  id?: string;
  // Applicant/Employee Section
  applicationDate: Date;
  employeeId: string;
  employeeName: string;
  department: string;
  annualLeaveEntitlement: string;
  daysTaken: string;
  fromDate: Date;
  toDate: Date;
  periodOfLeave: string;
  leaveDaysOutstanding: string;
  natureOfLeave: string;
  phoneNumber: string;
  employeeSignature: string;
  
  // Substitute Section
  substituteName: string;
  substituteSignature: string;
  substituteDate: Date;
  
  // Office Use Only - HR Section
  totalCasualLeaveTaken: string;
  daysGranted: string;
  daysOutstanding: string;
  hrSignature: string;
  hrDate: Date;
  
  // Office Use Only - Approval Section
  approvedBy: string;
  approvalSignature: string;
  approvalDate: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  
  // Additional metadata
  workspaceId: string;
  workspaceName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLeaveRequestData {
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

export interface CreateLeaveTypeData {
  workspaceId: string;
  name: string;
  description: string;
  maxDays: number;
  carryForward: boolean;
  carryForwardLimit: number;
  requiresApproval: boolean;
  color: string;
}

export interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  emergencyRequests: number;
  totalDaysRequested: number;
  avgProcessingTime: number;
}

export class LeaveService {
  // Leave Requests
  static async createLeaveRequest(data: CreateLeaveRequestData): Promise<string> {
    try {
      const days = differenceInDays(parseISO(data.endDate), parseISO(data.startDate)) + 1;
      
      const leaveRequestData = {
        ...data,
        days,
        status: 'pending' as const,
        appliedDate: format(new Date(), 'yyyy-MM-dd'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(leaveRequestData).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, 'leaveRequests'), cleanData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw new Error('Failed to create leave request');
    }
  }

  static async updateLeaveRequest(requestId: string, data: UpdateLeaveRequestData, approverId?: string): Promise<void> {
    try {
      // Get the current leave request to check status changes
      const currentRequest = await this.getLeaveRequest(requestId);
      if (!currentRequest) {
        throw new Error('Leave request not found');
      }

      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      if (data.status === 'approved') {
        updateData.approvedDate = format(new Date(), 'yyyy-MM-dd');
        updateData.approvedBy = approverId;
        
        // Get approver name if provided
        if (approverId) {
          try {
            const approver = await UserService.getUserById(approverId);
            updateData.approvedByName = approver?.name || approver?.email || 'HR Manager';
          } catch (error) {
            console.warn('Could not get approver name:', error);
            updateData.approvedByName = 'HR Manager';
          }
        }
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(doc(db, 'leaveRequests', requestId), cleanData);

      // Send email notifications based on status change
      if (data.status && data.status !== currentRequest.status && (data.status === 'approved' || data.status === 'rejected')) {
        await this.sendLeaveStatusNotification(currentRequest, data.status, data.rejectionReason);
      }

      // Update leave balance if approved
      if (data.status === 'approved' && currentRequest.status !== 'approved') {
        await this.updateLeaveBalanceOnApproval(currentRequest);
      }

      // Create notification for employee
      if (data.status && (data.status === 'approved' || data.status === 'rejected')) {
        await this.createLeaveStatusNotification(currentRequest, data.status, data.rejectionReason);
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      throw new Error('Failed to update leave request');
    }
  }

  static async deleteLeaveRequest(requestId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'leaveRequests', requestId));
    } catch (error) {
      console.error('Error deleting leave request:', error);
      throw new Error('Failed to delete leave request');
    }
  }

  static async getLeaveRequest(requestId: string): Promise<LeaveRequest | null> {
    try {
      const docRef = doc(db, 'leaveRequests', requestId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as LeaveRequest;
      }
      return null;
    } catch (error) {
      console.error('Error getting leave request:', error);
      throw new Error('Failed to get leave request');
    }
  }

  static async getLeaveRequests({
    workspaceId,
    workspaceFilter = 'current',
    employeeId,
    status,
    startDate,
    endDate,
    limit: limitCount
  }: {
    workspaceId?: string;
    workspaceFilter?: 'current' | 'all';
    employeeId?: string;
    status?: LeaveRequest['status'] | 'all';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<LeaveRequest[]> {
    try {
      // If no workspaceId is provided and we're not filtering by all, return empty array
      if (!workspaceId && workspaceFilter === 'current') {
        return [];
      }

      const constraints = [];

      if (workspaceFilter === 'current' && workspaceId) {
        constraints.push(where('workspaceId', '==', workspaceId));
      }

      if (employeeId) {
        constraints.push(where('employeeId', '==', employeeId));
      }

      if (status && status !== 'all') {
        constraints.push(where('status', '==', status));
      }

      if (startDate && endDate) {
        constraints.push(where('startDate', '>=', format(startDate, 'yyyy-MM-dd')));
        constraints.push(where('endDate', '<=', format(endDate, 'yyyy-MM-dd')));
      }

      // Only add orderBy if we have constraints, otherwise it might cause issues
      if (constraints.length > 0) {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      // If no constraints, return empty array to avoid querying all documents
      if (constraints.length === 0) {
        return [];
      }

      const q = query(collection(db, 'leaveRequests'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot || !querySnapshot.docs) {
        console.warn('QuerySnapshot is invalid or empty');
        return [];
      }

      const requests: LeaveRequest[] = [];

      for (const doc of querySnapshot.docs) {
        try {
          const data = doc.data();
          requests.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as LeaveRequest);
        } catch (docError) {
          console.warn('Error processing document:', doc.id, docError);
          // Continue processing other documents
        }
      }

      return requests;
    } catch (error) {
      console.error('Error getting leave requests:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  }

  static async getMultiWorkspaceLeaveRequests(workspaceIds: string[], filters: {
    employeeId?: string;
    status?: LeaveRequest['status'] | 'all';
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<LeaveRequest[]> {
    try {
      if (!workspaceIds || workspaceIds.length === 0) {
        return [];
      }

      const allRequests = await Promise.allSettled(
        workspaceIds.map(workspaceId =>
          this.getLeaveRequests({
            workspaceId,
            workspaceFilter: 'current',
            ...filters
          })
        )
      );

      // Filter out failed requests and flatten successful ones
      const successfulRequests = allRequests
        .filter((result): result is PromiseFulfilledResult<LeaveRequest[]> => result.status === 'fulfilled')
        .map(result => result.value);

      const failedRequests = allRequests
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected');

      if (failedRequests.length > 0) {
        console.warn('Some workspace queries failed:', failedRequests.length, 'out of', workspaceIds.length);
      }

      const combinedRequests = successfulRequests.flat();
      
      // Sort by creation date (newest first)
      return combinedRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting multi-workspace leave requests:', error);
      return [];
    }
  }

  // Leave Types
  static async createLeaveType(data: CreateLeaveTypeData): Promise<string> {
    try {
      const leaveTypeData = {
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'leaveTypes'), leaveTypeData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating leave type:', error);
      throw new Error('Failed to create leave type');
    }
  }

  static async updateLeaveType(typeId: string, data: Partial<CreateLeaveTypeData>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'leaveTypes', typeId), updateData);
    } catch (error) {
      console.error('Error updating leave type:', error);
      throw new Error('Failed to update leave type');
    }
  }

  static async deleteLeaveType(typeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'leaveTypes', typeId));
    } catch (error) {
      console.error('Error deleting leave type:', error);
      throw new Error('Failed to delete leave type');
    }
  }

  static async getLeaveTypes(workspaceId: string): Promise<LeaveType[]> {
    try {
      const q = query(
        collection(db, 'leaveTypes'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const types: LeaveType[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        types.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as LeaveType);
      }

      return types;
    } catch (error) {
      console.error('Error getting leave types:', error);
      throw new Error('Failed to get leave types');
    }
  }

  static async getAllLeaveTypes(workspaceId: string): Promise<LeaveType[]> {
    console.log('🔍 getAllLeaveTypes called with workspaceId:', workspaceId);
    
    try {
      const q = query(
        collection(db, 'leaveTypes'),
        where('workspaceId', '==', workspaceId),
        orderBy('name')
      );
      
      console.log('🔍 Executing Firestore query for leaveTypes...');
      const querySnapshot = await getDocs(q);
      console.log('🔍 QuerySnapshot docs count:', querySnapshot.docs.length);
      
      // If no leave types found for this workspace, let's check if there are any at all
      if (querySnapshot.docs.length === 0) {
        console.log('🔍 No leave types found for workspace, checking all leave types in database...');
        const allTypesQuery = query(collection(db, 'leaveTypes'));
        const allTypesSnapshot = await getDocs(allTypesQuery);
        console.log('🔍 Total leave types in database:', allTypesSnapshot.docs.length);
        
        if (allTypesSnapshot.docs.length > 0) {
          console.log('🔍 Found leave types in other workspaces:');
          allTypesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log('🔍 - Workspace:', data.workspaceId, 'Name:', data.name);
          });
        }
      }
      
      const types: LeaveType[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log('🔍 Leave type doc data:', { id: doc.id, name: data.name, isActive: data.isActive });
        types.push({
          id: doc.id,
          ...data,
          isActive: data.isActive !== false, // Default to true if not set
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as LeaveType);
      }

      console.log('🔍 getAllLeaveTypes returning:', types.length, 'types');
      return types;
    } catch (error) {
      console.error('🔍 Error getting all leave types:', error);
      throw new Error('Failed to get all leave types');
    }
  }

  static async getMultiWorkspaceLeaveTypes(workspaceIds: string[]): Promise<LeaveType[]> {
    try {
      const allTypes = await Promise.all(
        workspaceIds.map(workspaceId => this.getLeaveTypes(workspaceId))
      );

      return allTypes.flat();
    } catch (error) {
      console.error('Error getting multi-workspace leave types:', error);
      throw new Error('Failed to get multi-workspace leave types');
    }
  }

  // Leave Balances
  static async createLeaveBalance(data: {
    employeeId: string;
    employeeName: string;
    workspaceId: string;
    year: number;
    leaveTypeId: string;
    leaveTypeName: string;
    totalDays: number;
    carriedForwardDays?: number;
  }): Promise<string> {
    try {
      const balanceData = {
        ...data,
        usedDays: 0,
        remainingDays: data.totalDays + (data.carriedForwardDays || 0),
        carriedForwardDays: data.carriedForwardDays || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'leaveBalances'), balanceData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating leave balance:', error);
      throw new Error('Failed to create leave balance');
    }
  }

  static async updateLeaveBalance(balanceId: string, data: {
    usedDays?: number;
    remainingDays?: number;
  }): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'leaveBalances', balanceId), updateData);
    } catch (error) {
      console.error('Error updating leave balance:', error);
      throw new Error('Failed to update leave balance');
    }
  }

  static async getLeaveBalances(workspaceId: string, year?: number): Promise<LeaveBalance[]> {
    try {
      const constraints = [
        where('workspaceId', '==', workspaceId),
        orderBy('employeeName')
      ];

      if (year) {
        constraints.unshift(where('year', '==', year));
      }

      const q = query(collection(db, 'leaveBalances'), ...constraints);
      const querySnapshot = await getDocs(q);
      const balances: LeaveBalance[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        balances.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as LeaveBalance);
      }

      return balances;
    } catch (error) {
      console.error('Error getting leave balances:', error);
      throw new Error('Failed to get leave balances');
    }
  }

  static async getMultiWorkspaceLeaveBalances(workspaceIds: string[], year?: number): Promise<LeaveBalance[]> {
    try {
      const allBalances = await Promise.all(
        workspaceIds.map(workspaceId => this.getLeaveBalances(workspaceId, year))
      );

      return allBalances.flat();
    } catch (error) {
      console.error('Error getting multi-workspace leave balances:', error);
      throw new Error('Failed to get multi-workspace leave balances');
    }
  }

  // Statistics
  static async getLeaveStats(workspaceId: string, startDate?: Date, endDate?: Date): Promise<LeaveStats> {
    try {
      if (!workspaceId) {
        return {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          emergencyRequests: 0,
          totalDaysRequested: 0,
          avgProcessingTime: 0
        };
      }

      const requests = await this.getLeaveRequests({
        workspaceId,
        workspaceFilter: 'current',
        startDate,
        endDate
      });

      const totalRequests = requests.length;
      const pendingRequests = requests.filter(req => req.status === 'pending').length;
      const approvedRequests = requests.filter(req => req.status === 'approved').length;
      const rejectedRequests = requests.filter(req => req.status === 'rejected').length;
      const emergencyRequests = requests.filter(req => req.emergency).length;
      const totalDaysRequested = requests.reduce((sum, req) => sum + req.days, 0);

      // Calculate average processing time for approved/rejected requests
      const processedRequests = requests.filter(req => req.status !== 'pending');
      let avgProcessingTime = 0;
      
      if (processedRequests.length > 0) {
        const totalProcessingTime = processedRequests.reduce((sum, req) => {
          try {
            const appliedDate = parseISO(req.appliedDate);
            const processedDate = req.approvedDate ? parseISO(req.approvedDate) : new Date();
            return sum + differenceInDays(processedDate, appliedDate);
          } catch (dateError) {
            console.warn('Error parsing date for request:', req.id, dateError);
            return sum;
          }
        }, 0);
        avgProcessingTime = Math.round(totalProcessingTime / processedRequests.length);
      }

      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        emergencyRequests,
        totalDaysRequested,
        avgProcessingTime
      };
    } catch (error) {
      console.error('Error getting leave stats:', error);
      // Return default stats instead of throwing error
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        emergencyRequests: 0,
        totalDaysRequested: 0,
        avgProcessingTime: 0
      };
    }
  }

  static async getMultiWorkspaceLeaveStats(workspaceIds: string[], startDate?: Date, endDate?: Date): Promise<LeaveStats> {
    try {
      if (!workspaceIds || workspaceIds.length === 0) {
        return {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          emergencyRequests: 0,
          totalDaysRequested: 0,
          avgProcessingTime: 0
        };
      }

      const allStats = await Promise.allSettled(
        workspaceIds.map(workspaceId => this.getLeaveStats(workspaceId, startDate, endDate))
      );

      // Filter out failed stats and get successful ones
      const successfulStats = allStats
        .filter((result): result is PromiseFulfilledResult<LeaveStats> => result.status === 'fulfilled')
        .map(result => result.value);

      const failedStats = allStats
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected');

      if (failedStats.length > 0) {
        console.warn('Some workspace stats failed:', failedStats.length, 'out of', workspaceIds.length);
      }

      // Aggregate stats across all workspaces
      return {
        totalRequests: successfulStats.reduce((sum, stats) => sum + stats.totalRequests, 0),
        pendingRequests: successfulStats.reduce((sum, stats) => sum + stats.pendingRequests, 0),
        approvedRequests: successfulStats.reduce((sum, stats) => sum + stats.approvedRequests, 0),
        rejectedRequests: successfulStats.reduce((sum, stats) => sum + stats.rejectedRequests, 0),
        emergencyRequests: successfulStats.reduce((sum, stats) => sum + stats.emergencyRequests, 0),
        totalDaysRequested: successfulStats.reduce((sum, stats) => sum + stats.totalDaysRequested, 0),
        avgProcessingTime: successfulStats.length > 0 
          ? Math.round(successfulStats.reduce((sum, stats) => sum + stats.avgProcessingTime, 0) / successfulStats.length)
          : 0
      };
    } catch (error) {
      console.error('Error getting multi-workspace leave stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        emergencyRequests: 0,
        totalDaysRequested: 0,
        avgProcessingTime: 0
      };
    }
  }

  // Initialize default leave types for a workspace
  static async activateAllLeaveTypes(workspaceId: string): Promise<void> {
    try {
      const allTypes = await this.getAllLeaveTypes(workspaceId);
      const batch = writeBatch(db);
      
      for (const type of allTypes) {
        if (!type.isActive) {
          const docRef = doc(db, 'leaveTypes', type.id);
          batch.update(docRef, {
            isActive: true,
            updatedAt: new Date()
          });
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error activating leave types:', error);
      throw new Error('Failed to activate leave types');
    }
  }

  static async initializeDefaultLeaveTypes(workspaceId: string): Promise<void> {
    try {
      const defaultTypes: CreateLeaveTypeData[] = [
        {
          workspaceId,
          name: 'Annual Leave',
          description: 'Yearly vacation days',
          maxDays: 25,
          carryForward: true,
          carryForwardLimit: 5,
          requiresApproval: true,
          color: 'bg-blue-100 text-blue-800'
        },
        {
          workspaceId,
          name: 'Sick Leave',
          description: 'Medical leave',
          maxDays: 10,
          carryForward: false,
          carryForwardLimit: 0,
          requiresApproval: false,
          color: 'bg-red-100 text-red-800'
        },
        {
          workspaceId,
          name: 'Casual Leave',
          description: 'Personal time off',
          maxDays: 12,
          carryForward: false,
          carryForwardLimit: 0,
          requiresApproval: true,
          color: 'bg-green-100 text-green-800'
        },
        {
          workspaceId,
          name: 'Maternity Leave',
          description: 'Maternity leave',
          maxDays: 90,
          carryForward: false,
          carryForwardLimit: 0,
          requiresApproval: true,
          color: 'bg-pink-100 text-pink-800'
        },
        {
          workspaceId,
          name: 'Paternity Leave',
          description: 'Paternity leave',
          maxDays: 14,
          carryForward: false,
          carryForwardLimit: 0,
          requiresApproval: true,
          color: 'bg-purple-100 text-purple-800'
        }
      ];

      const batch = writeBatch(db);
      
      for (const typeData of defaultTypes) {
        const docRef = doc(collection(db, 'leaveTypes'));
        batch.set(docRef, {
          ...typeData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error initializing default leave types:', error);
      throw new Error('Failed to initialize default leave types');
    }
  }

  // Email notification methods
  private static async sendLeaveStatusNotification(
    leaveRequest: LeaveRequest, 
    newStatus: 'approved' | 'rejected', 
    rejectionReason?: string
  ): Promise<void> {
    try {
      const statusText = newStatus === 'approved' ? 'Approved' : 'Rejected';
      const subject = `Leave Request ${statusText} - ${leaveRequest.leaveType}`;
      
      const emailParams = {
        to_email: leaveRequest.employeeEmail,
        to_name: leaveRequest.employeeName,
        subject: subject,
        leave_type: leaveRequest.leaveType,
        start_date: format(parseISO(leaveRequest.startDate), 'MMMM dd, yyyy'),
        end_date: format(parseISO(leaveRequest.endDate), 'MMMM dd, yyyy'),
        days: leaveRequest.days.toString(),
        reason: leaveRequest.reason,
        status: statusText,
        rejection_reason: rejectionReason || '',
        approved_by: leaveRequest.approvedByName || 'HR Manager',
        company_name: 'Standard Pensions Trust',
        support_email: 'support@standardpensionstrust.com'
      };

      // Send email using EmailJS
      await EmailService.sendLeaveStatusEmail(emailParams);
      
      console.log(`Leave ${newStatus} email sent to ${leaveRequest.employeeEmail}`);
    } catch (error) {
      console.error('Error sending leave status email:', error);
      // Don't throw error as this is not critical to the main operation
    }
  }

  private static async createLeaveStatusNotification(
    leaveRequest: LeaveRequest, 
    newStatus: 'approved' | 'rejected', 
    rejectionReason?: string
  ): Promise<void> {
    try {
      const statusText = newStatus === 'approved' ? 'Approved' : 'Rejected';
      const title = `Leave Request ${statusText}`;
      const message = newStatus === 'approved' 
        ? `Your ${leaveRequest.leaveType} request for ${leaveRequest.days} days has been approved.`
        : `Your ${leaveRequest.leaveType} request has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

      await NotificationService.createNotification({
        userId: leaveRequest.employeeId,
        workspaceId: leaveRequest.workspaceId,
        type: newStatus === 'approved' ? 'leave_approved' : 'leave_rejected',
        title,
        message,
        priority: newStatus === 'approved' ? 'medium' : 'high',
        actionUrl: `/dashboard/hr/leaves`,
        actionLabel: 'View Details',
        metadata: {
          leaveRequestId: leaveRequest.id,
          leaveType: leaveRequest.leaveType,
          days: leaveRequest.days,
          rejectionReason
        }
      });
    } catch (error) {
      console.error('Error creating leave status notification:', error);
      // Don't throw error as this is not critical to the main operation
    }
  }

  private static async updateLeaveBalanceOnApproval(leaveRequest: LeaveRequest): Promise<void> {
    try {
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Find the leave balance for this employee and leave type
      const balances = await this.getLeaveBalances(leaveRequest.workspaceId, currentYear);
      const balance = balances.find(b => 
        b.employeeId === leaveRequest.employeeId && 
        b.leaveTypeId === leaveRequest.leaveTypeId
      );

      if (balance) {
        // Update existing balance
        const newUsedDays = balance.usedDays + leaveRequest.days;
        const newRemainingDays = Math.max(0, balance.totalDays - newUsedDays);
        
        await this.updateLeaveBalance(balance.id, {
          usedDays: newUsedDays,
          remainingDays: newRemainingDays
        });
      } else {
        // Create new balance if it doesn't exist
        // Get the leave type to determine total days
        const leaveTypes = await this.getLeaveTypes(leaveRequest.workspaceId);
        const leaveType = leaveTypes.find(lt => lt.id === leaveRequest.leaveTypeId);
        
        if (leaveType) {
          // Create a new leave balance with the approved days as used
          await this.createLeaveBalance({
            employeeId: leaveRequest.employeeId,
            employeeName: leaveRequest.employeeName,
            workspaceId: leaveRequest.workspaceId,
            year: currentYear,
            leaveTypeId: leaveRequest.leaveTypeId,
            leaveTypeName: leaveRequest.leaveType,
            totalDays: leaveType.maxDays,
            carriedForwardDays: 0
          });

          // Now update the newly created balance
          const newBalances = await this.getLeaveBalances(leaveRequest.workspaceId, currentYear);
          const newBalance = newBalances.find(b => 
            b.employeeId === leaveRequest.employeeId && 
            b.leaveTypeId === leaveRequest.leaveTypeId
          );

          if (newBalance) {
            await this.updateLeaveBalance(newBalance.id, {
              usedDays: leaveRequest.days,
              remainingDays: Math.max(0, leaveType.maxDays - leaveRequest.days)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating leave balance on approval:', error);
      // Don't throw error as this is not critical to the main operation
    }
  }

  // Get employee's leave requests (for employee view)
  static async getEmployeeLeaveRequests(employeeId: string, workspaceId: string): Promise<LeaveRequest[]> {
    try {
      return await this.getLeaveRequests({
        workspaceId,
        employeeId,
        limit: 50
      });
    } catch (error) {
      console.error('Error getting employee leave requests:', error);
      return [];
    }
  }

  // Get pending leave requests for approval (for admin/owner view)
  static async getPendingLeaveRequests(workspaceId: string): Promise<LeaveRequest[]> {
    try {
      return await this.getLeaveRequests({
        workspaceId,
        status: 'pending',
        limit: 50
      });
    } catch (error) {
      console.error('Error getting pending leave requests:', error);
      return [];
    }
  }

  // Get leave requests that need approval (for admin/owner view)
  static async getLeaveRequestsForApproval(workspaceId: string): Promise<LeaveRequest[]> {
    try {
      const requests = await this.getLeaveRequests({
        workspaceId,
        status: 'pending',
        limit: 100
      });

      // Filter requests that require approval based on leave type
      const leaveTypes = await this.getLeaveTypes(workspaceId);
      const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.id, lt]));

      return requests.filter(request => {
        const leaveType = leaveTypeMap.get(request.leaveTypeId);
        return leaveType?.requiresApproval !== false; // Default to requiring approval
      });
    } catch (error) {
      console.error('Error getting leave requests for approval:', error);
      return [];
    }
  }

  // Get leave types for employee view (with fallback to all types if no active ones)
  static async getLeaveTypesForEmployee(workspaceId: string): Promise<LeaveType[]> {
    console.log('🔍 getLeaveTypesForEmployee called with workspaceId:', workspaceId);
    
    try {
      // First try to get active leave types
      console.log('🔍 Getting active leave types...');
      const activeTypes = await this.getLeaveTypes(workspaceId);
      console.log('🔍 Active leave types found:', activeTypes.length);
      
      // If no active types found, get all types and show them
      if (activeTypes.length === 0) {
        console.log('🔍 No active leave types found, getting all types for employee view');
        const allTypes = await this.getAllLeaveTypes(workspaceId);
        console.log('🔍 All leave types found:', allTypes.length);
        return allTypes;
      }
      
      console.log('🔍 Returning active leave types:', activeTypes.length);
      return activeTypes;
    } catch (error) {
      console.error('🔍 Error getting leave types for employee:', error);
      // Fallback to getting all types if there's an error
      console.log('🔍 Falling back to getAllLeaveTypes due to error');
      const allTypes = await this.getAllLeaveTypes(workspaceId);
      console.log('🔍 Fallback all leave types found:', allTypes.length);
      return allTypes;
    }
  }

  // Create leave balances for existing approved requests (for migration/backfill)
  static async createLeaveBalancesForApprovedRequests(workspaceId: string): Promise<void> {
    try {
      console.log('🔍 Creating leave balances for existing approved requests...');
      
      // Get all approved leave requests
      const approvedRequests = await this.getLeaveRequests({
        workspaceId,
        status: 'approved'
      });

      console.log(`🔍 Found ${approvedRequests.length} approved requests`);

      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Get existing leave balances
      const existingBalances = await this.getLeaveBalances(workspaceId, currentYear);
      
      // Get leave types
      const leaveTypes = await this.getLeaveTypes(workspaceId);
      const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.id, lt]));

      // Group requests by employee and leave type
      const requestGroups = new Map<string, LeaveRequest[]>();
      
      approvedRequests.forEach(request => {
        const key = `${request.employeeId}-${request.leaveTypeId}`;
        if (!requestGroups.has(key)) {
          requestGroups.set(key, []);
        }
        requestGroups.get(key)!.push(request);
      });

      console.log(`🔍 Grouped into ${requestGroups.size} employee-leave type combinations`);

      // Create or update balances for each group
      for (const [key, requests] of requestGroups) {
        const [employeeId, leaveTypeId] = key.split('-');
        const leaveType = leaveTypeMap.get(leaveTypeId);
        
        if (!leaveType) {
          console.warn(`🔍 Leave type ${leaveTypeId} not found, skipping`);
          continue;
        }

        // Calculate total used days for this employee and leave type
        const totalUsedDays = requests.reduce((sum, req) => sum + req.days, 0);
        
        // Check if balance already exists
        const existingBalance = existingBalances.find(b => 
          b.employeeId === employeeId && b.leaveTypeId === leaveTypeId
        );

        if (existingBalance) {
          // Update existing balance
          const newUsedDays = Math.max(existingBalance.usedDays, totalUsedDays);
          const newRemainingDays = Math.max(0, existingBalance.totalDays - newUsedDays);
          
          await this.updateLeaveBalance(existingBalance.id, {
            usedDays: newUsedDays,
            remainingDays: newRemainingDays
          });
          
          console.log(`🔍 Updated balance for ${employeeId}-${leaveTypeId}: ${newUsedDays}/${existingBalance.totalDays} days used`);
        } else {
          // Create new balance
          const firstRequest = requests[0];
          await this.createLeaveBalance({
            employeeId,
            employeeName: firstRequest.employeeName,
            workspaceId,
            year: currentYear,
            leaveTypeId,
            leaveTypeName: firstRequest.leaveType,
            totalDays: leaveType.maxDays,
            carriedForwardDays: 0
          });

          // Update the newly created balance
          const newBalances = await this.getLeaveBalances(workspaceId, currentYear);
          const newBalance = newBalances.find(b => 
            b.employeeId === employeeId && b.leaveTypeId === leaveTypeId
          );

          if (newBalance) {
            await this.updateLeaveBalance(newBalance.id, {
              usedDays: totalUsedDays,
              remainingDays: Math.max(0, leaveType.maxDays - totalUsedDays)
            });
            
            console.log(`🔍 Created balance for ${employeeId}-${leaveTypeId}: ${totalUsedDays}/${leaveType.maxDays} days used`);
          }
        }
      }

      console.log('🔍 Finished creating leave balances for approved requests');
    } catch (error) {
      console.error('Error creating leave balances for approved requests:', error);
      throw new Error('Failed to create leave balances for approved requests');
    }
  }

  // ===== ANNUAL LEAVE APPLICATION METHODS =====

  static async createAnnualLeaveApplication(data: Omit<AnnualLeaveApplicationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const applicationData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'annualLeaveApplications'), applicationData);
      
      // Also create a regular leave request for tracking
      const leaveRequestData: CreateLeaveRequestData = {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        workspaceId: data.workspaceId,
        leaveTypeId: '', // Will be determined by nature of leave
        startDate: format(data.fromDate, 'yyyy-MM-dd'),
        endDate: format(data.toDate, 'yyyy-MM-dd'),
        reason: `Annual Leave Application - Nature: ${data.natureOfLeave}, Period: ${data.periodOfLeave}`,
        emergency: false
      };

      await this.createLeaveRequest(leaveRequestData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating annual leave application:', error);
      throw error;
    }
  }

  static async updateAnnualLeaveApplication(applicationId: string, data: Partial<AnnualLeaveApplicationData>): Promise<void> {
    try {
      const docRef = doc(db, 'annualLeaveApplications', applicationId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating annual leave application:', error);
      throw error;
    }
  }

  static async getAnnualLeaveApplication(applicationId: string): Promise<AnnualLeaveApplicationData | null> {
    try {
      const docRef = doc(db, 'annualLeaveApplications', applicationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          applicationDate: convertFirestoreTimestamp(data.applicationDate),
          fromDate: convertFirestoreTimestamp(data.fromDate),
          toDate: convertFirestoreTimestamp(data.toDate),
          substituteDate: convertFirestoreTimestamp(data.substituteDate),
          hrDate: convertFirestoreTimestamp(data.hrDate),
          approvalDate: convertFirestoreTimestamp(data.approvalDate),
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt)
        } as AnnualLeaveApplicationData & { id: string };
      }
      return null;
    } catch (error) {
      console.error('Error getting annual leave application:', error);
      throw error;
    }
  }

  static async getAnnualLeaveApplications(workspaceId: string, filters: {
    employeeId?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<AnnualLeaveApplicationData[]> {
    try {
      let q = query(
        collection(db, 'annualLeaveApplications'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      if (filters.employeeId) {
        q = query(q, where('employeeId', '==', filters.employeeId));
      }

      if (filters.status && filters.status !== 'all') {
        q = query(q, where('approvalStatus', '==', filters.status));
      }

      if (filters.startDate) {
        q = query(q, where('fromDate', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where('toDate', '<=', Timestamp.fromDate(filters.endDate)));
      }

      const querySnapshot = await getDocs(q);
      const applications: AnnualLeaveApplicationData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          applicationDate: convertFirestoreTimestamp(data.applicationDate),
          fromDate: convertFirestoreTimestamp(data.fromDate),
          toDate: convertFirestoreTimestamp(data.toDate),
          substituteDate: convertFirestoreTimestamp(data.substituteDate),
          hrDate: convertFirestoreTimestamp(data.hrDate),
          approvalDate: convertFirestoreTimestamp(data.approvalDate),
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt)
        } as AnnualLeaveApplicationData & { id: string });
      });

      return applications;
    } catch (error) {
      console.error('Error getting annual leave applications:', error);
      throw error;
    }
  }

  static async getEmployeeAnnualLeaveApplications(employeeId: string, workspaceId: string): Promise<AnnualLeaveApplicationData[]> {
    try {
      const q = query(
        collection(db, 'annualLeaveApplications'),
        where('employeeId', '==', employeeId),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const applications: AnnualLeaveApplicationData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          applicationDate: convertFirestoreTimestamp(data.applicationDate),
          fromDate: convertFirestoreTimestamp(data.fromDate),
          toDate: convertFirestoreTimestamp(data.toDate),
          substituteDate: convertFirestoreTimestamp(data.substituteDate),
          hrDate: convertFirestoreTimestamp(data.hrDate),
          approvalDate: convertFirestoreTimestamp(data.approvalDate),
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt)
        } as AnnualLeaveApplicationData & { id: string });
      });

      return applications;
    } catch (error) {
      console.error('Error getting employee annual leave applications:', error);
      throw error;
    }
  }

  static async canEditApplication(applicationId: string, employeeId: string): Promise<boolean> {
    try {
      const application = await this.getAnnualLeaveApplication(applicationId);
      if (!application) return false;
      
      // Can edit if:
      // 1. Application belongs to the employee
      // 2. Status is 'pending' (not approved or rejected)
      return application.employeeId === employeeId && application.approvalStatus === 'pending';
    } catch (error) {
      console.error('Error checking edit permissions:', error);
      return false;
    }
  }

  static async canDeleteApplication(applicationId: string, employeeId: string): Promise<boolean> {
    try {
      const application = await this.getAnnualLeaveApplication(applicationId);
      if (!application) return false;
      
      // Can delete if:
      // 1. Application belongs to the employee
      // 2. Status is 'pending' (not approved or rejected)
      return application.employeeId === employeeId && application.approvalStatus === 'pending';
    } catch (error) {
      console.error('Error checking delete permissions:', error);
      return false;
    }
  }

  static async deleteAnnualLeaveApplication(applicationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'annualLeaveApplications', applicationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting annual leave application:', error);
      throw error;
    }
  }
} 