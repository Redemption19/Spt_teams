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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  workspaceName?: string; // Added for cross-workspace display
  date: string; // YYYY-MM-DD format
  clockIn: string | null; // HH:mm format
  clockOut: string | null; // HH:mm format
  breakStart: string | null; // HH:mm format
  breakEnd: string | null; // HH:mm format
  workHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'work-from-home';
  location: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  workFromHome: number;
  halfDay: number;
  avgWorkHours: number;
  totalOvertime: number;
  attendanceRate: number;
}

export interface ClockInData {
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  location: string;
  notes?: string;
  createdBy: string;
}

export interface ClockOutData {
  location: string;
  notes?: string;
  updatedBy: string;
}

export interface BreakData {
  updatedBy: string;
}

export interface AttendanceFilters {
  startDate?: Date;
  endDate?: Date;
  employeeId?: string;
  status?: string;
  workspaceId?: string;
}

export interface CreateAttendanceData {
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'work-from-home';
  location: string;
  notes?: string;
  createdBy: string;
}

export interface UpdateAttendanceData {
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status?: 'present' | 'absent' | 'late' | 'half-day' | 'work-from-home';
  location?: string;
  notes?: string;
  updatedBy: string;
}

export class AttendanceService {
  private static readonly COLLECTION = 'attendance';

  // Create attendance record
  static async createAttendance(data: CreateAttendanceData): Promise<string> {
    try {
      const now = new Date();
      const workHours = this.calculateWorkHours(
        data.clockIn,
        data.clockOut,
        data.breakStart,
        data.breakEnd
      );
      const overtime = Math.max(0, workHours - 8); // Assuming 8 hours is standard

      // Filter out undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      const attendanceData = {
        ...cleanData,
        workHours,
        overtime,
        createdAt: now,
        updatedAt: now,
        updatedBy: data.createdBy
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), attendanceData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw new Error('Failed to create attendance record');
    }
  }

  // Update attendance record
  static async updateAttendance(id: string, data: UpdateAttendanceData): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const existingDoc = await getDoc(docRef);
      
      if (!existingDoc.exists()) {
        throw new Error('Attendance record not found');
      }

      const existingData = existingDoc.data();
      const updatedClockIn = data.clockIn ?? existingData.clockIn;
      const updatedClockOut = data.clockOut ?? existingData.clockOut;
      const updatedBreakStart = data.breakStart ?? existingData.breakStart;
      const updatedBreakEnd = data.breakEnd ?? existingData.breakEnd;

      const workHours = this.calculateWorkHours(
        updatedClockIn,
        updatedClockOut,
        updatedBreakStart,
        updatedBreakEnd
      );
      const overtime = Math.max(0, workHours - 8);

      // Filter out undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      const updateData = {
        ...cleanData,
        workHours,
        overtime,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw new Error('Failed to update attendance record');
    }
  }

  // Clock in
  static async clockIn(data: ClockInData): Promise<string> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentTime = format(new Date(), 'HH:mm');
      
      // Check if already clocked in today
      const existingRecord = await this.getTodayAttendance(data.employeeId, data.workspaceId);
      
      if (existingRecord && existingRecord.clockIn) {
        throw new Error('Already clocked in today');
      }

      if (existingRecord) {
        // Update existing record
        await this.updateAttendance(existingRecord.id, {
          clockIn: currentTime,
          status: this.determineStatus(currentTime),
          location: data.location,
          notes: data.notes,
          updatedBy: data.createdBy
        });
        return existingRecord.id;
      } else {
        // Create new record
        return await this.createAttendance({
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          workspaceId: data.workspaceId,
          date: today,
          clockIn: currentTime,
          status: this.determineStatus(currentTime),
          location: data.location,
          notes: data.notes,
          createdBy: data.createdBy
        });
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      throw error;
    }
  }

  // Clock out
  static async clockOut(employeeId: string, workspaceId: string, data: ClockOutData): Promise<void> {
    try {
      const todayRecord = await this.getTodayAttendance(employeeId, workspaceId);
      
      if (!todayRecord || !todayRecord.clockIn) {
        throw new Error('No clock-in record found for today');
      }

      if (todayRecord.clockOut) {
        throw new Error('Already clocked out today');
      }

      const currentTime = format(new Date(), 'HH:mm');
      
      await this.updateAttendance(todayRecord.id, {
        clockOut: currentTime,
        location: data.location,
        notes: data.notes,
        updatedBy: data.updatedBy
      });
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  // Start break
  static async startBreak(employeeId: string, workspaceId: string, data: BreakData): Promise<void> {
    try {
      const todayRecord = await this.getTodayAttendance(employeeId, workspaceId);
      
      if (!todayRecord || !todayRecord.clockIn) {
        throw new Error('Must clock in before taking a break');
      }

      if (todayRecord.breakStart && !todayRecord.breakEnd) {
        throw new Error('Already on break');
      }

      const currentTime = format(new Date(), 'HH:mm');
      
      await this.updateAttendance(todayRecord.id, {
        breakStart: currentTime,
        breakEnd: undefined, // Reset break end if starting new break
        updatedBy: data.updatedBy
      });
    } catch (error) {
      console.error('Error starting break:', error);
      throw error;
    }
  }

  // End break
  static async endBreak(employeeId: string, workspaceId: string, data: BreakData): Promise<void> {
    try {
      const todayRecord = await this.getTodayAttendance(employeeId, workspaceId);
      
      if (!todayRecord || !todayRecord.breakStart) {
        throw new Error('No active break found');
      }

      if (todayRecord.breakEnd) {
        throw new Error('Break already ended');
      }

      const currentTime = format(new Date(), 'HH:mm');
      
      await this.updateAttendance(todayRecord.id, {
        breakEnd: currentTime,
        updatedBy: data.updatedBy
      });
    } catch (error) {
      console.error('Error ending break:', error);
      throw error;
    }
  }

  // Get today's attendance record for an employee
  static async getTodayAttendance(employeeId: string, workspaceId: string): Promise<AttendanceRecord | null> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const q = query(
        collection(db, this.COLLECTION),
        where('employeeId', '==', employeeId),
        where('workspaceId', '==', workspaceId),
        where('date', '==', today)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as AttendanceRecord;
    } catch (error) {
      console.error('Error getting today attendance:', error);
      throw new Error('Failed to get today attendance');
    }
  }

  // Get a single attendance record by ID
  static async getAttendanceRecord(id: string): Promise<AttendanceRecord> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Attendance record not found');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      } as AttendanceRecord;
    } catch (error) {
      console.error('Error getting attendance record:', error);
      throw new Error('Failed to get attendance record');
    }
  }

  // Get attendance records with filters
  static async getAttendanceRecords(filters: AttendanceFilters = {}): Promise<AttendanceRecord[]> {
    try {
      let q = query(collection(db, this.COLLECTION));

      // Apply filters
      if (filters.workspaceId) {
        q = query(q, where('workspaceId', '==', filters.workspaceId));
      }

      if (filters.employeeId) {
        q = query(q, where('employeeId', '==', filters.employeeId));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.startDate) {
        const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
        q = query(q, where('date', '>=', startDateStr));
      }

      if (filters.endDate) {
        const endDateStr = format(filters.endDate, 'yyyy-MM-dd');
        q = query(q, where('date', '<=', endDateStr));
      }

      // Order by date and time
      q = query(q, orderBy('date', 'desc'), orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as AttendanceRecord[];
    } catch (error) {
      console.error('Error getting attendance records:', error);
      throw new Error('Failed to get attendance records');
    }
  }

  // Get attendance statistics for a date range
  static async getAttendanceStats(workspaceId: string, date?: Date, dateRange?: { startDate?: Date; endDate?: Date }): Promise<AttendanceStats> {
    try {
      let q = query(collection(db, this.COLLECTION), where('workspaceId', '==', workspaceId));
      
      if (date) {
        // Get attendance records for the specific date
        const dateStr = format(date, 'yyyy-MM-dd');
        q = query(q, where('date', '==', dateStr));
      } else if (dateRange) {
        // Get attendance records for the date range
        if (dateRange.startDate) {
          const startDateStr = format(dateRange.startDate, 'yyyy-MM-dd');
          q = query(q, where('date', '>=', startDateStr));
        }
        if (dateRange.endDate) {
          const endDateStr = format(dateRange.endDate, 'yyyy-MM-dd');
          q = query(q, where('date', '<=', endDateStr));
        }
      }
      // If no date or dateRange provided, get all records for the workspace

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => doc.data()) as AttendanceRecord[];
      
      console.log(`AttendanceStats for workspace ${workspaceId}:`, {
        totalRecords: records.length,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        workFromHome: records.filter(r => r.status === 'work-from-home').length,
        halfDay: records.filter(r => r.status === 'half-day').length,
        dateFilter: date ? format(date, 'yyyy-MM-dd') : 'all records'
      });

      // Get total employees from employee service
      const { EmployeeService } = await import('./employee-service');
      const employees = await EmployeeService.getWorkspaceEmployees(workspaceId);
      const totalEmployees = employees.filter(emp => emp.status === 'active').length;

      const stats: AttendanceStats = {
        totalEmployees,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        workFromHome: records.filter(r => r.status === 'work-from-home').length,
        halfDay: records.filter(r => r.status === 'half-day').length,
        avgWorkHours: 0,
        totalOvertime: 0,
        attendanceRate: 0
      };

      // Calculate averages
      const workingRecords = records.filter(r => r.status !== 'absent');
      if (workingRecords.length > 0) {
        stats.avgWorkHours = workingRecords.reduce((sum, r) => sum + (r.workHours || 0), 0) / workingRecords.length;
        stats.totalOvertime = workingRecords.reduce((sum, r) => sum + (r.overtime || 0), 0);
      }

      // Calculate attendance rate based on total active employees
      if (stats.totalEmployees > 0) {
        const presentCount = stats.present + stats.late + stats.workFromHome + stats.halfDay;
        stats.attendanceRate = (presentCount / stats.totalEmployees) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      throw new Error('Failed to get attendance statistics');
    }
  }

  // Get attendance statistics for multiple workspaces
  static async getMultiWorkspaceStats(workspaceIds: string[], date?: Date, dateRange?: { startDate?: Date; endDate?: Date }): Promise<AttendanceStats> {
    try {
      const allStats = await Promise.all(
        workspaceIds.map(id => this.getAttendanceStats(id, date, dateRange))
      );

      // Combine stats from all workspaces
      const combinedStats: AttendanceStats = {
        totalEmployees: allStats.reduce((sum, stat) => sum + stat.totalEmployees, 0),
        present: allStats.reduce((sum, stat) => sum + stat.present, 0),
        absent: allStats.reduce((sum, stat) => sum + stat.absent, 0),
        late: allStats.reduce((sum, stat) => sum + stat.late, 0),
        workFromHome: allStats.reduce((sum, stat) => sum + stat.workFromHome, 0),
        halfDay: allStats.reduce((sum, stat) => sum + stat.halfDay, 0),
        avgWorkHours: 0,
        totalOvertime: allStats.reduce((sum, stat) => sum + stat.totalOvertime, 0),
        attendanceRate: 0
      };

      // Calculate weighted average work hours
      const totalWorkingRecords = allStats.reduce((sum, stat) => {
        const workingRecords = stat.present + stat.late + stat.workFromHome + stat.halfDay;
        return sum + workingRecords;
      }, 0);

      if (totalWorkingRecords > 0) {
        const weightedSum = allStats.reduce((sum, stat) => {
          const workingRecords = stat.present + stat.late + stat.workFromHome + stat.halfDay;
          return sum + (stat.avgWorkHours * workingRecords);
        }, 0);
        combinedStats.avgWorkHours = weightedSum / totalWorkingRecords;
      }

      // Calculate overall attendance rate
      if (combinedStats.totalEmployees > 0) {
        const presentCount = combinedStats.present + combinedStats.late + combinedStats.workFromHome + combinedStats.halfDay;
        combinedStats.attendanceRate = (presentCount / combinedStats.totalEmployees) * 100;
      }

      return combinedStats;
    } catch (error) {
      console.error('Error getting multi-workspace attendance stats:', error);
      throw new Error('Failed to get multi-workspace attendance statistics');
    }
  }

  // Delete attendance record
  static async deleteAttendance(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, id));
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw new Error('Failed to delete attendance record');
    }
  }

  // Bulk create attendance records
  static async bulkCreateAttendance(records: CreateAttendanceData[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date();

      records.forEach(record => {
        const docRef = doc(collection(db, this.COLLECTION));
        const workHours = this.calculateWorkHours(
          record.clockIn,
          record.clockOut,
          record.breakStart,
          record.breakEnd
        );
        const overtime = Math.max(0, workHours - 8);

        batch.set(docRef, {
          ...record,
          workHours,
          overtime,
          createdAt: now,
          updatedAt: now,
          updatedBy: record.createdBy
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk creating attendance records:', error);
      throw new Error('Failed to bulk create attendance records');
    }
  }

  // Helper method to calculate work hours
  private static calculateWorkHours(
    clockIn?: string | null,
    clockOut?: string | null,
    breakStart?: string | null,
    breakEnd?: string | null
  ): number {
    if (!clockIn || !clockOut) {
      return 0;
    }

    try {
      const [inHour, inMinute] = clockIn.split(':').map(Number);
      const [outHour, outMinute] = clockOut.split(':').map(Number);
      
      const clockInMinutes = inHour * 60 + inMinute;
      const clockOutMinutes = outHour * 60 + outMinute;
      
      let totalMinutes = clockOutMinutes - clockInMinutes;
      
      // Subtract break time if both break start and end are provided
      if (breakStart && breakEnd) {
        const [breakStartHour, breakStartMinute] = breakStart.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEnd.split(':').map(Number);
        
        const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
        const breakEndMinutes = breakEndHour * 60 + breakEndMinute;
        
        const breakDuration = breakEndMinutes - breakStartMinutes;
        totalMinutes -= breakDuration;
      }
      
      return Math.max(0, totalMinutes / 60); // Convert to hours
    } catch (error) {
      console.error('Error calculating work hours:', error);
      return 0;
    }
  }

  // Helper method to determine status based on clock-in time
  private static determineStatus(clockInTime: string): 'present' | 'late' {
    try {
      const [hour, minute] = clockInTime.split(':').map(Number);
      const clockInMinutes = hour * 60 + minute;
      const standardStartTime = 9 * 60; // 9:00 AM in minutes
      
      return clockInMinutes > standardStartTime ? 'late' : 'present';
    } catch (error) {
      console.error('Error determining status:', error);
      return 'present';
    }
  }

  // Get attendance records for multiple workspaces (for owners)
  static async getMultiWorkspaceAttendance(
    workspaceIds: string[], 
    date?: Date, 
    dateRange?: { startDate?: Date; endDate?: Date }
  ): Promise<AttendanceRecord[]> {
    try {
      const promises = workspaceIds.map(workspaceId => {
        let q = query(
          collection(db, this.COLLECTION),
          where('workspaceId', '==', workspaceId)
        );

        // Apply date filtering
        if (date) {
          // Single date filtering
          const dateStr = format(date, 'yyyy-MM-dd');
          q = query(q, where('date', '==', dateStr));
        } else if (dateRange && (dateRange.startDate || dateRange.endDate)) {
          // Date range filtering
          if (dateRange.startDate) {
            const startDateStr = format(dateRange.startDate, 'yyyy-MM-dd');
            q = query(q, where('date', '>=', startDateStr));
          }
          if (dateRange.endDate) {
            const endDateStr = format(dateRange.endDate, 'yyyy-MM-dd');
            q = query(q, where('date', '<=', endDateStr));
          }
        } else if (dateRange === undefined) {
          // Default to today's records only if dateRange is undefined (not empty object)
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          q = query(q, where('date', '==', todayStr));
        }
        // If dateRange is an empty object {}, fetch all records (no date filtering)

        return getDocs(q);
      });

      const results = await Promise.all(promises);
      const allRecords: AttendanceRecord[] = [];

      results.forEach(querySnapshot => {
        querySnapshot.docs.forEach(doc => {
          allRecords.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          } as AttendanceRecord);
        });
      });

      return allRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting multi-workspace attendance:', error);
      throw new Error('Failed to get multi-workspace attendance');
    }
  }
}