import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { cleanFirestoreData } from './firestore-utils';

export interface Employee {
  id: string;
  employeeId: string;
  workspaceId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  employmentDetails: {
    role: string;
    department: string;
    departmentId: string;
    manager: string;
    managerId?: string;
    hireDate: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
    workLocation: 'office' | 'remote' | 'hybrid';
    probationEndDate?: string;
    contractEndDate?: string;
  };
  compensation: {
    baseSalary: number;
    currency: string;
    payFrequency: 'monthly' | 'bi-weekly' | 'weekly';
    allowances: {
      housing: number;
      transport: number;
      medical: number;
      other: number;
    };
    benefits: string[];
  };
  status: 'active' | 'on-leave' | 'suspended' | 'resigned' | 'terminated';
  documents: EmployeeDocument[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'contract' | 'identification' | 'certificate' | 'resume' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: Date;
  uploadedBy: string;
  status: 'uploaded' | 'pending' | 'expired' | 'rejected';
  expiryDate?: Date;
  notes?: string;
}

export interface CreateEmployeeData {
  personalInfo: Employee['personalInfo'];
  employmentDetails: Employee['employmentDetails'];
  compensation: Employee['compensation'];
  workspaceId: string;
  createdBy: string;
}

export interface UpdateEmployeeData {
  personalInfo?: Partial<Employee['personalInfo']>;
  employmentDetails?: Partial<Employee['employmentDetails']>;
  compensation?: Partial<Employee['compensation']>;
  status?: Employee['status'];
  updatedBy: string;
}

export interface EmployeeFilters {
  workspaceId?: string;
  department?: string;
  status?: Employee['status'];
  employmentType?: Employee['employmentDetails']['employmentType'];
  searchTerm?: string;
  managerId?: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  newHiresThisMonth: number;
  departmentBreakdown: { [department: string]: number };
  statusBreakdown: { [status: string]: number };
  averageTenure: number;
  turnoverRate: number;
}

export class EmployeeService {
  /**
   * Clean employee data by removing undefined values
   */
  private static cleanEmployeeData(data: any): any {
    const clean = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(clean);
      }
      
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = clean(value);
          }
        }
        return cleaned;
      }
      
      return obj;
    };
    
    return clean(data);
  }

  /**
   * Create a new employee
   */
  static async createEmployee(employeeData: CreateEmployeeData): Promise<string> {
    try {
      // Generate employee ID
      const employeeId = await this.generateEmployeeId(employeeData.workspaceId);
      
      const employee: Omit<Employee, 'id'> = {
        employeeId,
        workspaceId: employeeData.workspaceId,
        personalInfo: employeeData.personalInfo,
        employmentDetails: employeeData.employmentDetails,
        compensation: employeeData.compensation,
        status: 'active',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: employeeData.createdBy,
        updatedBy: employeeData.createdBy,
      };

      // Clean the data to remove undefined values
      const cleanedEmployee = this.cleanEmployeeData(employee);

      const docRef = await addDoc(collection(db, 'employees'), {
        ...cleanedEmployee,
        createdAt: Timestamp.fromDate(employee.createdAt),
        updatedAt: Timestamp.fromDate(employee.updatedAt),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee');
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployee(employeeId: string): Promise<Employee | null> {
    try {
      const docRef = doc(db, 'employees', employeeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          documents: data.documents?.map((doc: any) => ({
            ...doc,
            uploadDate: doc.uploadDate?.toDate() || new Date(),
            expiryDate: doc.expiryDate?.toDate(),
          })) || [],
        } as Employee;
      }

      return null;
    } catch (error) {
      console.error('Error getting employee:', error);
      throw new Error('Failed to get employee');
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(employeeId: string, updateData: UpdateEmployeeData): Promise<void> {
    try {
      const docRef = doc(db, 'employees', employeeId);
      
      const updates: any = {
        ...updateData,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Clean the data to remove undefined values
      const cleanedUpdates = this.cleanEmployeeData(updates);

      await updateDoc(docRef, cleanedUpdates);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('Failed to update employee');
    }
  }

  /**
   * Delete employee (soft delete by updating status)
   */
  static async deleteEmployee(employeeId: string, deletedBy: string): Promise<void> {
    try {
      await this.updateEmployee(employeeId, {
        status: 'terminated',
        updatedBy: deletedBy,
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('Failed to delete employee');
    }
  }

  /**
   * Get employees by workspace
   */
  static async getWorkspaceEmployees(
    workspaceId: string,
    filters?: EmployeeFilters,
    limitCount?: number
  ): Promise<Employee[]> {
    try {
      let q = query(
        collection(db, 'employees'),
        where('workspaceId', '==', workspaceId),
        orderBy('personalInfo.firstName', 'asc')
      );

      if (filters?.department) {
        q = query(q, where('employmentDetails.department', '==', filters.department));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.employmentType) {
        q = query(q, where('employmentDetails.employmentType', '==', filters.employmentType));
      }

      if (filters?.managerId) {
        q = query(q, where('employmentDetails.managerId', '==', filters.managerId));
      }

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      let employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        documents: doc.data().documents?.map((docData: any) => ({
          ...docData,
          uploadDate: docData.uploadDate?.toDate() || new Date(),
          expiryDate: docData.expiryDate?.toDate(),
        })) || [],
      })) as Employee[];

      // Apply search filter if provided
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        employees = employees.filter(emp => 
          emp.personalInfo.firstName.toLowerCase().includes(searchTerm) ||
          emp.personalInfo.lastName.toLowerCase().includes(searchTerm) ||
          emp.personalInfo.email.toLowerCase().includes(searchTerm) ||
          emp.employeeId.toLowerCase().includes(searchTerm) ||
          emp.employmentDetails.role.toLowerCase().includes(searchTerm) ||
          emp.employmentDetails.department.toLowerCase().includes(searchTerm)
        );
      }

      return employees;
    } catch (error) {
      console.error('Error getting workspace employees:', error);
      throw new Error('Failed to get employees');
    }
  }

  /**
   * Get employees across multiple workspaces
   */
  static async getAccessibleEmployees(workspaceIds: string[]): Promise<Employee[]> {
    try {
      if (workspaceIds.length === 0) return [];

      const allEmployees: Employee[] = [];

      // Fetch employees from each workspace
      for (const workspaceId of workspaceIds) {
        const employees = await this.getWorkspaceEmployees(workspaceId);
        allEmployees.push(...employees);
      }

      // Sort by name
      return allEmployees.sort((a, b) => 
        `${a.personalInfo.firstName} ${a.personalInfo.lastName}`.localeCompare(
          `${b.personalInfo.firstName} ${b.personalInfo.lastName}`
        )
      );
    } catch (error) {
      console.error('Error getting accessible employees:', error);
      throw new Error('Failed to get employees');
    }
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStats(workspaceId: string): Promise<EmployeeStats> {
    try {
      const employees = await this.getWorkspaceEmployees(workspaceId);
      
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats: EmployeeStats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(emp => emp.status === 'active').length,
        onLeaveEmployees: employees.filter(emp => emp.status === 'on-leave').length,
        newHiresThisMonth: employees.filter(emp => 
          new Date(emp.employmentDetails.hireDate) >= thisMonth
        ).length,
        departmentBreakdown: {},
        statusBreakdown: {},
        averageTenure: 0,
        turnoverRate: 0,
      };

      // Calculate department breakdown
      employees.forEach(emp => {
        const dept = emp.employmentDetails.department;
        stats.departmentBreakdown[dept] = (stats.departmentBreakdown[dept] || 0) + 1;
      });

      // Calculate status breakdown
      employees.forEach(emp => {
        stats.statusBreakdown[emp.status] = (stats.statusBreakdown[emp.status] || 0) + 1;
      });

      // Calculate average tenure (in months)
      if (employees.length > 0) {
        const totalTenure = employees.reduce((sum, emp) => {
          const hireDate = new Date(emp.employmentDetails.hireDate);
          const tenure = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
          return sum + tenure;
        }, 0);
        stats.averageTenure = Math.round(totalTenure / employees.length);
      }

      return stats;
    } catch (error) {
      console.error('Error getting employee stats:', error);
      throw new Error('Failed to get employee statistics');
    }
  }

  /**
   * Add document to employee with file upload
   */
  static async addEmployeeDocument(
    employeeId: string,
    file: File,
    documentData: {
      name: string;
      type: EmployeeDocument['type'];
      notes?: string;
      expiryDate?: Date;
    },
    uploadedBy: string
  ): Promise<void> {
    try {
      const employee = await this.getEmployee(employeeId);
      if (!employee) throw new Error('Employee not found');

      // Upload file to Firebase Storage
      const fileUrl = await this.uploadEmployeeDocument(file, employeeId);

      const newDocument: EmployeeDocument = {
        id: Date.now().toString(),
        name: documentData.name,
        type: documentData.type,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        uploadDate: new Date(),
        uploadedBy,
        status: 'uploaded',
        expiryDate: documentData.expiryDate,
        notes: documentData.notes,
      };

      const updatedDocuments = [...employee.documents, newDocument];

      const docRef = doc(db, 'employees', employeeId);
      await updateDoc(docRef, {
        documents: updatedDocuments.map(doc => ({
          ...doc,
          uploadDate: Timestamp.fromDate(doc.uploadDate),
          expiryDate: doc.expiryDate ? Timestamp.fromDate(doc.expiryDate) : null,
        })),
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: uploadedBy,
      });
    } catch (error) {
      console.error('Error adding employee document:', error);
      throw new Error('Failed to add document');
    }
  }

  /**
   * Upload employee document to Firebase Storage
   */
  private static async uploadEmployeeDocument(file: File, employeeId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `employees/${employeeId}/documents/${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, filePath);
      
      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading employee document:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove document from employee
   */
  static async removeEmployeeDocument(
    employeeId: string,
    documentId: string,
    removedBy: string
  ): Promise<void> {
    try {
      const employee = await this.getEmployee(employeeId);
      if (!employee) throw new Error('Employee not found');

      const documentToRemove = employee.documents.find(doc => doc.id === documentId);
      if (!documentToRemove) throw new Error('Document not found');

      // Delete file from Firebase Storage if it exists
      if (documentToRemove.fileUrl) {
        try {
          await this.deleteEmployeeDocumentFromStorage(documentToRemove.fileUrl);
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Continue with Firestore deletion even if storage deletion fails
        }
      }

      const updatedDocuments = employee.documents.filter(doc => doc.id !== documentId);

      const docRef = doc(db, 'employees', employeeId);
      await updateDoc(docRef, {
        documents: updatedDocuments.map(doc => ({
          ...doc,
          uploadDate: Timestamp.fromDate(doc.uploadDate),
          expiryDate: doc.expiryDate ? Timestamp.fromDate(doc.expiryDate) : null,
        })),
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: removedBy,
      });
    } catch (error) {
      console.error('Error removing employee document:', error);
      throw new Error('Failed to remove document');
    }
  }

  /**
   * Delete employee document from Firebase Storage
   */
  private static async deleteEmployeeDocumentFromStorage(fileUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const url = new URL(fileUrl);
      const pathSegments = url.pathname.split('/');
      const storagePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/');
      
      if (storagePath) {
        const storageRef = ref(storage, decodeURIComponent(storagePath));
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      throw error;
    }
  }

  /**
   * Generate unique employee ID
   */
  private static async generateEmployeeId(workspaceId: string): Promise<string> {
    try {
      // Get existing employees to determine next ID
      const employees = await this.getWorkspaceEmployees(workspaceId);
      const maxId = employees.reduce((max, emp) => {
        const numPart = emp.employeeId.replace(/\D/g, '');
        const num = parseInt(numPart) || 0;
        return Math.max(max, num);
      }, 0);

      return `EMP${String(maxId + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      // Fallback to timestamp-based ID
      return `EMP${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Search employees across workspaces
   */
  static async searchEmployees(
    workspaceIds: string[],
    searchTerm: string,
    limitCount: number = 20
  ): Promise<Employee[]> {
    try {
      const allEmployees = await this.getAccessibleEmployees(workspaceIds);
      
      const searchLower = searchTerm.toLowerCase();
      const filtered = allEmployees.filter(emp => 
        emp.personalInfo.firstName.toLowerCase().includes(searchLower) ||
        emp.personalInfo.lastName.toLowerCase().includes(searchLower) ||
        emp.personalInfo.email.toLowerCase().includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower) ||
        emp.employmentDetails.role.toLowerCase().includes(searchLower) ||
        emp.employmentDetails.department.toLowerCase().includes(searchLower)
      );

      return filtered.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Failed to search employees');
    }
  }

  /**
   * Bulk update employee status
   */
  static async bulkUpdateEmployeeStatus(
    employeeIds: string[],
    status: Employee['status'],
    updatedBy: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      employeeIds.forEach(employeeId => {
        const docRef = doc(db, 'employees', employeeId);
        batch.update(docRef, {
          status,
          updatedAt: Timestamp.fromDate(new Date()),
          updatedBy,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating employee status:', error);
      throw new Error('Failed to update employee status');
    }
  }
} 