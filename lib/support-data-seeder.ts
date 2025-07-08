import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { SupportService, SupportTicket } from './support-service';

export class SupportDataSeeder {
  
  /**
   * Seed FAQs with sample data
   */
  static async seedFAQs(): Promise<void> {
    const faqs = [
      {
        question: "How do I create a new branch?",
        answer: "Navigate to Organization → Branches and click 'Create Branch'. Fill in the required information including branch name, location, and manager. The branch will be created and you can start adding departments and users.",
        category: "general" as const,
        tags: ["branch", "organization", "setup"],
        views: 156,
        helpful: 23,
        notHelpful: 2,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        question: "How do I invite users to my workspace?",
        answer: "Go to Users → Invitations to send invitation links. You can invite users by email and assign them specific roles (member, admin). The invited user will receive an email with a link to join your workspace.",
        category: "general" as const,
        tags: ["users", "invitations", "roles"],
        views: 234,
        helpful: 45,
        notHelpful: 1,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      },
      {
        question: "How do I manage user permissions?",
        answer: "Use Users → User Management to edit roles and permissions. You can promote users to admin, change their department assignments, or deactivate accounts. Only workspace owners can change admin roles.",
        category: "general" as const,
        tags: ["permissions", "roles", "admin"],
        views: 189,
        helpful: 34,
        notHelpful: 3,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12')
      },
      {
        question: "How do I generate reports?",
        answer: "Navigate to Reports → Create Report. Select the report type, date range, and departments you want to include. You can generate performance reports, activity summaries, and custom analytics.",
        category: "features" as const,
        tags: ["reports", "analytics", "performance"],
        views: 267,
        helpful: 56,
        notHelpful: 4,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08')
      },
      {
        question: "How do I set up automated workflows?",
        answer: "Go to Settings → Workflows to configure automated processes. You can set up approval workflows, notification rules, and task assignments. Workflows help streamline your team's processes.",
        category: "features" as const,
        tags: ["workflows", "automation", "settings"],
        views: 145,
        helpful: 28,
        notHelpful: 2,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page. Enter your email address and you'll receive a password reset link. Click the link in your email to create a new password.",
        category: "technical" as const,
        tags: ["password", "security", "login"],
        views: 89,
        helpful: 15,
        notHelpful: 1,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      },
      {
        question: "How do I export data?",
        answer: "Navigate to Reports → Export. Select the data type, date range, and format (CSV, PDF, Excel). You can export user data, activity logs, and performance metrics.",
        category: "features" as const,
        tags: ["export", "data", "reports"],
        views: 178,
        helpful: 32,
        notHelpful: 3,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
      },
      {
        question: "How do I configure email notifications?",
        answer: "Go to Settings → Notifications to configure your email preferences. You can choose which events trigger notifications and set your preferred notification frequency.",
        category: "technical" as const,
        tags: ["notifications", "email", "settings"],
        views: 123,
        helpful: 25,
        notHelpful: 2,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14')
      }
    ];

    try {
      for (const faq of faqs) {
        await addDoc(collection(db, 'faqs'), {
          ...faq,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log('FAQs seeded successfully');
    } catch (error) {
      console.error('Error seeding FAQs:', error);
    }
  }

  /**
   * Seed knowledge articles with sample data
   */
  static async seedKnowledgeArticles(): Promise<void> {
    const articles = [
      {
        title: "Getting Started with Workspace Management",
        content: "This comprehensive guide will walk you through setting up your workspace, creating departments, and managing your team effectively. Learn best practices for organization structure and user management.",
        category: "guides" as const,
        tags: ["workspace", "setup", "management"],
        author: "Support Team",
        views: 456,
        helpful: 89,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        featured: true
      },
      {
        title: "Advanced Reporting and Analytics",
        content: "Discover how to leverage our advanced reporting features to gain insights into your organization's performance. Learn about custom dashboards, data visualization, and export options.",
        category: "tutorials" as const,
        tags: ["reports", "analytics", "dashboard"],
        author: "Analytics Team",
        views: 234,
        helpful: 45,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        featured: true
      },
      {
        title: "Security Best Practices",
        content: "Learn about our security features and best practices for keeping your workspace secure. Topics include password policies, two-factor authentication, and data protection.",
        category: "best-practices" as const,
        tags: ["security", "authentication", "privacy"],
        author: "Security Team",
        views: 189,
        helpful: 34,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        featured: false
      },
      {
        title: "Troubleshooting Common Issues",
        content: "A comprehensive troubleshooting guide covering common problems users encounter. Learn how to resolve login issues, data sync problems, and performance concerns.",
        category: "troubleshooting" as const,
        tags: ["troubleshooting", "issues", "support"],
        author: "Support Team",
        views: 345,
        helpful: 67,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
        featured: false
      },
      {
        title: "Team Collaboration Features",
        content: "Explore the collaboration features that help teams work together more effectively. Learn about shared workspaces, real-time updates, and communication tools.",
        category: "guides" as const,
        tags: ["collaboration", "team", "communication"],
        author: "Product Team",
        views: 278,
        helpful: 52,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        featured: false
      }
    ];

    try {
      for (const article of articles) {
        await addDoc(collection(db, 'knowledge_articles'), {
          ...article,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log('Knowledge articles seeded successfully');
    } catch (error) {
      console.error('Error seeding knowledge articles:', error);
    }
  }

  /**
   * Seed sample support tickets
   */
  // REMOVE THIS DUPLICATE FUNCTION
  // static async seedSupportTickets(userId: string, workspaceId: string): Promise<void> {
  //   ...
  // }

  /**
   * Seed all support data
   */
  static async seedAllData(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.seedFAQs(),
        this.seedKnowledgeArticles(),
        this.seedSupportTickets(userId)
      ]);
      console.log('All support data seeded successfully');
    } catch (error) {
      console.error('Error seeding support data:', error);
    }
  }

  static async seedSupportTickets(userId: string) {
    // Get all accessible workspaces for the user
    const { allWorkspaces } = await SupportService.getAccessibleWorkspaces(userId);
    if (!allWorkspaces.length) return;

    const categories: SupportTicket['category'][] = [
      'technical',
      'billing',
      'feature-request',
      'bug-report',
      'general',
    ];
    const priorities: SupportTicket['priority'][] = [
      'low',
      'medium',
      'high',
      'urgent',
    ];

    const now = new Date();
    const tickets: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    let ticketCount = 0;
    for (const workspaceId of allWorkspaces) {
      for (let i = 0; i < categories.length; i++) {
        tickets.push({
          title: `Seeded Ticket ${ticketCount + 1} (${categories[i]})`,
          description: `This is a seeded support ticket for ${categories[i]}.`,
          category: categories[i],
          priority: priorities[i % priorities.length],
          status: 'open',
          userId,
          userEmail: `user${userId}@example.com`,
          userName: `Seed User ${userId}`,
          workspaceId,
          assignedTo: '',
          resolvedAt: undefined,
          attachments: [],
          tags: [],
          responseTime: Math.floor(Math.random() * 24),
          satisfaction: Math.floor(Math.random() * 5) + 1,
        });
        ticketCount++;
      }
    }

    // Create tickets in Firestore
    for (const ticket of tickets) {
      // Remove undefined fields (especially resolvedAt)
      const ticketData = { ...ticket };
      if (ticketData.resolvedAt === undefined) {
        delete ticketData.resolvedAt;
      }
      await SupportService.createTicket(ticketData);
    }
  }
} 