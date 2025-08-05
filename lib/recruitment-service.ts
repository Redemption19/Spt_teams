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
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface JobPosting {
  id: string;
  workspaceId: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote' | 'hybrid';
  salaryRange: { min: number; max: number; currency: string };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  postedDate: Date;
  expiryDate?: Date;
  applications: number;
  views: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id: string;
  workspaceId: string;
  jobPostingId: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  education: string;
  location: string;
  resumeUrl?: string;
  resumeFileName?: string;
  coverLetter?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  appliedDate: Date;
  score?: number;
  notes: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interview {
  id: string;
  workspaceId: string;
  candidateId: string;
  jobPostingId: string;
  type: 'phone' | 'video' | 'in-person' | 'technical' | 'panel';
  date: Date;
  time: string;
  duration: number; // in minutes
  interviewer: string;
  interviewers?: string[];
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  feedback?: string;
  rating?: number; // 1-5 scale
  technicalScore?: number;
  culturalScore?: number;
  overallScore?: number;
  nextSteps?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HiringPipeline {
  id: string;
  workspaceId: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string;
}

export interface RecruitmentStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  applicationsThisMonth: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  offersSent: number;
  hiresThisMonth: number;
  averageTimeToHire: number; // in days
  applicationToInterviewRate: number; // percentage
  interviewToOfferRate: number; // percentage
  offerToHireRate: number; // percentage
}

export class RecruitmentService {
  // Job Postings
  static async createJobPosting(data: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'jobPostings'), {
        ...data,
        postedDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating job posting:', error);
      throw error;
    }
  }

  static async updateJobPosting(jobId: string, data: Partial<JobPosting>): Promise<void> {
    try {
      const docRef = doc(db, 'jobPostings', jobId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating job posting:', error);
      throw error;
    }
  }

  static async deleteJobPosting(jobId: string): Promise<void> {
    try {
      const docRef = doc(db, 'jobPostings', jobId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting job posting:', error);
      throw error;
    }
  }

  static async getJobPosting(jobId: string): Promise<JobPosting | null> {
    try {
      const docRef = doc(db, 'jobPostings', jobId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          postedDate: data.postedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          expiryDate: data.expiryDate?.toDate()
        } as JobPosting;
      }
      return null;
    } catch (error) {
      console.error('Error getting job posting:', error);
      throw error;
    }
  }

  static async getWorkspaceJobPostings(workspaceId: string, filters?: {
    status?: JobPosting['status'];
    department?: string;
    type?: JobPosting['type'];
  }): Promise<JobPosting[]> {
    try {
      let q = query(
        collection(db, 'jobPostings'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }

      const querySnapshot = await getDocs(q);
      const jobPostings: JobPosting[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobPostings.push({
          id: doc.id,
          ...data,
          postedDate: data.postedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          expiryDate: data.expiryDate?.toDate()
        } as JobPosting);
      });

      return jobPostings;
    } catch (error) {
      console.error('Error getting workspace job postings:', error);
      throw error;
    }
  }

  // Candidates
  static async createCandidate(data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'candidates'), {
        ...data,
        appliedDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update job posting application count
      const jobRef = doc(db, 'jobPostings', data.jobPostingId);
      await updateDoc(jobRef, {
        applications: increment(1)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  static async updateCandidate(candidateId: string, data: Partial<Candidate>): Promise<void> {
    try {
      const docRef = doc(db, 'candidates', candidateId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  }

  static async deleteCandidate(candidateId: string): Promise<void> {
    try {
      const docRef = doc(db, 'candidates', candidateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  }

  static async getCandidate(candidateId: string): Promise<Candidate | null> {
    try {
      const docRef = doc(db, 'candidates', candidateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          appliedDate: data.appliedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Candidate;
      }
      return null;
    } catch (error) {
      console.error('Error getting candidate:', error);
      throw error;
    }
  }

  static async getWorkspaceCandidates(workspaceId: string, filters?: {
    status?: Candidate['status'];
    jobPostingId?: string;
  }): Promise<Candidate[]> {
    try {
      let q = query(
        collection(db, 'candidates'),
        where('workspaceId', '==', workspaceId),
        orderBy('appliedDate', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.jobPostingId) {
        q = query(q, where('jobPostingId', '==', filters.jobPostingId));
      }

      const querySnapshot = await getDocs(q);
      const candidates: Candidate[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        candidates.push({
          id: doc.id,
          ...data,
          appliedDate: data.appliedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Candidate);
      });

      return candidates;
    } catch (error) {
      console.error('Error getting workspace candidates:', error);
      throw error;
    }
  }

  // Interviews
  static async createInterview(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'interviews'), {
        ...data,
        date: Timestamp.fromDate(data.date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  }

  static async updateInterview(interviewId: string, data: Partial<Interview>): Promise<void> {
    try {
      const docRef = doc(db, 'interviews', interviewId);
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      // Convert date to Timestamp if it exists
      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  }

  static async deleteInterview(interviewId: string): Promise<void> {
    try {
      const docRef = doc(db, 'interviews', interviewId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting interview:', error);
      throw error;
    }
  }

  static async getInterview(interviewId: string): Promise<Interview | null> {
    try {
      const docRef = doc(db, 'interviews', interviewId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Interview;
      }
      return null;
    } catch (error) {
      console.error('Error getting interview:', error);
      throw error;
    }
  }

  static async getWorkspaceInterviews(workspaceId: string, filters?: {
    status?: Interview['status'];
    candidateId?: string;
    jobPostingId?: string;
  }): Promise<Interview[]> {
    try {
      let q = query(
        collection(db, 'interviews'),
        where('workspaceId', '==', workspaceId),
        orderBy('date', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.candidateId) {
        q = query(q, where('candidateId', '==', filters.candidateId));
      }
      if (filters?.jobPostingId) {
        q = query(q, where('jobPostingId', '==', filters.jobPostingId));
      }

      const querySnapshot = await getDocs(q);
      const interviews: Interview[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        interviews.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Interview);
      });

      return interviews;
    } catch (error) {
      console.error('Error getting workspace interviews:', error);
      throw error;
    }
  }

  // Hiring Pipeline
  static async createHiringPipeline(data: Omit<HiringPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'hiringPipelines'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating hiring pipeline:', error);
      throw error;
    }
  }

  static async getWorkspaceHiringPipelines(workspaceId: string): Promise<HiringPipeline[]> {
    try {
      const q = query(
        collection(db, 'hiringPipelines'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const pipelines: HiringPipeline[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pipelines.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as HiringPipeline);
      });

      return pipelines;
    } catch (error) {
      console.error('Error getting workspace hiring pipelines:', error);
      throw error;
    }
  }

  // Statistics
  static async getRecruitmentStats(workspaceId: string): Promise<RecruitmentStats> {
    try {
      const [jobPostings, candidates, interviews] = await Promise.all([
        this.getWorkspaceJobPostings(workspaceId),
        this.getWorkspaceCandidates(workspaceId),
        this.getWorkspaceInterviews(workspaceId)
      ]);

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeJobs = jobPostings.filter(job => job.status === 'active').length;
      const applicationsThisMonth = candidates.filter(c => c.appliedDate >= thisMonth).length;
      const interviewsScheduled = interviews.filter(i => i.status === 'scheduled').length;
      const interviewsCompleted = interviews.filter(i => i.status === 'completed').length;
      const offersSent = candidates.filter(c => c.status === 'offer').length;
      const hiresThisMonth = candidates.filter(c => 
        c.status === 'hired' && c.updatedAt >= thisMonth
      ).length;

      // Calculate rates
      const totalApplications = candidates.length;
      const totalInterviews = interviews.filter(i => i.status === 'completed').length;
      const totalOffers = candidates.filter(c => c.status === 'offer').length;
      const totalHires = candidates.filter(c => c.status === 'hired').length;

      const applicationToInterviewRate = totalApplications > 0 ? (totalInterviews / totalApplications) * 100 : 0;
      const interviewToOfferRate = totalInterviews > 0 ? (totalOffers / totalInterviews) * 100 : 0;
      const offerToHireRate = totalOffers > 0 ? (totalHires / totalOffers) * 100 : 0;

      // Calculate average time to hire (simplified)
      const hiredCandidates = candidates.filter(c => c.status === 'hired');
      const totalTimeToHire = hiredCandidates.reduce((sum, candidate) => {
        const timeDiff = candidate.updatedAt.getTime() - candidate.appliedDate.getTime();
        return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
      }, 0);
      const averageTimeToHire = hiredCandidates.length > 0 ? totalTimeToHire / hiredCandidates.length : 0;

      return {
        totalJobs: jobPostings.length,
        activeJobs,
        totalApplications,
        applicationsThisMonth,
        interviewsScheduled,
        interviewsCompleted,
        offersSent,
        hiresThisMonth,
        averageTimeToHire: Math.round(averageTimeToHire),
        applicationToInterviewRate: Math.round(applicationToInterviewRate),
        interviewToOfferRate: Math.round(interviewToOfferRate),
        offerToHireRate: Math.round(offerToHireRate)
      };
    } catch (error) {
      console.error('Error getting recruitment stats:', error);
      throw error;
    }
  }

  // Utility functions
  static async incrementJobViews(jobId: string): Promise<void> {
    try {
      const docRef = doc(db, 'jobPostings', jobId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing job views:', error);
      throw error;
    }
  }

  static async bulkUpdateCandidateStatus(candidateIds: string[], newStatus: Candidate['status']): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      candidateIds.forEach(candidateId => {
        const docRef = doc(db, 'candidates', candidateId);
        batch.update(docRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating candidate status:', error);
      throw error;
    }
  }

  static async getPublicJobPostings(): Promise<JobPosting[]> {
    try {
      const q = query(
        collection(db, 'jobPostings'),
        where('status', '==', 'active'),
        orderBy('postedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const jobPostings: JobPosting[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobPostings.push({
          id: doc.id,
          ...data,
          postedDate: data.postedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as JobPosting);
      });
      
      return jobPostings;
    } catch (error) {
      console.error('Error getting public job postings:', error);
      throw error;
    }
  }

  static async incrementJobApplications(jobId: string): Promise<void> {
    try {
      const jobRef = doc(db, 'jobPostings', jobId);
      await updateDoc(jobRef, {
        applications: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing job applications:', error);
      throw error;
    }
  }

  // Interview invitation functions
  static generateInterviewLink(interviewId: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/interview/${interviewId}`;
  }

  static async updateInterviewWithMeetingLink(interviewId: string): Promise<string> {
    try {
      const meetingLink = this.generateInterviewLink(interviewId);
      
      await updateDoc(doc(db, 'interviews', interviewId), {
        meetingLink,
        updatedAt: serverTimestamp()
      });

      return meetingLink;
    } catch (error) {
      console.error('Error updating interview with meeting link:', error);
      throw error;
    }
  }

  static async sendInterviewInvitation(
    interviewId: string, 
    candidateEmail: string, 
    candidateName: string,
    jobTitle: string,
    interviewDate: Date,
    interviewTime: string,
    interviewer: string
  ): Promise<void> {
    try {
      // Generate meeting link
      const meetingLink = await this.updateInterviewWithMeetingLink(interviewId);
      
      // Format the interview date
      const dateStr = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Here you would integrate with your email service
      // For now, we'll just log the invitation details
      console.log('Interview invitation details:', {
        to: candidateEmail,
        candidate: candidateName,
        jobTitle,
        date: dateStr,
        time: interviewTime,
        interviewer,
        meetingLink
      });

      // In a real implementation, you would send an email using EmailJS or another service:
      /*
      await EmailService.sendInterviewInvitation({
        to_email: candidateEmail,
        to_name: candidateName,
        job_title: jobTitle,
        interview_date: dateStr,
        interview_time: interviewTime,
        interviewer_name: interviewer,
        meeting_link: meetingLink,
        company_name: 'Standard Pensions Trust',
        support_email: 'support@standardpensionstrust.com'
      });
      */

    } catch (error) {
      console.error('Error sending interview invitation:', error);
      throw error;
    }
  }
} 