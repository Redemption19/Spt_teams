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
import { format, parseISO, differenceInDays, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { EmailService } from './email-service';
import { NotificationService } from './notification-service';
import { UserService } from './user-service';
import { EmployeeService } from './employee-service';

export interface PayrollEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  workspaceId: string;
  workspaceName?: string;
  department: string;
  role: string;
  baseSalary: number;
  currency: string;
  isFixedSalary: boolean;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    meal: number;
    other: number;
  };
  deductions: {
    tax: number;
    socialSecurity: number;
    pension: number;
    insurance: number;
    other: number;
  };
  overtime: number;
  bonus: number;
  netSalary: number;
  payrollStatus: 'pending' | 'processed' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollPeriod {
  id: string;
  workspaceId: string;
  period: string; // Format: YYYY-MM
  startDate: string;
  endDate: string;
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  processedBy?: string;
  processedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  workspaceId: string;
  workspaceName?: string;
  period: string;
  startDate: string;
  endDate: string;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    meal: number;
    other: number;
  };
  totalAllowances: number;
  overtime: number;
  bonus: number;
  grossPay: number;
  deductions: {
    tax: number;
    socialSecurity: number;
    pension: number;
    insurance: number;
    other: number;
  };
  totalDeductions: number;
  netPay: number;
  currency: string;
  status: 'draft' | 'sent' | 'acknowledged' | 'cancelled';
  generatedBy?: string;
  generatedDate?: string;
  acknowledgedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  averageSalary: number;
  totalTax: number;
  totalAllowances: number;
  totalOvertime: number;
  totalBonus: number;
  pendingPayments: number;
  processedPayments: number;
  paidPayments: number;
}

export interface CreatePayrollEmployeeData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  workspaceId: string;
  department: string;
  role: string;
  baseSalary: number;
  currency: string;
  isFixedSalary: boolean;
  allowances?: {
    housing?: number;
    transport?: number;
    medical?: number;
    meal?: number;
    other?: number;
  };
  deductions?: {
    tax?: number;
    socialSecurity?: number;
    pension?: number;
    insurance?: number;
    other?: number;
  };
  overtime?: number;
  bonus?: number;
}

export interface UpdatePayrollEmployeeData {
  department?: string;
  role?: string;
  baseSalary?: number;
  currency?: string;
  isFixedSalary?: boolean;
  allowances?: {
    housing?: number;
    transport?: number;
    medical?: number;
    meal?: number;
    other?: number;
  };
  deductions?: {
    tax?: number;
    socialSecurity?: number;
    pension?: number;
    insurance?: number;
    other?: number;
  };
  overtime?: number;
  bonus?: number;
  payrollStatus?: PayrollEmployee['payrollStatus'];
}

export interface CreatePayslipData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  workspaceId: string;
  period: string;
  startDate: string;
  endDate: string;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    meal: number;
    other: number;
  };
  overtime: number;
  bonus: number;
  deductions: {
    tax: number;
    socialSecurity: number;
    pension: number;
    insurance: number;
    other: number;
  };
  currency: string;
}

export class PayrollService {
  // Payroll Employee Management
  static async createPayrollEmployee(data: CreatePayrollEmployeeData): Promise<string> {
    try {
      const employeeData = {
        ...data,
        isFixedSalary: data.isFixedSalary,
        allowances: {
          housing: data.allowances?.housing || 0,
          transport: data.allowances?.transport || 0,
          medical: data.allowances?.medical || 0,
          meal: data.allowances?.meal || 0,
          other: data.allowances?.other || 0,
        },
        deductions: {
          tax: data.deductions?.tax || 0,
          socialSecurity: data.deductions?.socialSecurity || 0,
          pension: data.deductions?.pension || 0,
          insurance: data.deductions?.insurance || 0,
          other: data.deductions?.other || 0,
        },
        overtime: data.overtime || 0,
        bonus: data.bonus || 0,
        netSalary: 0, // Will be calculated
        payrollStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Calculate net salary
      const totalAllowances = Object.values(employeeData.allowances).reduce((sum, val) => sum + val, 0);
      const totalDeductions = Object.values(employeeData.deductions).reduce((sum, val) => sum + val, 0);
      employeeData.netSalary = employeeData.baseSalary + totalAllowances + employeeData.overtime + employeeData.bonus - totalDeductions;

      const docRef = await addDoc(collection(db, 'payrollEmployees'), employeeData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payroll employee:', error);
      throw new Error('Failed to create payroll employee');
    }
  }

  static async updatePayrollEmployee(employeeId: string, data: UpdatePayrollEmployeeData): Promise<void> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };

      // Recalculate net salary if salary components changed
      if (data.baseSalary || data.allowances || data.deductions || data.overtime || data.bonus) {
        const currentEmployee = await this.getPayrollEmployee(employeeId);
        if (currentEmployee) {
          const newAllowances = data.allowances || currentEmployee.allowances;
          const newDeductions = data.deductions || currentEmployee.deductions;
          const newBaseSalary = data.baseSalary || currentEmployee.baseSalary;
          const newOvertime = data.overtime !== undefined ? data.overtime : currentEmployee.overtime;
          const newBonus = data.bonus !== undefined ? data.bonus : currentEmployee.bonus;

          const totalAllowances = Object.values(newAllowances).reduce((sum: number, val: number) => sum + val, 0);
          const totalDeductions = Object.values(newDeductions).reduce((sum: number, val: number) => sum + val, 0);
          updateData.netSalary = newBaseSalary + totalAllowances + newOvertime + newBonus - totalDeductions;
        }
      }

      await updateDoc(doc(db, 'payrollEmployees', employeeId), updateData);
    } catch (error) {
      console.error('Error updating payroll employee:', error);
      throw new Error('Failed to update payroll employee');
    }
  }

  static async deletePayrollEmployee(employeeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'payrollEmployees', employeeId));
    } catch (error) {
      console.error('Error deleting payroll employee:', error);
      throw new Error('Failed to delete payroll employee');
    }
  }

  static async getPayrollEmployee(employeeId: string): Promise<PayrollEmployee | null> {
    try {
      const docRef = doc(db, 'payrollEmployees', employeeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PayrollEmployee;
      }
      return null;
    } catch (error) {
      console.error('Error getting payroll employee:', error);
      throw new Error('Failed to get payroll employee');
    }
  }

  static async getPayrollEmployees(workspaceId: string): Promise<PayrollEmployee[]> {
    try {
      if (!workspaceId) {
        console.warn('WorkspaceId is undefined, returning empty array');
        return [];
      }

      const q = query(
        collection(db, 'payrollEmployees'),
        where('workspaceId', '==', workspaceId),
        orderBy('employeeName')
      );
      const querySnapshot = await getDocs(q);
      const employees: PayrollEmployee[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        employees.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PayrollEmployee);
      }

      return employees;
    } catch (error) {
      console.error('Error getting payroll employees:', error);
      return [];
    }
  }

  static async getMultiWorkspacePayrollEmployees(workspaceIds: string[]): Promise<PayrollEmployee[]> {
    try {
      if (!workspaceIds || workspaceIds.length === 0) {
        console.warn('No workspace IDs provided, returning empty array');
        return [];
      }

      // Filter out any undefined or empty workspace IDs
      const validWorkspaceIds = workspaceIds.filter(id => id && id.trim() !== '');
      
      if (validWorkspaceIds.length === 0) {
        console.warn('No valid workspace IDs provided, returning empty array');
        return [];
      }

      console.log('Fetching payroll employees from workspaces:', validWorkspaceIds);
      const allEmployees = await Promise.all(
        validWorkspaceIds.map(workspaceId => this.getPayrollEmployees(workspaceId))
      );

      return allEmployees.flat();
    } catch (error) {
      console.error('Error getting multi-workspace payroll employees:', error);
      return [];
    }
  }

  // Payroll Period Management
  static async createPayrollPeriod(data: {
    workspaceId: string;
    period: string;
    startDate: string;
    endDate: string;
  }): Promise<string> {
    try {
      const periodData = {
        ...data,
        status: 'draft' as const,
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'payrollPeriods'), periodData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payroll period:', error);
      throw new Error('Failed to create payroll period');
    }
  }

  static async updatePayrollPeriod(periodId: string, data: Partial<PayrollPeriod>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'payrollPeriods', periodId), updateData);
    } catch (error) {
      console.error('Error updating payroll period:', error);
      throw new Error('Failed to update payroll period');
    }
  }

  static async getPayrollPeriods(workspaceId: string): Promise<PayrollPeriod[]> {
    try {
      if (!workspaceId) {
        console.warn('WorkspaceId is undefined, returning empty array');
        return [];
      }

      const q = query(
        collection(db, 'payrollPeriods'),
        where('workspaceId', '==', workspaceId),
        orderBy('period', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const periods: PayrollPeriod[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        periods.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PayrollPeriod);
      }

      return periods;
    } catch (error) {
      console.error('Error getting payroll periods:', error);
      return [];
    }
  }

  // Payslip Management
  static async createPayslip(data: CreatePayslipData): Promise<string> {
    try {
      const totalAllowances = Object.values(data.allowances).reduce((sum, val) => sum + val, 0);
      const totalDeductions = Object.values(data.deductions).reduce((sum, val) => sum + val, 0);
      const grossPay = data.baseSalary + totalAllowances + data.overtime + data.bonus;
      const netPay = grossPay - totalDeductions;

      const payslipData = {
        ...data,
        totalAllowances,
        totalDeductions,
        grossPay,
        netPay,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'payslips'), payslipData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payslip:', error);
      throw new Error('Failed to create payslip');
    }
  }

  static async updatePayslip(payslipId: string, data: Partial<Payslip>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'payslips', payslipId), updateData);
    } catch (error) {
      console.error('Error updating payslip:', error);
      throw new Error('Failed to update payslip');
    }
  }

  static async deletePayslip(payslipId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'payslips', payslipId));
    } catch (error) {
      console.error('Error deleting payslip:', error);
      throw new Error('Failed to delete payslip');
    }
  }

  static async getPayslip(payslipId: string): Promise<Payslip | null> {
    try {
      const docRef = doc(db, 'payslips', payslipId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Payslip;
      }
      return null;
    } catch (error) {
      console.error('Error getting payslip:', error);
      throw new Error('Failed to get payslip');
    }
  }

  static async getPayslips(workspaceId: string, period?: string): Promise<Payslip[]> {
    try {
      if (!workspaceId) {
        console.warn('WorkspaceId is undefined, returning empty array');
        return [];
      }

      const constraints = [
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      ];

      if (period) {
        constraints.unshift(where('period', '==', period));
      }

      const q = query(collection(db, 'payslips'), ...constraints);
      const querySnapshot = await getDocs(q);
      const payslips: Payslip[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        payslips.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Payslip);
      }

      return payslips;
    } catch (error) {
      console.error('Error getting payslips:', error);
      return [];
    }
  }

  static async getMultiWorkspacePayslips(workspaceIds: string[], period?: string): Promise<Payslip[]> {
    try {
      if (!workspaceIds || workspaceIds.length === 0) {
        console.warn('No workspace IDs provided, returning empty array');
        return [];
      }

      // Filter out any undefined or empty workspace IDs
      const validWorkspaceIds = workspaceIds.filter(id => id && id.trim() !== '');
      
      if (validWorkspaceIds.length === 0) {
        console.warn('No valid workspace IDs provided, returning empty array');
        return [];
      }

      console.log('Fetching payslips from workspaces:', validWorkspaceIds);
      const allPayslips = await Promise.all(
        validWorkspaceIds.map(workspaceId => this.getPayslips(workspaceId, period))
      );

      return allPayslips.flat();
    } catch (error) {
      console.error('Error getting multi-workspace payslips:', error);
      return [];
    }
  }

  // Statistics
  static async getPayrollStats(workspaceId: string, period?: string): Promise<PayrollSummary> {
    try {
      if (!workspaceId) {
        console.warn('WorkspaceId is undefined, returning default stats');
        return {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          averageSalary: 0,
          totalTax: 0,
          totalAllowances: 0,
          totalOvertime: 0,
          totalBonus: 0,
          pendingPayments: 0,
          processedPayments: 0,
          paidPayments: 0
        };
      }

      const employees = await this.getPayrollEmployees(workspaceId);
      const payslips = period ? await this.getPayslips(workspaceId, period) : [];

      const totalEmployees = employees.length;
      const totalGrossPay = employees.reduce((sum, emp) => sum + emp.baseSalary + 
        Object.values(emp.allowances).reduce((a, b) => a + b, 0) + emp.overtime + emp.bonus, 0);
      const totalDeductions = employees.reduce((sum, emp) => sum + 
        Object.values(emp.deductions).reduce((a, b) => a + b, 0), 0);
      const totalNetPay = employees.reduce((sum, emp) => sum + emp.netSalary, 0);
      const averageSalary = totalEmployees > 0 ? totalGrossPay / totalEmployees : 0;
      const totalTax = employees.reduce((sum, emp) => sum + emp.deductions.tax, 0);
      const totalAllowances = employees.reduce((sum, emp) => sum + 
        Object.values(emp.allowances).reduce((a, b) => a + b, 0), 0);
      const totalOvertime = employees.reduce((sum, emp) => sum + emp.overtime, 0);
      const totalBonus = employees.reduce((sum, emp) => sum + emp.bonus, 0);
      const pendingPayments = employees.filter(emp => emp.payrollStatus === 'pending').length;
      const processedPayments = employees.filter(emp => emp.payrollStatus === 'processed').length;
      const paidPayments = employees.filter(emp => emp.payrollStatus === 'paid').length;

      return {
        totalEmployees,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        averageSalary,
        totalTax,
        totalAllowances,
        totalOvertime,
        totalBonus,
        pendingPayments,
        processedPayments,
        paidPayments
      };
    } catch (error) {
      console.error('Error getting payroll stats:', error);
      return {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        averageSalary: 0,
        totalTax: 0,
        totalAllowances: 0,
        totalOvertime: 0,
        totalBonus: 0,
        pendingPayments: 0,
        processedPayments: 0,
        paidPayments: 0
      };
    }
  }

  static async getMultiWorkspacePayrollStats(workspaceIds: string[], period?: string): Promise<PayrollSummary> {
    try {
      if (!workspaceIds || workspaceIds.length === 0) {
        console.warn('No workspace IDs provided, returning default stats');
        return {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          averageSalary: 0,
          totalTax: 0,
          totalAllowances: 0,
          totalOvertime: 0,
          totalBonus: 0,
          pendingPayments: 0,
          processedPayments: 0,
          paidPayments: 0
        };
      }

      // Filter out any undefined or empty workspace IDs
      const validWorkspaceIds = workspaceIds.filter(id => id && id.trim() !== '');
      
      if (validWorkspaceIds.length === 0) {
        console.warn('No valid workspace IDs provided, returning default stats');
        return {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          averageSalary: 0,
          totalTax: 0,
          totalAllowances: 0,
          totalOvertime: 0,
          totalBonus: 0,
          pendingPayments: 0,
          processedPayments: 0,
          paidPayments: 0
        };
      }

      console.log('Fetching payroll stats from workspaces:', validWorkspaceIds);
      const allStats = await Promise.all(
        validWorkspaceIds.map(workspaceId => this.getPayrollStats(workspaceId, period))
      );

      return allStats.reduce((acc, stat) => ({
        totalEmployees: acc.totalEmployees + stat.totalEmployees,
        totalGrossPay: acc.totalGrossPay + stat.totalGrossPay,
        totalDeductions: acc.totalDeductions + stat.totalDeductions,
        totalNetPay: acc.totalNetPay + stat.totalNetPay,
        averageSalary: 0, // Will be calculated
        totalTax: acc.totalTax + stat.totalTax,
        totalAllowances: acc.totalAllowances + stat.totalAllowances,
        totalOvertime: acc.totalOvertime + stat.totalOvertime,
        totalBonus: acc.totalBonus + stat.totalBonus,
        pendingPayments: acc.pendingPayments + stat.pendingPayments,
        processedPayments: acc.processedPayments + stat.processedPayments,
        paidPayments: acc.paidPayments + stat.paidPayments
      }), {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        averageSalary: 0,
        totalTax: 0,
        totalAllowances: 0,
        totalOvertime: 0,
        totalBonus: 0,
        pendingPayments: 0,
        processedPayments: 0,
        paidPayments: 0
      });
    } catch (error) {
      console.error('Error getting multi-workspace payroll stats:', error);
      return {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        averageSalary: 0,
        totalTax: 0,
        totalAllowances: 0,
        totalOvertime: 0,
        totalBonus: 0,
        pendingPayments: 0,
        processedPayments: 0,
        paidPayments: 0
      };
    }
  }

  // Process Payroll
  static async processPayroll(workspaceId: string, period: string, processorId: string): Promise<void> {
    try {
      const employees = await this.getPayrollEmployees(workspaceId);
      
      // Update all employees to processed status
      const batch = writeBatch(db);
      
      employees.forEach(employee => {
        const employeeRef = doc(db, 'payrollEmployees', employee.id);
        batch.update(employeeRef, {
          payrollStatus: 'processed',
          updatedAt: new Date()
        });
      });

      // Create or update payroll period
      const periods = await this.getPayrollPeriods(workspaceId);
      const existingPeriod = periods.find(p => p.period === period);
      
      if (existingPeriod) {
        const periodRef = doc(db, 'payrollPeriods', existingPeriod.id);
        batch.update(periodRef, {
          status: 'completed',
          totalEmployees: employees.length,
          totalGrossPay: employees.reduce((sum, emp) => sum + emp.baseSalary + 
            Object.values(emp.allowances).reduce((a, b) => a + b, 0) + emp.overtime + emp.bonus, 0),
          totalDeductions: employees.reduce((sum, emp) => sum + 
            Object.values(emp.deductions).reduce((a, b) => a + b, 0), 0),
          totalNetPay: employees.reduce((sum, emp) => sum + emp.netSalary, 0),
          processedBy: processorId,
          processedDate: format(new Date(), 'yyyy-MM-dd'),
          updatedAt: new Date()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error processing payroll:', error);
      throw new Error('Failed to process payroll');
    }
  }

  // Process Individual Employee
  static async processIndividualEmployee(employeeId: string, processorId: string): Promise<void> {
    try {
      const employeeRef = doc(db, 'payrollEmployees', employeeId);
      
      await updateDoc(employeeRef, {
        payrollStatus: 'processed',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error processing individual employee:', error);
      throw new Error('Failed to process employee');
    }
  }

  // Process Selected Employees
  static async processSelectedEmployees(employeeIds: string[], processorId: string): Promise<void> {
    try {
      if (employeeIds.length === 0) {
        throw new Error('No employees selected for processing');
      }

      const batch = writeBatch(db);
      
      employeeIds.forEach(employeeId => {
        const employeeRef = doc(db, 'payrollEmployees', employeeId);
        batch.update(employeeRef, {
          payrollStatus: 'processed',
          updatedAt: new Date()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error processing selected employees:', error);
      throw new Error('Failed to process selected employees');
    }
  }

  // Auto-process fixed salaries (employees with no variable components)
  static async autoProcessFixedSalaries(workspaceId: string, processorId: string): Promise<{
    processed: number;
    skipped: number;
    errors: number;
  }> {
    try {
      const employees = await this.getPayrollEmployees(workspaceId);
      const batch = writeBatch(db);
      
      let processed = 0;
      let skipped = 0;
      let errors = 0;

      for (const employee of employees) {
        // Skip if already processed or paid
        if (employee.payrollStatus !== 'pending') {
          skipped++;
          continue;
        }

        // Use the explicit isFixedSalary flag
        if (employee.isFixedSalary) {
          // Auto-process fixed salary employees
          const employeeRef = doc(db, 'payrollEmployees', employee.id);
          batch.update(employeeRef, {
            payrollStatus: 'processed',
            updatedAt: new Date()
          });
          processed++;
        } else {
          // Skip employees marked as variable salary (need manual review)
          skipped++;
        }
      }

      await batch.commit();
      
      return { processed, skipped, errors };
    } catch (error) {
      console.error('Error auto-processing fixed salaries:', error);
      throw new Error('Failed to auto-process fixed salaries');
    }
  }

  // Process with salary review (for employees with variable components)
  static async processWithReview(employeeIds: string[], processorId: string, reviewData: {
    [employeeId: string]: {
      overtime?: number;
      bonus?: number;
      otherAllowance?: number;
      notes?: string;
    };
  }): Promise<void> {
    try {
      if (employeeIds.length === 0) {
        throw new Error('No employees selected for processing');
      }

      const batch = writeBatch(db);
      
      for (const employeeId of employeeIds) {
        const employeeRef = doc(db, 'payrollEmployees', employeeId);
        const review = reviewData[employeeId] || {};
        
        const updates: any = {
          payrollStatus: 'processed',
          updatedAt: new Date()
        };

        // Update variable components if provided
        if (review.overtime !== undefined) {
          updates.overtime = review.overtime;
        }
        if (review.bonus !== undefined) {
          updates.bonus = review.bonus;
        }
        if (review.otherAllowance !== undefined) {
          updates.allowances = {
            ...(await getDoc(employeeRef)).data()?.allowances,
            other: review.otherAllowance
          };
        }

        // Recalculate net salary if variable components changed
        if (review.overtime !== undefined || review.bonus !== undefined || review.otherAllowance !== undefined) {
          const employeeData = (await getDoc(employeeRef)).data();
          if (employeeData) {
            const baseSalary = employeeData.baseSalary;
            const allowances = employeeData.allowances;
            const deductions = employeeData.deductions;
            const overtime = review.overtime !== undefined ? review.overtime : employeeData.overtime;
            const bonus = review.bonus !== undefined ? review.bonus : employeeData.bonus;

            const totalAllowances = (Object.values(allowances) as number[]).reduce((sum: number, val: number) => sum + val, 0);
            const totalDeductions = (Object.values(deductions) as number[]).reduce((sum: number, val: number) => sum + val, 0);
            const netSalary = baseSalary + totalAllowances + overtime + bonus - totalDeductions;

            updates.netSalary = netSalary;
          }
        }

        batch.update(employeeRef, updates);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error processing with review:', error);
      throw new Error('Failed to process with review');
    }
  }

  // Get employees that need manual review (have variable components)
  static async getEmployeesNeedingReview(workspaceId: string): Promise<PayrollEmployee[]> {
    try {
      const employees = await this.getPayrollEmployees(workspaceId);
      
      return employees.filter(employee => {
        // Only include pending employees marked as variable salary
        return employee.payrollStatus === 'pending' && !employee.isFixedSalary;
      });
    } catch (error) {
      console.error('Error getting employees needing review:', error);
      throw new Error('Failed to get employees needing review');
    }
  }

  // Get employees with fixed salaries (no variable components)
  static async getFixedSalaryEmployees(workspaceId: string): Promise<PayrollEmployee[]> {
    try {
      const employees = await this.getPayrollEmployees(workspaceId);
      
      return employees.filter(employee => {
        // Only include pending employees marked as fixed salary
        return employee.payrollStatus === 'pending' && employee.isFixedSalary;
      });
    } catch (error) {
      console.error('Error getting fixed salary employees:', error);
      throw new Error('Failed to get fixed salary employees');
    }
  }

  // Generate Payslips
  static async generatePayslips(workspaceId: string, period: string, generatorId: string): Promise<void> {
    try {
      const employees = await this.getPayrollEmployees(workspaceId);
      const startDate = `${period}-01`;
      const endDate = `${period}-${new Date(new Date(period + '-01').getFullYear(), new Date(period + '-01').getMonth() + 1, 0).getDate()}`;

      const batch = writeBatch(db);

      for (const employee of employees) {
        const payslipData = {
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          employeeEmail: employee.employeeEmail,
          workspaceId: employee.workspaceId,
          period,
          startDate,
          endDate,
          baseSalary: employee.baseSalary,
          allowances: employee.allowances,
          totalAllowances: (Object.values(employee.allowances) as number[]).reduce((sum: number, val: number) => sum + val, 0),
          overtime: employee.overtime,
          bonus: employee.bonus,
          grossPay: employee.baseSalary + (Object.values(employee.allowances) as number[]).reduce((sum: number, val: number) => sum + val, 0) + employee.overtime + employee.bonus,
          deductions: employee.deductions,
          totalDeductions: (Object.values(employee.deductions) as number[]).reduce((sum: number, val: number) => sum + val, 0),
          netPay: employee.netSalary,
          currency: employee.currency,
          status: 'draft' as const,
          generatedBy: generatorId,
          generatedDate: format(new Date(), 'yyyy-MM-dd'),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const payslipRef = doc(collection(db, 'payslips'));
        batch.set(payslipRef, payslipData);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error generating payslips:', error);
      throw new Error('Failed to generate payslips');
    }
  }

  // Send Payslip
  static async sendPayslip(payslipId: string): Promise<void> {
    try {
      const payslip = await this.getPayslip(payslipId);
      if (!payslip) {
        throw new Error('Payslip not found');
      }

      // Update payslip status
      await this.updatePayslip(payslipId, { status: 'sent' });

      // Send email notification
      try {
        await EmailService.sendPayslipEmail({
          to_email: payslip.employeeEmail,
          to_name: payslip.employeeName,
          period: payslip.period,
          net_pay: payslip.netPay,
          currency: payslip.currency
        });
      } catch (emailError) {
        console.warn('Failed to send payslip email:', emailError);
      }

      // Create notification
      try {
        await NotificationService.createNotification({
          userId: payslip.employeeId,
          workspaceId: payslip.workspaceId,
          type: 'payslip_sent',
          title: 'Payslip Available',
          message: `Your payslip for ${payslip.period} is now available. Net pay: ${payslip.currency} ${payslip.netPay.toLocaleString()}`,
          metadata: { payslipId: payslip.id }
        });
      } catch (notificationError) {
        console.warn('Failed to create payslip notification:', notificationError);
      }
    } catch (error) {
      console.error('Error sending payslip:', error);
      throw new Error('Failed to send payslip');
    }
  }
} 