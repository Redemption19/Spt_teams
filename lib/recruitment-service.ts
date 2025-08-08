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
import { ActivityService } from './activity-service';

export interface JobPosting {
  id: string;
  workspaceId: string;
  title: string;
  department: string;
  departmentId?: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'intern';
  level: 'entry' | 'mid' | 'senior' | 'executive';
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'draft' | 'published' | 'active' | 'paused' | 'closed';
  publishedAt?: Date;
  closedAt?: Date;
  applications: JobApplication[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  // Additional fields for compatibility with existing components
  postedDate?: Date; // Alias for publishedAt
  views?: number; // View count
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  workspaceId: string;
  candidateInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    resume?: string;
    coverLetter?: string;
    portfolio?: string;
    linkedIn?: string;
  };
  status: 'submitted' | 'under-review' | 'interview-scheduled' | 'interviewed' | 'hired' | 'rejected';
  stage: 'application' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  notes: string[];
  interviewScheduled?: {
    date: Date;
    type: 'phone' | 'video' | 'in-person';
    interviewer: string;
    notes?: string;
  };
  rating?: number; // 1-5 stars
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  // Additional fields for compatibility with existing components
  appliedDate?: Date; // Alias for createdAt
}

export interface Candidate {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'new' | 'in-review' | 'interview-scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
  score?: number; // 1-100 rating
  experience: number; // years of experience
  education: string;
  appliedDate: Date;
  notes?: string;
  tags?: string[];
  jobId?: string; // Associated job posting
  jobPostingId?: string; // Alias for jobId
  resume?: string; // URL to resume file
  coverLetter?: string;
  portfolio?: string;
  linkedIn?: string;
  skills?: string[];
  expectedSalary?: number;
  availabilityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Interview {
  id: string;
  workspaceId: string;
  candidateId: string;
  jobPostingId: string;
  title: string;
  date: Date;
  time: string; // HH:mm format
  duration: number; // minutes
  interviewer: string;
  interviewerId?: string;
  location?: string;
  type: 'phone' | 'video' | 'in-person';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  meetingLink?: string;
  notes?: string;
  feedback?: string;
  rating?: number; // 1-5 stars
  outcome?: 'pass' | 'fail' | 'pending';
  nextSteps?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color: string;
  isRequired: boolean;
  estimatedDuration?: number; // days
  criteria?: string[];
  nextStageId?: string;
}

export interface HiringPipeline {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  jobPostingId?: string; // Optional - can be job-specific or general
  stages: PipelineStage[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface RecruitmentStats {
  // Legacy properties for backward compatibility
  openPositions: number;
  totalApplications: number;
  inProgress: number; // under-review + interview-scheduled + interviewed
  hired: number;
  rejected: number;
  avgTimeToHire: number; // in days
  applicationsByMonth: { month: string; count: number }[];
  topDepartments: { department: string; positions: number }[];
  
  // New properties expected by RecruitmentStats component
  activeJobs: number;
  applicationsThisMonth: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  offersSent: number;
  hiresThisMonth: number;
  averageTimeToHire: number;
  applicationToInterviewRate: number;
  interviewToOfferRate: number;
  offerToHireRate: number;
}

export class RecruitmentService {
  /**
   * Get all job postings for a workspace
   */
  static async getJobPostings(workspaceId: string, status?: JobPosting['status']): Promise<JobPosting[]> {
    try {
      let q = query(
        collection(db, 'jobPostings'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(
          collection(db, 'jobPostings'),
          where('workspaceId', '==', workspaceId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate(),
          closedAt: data.closedAt?.toDate(),
          // Add compatibility aliases
          postedDate: data.publishedAt?.toDate() || data.createdAt?.toDate() || new Date(),
          views: data.views || 0,
          // Map 'published' status to 'active' for component compatibility
          status: data.status === 'published' ? 'active' : data.status,
        } as JobPosting;
      });
    } catch (error) {
      console.error('Error fetching job postings:', error);
      return [];
    }
  }

  /**
   * Get all job postings for a workspace (alias for getJobPostings)
   */
  static async getWorkspaceJobPostings(workspaceId: string, status?: JobPosting['status']): Promise<JobPosting[]> {
    return this.getJobPostings(workspaceId, status);
  }

  /**
   * Get job postings from multiple workspaces
   */
  static async getMultiWorkspaceJobPostings(workspaceIds: string[], status?: JobPosting['status']): Promise<JobPosting[]> {
    try {
      if (!workspaceIds || workspaceIds.length === 0) {
        console.warn('No workspace IDs provided, returning empty array');
        return [];
      }

      const allJobPostings: JobPosting[] = [];
      
      // Fetch job postings from each workspace
      for (const workspaceId of workspaceIds) {
        const jobPostings = await this.getJobPostings(workspaceId, status);
        allJobPostings.push(...jobPostings);
      }
      
      // Sort by creation date (newest first)
      allJobPostings.sort((a, b) => {
        const aDate = a.publishedAt || a.createdAt;
        const bDate = b.publishedAt || b.createdAt;
        return bDate.getTime() - aDate.getTime();
      });
      
      return allJobPostings;
    } catch (error) {
      console.error('Error fetching multi-workspace job postings:', error);
      return [];
    }
  }

  /**
   * Get all job applications for a workspace
   */
  static async getJobApplications(workspaceId: string, status?: JobApplication['status']): Promise<JobApplication[]> {
    try {
      let q = query(
        collection(db, 'jobApplications'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(
          collection(db, 'jobApplications'),
          where('workspaceId', '==', workspaceId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          interviewScheduled: data.interviewScheduled ? {
            ...data.interviewScheduled,
            date: data.interviewScheduled.date?.toDate()
          } : undefined,
          // Add compatibility alias
          appliedDate: data.createdAt?.toDate() || new Date(),
        } as JobApplication;
      });
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return [];
    }
  }

  /**
   * Get all job applications for a workspace (alias for getJobApplications)
   */
  static async getWorkspaceJobApplications(workspaceId: string, status?: JobApplication['status']): Promise<JobApplication[]> {
    return this.getJobApplications(workspaceId, status);
  }

  /**
   * Get recruitment statistics for a workspace
   */
  static async getRecruitmentStats(workspaceId: string): Promise<RecruitmentStats> {
    try {
      console.log('📊 [STATS DEBUG] Starting getRecruitmentStats for workspace:', workspaceId);
      
      const [jobPostings, applications, interviews, candidates] = await Promise.all([
        this.getJobPostings(workspaceId),
        this.getJobApplications(workspaceId),
        this.getWorkspaceInterviews(workspaceId),
        this.getWorkspaceCandidates(workspaceId)
      ]);
      
      console.log('📊 [STATS DEBUG] Raw data counts:');
      console.log('  - Job Postings:', jobPostings?.length || 0);
      console.log('  - Applications:', applications?.length || 0);
      console.log('  - Interviews:', interviews?.length || 0);
      console.log('  - Candidates:', candidates?.length || 0);
      
      if (applications?.length > 0) {
        console.log('📊 [STATS DEBUG] Sample application statuses:', applications.slice(0, 3).map(app => ({ id: app.id, status: app.status, createdAt: app.createdAt })));
      }
      
      if (interviews?.length > 0) {
        console.log('📊 [STATS DEBUG] Sample interview statuses:', interviews.slice(0, 3).map(int => ({ id: int.id, status: int.status, candidateId: int.candidateId })));
      }
      
      if (candidates?.length > 0) {
        console.log('📊 [STATS DEBUG] Sample candidate data:', candidates.slice(0, 3).map(candidate => ({ id: candidate.id, status: candidate.status, createdAt: candidate.createdAt })));
      }

      const openPositions = jobPostings.filter(job => 
        job.status === 'active' || job.status === 'published'
      ).length;

      // Use candidates as primary source if applications are empty
      const useApplications = applications.length > 0;
      console.log('📊 [STATS DEBUG] useApplications flag:', useApplications);
      console.log('📊 [STATS DEBUG] applications.length:', applications.length);
      console.log('📊 [STATS DEBUG] candidates.length:', candidates.length);
      
      // Fix: Ensure totalApplications always reflects the actual data count
      let totalApplications;
      if (applications.length > 0) {
        totalApplications = applications.length;
        console.log('📊 [STATS DEBUG] Using applications.length:', totalApplications);
      } else {
        totalApplications = candidates.length;
        console.log('📊 [STATS DEBUG] Using candidates.length:', totalApplications);
      }
      console.log('📊 [STATS DEBUG] Final totalApplications:', totalApplications);
      console.log('📊 [STATS DEBUG] Sample candidate data:', candidates.slice(0, 1).map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        workspaceId: c.workspaceId,
        createdAt: c.createdAt
      })));

      // Get candidate IDs with scheduled interviews
      const candidatesWithInterviews = new Set(interviews
        .filter(interview => interview.status === 'scheduled')
        .map(interview => interview.candidateId)
      );
      
      let inProgress, hired, rejected;
      
      if (useApplications) {
        inProgress = applications.filter(app => 
          ['under-review', 'interview-scheduled', 'interviewed'].includes(app.status) ||
          candidatesWithInterviews.has(app.id)
        ).length;
        
        hired = applications.filter(app => app.status === 'hired').length;
        rejected = applications.filter(app => app.status === 'rejected').length;
      } else {
        // Use candidates data with interview status
        inProgress = candidates.filter(candidate => 
          ['under-review', 'interview-scheduled', 'interviewed'].includes(candidate.status) ||
          candidatesWithInterviews.has(candidate.id)
        ).length;
        
        hired = candidates.filter(candidate => candidate.status === 'hired').length;
        rejected = candidates.filter(candidate => candidate.status === 'rejected').length;
      }

      // Calculate average time to hire (for hired candidates)
      let avgTimeToHire = 0;
      if (useApplications) {
        const hiredApplications = applications.filter(app => app.status === 'hired');
        avgTimeToHire = hiredApplications.length > 0 
          ? hiredApplications.reduce((sum, app) => {
              const daysDiff = Math.floor((app.updatedAt.getTime() - app.createdAt.getTime()) / (1000 * 60 * 60 * 24));
              return sum + daysDiff;
            }, 0) / hiredApplications.length
          : 0;
      } else {
        const hiredCandidates = candidates.filter(candidate => candidate.status === 'hired');
        avgTimeToHire = hiredCandidates.length > 0 
          ? hiredCandidates.reduce((sum, candidate) => {
              const daysDiff = Math.floor((candidate.updatedAt.getTime() - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24));
              return sum + daysDiff;
            }, 0) / hiredCandidates.length
          : 0;
      }

      // Applications by month (last 6 months) - use appropriate data source
      const applicationsByMonth = useApplications 
        ? this.getApplicationsByMonth(applications, 6)
        : this.getCandidatesByMonth(candidates, 6);

      // Top departments by open positions
      const departmentCounts = jobPostings
        .filter(job => job.status === 'active' || job.status === 'published')
        .reduce((acc, job) => {
          acc[job.department] = (acc[job.department] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topDepartments = Object.entries(departmentCounts)
        .map(([department, positions]) => ({ department, positions }))
        .sort((a, b) => b.positions - a.positions)
        .slice(0, 5);

      // Calculate new statistics for component compatibility
      const activeJobs = openPositions;
      
      // Applications this month
      const now = new Date();
      const thisMonth = now.toISOString().substr(0, 7); // YYYY-MM format
      let applicationsThisMonth;
      if (applications.length > 0) {
        applicationsThisMonth = applications.filter(app => {
          const appMonth = app.createdAt.toISOString().substr(0, 7);
          return appMonth === thisMonth;
        }).length;
        console.log('📊 [STATS DEBUG] Using applications for this month:', applicationsThisMonth);
      } else {
        applicationsThisMonth = candidates.filter(candidate => {
          const candidateMonth = candidate.createdAt.toISOString().substr(0, 7);
          return candidateMonth === thisMonth;
        }).length;
        console.log('📊 [STATS DEBUG] Using candidates for this month:', applicationsThisMonth);
      }

      // Interview statistics from actual interview data
      const interviewsScheduled = interviews.filter(interview => 
        interview.status === 'scheduled'
      ).length;
      
      const interviewsCompleted = interviews.filter(interview => 
        interview.status === 'completed'
      ).length;

      // Offers and hires
      const offersSent = useApplications
        ? applications.filter(app => ['offered', 'hired'].includes(app.status)).length
        : candidates.filter(candidate => ['offered', 'hired'].includes(candidate.status)).length;
      
      const hiresThisMonth = useApplications
        ? applications.filter(app => {
            if (app.status !== 'hired') return false;
            const hireMonth = app.updatedAt.toISOString().substr(0, 7);
            return hireMonth === thisMonth;
          }).length
        : candidates.filter(candidate => {
            if (candidate.status !== 'hired') return false;
            const hireMonth = candidate.updatedAt.toISOString().substr(0, 7);
            return hireMonth === thisMonth;
          }).length;

      const averageTimeToHire = Math.round(avgTimeToHire);

      // Calculate conversion rates with division by zero protection using actual interview data
      const totalInterviews = interviewsScheduled + interviewsCompleted;
      const applicationToInterviewRate = totalApplications > 0 
        ? Math.round((totalInterviews / totalApplications) * 100)
        : 0;
      
      // Use total interviews (scheduled + completed) for offer conversion rate
      const interviewToOfferRate = totalInterviews > 0 
        ? Math.round((offersSent / totalInterviews) * 100)
        : 0;
      
      const offerToHireRate = offersSent > 0 
        ? Math.round((hired / offersSent) * 100)
        : 0;

      const finalStats = {
        // Legacy properties
        openPositions,
        totalApplications,
        inProgress,
        hired,
        rejected,
        avgTimeToHire,
        applicationsByMonth,
        topDepartments,
        
        // New properties for component compatibility
        activeJobs,
        applicationsThisMonth,
        interviewsScheduled,
        interviewsCompleted,
        offersSent,
        hiresThisMonth,
        averageTimeToHire,
        applicationToInterviewRate,
        interviewToOfferRate,
        offerToHireRate
      };
      
      console.log('📊 [STATS DEBUG] Calculated statistics:');
      console.log('  - Open Positions:', openPositions);
      console.log('  - Total Applications:', totalApplications);
      console.log('  - Applications This Month:', applicationsThisMonth);
      console.log('  - Interviews Scheduled:', interviewsScheduled);
      console.log('  - Interviews Completed:', interviewsCompleted);
      console.log('  - Offers Sent:', offersSent);
      console.log('  - Hires This Month:', hiresThisMonth);
      console.log('  - Average Time to Hire:', averageTimeToHire);
      console.log('📊 [STATS DEBUG] Final stats object:', finalStats);
      console.log('📊 [STATS DEBUG] CRITICAL - About to return totalApplications:', finalStats.totalApplications);
      console.log('📊 [STATS DEBUG] CRITICAL - useApplications was:', useApplications);
      console.log('📊 [STATS DEBUG] CRITICAL - applications.length was:', applications.length);
      console.log('📊 [STATS DEBUG] CRITICAL - candidates.length was:', candidates.length);
      
      return finalStats;
    } catch (error) {
      console.error('Error calculating recruitment stats:', error);
      return {
        // Legacy properties
        openPositions: 0,
        totalApplications: 0,
        inProgress: 0,
        hired: 0,
        rejected: 0,
        avgTimeToHire: 0,
        applicationsByMonth: [],
        topDepartments: [],
        
        // New properties for component compatibility
        activeJobs: 0,
        applicationsThisMonth: 0,
        interviewsScheduled: 0,
        interviewsCompleted: 0,
        offersSent: 0,
        hiresThisMonth: 0,
        averageTimeToHire: 0,
        applicationToInterviewRate: 0,
        interviewToOfferRate: 0,
        offerToHireRate: 0
      };
    }
  }

  /**
   * Helper method to get applications by month
   */
  private static getApplicationsByMonth(applications: JobApplication[], months: number) {
    const now = new Date();
    const monthsData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substr(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const count = applications.filter(app => {
        const appMonth = app.createdAt.toISOString().substr(0, 7);
        return appMonth === monthKey;
      }).length;

      monthsData.push({ month: monthName, count });
    }

    return monthsData;
  }

  /**
   * Helper method to get candidates by month
   */
  private static getCandidatesByMonth(candidates: Candidate[], months: number) {
    const now = new Date();
    const monthsData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substr(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const count = candidates.filter(candidate => {
        const candidateMonth = candidate.createdAt.toISOString().substr(0, 7);
        return candidateMonth === monthKey;
      }).length;

      monthsData.push({ month: monthName, count });
    }

    return monthsData;
  }

  /**
   * Create a new job posting
   */
  static async createJobPosting(data: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'applications' | 'postedDate' | 'views'>): Promise<string> {
    try {
      const docData = {
        ...data,
        applications: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'jobPostings'), docData);

      // Log activity
      await ActivityService.logActivity(
        'system_event',
        'job_posting',
        docRef.id,
        { title: data.title, department: data.department },
        data.workspaceId,
        data.createdBy
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating job posting:', error);
      throw error;
    }
  }

  /**
   * Update a job posting
   */
  static async updateJobPosting(jobId: string, data: Partial<JobPosting>): Promise<void> {
    try {
      const docRef = doc(db, 'jobPostings', jobId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });

      // Log activity if status changed
      if (data.status) {
        await ActivityService.logActivity(
          'system_event',
          'job_posting',
          jobId,
          { status: data.status },
          data.workspaceId,
          data.updatedBy
        );
      }
    } catch (error) {
      console.error('Error updating job posting:', error);
      throw error;
    }
  }

  /**
   * Create a new job application
   */
  static async createJobApplication(data: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'lastActivity'>): Promise<string> {
    try {
      const docData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActivity: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'jobApplications'), docData);

      // Log activity
      await ActivityService.logActivity(
        'system_event',
        'job_application',
        docRef.id,
        { 
          jobTitle: data.jobTitle,
          candidate: `${data.candidateInfo.firstName} ${data.candidateInfo.lastName}`,
          status: data.status
        },
        data.workspaceId
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating job application:', error);
      throw error;
    }
  }

  /**
   * Update a job application
   */
  static async updateJobApplication(applicationId: string, data: Partial<JobApplication>): Promise<void> {
    try {
      const docRef = doc(db, 'jobApplications', applicationId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
        lastActivity: Timestamp.now()
      });

      // Log activity for status changes
      if (data.status) {
        await ActivityService.logActivity(
          'system_event',
          'job_application',
          applicationId,
          { status: data.status },
          data.workspaceId
        );
      }
    } catch (error) {
      console.error('Error updating job application:', error);
      throw error;
    }
  }

  // Placeholder methods for missing functionality
  // These should be implemented when the full recruitment module is developed

  static async getWorkspaceCandidates(workspaceId: string): Promise<Candidate[]> {
    try {
      console.log('📊 [CANDIDATES DEBUG] Fetching candidates for workspace:', workspaceId);
      const q = query(
        collection(db, 'candidates'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 [CANDIDATES DEBUG] Query snapshot size:', querySnapshot.size);
      const candidates: Candidate[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📊 [CANDIDATES DEBUG] Found candidate:', { id: doc.id, status: data.status, workspaceId: data.workspaceId });
                 candidates.push({
           id: doc.id,
           ...data,
           createdAt: data.createdAt?.toDate() || new Date(),
           updatedAt: data.updatedAt?.toDate() || new Date(),
           appliedDate: data.appliedDate?.toDate() || data.createdAt?.toDate() || new Date(),
           availabilityDate: data.availabilityDate?.toDate(),
           skills: data.skills || [],
           tags: data.tags || [],
           // Ensure both field names are available for compatibility
           jobId: data.jobId || data.jobPostingId,
           jobPostingId: data.jobPostingId || data.jobId,
         } as Candidate);
      });
      
      console.log('📊 [CANDIDATES DEBUG] Total candidates found:', candidates.length);
      return candidates;
    } catch (error) {
      console.error('Error fetching workspace candidates:', error);
      return [];
    }
  }

  static async getWorkspaceInterviews(workspaceId: string): Promise<Interview[]> {
    try {
      const q = query(
        collection(db, 'interviews'),
        where('workspaceId', '==', workspaceId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const interviews: Interview[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        interviews.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          duration: data.duration || 60,
          meetingLink: data.meetingLink || '',
        } as Interview);
      });
      
      return interviews;
    } catch (error) {
      console.error('Error fetching workspace interviews:', error);
      return [];
    }
  }

  static async getWorkspaceHiringPipelines(workspaceId: string): Promise<HiringPipeline[]> {
    // TODO: Implement hiring pipeline management with Firestore
    // For now, return empty array with proper typing
    console.log('getWorkspaceHiringPipelines not yet implemented for:', workspaceId);
    return [];
  }

  static async getJobPosting(jobId: string): Promise<JobPosting | null> {
    try {
      const docRef = doc(db, 'jobPostings', jobId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
        closedAt: data.closedAt?.toDate(),
        // Add compatibility aliases
        postedDate: data.publishedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        views: data.views || 0,
        // Map 'published' status to 'active' for component compatibility
        status: data.status === 'published' ? 'active' : data.status,
      } as JobPosting;
    } catch (error) {
      console.error('Error fetching job posting:', error);
      return null;
    }
  }

  static async deleteJobPosting(jobId: string): Promise<void> {
    // TODO: Implement job posting deletion
    console.log('deleteJobPosting not yet implemented for:', jobId);
  }

  static async getInterview(interviewId: string): Promise<Interview | null> {
    try {
      const docRef = doc(db, 'interviews', interviewId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        duration: data.duration || 60,
        meetingLink: data.meetingLink || '',
      } as Interview;
    } catch (error) {
      console.error('Error fetching interview:', error);
      return null;
    }
  }

  static async getCandidate(candidateId: string): Promise<Candidate | null> {
    try {
      const docRef = doc(db, 'candidates', candidateId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
             return {
         id: docSnap.id,
         ...data,
         createdAt: data.createdAt?.toDate() || new Date(),
         updatedAt: data.updatedAt?.toDate() || new Date(),
         appliedDate: data.appliedDate?.toDate() || data.createdAt?.toDate() || new Date(),
         availabilityDate: data.availabilityDate?.toDate(),
         skills: data.skills || [],
         tags: data.tags || [],
         // Ensure both field names are available for compatibility
         jobId: data.jobId || data.jobPostingId,
         jobPostingId: data.jobPostingId || data.jobId,
       } as Candidate;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }

  static async updateCandidate(candidateId: string, updates: Partial<Candidate>): Promise<void> {
    try {
      const docRef = doc(db, 'candidates', candidateId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;
      
      await updateDoc(docRef, updateData);
      
      // Log the activity
      await ActivityService.logActivity(
        'system_event',
        'candidate',
        candidateId,
        {
          action: 'updated',
          changes: Object.keys(updates),
        },
        updates.workspaceId || '',
        updates.createdBy || ''
      );
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  }

  static async deleteCandidate(candidateId: string, workspaceId?: string, userId?: string): Promise<void> {
    try {
      // Get the candidate data before deletion for logging
      const candidate = await this.getCandidate(candidateId);
      
      const docRef = doc(db, 'candidates', candidateId);
      await deleteDoc(docRef);
      
      // Log the activity
      if (candidate && workspaceId && userId) {
        await ActivityService.logActivity(
          'system_event',
          'candidate',
          candidateId,
          {
            action: 'deleted',
            name: candidate.name,
            email: candidate.email,
          },
          workspaceId,
          userId
        );
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  }

  static async createInterview(interviewData: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docData = {
        ...interviewData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: interviewData.status || 'scheduled',
        duration: interviewData.duration || 60,
        meetingLink: interviewData.meetingLink || '',
      };
      
      const docRef = await addDoc(collection(db, 'interviews'), docData);
      
      // Log the activity
      await ActivityService.logActivity(
        'system_event',
        'interview',
        docRef.id,
        {
          title: interviewData.title,
          interviewer: interviewData.interviewer,
          candidateId: interviewData.candidateId,
          jobPostingId: interviewData.jobPostingId,
        },
        interviewData.workspaceId,
        interviewData.createdBy
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  }

  static async sendInterviewInvitation(interviewId: string, data: any): Promise<void> {
    // TODO: Implement interview invitation
    console.log('sendInterviewInvitation not yet implemented for:', interviewId, data);
  }

  static async updateInterview(interviewId: string, updates: Partial<Interview>): Promise<void> {
    try {
      const docRef = doc(db, 'interviews', interviewId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;
      
      await updateDoc(docRef, updateData);
      
      // Log the activity
      await ActivityService.logActivity(
        'system_event',
        'interview',
        interviewId,
        {
          action: 'updated',
          changes: Object.keys(updates),
        },
        updates.workspaceId || '',
        updates.createdBy || ''
      );
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  }

  static async deleteInterview(interviewId: string, workspaceId?: string, userId?: string): Promise<void> {
    try {
      // Get the interview data before deletion for logging
      const interview = await this.getInterview(interviewId);
      
      const docRef = doc(db, 'interviews', interviewId);
      await deleteDoc(docRef);
      
      // Log the activity
      if (interview && workspaceId && userId) {
        await ActivityService.logActivity(
          'system_event',
          'interview',
          interviewId,
          {
            action: 'deleted',
            interviewer: interview.interviewer,
            candidateId: interview.candidateId,
            jobPostingId: interview.jobPostingId,
          },
          workspaceId,
          userId
        );
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      throw error;
    }
  }

  static async getPublicJobPostings(): Promise<JobPosting[]> {
    try {
      const q = query(
        collection(db, 'jobPostings'),
        where('status', 'in', ['active', 'published'])
      );
      
      const querySnapshot = await getDocs(q);
      const jobPostings: JobPosting[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        jobPostings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate(),
          closedAt: data.closedAt?.toDate(),
          // Add compatibility aliases
          postedDate: data.publishedAt?.toDate() || data.createdAt?.toDate() || new Date(),
          views: data.views || 0,
          applications: data.applications || 0,
          requirements: data.requirements || [],
          responsibilities: data.responsibilities || [],
          benefits: data.benefits || [],
        } as JobPosting);
      });
      
      // Sort manually by publishedAt (desc), then by createdAt (desc) for jobs without publishedAt
      jobPostings.sort((a, b) => {
        const aDate = a.publishedAt || a.createdAt;
        const bDate = b.publishedAt || b.createdAt;
        return bDate.getTime() - aDate.getTime();
      });
      
      return jobPostings;
    } catch (error) {
      console.error('Error fetching public job postings:', error);
      return [];
    }
  }

   static async createCandidate(candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
     try {
       const docData = {
         ...candidateData,
         createdAt: Timestamp.now(),
         updatedAt: Timestamp.now(),
         skills: candidateData.skills || [],
         tags: candidateData.tags || [],
         // Ensure both field names are available for compatibility
         jobId: candidateData.jobId || candidateData.jobPostingId,
         jobPostingId: candidateData.jobPostingId || candidateData.jobId,
       };
      
      const docRef = await addDoc(collection(db, 'candidates'), docData);
      
      // Log the activity
      await ActivityService.logActivity(
        'system_event',
        'candidate',
        docRef.id,
        {
          name: candidateData.name,
          email: candidateData.email,
          phone: candidateData.phone,
        },
        candidateData.workspaceId,
        candidateData.createdBy
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  static async incrementJobApplications(jobId: string): Promise<void> {
    // TODO: Implement job application counter increment
    console.log('incrementJobApplications not yet implemented for:', jobId);
  }

  static async incrementJobViews(jobId: string): Promise<void> {
    // TODO: Implement job view counter increment
    console.log('incrementJobViews not yet implemented for:', jobId);
  }
}