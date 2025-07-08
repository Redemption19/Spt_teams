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
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { ActivityService } from './activity-service';
import { WorkspaceService } from './workspace-service';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  userId: string;
  userEmail: string;
  userName: string;
  workspaceId: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  attachments?: string[];
  tags?: string[];
  responseTime?: number; // in hours
  satisfaction?: number; // 1-5 rating
  feedbackComment?: string; // member's rating comment
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'billing' | 'features' | 'troubleshooting';
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: 'guides' | 'tutorials' | 'best-practices' | 'troubleshooting';
  tags: string[];
  author: string;
  views: number;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  satisfactionScore: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{ action: string; timestamp: Date; details: string }>;
}

export interface UserRole {
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
}

export interface TicketFeedback {
  id: string;
  userId: string;
  userName: string;
  role: 'owner' | 'admin' | 'member';
  content: string;
  createdAt: Date;
}

export class SupportService {
  
  /**
   * Get user's accessible workspaces based on role
   */
  static async getAccessibleWorkspaces(userId: string): Promise<{
    ownedWorkspaces: string[];
    adminWorkspaces: string[];
    memberWorkspaces: string[];
    allWorkspaces: string[];
  }> {
    try {
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
      
      const ownedWorkspaces = userWorkspaces
        .filter(uw => uw.role === 'owner')
        .map(uw => uw.workspace.id);
      
      const adminWorkspaces = userWorkspaces
        .filter(uw => uw.role === 'admin')
        .map(uw => uw.workspace.id);
      
      const memberWorkspaces = userWorkspaces
        .filter(uw => uw.role === 'member')
        .map(uw => uw.workspace.id);
      
      const allWorkspaces = userWorkspaces.map(uw => uw.workspace.id);
      
      return {
        ownedWorkspaces,
        adminWorkspaces,
        memberWorkspaces,
        allWorkspaces
      };
    } catch (error) {
      console.error('Error getting accessible workspaces:', error);
      return {
        ownedWorkspaces: [],
        adminWorkspaces: [],
        memberWorkspaces: [],
        allWorkspaces: []
      };
    }
  }

  /**
   * Check if user has access to a specific workspace
   */
  static async hasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const { allWorkspaces } = await this.getAccessibleWorkspaces(userId);
      return allWorkspaces.includes(workspaceId);
    } catch (error) {
      console.error('Error checking workspace access:', error);
      return false;
    }
  }

  /**
   * Get user's role in a specific workspace
   */
  static async getUserWorkspaceRole(userId: string, workspaceId: string): Promise<'owner' | 'admin' | 'member' | null> {
    try {
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(userId);
      const userWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
      const role = userWorkspace?.role;
      return (role === 'owner' || role === 'admin' || role === 'member') ? role : null;
    } catch (error) {
      console.error('Error getting user workspace role:', error);
      return null;
    }
  }

  /**
   * Create a new support ticket
   */
  static async createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Remove all undefined fields
      const cleanData = Object.fromEntries(
        Object.entries(ticketData).filter(([_, v]) => v !== undefined)
      );

      // Verify user has access to the workspace
      const hasAccess = await this.hasWorkspaceAccess(ticketData.userId, ticketData.workspaceId);
      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to create tickets in this workspace');
      }

      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'support_ticket_created',
        'support_ticket',
        ticketRef.id,
        {
          title: ticketData.title,
          category: ticketData.category,
          priority: ticketData.priority,
          workspaceId: ticketData.workspaceId
        },
        ticketData.workspaceId,
        ticketData.userId
      );

      return ticketRef.id;
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      throw new Error(error.message || 'Failed to create support ticket');
    }
  }

  /**
   * Get support tickets based on user role and permissions
   */
  static async getUserTickets(userId: string, workspaceId: string): Promise<SupportTicket[]> {
    try {
      const userRole = await this.getUserWorkspaceRole(userId, workspaceId);
      if (!userRole) {
        return [];
      }

      let q;
      
      if (userRole === 'owner') {
        // Owners can see all tickets in their owned workspaces
        const { ownedWorkspaces } = await this.getAccessibleWorkspaces(userId);
        if (ownedWorkspaces.includes(workspaceId)) {
          q = query(
            collection(db, 'support_tickets'),
            where('workspaceId', '==', workspaceId),
            orderBy('createdAt', 'desc')
          );
        } else {
          return [];
        }
      } else if (userRole === 'admin') {
        // Admins can see all tickets in their admin workspaces
        const { adminWorkspaces } = await this.getAccessibleWorkspaces(userId);
        if (adminWorkspaces.includes(workspaceId)) {
          q = query(
            collection(db, 'support_tickets'),
            where('workspaceId', '==', workspaceId),
            orderBy('createdAt', 'desc')
          );
        } else {
          return [];
        }
      } else {
        // Members can only see their own tickets
        q = query(
          collection(db, 'support_tickets'),
          where('userId', '==', userId),
          where('workspaceId', '==', workspaceId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
      })) as SupportTicket[];
    } catch (error: any) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  /**
   * Get all tickets for admin/owner view with role-based filtering
   */
  static async getAllTickets(userId: string, workspaceId: string): Promise<SupportTicket[]> {
    try {
      const userRole = await this.getUserWorkspaceRole(userId, workspaceId);
      if (!userRole || userRole === 'member') {
        return [];
      }

      // Only owners and admins can see all tickets
      const q = query(
        collection(db, 'support_tickets'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
      })) as SupportTicket[];
    } catch (error: any) {
      console.error('Error fetching all tickets:', error);
      return [];
    }
  }

  /**
   * Update ticket status with role-based permissions
   */
  static async updateTicketStatus(
    ticketId: string, 
    status: SupportTicket['status'], 
    userId: string,
    assignedTo?: string
  ): Promise<void> {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }

      const ticketData = ticketDoc.data() as SupportTicket;
      const userRole = await this.getUserWorkspaceRole(userId, ticketData.workspaceId);
      
      // Check permissions
      if (!userRole || userRole === 'member') {
        throw new Error('Access denied: Only admins and owners can update ticket status');
      }

      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      }

      await updateDoc(ticketRef, updateData);

      // Log activity
      await ActivityService.logActivity(
        'support_ticket_updated',
        'support_ticket',
        ticketId,
        {
          status,
          assignedTo,
          workspaceId: ticketData.workspaceId
        },
        ticketData.workspaceId,
        userId
      );
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      throw new Error(error.message || 'Failed to update ticket status');
    }
  }

  /**
   * Get FAQs (same for all users)
   */
  static async getFAQs(category?: string): Promise<FAQ[]> {
    try {
      let q = query(
        collection(db, 'faqs'),
        orderBy('views', 'desc')
      );

      if (category) {
        q = query(
          collection(db, 'faqs'),
          where('category', '==', category),
          orderBy('views', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as FAQ[];
    } catch (error: any) {
      console.error('Error fetching FAQs:', error);
      return [];
    }
  }

  /**
   * Get knowledge articles (same for all users)
   */
  static async getKnowledgeArticles(category?: string, featured?: boolean): Promise<KnowledgeArticle[]> {
    try {
      let q = query(
        collection(db, 'knowledge_articles'),
        orderBy('views', 'desc')
      );

      if (category) {
        q = query(
          collection(db, 'knowledge_articles'),
          where('category', '==', category),
          orderBy('views', 'desc')
        );
      }

      if (featured) {
        q = query(
          collection(db, 'knowledge_articles'),
          where('featured', '==', true),
          orderBy('views', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as KnowledgeArticle[];
    } catch (error: any) {
      console.error('Error fetching knowledge articles:', error);
      return [];
    }
  }

  /**
   * Increment article views
   */
  static async incrementArticleViews(articleId: string): Promise<void> {
    try {
      const articleRef = doc(db, 'knowledge_articles', articleId);
      await updateDoc(articleRef, {
        views: (await getDoc(articleRef)).data()?.views + 1 || 1
      });
    } catch (error: any) {
      console.error('Error incrementing article views:', error);
    }
  }

  /**
   * Get support statistics with role-based filtering
   */
  static async getSupportStats(userId: string, workspaceId: string): Promise<SupportStats> {
    try {
      const userRole = await this.getUserWorkspaceRole(userId, workspaceId);
      if (!userRole) {
        return this.getEmptyStats();
      }

      let tickets: SupportTicket[];
      
      if (userRole === 'owner' || userRole === 'admin') {
        // Owners and admins see all tickets in their workspaces
        tickets = await this.getAllTickets(userId, workspaceId);
      } else {
        // Members only see their own tickets
        tickets = await this.getUserTickets(userId, workspaceId);
      }
      
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      
      // Calculate average response time
      const ticketsWithResponseTime = tickets.filter(t => t.responseTime);
      const averageResponseTime = ticketsWithResponseTime.length > 0 
        ? ticketsWithResponseTime.reduce((sum, t) => sum + (t.responseTime || 0), 0) / ticketsWithResponseTime.length
        : 0;

      // Calculate satisfaction score
      const ticketsWithSatisfaction = tickets.filter(t => t.satisfaction);
      const satisfactionScore = ticketsWithSatisfaction.length > 0
        ? ticketsWithSatisfaction.reduce((sum, t) => sum + (t.satisfaction || 0), 0) / ticketsWithSatisfaction.length
        : 0;

      // Get top categories
      const categoryCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent activity (last 10 tickets)
      const recentActivity = tickets.slice(0, 10).map(ticket => ({
        action: `Ticket ${ticket.status}`,
        timestamp: ticket.updatedAt,
        details: ticket.title
      }));

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        averageResponseTime,
        satisfactionScore,
        topCategories,
        recentActivity
      };
    } catch (error: any) {
      console.error('Error fetching support stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get empty stats for error cases
   */
  private static getEmptyStats(): SupportStats {
    return {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      averageResponseTime: 0,
      satisfactionScore: 0,
      topCategories: [],
      recentActivity: []
    };
  }

  /**
   * Search FAQs and knowledge articles
   */
  static async searchSupport(query: string): Promise<{
    faqs: FAQ[];
    articles: KnowledgeArticle[];
  }> {
    try {
      // This is a simple search - in production you'd use a proper search service
      const [faqs, articles] = await Promise.all([
        this.getFAQs(),
        this.getKnowledgeArticles()
      ]);

      const searchTerm = query.toLowerCase();
      
      const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm) ||
        faq.answer.toLowerCase().includes(searchTerm) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );

      const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );

      return {
        faqs: filteredFaqs,
        articles: filteredArticles
      };
    } catch (error: any) {
      console.error('Error searching support:', error);
      return { faqs: [], articles: [] };
    }
  }

  /**
   * Rate FAQ helpfulness
   */
  static async rateFAQ(faqId: string, helpful: boolean): Promise<void> {
    try {
      const faqRef = doc(db, 'faqs', faqId);
      const updateData = helpful 
        ? { helpful: (await getDoc(faqRef)).data()?.helpful + 1 || 1 }
        : { notHelpful: (await getDoc(faqRef)).data()?.notHelpful + 1 || 1 };
      
      await updateDoc(faqRef, updateData);
    } catch (error: any) {
      console.error('Error rating FAQ:', error);
    }
  }

  /**
   * Rate knowledge article helpfulness
   */
  static async rateArticle(articleId: string, helpful: boolean): Promise<void> {
    try {
      const articleRef = doc(db, 'knowledge_articles', articleId);
      const updateData = helpful 
        ? { helpful: (await getDoc(articleRef)).data()?.helpful + 1 || 1 }
        : { notHelpful: (await getDoc(articleRef)).data()?.notHelpful + 1 || 1 };
      
      await updateDoc(articleRef, updateData);
    } catch (error: any) {
      console.error('Error rating article:', error);
    }
  }

  /**
   * Get cross-workspace stats for owners
   */
  static async getCrossWorkspaceStats(userId: string): Promise<{
    totalWorkspaces: number;
    totalTickets: number;
    averageResponseTime: number;
    topIssues: Array<{ category: string; count: number }>;
  }> {
    try {
      // Use all accessible workspaces (main + sub)
      const { allWorkspaces } = await this.getAccessibleWorkspaces(userId);
      
      if (allWorkspaces.length === 0) {
        return {
          totalWorkspaces: 0,
          totalTickets: 0,
          averageResponseTime: 0,
          topIssues: []
        };
      }

      // Get all tickets from all accessible workspaces (main + sub)
      const allTickets: SupportTicket[] = [];
      for (const workspaceId of allWorkspaces) {
        const tickets = await this.getAllTickets(userId, workspaceId);
        allTickets.push(...tickets);
      }

      const totalTickets = allTickets.length;
      
      // Calculate average response time across all workspaces
      const ticketsWithResponseTime = allTickets.filter(t => t.responseTime);
      const averageResponseTime = ticketsWithResponseTime.length > 0 
        ? ticketsWithResponseTime.reduce((sum, t) => sum + (t.responseTime || 0), 0) / ticketsWithResponseTime.length
        : 0;

      // Get top issues across all workspaces
      const categoryCounts = allTickets.reduce((acc, ticket) => {
        if (ticket.category) {
          acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topIssues = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalWorkspaces: allWorkspaces.length,
        totalTickets,
        averageResponseTime,
        topIssues: topIssues.length > 0 ? topIssues : [{ category: 'N/A', count: 0 }]
      };
    } catch (error: any) {
      console.error('Error fetching cross-workspace stats:', error);
      return {
        totalWorkspaces: 0,
        totalTickets: 0,
        averageResponseTime: 0,
        topIssues: [{ category: 'N/A', count: 0 }]
      };
    }
  }

  /**
   * Edit a support ticket (with permission check)
   */
  static async editTicket(ticketId: string, updates: Partial<SupportTicket>, userId: string): Promise<void> {
    const ticketRef = doc(db, 'support_tickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    if (!ticketDoc.exists()) throw new Error('Ticket not found');
    const ticket = ticketDoc.data() as SupportTicket;
    const userRole = await this.getUserWorkspaceRole(userId, ticket.workspaceId);
    // Members can only edit their own tickets
    if (userRole === 'member' && ticket.userId !== userId) throw new Error('Permission denied');
    // Admins/owners can edit any ticket
    await updateDoc(ticketRef, Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined)));
  }

  /**
   * Delete a support ticket (with permission check)
   */
  static async deleteTicket(ticketId: string, userId: string): Promise<void> {
    const ticketRef = doc(db, 'support_tickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    if (!ticketDoc.exists()) throw new Error('Ticket not found');
    const ticket = ticketDoc.data() as SupportTicket;
    const userRole = await this.getUserWorkspaceRole(userId, ticket.workspaceId);
    // Members can only delete their own tickets
    if (userRole === 'member' && ticket.userId !== userId) throw new Error('Permission denied');
    // Admins/owners can delete any ticket
    await deleteDoc(ticketRef);
  }

  /**
   * Add feedback (threaded comment) to a ticket
   */
  static async addTicketFeedback(ticketId: string, feedback: Omit<TicketFeedback, 'id' | 'createdAt'>): Promise<string> {
    const feedbackRef = await addDoc(collection(db, 'support_tickets', ticketId, 'feedback'), {
      ...feedback,
      createdAt: serverTimestamp(),
    });
    return feedbackRef.id;
  }

  /**
   * Get all feedback (threaded comments) for a ticket
   */
  static async getTicketFeedback(ticketId: string): Promise<TicketFeedback[]> {
    const feedbackCol = collection(db, 'support_tickets', ticketId, 'feedback');
    const q = query(feedbackCol, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as TicketFeedback[];
  }
} 