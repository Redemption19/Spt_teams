import type {
  TeamFormationSuggestion,
  MentorshipMatch,
  DepartmentInsights
} from '../ai-types/ai-interfaces';
import { MockDataService } from './mock-data-service';
import { DepartmentService } from './department-service';
import { WorkspaceService } from '../workspace-service';
import { ProjectService } from '../project-service';
import { TaskService } from '../task-service';
import { UserService } from '../user-service';

// =============================================================================
// TEAM & MENTORSHIP SERVICE (Team formation and mentorship recommendations)
// =============================================================================

export class TeamMentorshipService {
  // Generate team formation suggestions based on real workspace data
  static async getTeamFormationSuggestions(workspaceId: string, userId: string): Promise<TeamFormationSuggestion[]> {
    try {
      // Get real workspace data
      const [departments, projects, workspaceUsers, tasks] = await Promise.all([
        DepartmentService.getDepartmentInsights(workspaceId, userId),
        ProjectService.getWorkspaceProjects(workspaceId).catch(() => []),
        WorkspaceService.getWorkspaceUsers(workspaceId).catch(() => []),
        TaskService.getWorkspaceTasks(workspaceId).catch(() => [])
      ]);

      const suggestions: TeamFormationSuggestion[] = [];

      // Analysis 1: Project-based team formation
      if (projects.length > 0) {
        // Find projects with high task counts that might need dedicated teams
        const largeProjects = projects.filter(project => {
          const projectTasks = tasks.filter(task => task.projectId === project.id);
          return projectTasks.length > 5; // Projects with 5+ tasks
        });

        if (largeProjects.length > 0) {
          const topProject = largeProjects[0];
          const projectTasks = tasks.filter(task => task.projectId === topProject.id);
          const uniqueAssignees = [...new Set(projectTasks.map(task => task.assigneeId).filter(Boolean))] as string[];

          suggestions.push({
            id: `project-team-${topProject.id}`,
            title: `Dedicated Team for "${topProject.name}"`,
            description: `Form a specialized team to focus on ${topProject.name} with ${projectTasks.length} active tasks`,
            suggestedMembers: uniqueAssignees.slice(0, 5),
            expectedOutcome: `Faster completion of ${topProject.name} and improved project focus`,
            confidence: 85,
            implementation: 'low',
            expectedImpact: `30% faster completion of ${topProject.name}`,
            timeline: '2-3 weeks',
            risk: 'Low - leverages existing project assignments',
            suggestedChanges: [
              {
                change: `Formalize team structure for ${topProject.name}`,
                reason: `Project has ${projectTasks.length} tasks requiring coordinated effort`,
                impact: 'Better task coordination and faster delivery'
              }
            ]
          });
        }
      }

      // Analysis 2: Department-based optimization
      if (departments.length > 0) {
        const lowEfficiencyDepts = departments.filter(dept => dept.efficiency < 70);
        const highEfficiencyDepts = departments.filter(dept => dept.efficiency > 85);

        if (lowEfficiencyDepts.length > 0 && highEfficiencyDepts.length > 0) {
          const underperformingDept = lowEfficiencyDepts[0];
          const topPerformingDept = highEfficiencyDepts[0];

          suggestions.push({
            id: `dept-improvement-${underperformingDept.id}`,
            title: `${underperformingDept.name} Team Enhancement`,
            description: `Strengthen ${underperformingDept.name} by learning from ${topPerformingDept.name}'s success`,
            suggestedMembers: [],
            expectedOutcome: `Improve ${underperformingDept.name} efficiency from ${underperformingDept.efficiency}% to 80%+`,
            confidence: 75,
            implementation: 'medium',
            expectedImpact: `${Math.round((80 - underperformingDept.efficiency) / underperformingDept.efficiency * 100)}% efficiency improvement`,
            timeline: '4-6 weeks',
            risk: 'Medium - requires process changes',
            suggestedChanges: [
              {
                change: `Cross-training between ${topPerformingDept.name} and ${underperformingDept.name}`,
                reason: `${topPerformingDept.name} shows ${topPerformingDept.efficiency}% efficiency vs ${underperformingDept.name}'s ${underperformingDept.efficiency}%`,
                impact: 'Knowledge transfer and best practice adoption'
              }
            ]
          });
        }
      }

      // Analysis 3: Task overload analysis
      if (tasks.length > 0 && workspaceUsers.length > 0) {
        // Find users with high task loads
        const userTaskCounts = workspaceUsers.map(wu => {
          const userTasks = tasks.filter(task => 
            task.assigneeId === wu.user.id && 
            task.status !== 'completed'
          );
          return {
            user: wu.user,
            role: wu.role,
            taskCount: userTasks.length,
            highPriorityTasks: userTasks.filter(task => task.priority === 'high').length
          };
        }).filter(u => u.taskCount > 0);

        const overloadedUsers = userTaskCounts.filter(u => u.taskCount > 5).sort((a, b) => b.taskCount - a.taskCount);
        const availableUsers = userTaskCounts.filter(u => u.taskCount <= 2);

        if (overloadedUsers.length > 0 && availableUsers.length > 0) {
          const overloadedUser = overloadedUsers[0];
          
          suggestions.push({
            id: 'workload-balancing',
            title: 'Workload Balancing Team',
            description: `Redistribute tasks and create support team to address workload imbalances`,
            suggestedMembers: [overloadedUser.user.id, ...availableUsers.slice(0, 2).map(u => u.user.id)],
            expectedOutcome: `Better task distribution and reduced individual workload stress`,
            confidence: 80,
            implementation: 'low',
            expectedImpact: `25% reduction in individual task overload`,
            timeline: '1-2 weeks',
            risk: 'Low - leverages existing team members',
            suggestedChanges: [
              {
                change: `Create task redistribution plan`,
                reason: `Some team members have ${overloadedUser.taskCount}+ tasks while others have 2 or fewer`,
                impact: 'More balanced workload and improved team efficiency'
              }
            ]
          });
        }
      }

      // Analysis 4: Skill-based team formation (if we have department data)
      if (departments.length > 1) {
        const collaborativeDepts = departments.filter(dept => dept.collaborationScore > 75);
        
        if (collaborativeDepts.length >= 2) {
          suggestions.push({
            id: 'cross-functional-team',
            title: 'Cross-Functional Collaboration Team',
            description: `Form inter-departmental team combining strengths from multiple departments`,
            suggestedMembers: collaborativeDepts.slice(0, 3).map(dept => dept.headId || 'dept-member').filter(Boolean),
            expectedOutcome: `Enhanced collaboration and knowledge sharing across departments`,
            confidence: 70,
            implementation: 'medium',
            expectedImpact: `20% improvement in cross-departmental project delivery`,
            timeline: '3-4 weeks',
            risk: 'Medium - requires coordination across departments',
            suggestedChanges: [
              {
                change: `Establish regular cross-departmental meetings`,
                reason: `Multiple departments show high collaboration scores (${collaborativeDepts.map(d => `${d.name}: ${d.collaborationScore}%`).join(', ')})`,
                impact: 'Better knowledge sharing and unified project approaches'
              }
            ]
          });
        }
      }

      // Return real suggestions if we have any, otherwise fallback to mock
      return suggestions.length > 0 ? suggestions : MockDataService.getMockTeamFormationSuggestions();
    } catch (error) {
      console.error('❌ Error getting team formation suggestions:', error);
      return MockDataService.getMockTeamFormationSuggestions();
    }
  }

  // Find mentorship matches based on real workspace data
  static async getMentorshipMatches(workspaceId: string, userId: string): Promise<MentorshipMatch[]> {
    try {
      // Get real workspace data
      const [departments, workspaceUsers, userRole] = await Promise.all([
        DepartmentService.getDepartmentInsights(workspaceId, userId),
        WorkspaceService.getWorkspaceUsers(workspaceId).catch(() => []),
        WorkspaceService.getUserRole(userId, workspaceId).catch(() => 'member')
      ]);

      const matches: MentorshipMatch[] = [];

      // Find the current user's details
      const currentUser = workspaceUsers.find(wu => wu.user.id === userId);
      const currentUserName = currentUser ? 
        `${currentUser.user.firstName || ''} ${currentUser.user.lastName || ''}`.trim() || currentUser.user.email || 'Current User' : 
        'Current User';

      // Strategy 1: Role-based mentorship (higher roles mentor lower roles)
      if (userRole === 'member') {
        // Find admins and owners as potential mentors
        const potentialMentors = workspaceUsers.filter(wu => 
          wu.role === 'admin' || wu.role === 'owner'
        );

        for (const mentor of potentialMentors.slice(0, 3)) {
          const mentorName = `${mentor.user.firstName || ''} ${mentor.user.lastName || ''}`.trim() || mentor.user.email || 'Team Lead';
          
          // Find relevant department for context
          const relevantDept = departments.find(dept => 
            dept.headId === mentor.user.id || dept.memberCount > 0
          );

          const compatibilityScore = relevantDept ? relevantDept.collaborationScore : 75;

          matches.push({
            id: `mentor-${mentor.user.id}`,
            mentorId: mentor.user.id,
            mentorName,
            menteeId: userId,
            menteeName: currentUserName,
            compatibilityScore,
            compatibility: compatibilityScore,
            mentorRole: mentor.role === 'owner' ? 'Workspace Owner' : 'Team Admin',
            menteeRole: 'Team Member',
            focusAreas: mentor.role === 'owner' ? 
              ['Leadership', 'Strategic Planning', 'Business Development'] :
              ['Project Management', 'Team Coordination', 'Process Optimization'],
            sharedSkills: ['Team Collaboration', 'Communication'],
            mentorshipAreas: mentor.role === 'owner' ? 
              ['Leadership Development', 'Strategic Thinking'] :
              ['Project Management', 'Technical Skills'],
            suggestedActivities: ['Weekly one-on-ones', 'Project shadowing', 'Skill-building sessions'],
            expectedOutcome: `Enhanced ${mentor.role === 'owner' ? 'leadership and strategic' : 'project management and technical'} skills`
          });
        }
      }

      // Strategy 2: Department-based mentorship
      if (departments.length > 0) {
        for (const dept of departments) {
          if (dept.headId && dept.headId !== userId && dept.efficiency > 75) {
            // Find the department head user details
            const deptHead = workspaceUsers.find(wu => wu.user.id === dept.headId);
            if (deptHead) {
              const mentorName = `${deptHead.user.firstName || ''} ${deptHead.user.lastName || ''}`.trim() || 
                               deptHead.user.email || 
                               'Department Head';

              matches.push({
                id: `dept-mentor-${dept.id}`,
                mentorId: dept.headId,
                mentorName,
                menteeId: userId,
                menteeName: currentUserName,
                compatibilityScore: dept.collaborationScore,
                compatibility: dept.collaborationScore,
                mentorRole: `${dept.name} Lead`,
                menteeRole: userRole === 'member' ? 'Team Member' : 'Fellow Leader',
                focusAreas: ['Domain Expertise', 'Best Practices', 'Team Management'],
                sharedSkills: ['Domain Knowledge', 'Team Collaboration'],
                mentorshipAreas: [`${dept.name} Excellence`, 'Process Improvement'],
                suggestedActivities: ['Department shadowing', 'Best practice sharing', 'Goal setting'],
                expectedOutcome: `Improved performance in ${dept.name} domain`
              });
            }
          }
        }
      }

      // Strategy 3: Peer mentorship (similar roles)
      if (userRole === 'admin') {
        const peerAdmins = workspaceUsers.filter(wu => 
          wu.role === 'admin' && wu.user.id !== userId
        );

        for (const peer of peerAdmins.slice(0, 2)) {
          const peerName = `${peer.user.firstName || ''} ${peer.user.lastName || ''}`.trim() || peer.user.email || 'Fellow Admin';
          
          matches.push({
            id: `peer-mentor-${peer.user.id}`,
            mentorId: peer.user.id,
            mentorName: peerName,
            menteeId: userId,
            menteeName: currentUserName,
            compatibilityScore: 80,
            compatibility: 80,
            mentorRole: 'Fellow Admin',
            menteeRole: 'Team Admin',
            focusAreas: ['Peer Learning', 'Knowledge Exchange', 'Collaborative Leadership'],
            sharedSkills: ['Administration', 'Team Management', 'Problem Solving'],
            mentorshipAreas: ['Leadership Exchange', 'Best Practice Sharing'],
            suggestedActivities: ['Peer discussions', 'Joint problem-solving', 'Experience sharing'],
            expectedOutcome: 'Mutual learning and leadership development'
          });
        }
      }

      // Remove duplicates and limit results
      const uniqueMatches = matches.filter((match, index, self) => 
        index === self.findIndex(m => m.mentorId === match.mentorId)
      );

      return uniqueMatches.length > 0 ? uniqueMatches.slice(0, 3) : MockDataService.getMockMentorshipMatches();
    } catch (error) {
      console.error('❌ Error getting mentorship matches:', error);
      return MockDataService.getMockMentorshipMatches();
    }
  }
}
