/**
 * Static Knowledge Base Configuration
 * Contains predefined information about the application features and workflows
 */

export interface StaticKnowledge {
  features: Record<string, FeatureInfo>;
  workflows: Record<string, WorkflowInfo>;
  troubleshooting: Record<string, TroubleshootingInfo>;
  bestPractices: Record<string, BestPracticeInfo>;
}

export interface FeatureInfo {
  name: string;
  description: string;
  howToUse: string[];
  relatedFeatures: string[];
  userRoles: string[];
}

export interface WorkflowInfo {
  name: string;
  description: string;
  steps: string[];
  requirements: string[];
  tips: string[];
}

export interface TroubleshootingInfo {
  issue: string;
  symptoms: string[];
  solutions: string[];
  prevention: string[];
}

export interface BestPracticeInfo {
  category: string;
  title: string;
  description: string;
  recommendations: string[];
  benefits: string[];
}

export class StaticKnowledgeService {
  private static knowledge: StaticKnowledge = {
    features: {
      tasks: {
        name: "Task Management",
        description: "Create, assign, and track tasks within your workspace",
        howToUse: [
          "Navigate to the Tasks section from the dashboard",
          "Click 'Create Task' to add a new task",
          "Fill in task details: title, description, due date, priority",
          "Assign the task to team members",
          "Track progress and update status as needed"
        ],
        relatedFeatures: ["teams", "reports", "calendar"],
        userRoles: ["owner", "admin", "member"]
      },
      teams: {
        name: "Team Management", 
        description: "Organize users into teams for better collaboration",
        howToUse: [
          "Go to Teams section in the dashboard",
          "Create new teams with descriptive names",
          "Add team members with appropriate roles",
          "Set team leads and permissions",
          "Monitor team activity and performance"
        ],
        relatedFeatures: ["tasks", "users", "departments"],
        userRoles: ["owner", "admin"]
      },
      reports: {
        name: "Reporting System",
        description: "Generate, submit, and manage various types of reports",
        howToUse: [
          "Access Reports from the main navigation",
          "Choose report type or create custom report",
          "Fill in required information and data",
          "Submit for review if required",
          "Track approval status and feedback"
        ],
        relatedFeatures: ["tasks", "analytics", "approval"],
        userRoles: ["owner", "admin", "member"]
      },
      calendar: {
        name: "Calendar & Scheduling",
        description: "Schedule events, meetings, and track deadlines",
        howToUse: [
          "Open Calendar from the dashboard",
          "Click on dates to create new events",
          "Set event details, attendees, and reminders",
          "View tasks with due dates automatically",
          "Sync with external calendar systems"
        ],
        relatedFeatures: ["tasks", "teams", "notifications"],
        userRoles: ["owner", "admin", "member"]
      }
    },
    workflows: {
      taskCreation: {
        name: "Creating and Managing Tasks",
        description: "Complete workflow for task lifecycle management",
        steps: [
          "Navigate to Tasks section",
          "Click 'Create New Task' button",
          "Enter task title and description",
          "Set priority level (Low, Medium, High)",
          "Assign due date if applicable",
          "Select assignee from team members",
          "Add any relevant tags or categories",
          "Save and notify assignee"
        ],
        requirements: ["Active workspace membership", "Task creation permissions"],
        tips: [
          "Use clear, actionable task titles",
          "Set realistic due dates",
          "Include detailed descriptions for complex tasks",
          "Use priority levels consistently across your team"
        ]
      },
      reportSubmission: {
        name: "Report Submission Process",
        description: "Step-by-step guide for submitting reports",
        steps: [
          "Access Reports section",
          "Select appropriate report template",
          "Fill in all required fields",
          "Attach supporting documents if needed",
          "Review information for accuracy",
          "Submit for approval",
          "Monitor status in Reports dashboard"
        ],
        requirements: ["Report submission permissions", "Required data available"],
        tips: [
          "Save drafts frequently",
          "Follow company formatting guidelines",
          "Submit reports before deadlines",
          "Include all necessary supporting evidence"
        ]
      }
    },
    troubleshooting: {
      cannotCreateTask: {
        issue: "Unable to create new tasks",
        symptoms: ["Create button is disabled", "Form doesn't submit", "Permission error"],
        solutions: [
          "Check your user role and permissions",
          "Ensure you're in the correct workspace",
          "Refresh the page and try again",
          "Contact your workspace admin",
          "Clear browser cache and cookies"
        ],
        prevention: [
          "Maintain active workspace membership",
          "Keep browser updated",
          "Report permission issues promptly"
        ]
      },
      reportNotSubmitting: {
        issue: "Reports fail to submit",
        symptoms: ["Submit button unresponsive", "Error messages", "Data loss"],
        solutions: [
          "Check all required fields are filled",
          "Verify file attachments are proper format",
          "Save as draft and try submitting later",
          "Check internet connection",
          "Contact support with error details"
        ],
        prevention: [
          "Save work frequently",
          "Use supported file formats",
          "Test with smaller reports first"
        ]
      }
    },
    bestPractices: {
      taskManagement: {
        category: "Task Management",
        title: "Effective Task Organization",
        description: "Best practices for organizing and managing tasks efficiently",
        recommendations: [
          "Use consistent naming conventions for tasks",
          "Set realistic deadlines and buffer time",
          "Break large tasks into smaller subtasks",
          "Use priority levels to focus on important work",
          "Review and update task status regularly",
          "Communicate progress with team members"
        ],
        benefits: [
          "Improved productivity and time management",
          "Better team coordination",
          "Clearer project visibility",
          "Reduced missed deadlines"
        ]
      },
      teamCollaboration: {
        category: "Team Management",
        title: "Building Effective Teams",
        description: "Guidelines for successful team collaboration",
        recommendations: [
          "Define clear roles and responsibilities",
          "Establish regular communication channels",
          "Set team goals and objectives",
          "Foster open and honest feedback",
          "Recognize team achievements",
          "Provide necessary resources and tools"
        ],
        benefits: [
          "Enhanced team productivity",
          "Better problem-solving capabilities",
          "Improved job satisfaction",
          "Stronger team cohesion"
        ]
      }
    }
  };

  /**
   * Get feature information by name
   */
  static getFeatureInfo(featureName: string): FeatureInfo | null {
    return this.knowledge.features[featureName.toLowerCase()] || null;
  }

  /**
   * Get workflow information by name
   */
  static getWorkflowInfo(workflowName: string): WorkflowInfo | null {
    return this.knowledge.workflows[workflowName.toLowerCase()] || null;
  }

  /**
   * Get troubleshooting information
   */
  static getTroubleshootingInfo(issue: string): TroubleshootingInfo | null {
    const key = Object.keys(this.knowledge.troubleshooting).find(k => 
      k.toLowerCase().includes(issue.toLowerCase()) ||
      this.knowledge.troubleshooting[k].issue.toLowerCase().includes(issue.toLowerCase())
    );
    return key ? this.knowledge.troubleshooting[key] : null;
  }

  /**
   * Get best practices by category
   */
  static getBestPractices(category?: string): BestPracticeInfo[] {
    const practices = Object.values(this.knowledge.bestPractices);
    if (category) {
      return practices.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    return practices;
  }

  /**
   * Search knowledge base for relevant information
   */
  static searchKnowledge(query: string): string {
    const lowerQuery = query.toLowerCase();
    let results: string[] = [];

    // Search features
    Object.entries(this.knowledge.features).forEach(([key, feature]) => {
      if (key.includes(lowerQuery) || 
          feature.name.toLowerCase().includes(lowerQuery) ||
          feature.description.toLowerCase().includes(lowerQuery)) {
        results.push(`FEATURE - ${feature.name}: ${feature.description}`);
      }
    });

    // Search workflows
    Object.entries(this.knowledge.workflows).forEach(([key, workflow]) => {
      if (key.includes(lowerQuery) || 
          workflow.name.toLowerCase().includes(lowerQuery) ||
          workflow.description.toLowerCase().includes(lowerQuery)) {
        results.push(`WORKFLOW - ${workflow.name}: ${workflow.description}`);
      }
    });

    // Search troubleshooting
    Object.entries(this.knowledge.troubleshooting).forEach(([key, trouble]) => {
      if (key.includes(lowerQuery) || 
          trouble.issue.toLowerCase().includes(lowerQuery)) {
        results.push(`TROUBLESHOOTING - ${trouble.issue}: ${trouble.solutions.join(', ')}`);
      }
    });

    // Search best practices
    Object.entries(this.knowledge.bestPractices).forEach(([key, practice]) => {
      if (practice.title.toLowerCase().includes(lowerQuery) ||
          practice.category.toLowerCase().includes(lowerQuery)) {
        results.push(`BEST PRACTICE - ${practice.title}: ${practice.description}`);
      }
    });

    return results.length > 0 ? results.join('\n\n') : '';
  }

  /**
   * Get comprehensive help for a specific topic
   */
  static getComprehensiveHelp(topic: string): string {
    const feature = this.getFeatureInfo(topic);
    const workflow = this.getWorkflowInfo(topic);
    const troubleshooting = this.getTroubleshootingInfo(topic);
    const bestPractices = this.getBestPractices(topic);

    let help = '';

    if (feature) {
      help += `FEATURE INFORMATION:
${feature.description}

How to use:
${feature.howToUse.map(step => `• ${step}`).join('\n')}

Related features: ${feature.relatedFeatures.join(', ')}
Available to: ${feature.userRoles.join(', ')}`;
    }

    if (workflow) {
      help += `${help ? '\n\n' : ''}WORKFLOW STEPS:
${workflow.description}

Steps:
${workflow.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Requirements: ${workflow.requirements.join(', ')}

Tips:
${workflow.tips.map(tip => `• ${tip}`).join('\n')}`;
    }

    if (troubleshooting) {
      help += `${help ? '\n\n' : ''}TROUBLESHOOTING:
Issue: ${troubleshooting.issue}

Solutions:
${troubleshooting.solutions.map(solution => `• ${solution}`).join('\n')}`;
    }

    if (bestPractices.length > 0) {
      help += `${help ? '\n\n' : ''}BEST PRACTICES:
${bestPractices.map(practice => 
  `${practice.title}:\n${practice.recommendations.map(rec => `• ${rec}`).join('\n')}`
).join('\n\n')}`;
    }

    return help || 'No specific help available for this topic.';
  }

  /**
   * Get intelligent search suggestions based on user context
   */
  static getSearchSuggestions(userRole: string, workspaceType: string): string[] {
    const suggestions = [];
    
    if (userRole === 'owner') {
      suggestions.push(
        "Show me performance analytics across all workspaces",
        "What are the productivity trends this month?",
        "Which teams need more resources?",
        "How is workload distributed across my workspaces?",
        "What are the upcoming deadlines across all projects?"
      );
    } else if (userRole === 'admin') {
      suggestions.push(
        "Show me workspace performance metrics",
        "What reports need my approval?",
        "How are teams performing this week?",
        "Which tasks are overdue?",
        "What should I focus on today?"
      );
    } else {
      suggestions.push(
        "What are my pending tasks?",
        "Show me my team's progress",
        "What reports do I need to submit?",
        "How can I improve my productivity?",
        "What's my workload for this week?"
      );
    }
    
    return suggestions;
  }

  /**
   * Get contextual help based on user query patterns
   */
  static getContextualHelp(query: string, userRole: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Pattern-based help responses
    if (lowerQuery.includes('how to create')) {
      return this.getCreationHelp();
    }
    
    if (lowerQuery.includes('improve') || lowerQuery.includes('better')) {
      return this.getImprovementTips(userRole);
    }
    
    if (lowerQuery.includes('workflow') || lowerQuery.includes('process')) {
      return this.getWorkflowGuidance();
    }
    
    if (lowerQuery.includes('permission') || lowerQuery.includes('access')) {
      return this.getPermissionHelp(userRole);
    }
    
    // Document intelligence help
    if (lowerQuery.includes('analyze') || lowerQuery.includes('summary') || 
        lowerQuery.includes('document') || lowerQuery.includes('intelligence')) {
      return this.getDocumentIntelligenceHelp();
    }
    
    // Document type specific help
    if (lowerQuery.includes('report') && (lowerQuery.includes('best') || lowerQuery.includes('practice'))) {
      return this.getDocumentBestPractices('report');
    }
    
    if (lowerQuery.includes('task') && (lowerQuery.includes('best') || lowerQuery.includes('practice'))) {
      return this.getDocumentBestPractices('task');
    }
    
    if (lowerQuery.includes('project') && (lowerQuery.includes('best') || lowerQuery.includes('practice'))) {
      return this.getDocumentBestPractices('project');
    }
    
    return '';
  }

  /**
   * Get creation help for various entities
   */
  private static getCreationHelp(): string {
    return `CREATION GUIDE:
• Tasks: Use the "+" button in Tasks section, assign to team members, set deadlines
• Teams: Go to Teams section, create new team, invite members with specific roles
• Reports: Use Reports section, select template, fill required fields, submit for approval
• Workspaces: Available to owners only, use workspace settings to create sub-workspaces
• Folders: Organize content in any section using the folder icon

TIPS:
- Always set clear deadlines and descriptions
- Assign appropriate team members with right permissions
- Use templates for consistency
- Review and approve content promptly`;
  }

  /**
   * Get improvement tips based on user role
   */
  private static getImprovementTips(userRole: string): string {
    if (userRole === 'owner') {
      return `OWNER IMPROVEMENT TIPS:
• Monitor cross-workspace performance metrics regularly
• Set up automated reports for key performance indicators
• Balance workload across teams and workspaces
• Establish clear communication channels between workspaces
• Regular review of user permissions and access levels
• Create standardized workflows for common processes`;
    } else if (userRole === 'admin') {
      return `ADMIN IMPROVEMENT TIPS:
• Review pending reports and tasks daily
• Monitor team performance and provide support
• Ensure proper task distribution among team members
• Set up regular check-ins with team members
• Keep workspace organized with proper folder structure
• Provide timely feedback on submissions`;
    } else {
      return `MEMBER IMPROVEMENT TIPS:
• Update task status regularly to keep team informed
• Set personal deadlines before official deadlines
• Communicate proactively about blockers or delays
• Use task comments for progress updates
• Organize your work with personal folders and tags
• Submit reports early for feedback and iterations`;
    }
  }

  /**
   * Get workflow guidance
   */
  private static getWorkflowGuidance(): string {
    return `WORKFLOW BEST PRACTICES:
1. TASK WORKFLOW:
   Create → Assign → Track → Review → Complete → Archive

2. REPORT WORKFLOW:
   Draft → Review → Submit → Approve → Publish → Archive

3. TEAM COLLABORATION:
   Plan → Assign → Execute → Communicate → Review → Improve

4. PROJECT MANAGEMENT:
   Initiate → Plan → Execute → Monitor → Control → Close

AUTOMATION TIPS:
• Use recurring tasks for routine activities
• Set up notification preferences for important updates
• Create templates for common document types
• Use bulk actions for similar tasks`;
  }

  /**
   * Get permission help based on user role
   */
  private static getPermissionHelp(userRole: string): string {
    const basePermissions = `PERMISSION SYSTEM:
• Owner: Full access to all workspaces, users, and settings
• Admin: Manage workspace content, approve reports, assign tasks
• Member: Create own content, collaborate on assigned tasks

CURRENT ROLE: ${userRole.toUpperCase()}`;

    if (userRole === 'owner') {
      return `${basePermissions}

YOUR CAPABILITIES:
✓ Create and manage multiple workspaces
✓ Add/remove users and assign roles
✓ Access all data across workspaces
✓ Configure workspace settings and integrations
✓ View comprehensive analytics and reports
✓ Manage billing and subscription settings`;
    } else if (userRole === 'admin') {
      return `${basePermissions}

YOUR CAPABILITIES:
✓ Manage tasks and assignments within workspace
✓ Review and approve reports
✓ Invite new team members
✓ View workspace analytics
✓ Manage team and project settings
✗ Cannot access other workspaces
✗ Cannot manage billing or owner settings`;
    } else {
      return `${basePermissions}

YOUR CAPABILITIES:
✓ Create and manage your own tasks
✓ Collaborate on assigned projects
✓ Submit reports for approval
✓ View team and project information
✓ Update your profile and preferences
✗ Cannot approve reports or manage other users
✗ Cannot access admin or owner functions`;
    }
  }

  /**
   * Get document intelligence help and examples
   */
  static getDocumentIntelligenceHelp(): string {
    return `DOCUMENT INTELLIGENCE FEATURES:

🔍 ANALYSIS CAPABILITIES:
• Automatic summarization of reports, tasks, and projects
• Quality assessment and scoring
• Improvement suggestions and recommendations
• Content completeness evaluation
• Writing clarity analysis

📊 AVAILABLE METRICS:
• Completeness Score (0-100%)
• Quality Score (0-100%)
• Clarity Score (0-100%)
• Compliance Score (0-100%)
• Word count and reading time
• Key points extraction

💬 EXAMPLE QUERIES:
• "What report did Benjamin submit today and can you give a summary?"
• "Analyze my latest report and suggest improvements"
• "Show me team document activity for today"
• "Summarize John's completed tasks this week"
• "What needs improvement in my recent submissions?"
• "Give me feedback on the quarterly report"

🎯 IMPROVEMENT CATEGORIES:
• Critical Issues: Must-fix problems affecting document quality
• Suggestions: Recommendations for enhancement
• Commendations: Recognition of good practices

👥 ROLE-BASED ACCESS:
• Members: Can analyze their own documents
• Admins: Can analyze all workspace documents
• Owners: Can analyze documents across all workspaces

📈 QUALITY ASSESSMENT CRITERIA:
• Content depth and detail
• Structure and organization
• Clarity of communication
• Compliance with standards
• Supporting evidence inclusion
• Actionable recommendations`;
  }

  /**
   * Get document best practices based on type
   */
  static getDocumentBestPractices(documentType: string): string {
    switch (documentType.toLowerCase()) {
      case 'report':
        return `REPORT WRITING BEST PRACTICES:

📝 STRUCTURE:
• Executive Summary (2-3 paragraphs)
• Introduction and Background
• Methodology or Approach
• Key Findings and Results
• Analysis and Discussion
• Recommendations and Next Steps
• Conclusion
• Supporting Appendices

✅ QUALITY CHECKLIST:
• Clear, descriptive title
• Comprehensive executive summary
• Well-supported findings with evidence
• Actionable recommendations
• Proper grammar and formatting
• Logical flow and organization
• Appropriate length for audience
• Citations and references where needed

🎯 IMPROVEMENT TIPS:
• Use data and examples to support claims
• Write for your target audience
• Include visual aids when helpful
• Proofread for clarity and errors
• Get feedback before final submission`;

      case 'task':
        return `TASK DOCUMENTATION BEST PRACTICES:

📋 ESSENTIAL ELEMENTS:
• Clear, actionable title
• Detailed description of work required
• Specific acceptance criteria
• Realistic deadline
• Priority level assignment
• Responsible person assignment
• Required resources or dependencies

✅ QUALITY CHECKLIST:
• Title clearly describes the outcome
• Description explains the "why" not just "what"
• Success criteria are measurable
• Timeline is realistic and specific
• All stakeholders are identified
• Progress tracking is possible

🎯 IMPROVEMENT TIPS:
• Break large tasks into smaller subtasks
• Include context and background information
• Set up regular check-ins for complex tasks
• Document decisions and changes
• Update status regularly`;

      case 'project':
        return `PROJECT DOCUMENTATION BEST PRACTICES:

🎯 PROJECT ELEMENTS:
• Clear project scope and objectives
• Detailed timeline and milestones
• Resource allocation and team roles
• Risk assessment and mitigation plans
• Success metrics and KPIs
• Communication plan
• Change management process

✅ QUALITY CHECKLIST:
• Objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
• Timeline includes dependencies and buffer time
• Roles and responsibilities are clearly defined
• Success criteria are quantifiable
• Regular review points are scheduled

🎯 IMPROVEMENT TIPS:
• Involve stakeholders in planning
• Document assumptions and constraints
• Plan for regular status updates
• Include lessons learned sections
• Maintain version control`;

      default:
        return `GENERAL DOCUMENT BEST PRACTICES:

📝 UNIVERSAL PRINCIPLES:
• Clear and concise writing
• Logical structure and organization
• Consistent formatting and style
• Audience-appropriate language
• Supporting evidence and examples
• Regular reviews and updates

✅ QUALITY INDICATORS:
• Purpose is clearly stated
• Content is accurate and current
• Information is well-organized
• Language is professional and clear
• Document serves its intended function

🎯 IMPROVEMENT STRATEGIES:
• Get feedback from colleagues
• Use templates for consistency
• Proofread carefully before sharing
• Keep information up to date
• Archive outdated versions`;
    }
  }
}
