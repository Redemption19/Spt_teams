# Knowledge Services Architecture

This directory contains specialized knowledge services that handle different aspects of the AI Workspace Assistant's knowledge base. This modular architecture makes the system more maintainable and easier to extend.

## Structure

### Main Orchestrator
- **`ai-knowledge-service.ts`** - Main service that orchestrates all specialized knowledge services

### Specialized Services

#### 📊 Analytics Knowledge (`analytics-knowledge.ts`)
Handles performance analytics, predictive insights, and resource utilization:
- Performance analytics and trends
- Predictive insights and recommendations  
- Resource utilization analysis
- Query detection: analytics, performance, insights, metrics, etc.

#### 📅 Calendar Knowledge (`calendar-knowledge.ts`)
Manages calendar, scheduling, and notification data:
- Calendar insights and scheduling
- Notification summaries and alerts
- Deadline tracking and overdue analysis
- Query detection: calendar, schedule, notifications, etc.

#### 💡 Suggestion Knowledge (`suggestion-knowledge.ts`)
Provides smart suggestions and workspace recommendations:
- Context-aware smart suggestions
- Workspace switching recommendations
- Role-based suggestions
- Query detection: suggestions, recommendations, advice, etc.

#### 🏢 Entity Knowledge (`entity-knowledge.ts`)
Handles core business entities (tasks, teams, reports, users, workspaces, folders, projects, branches, regions, departments):
- **Core Entities**: Task, team, report, user, and workspace context
- **Extended Entities**: Folder, project, branch, region, and department context
- **Cross-workspace Management**: Owners get aggregated data from ALL their workspaces
- **RBAC Integration**: Role-based data access control for all entities
- **Comprehensive Analysis**: Complete entity ecosystem coverage
- **Query Detection**: Supports all major app pages and entities
- **Regional Managers**: Detailed regional manager information across workspaces
- **Multi-Source User Detection**: Queries multiple Firebase collections for complete user lists

#### 📄 Document Knowledge (`document-knowledge.ts`)
Manages document intelligence and analysis:
- Document analysis and summarization
- Quality scoring and improvement suggestions
- Team document insights
- User activity tracking
- Query detection: summary, analyze, document, etc.

#### ❓ Help Knowledge (`help-knowledge.ts`)
Provides contextual help and guidance:
- Help topic extraction
- Comprehensive help context
- Role-based help delivery
- Query detection: how to, help me, explain, etc.

## Usage

### Basic Import
```typescript
import { AIKnowledgeService } from './ai-knowledge-service';
```

### Direct Service Import
```typescript
import { 
  AnalyticsKnowledgeService,
  DocumentKnowledgeService,
  EntityKnowledgeService
} from './knowledge-services';
```

### Individual Service Import
```typescript
import { AnalyticsKnowledgeService } from './knowledge-services/analytics-knowledge';
```

## Coverage

This modular knowledge system now provides comprehensive coverage for **ALL major app pages/entities**:

### ✅ Fully Covered Entities
- **Tasks** - Task management, assignments, progress tracking
- **Teams** - Team collaboration, member management
- **Reports** - Document analysis, submissions, approvals
- **Users/User Management** - User profiles, role management, permissions
- **Workspaces** - Organization structure, settings, cross-workspace data
- **Folders** - File storage, document organization, sharing
- **Projects** - Project management, epics, milestones
- **Branches** - Location management, office/site operations
- **Regions** - Geographic/territorial organization
- **Departments** - Organizational units, structure management
- **Calendar** - Scheduling, notifications, deadline tracking

### 🎯 Query Support
The assistant can now intelligently answer questions about:
- How many projects are active?
- Show me folder statistics
- What branches do we have?
- Which departments need attention?
- **Who are the regional managers?** *(Cross-workspace for owners)*
- Folder sharing and permissions
- Project deadlines and progress
- Branch performance metrics
- Department staff allocation
- Cross-entity relationship insights

### 👑 Owner & Admin Cross-Workspace Features
For workspace owners and admins, the assistant provides **role-specific aggregated data across managed workspaces**:
- **Regional Managers**: Complete list with contact details across all accessible workspaces
- **Department Overview**: Total departments, heads, and members across workspaces
- **Branch Statistics**: All branches and their user counts across workspaces
- **Project Portfolio**: All projects and their status across workspaces
- **Folder Management**: Storage and file statistics across workspaces
- **Task Management**: Task statistics and assignments across workspaces
- **Report Analytics**: Report submissions and approvals across workspaces
- **User Management**: User listings and role information across workspaces
- **Workspace Breakdown**: Detailed summaries for each accessible workspace
- **Comprehensive User Detection**: Multi-source user queries across all Firebase collections

**Role-Based Access Control:**
- **Owners**: Access to all data from workspaces they OWN
- **Admins**: Access to all data from workspaces where they are ADMIN (not owner or member)
- **Members**: Current workspace only

**Admin-Specific Filtering**: Admins now only see data from workspaces where they are specifically administrators, ensuring proper role-based data segregation and security.

### 🔍 Advanced User Detection
The system uses a **multi-source approach** to detect all users:
- **Source 1**: `userWorkspaces` collection - Direct workspace memberships
- **Source 2**: `teamUsers` + `teams` collections - Team-based memberships
- **Source 3**: Workspace service fallback - Legacy compatibility
- **Deduplication**: Combines all sources and removes duplicates
- **Data Source Tracking**: Shows which Firebase collections provided the data

## Benefits

1. **Modularity**: Each service handles a specific domain
2. **Maintainability**: Easy to update or extend individual features
3. **Testability**: Services can be tested independently
4. **Performance**: Only load required services
5. **Scalability**: Easy to add new knowledge domains
6. **Separation of Concerns**: Clear responsibility boundaries

## Adding New Services

To add a new knowledge service:

1. Create a new file in `knowledge-services/`
2. Implement query detection methods
3. Implement data retrieval methods
4. Export from `index.ts`
5. Import and integrate in main `ai-knowledge-service.ts`

## Recent Updates

### v1.2 - Admin-Specific Filtering (Latest)
- **Admin Role-Based Access**: Admins now only see data from workspaces where they are specifically administrators (not owner or member)
- **Consistent Entity Logic**: All entity context methods (tasks, reports, users, folders, projects, branches, regions, departments) now follow the same admin-specific filtering pattern
- **Enhanced Security**: Proper role-based data segregation ensures admins cannot access data from workspaces where they are not admin
- **Cross-Entity Consistency**: Unified approach across all entity types for role-based access control
- **Improved Logging**: Enhanced debugging output showing role-specific workspace filtering

## Example Service Structure

```typescript
export class NewKnowledgeService {
  // Query detection
  static isNewFeatureQuery(query: string): boolean {
    // Implementation
  }

  // Data retrieval
  static async getNewFeatureData(context: KnowledgeContext): Promise<string> {
    // Implementation
  }
}
```
