# Department Performance Analytics Usage

## Overview
The new `getDepartmentPerformance` method provides comprehensive analytics about department/team performance including grades, recommendations, and trends.

## Usage

### Basic Usage
```typescript
import { AIDataService } from '@/lib/ai-data-service';

// Get department performance data
const performanceData = await AIDataService.getDepartmentPerformance(userId, workspaceId);
```

### Response Structure
```typescript
{
  departmentMetrics: [
    {
      id: "team-123",
      name: "Development Team",
      memberCount: 8,
      efficiency: 85,
      collaborationScore: 78,
      activeProjects: 3,
      completedTasks: 12,
      performanceGrade: "B+",
      status: "good",
      recommendations: [
        "Enhance team communication and collaboration tools"
      ],
      trends: {
        efficiency: "up",
        collaboration: "stable",
        productivity: "up"
      }
    }
  ],
  overallMetrics: {
    averageEfficiency: 82,
    averageCollaboration: 79,
    totalActiveProjects: 8,
    totalCompletedTasks: 45,
    bestPerformingDepartment: "Development Team",
    departmentsNeedingAttention: ["Marketing Team"]
  }
}
```

## Performance Grades
- **A+**: 90%+ average score - Excellent
- **A**: 85-89% average score - Excellent  
- **B+**: 80-84% average score - Good
- **B**: 75-79% average score - Good
- **C+**: 70-74% average score - Needs Improvement
- **C**: 60-69% average score - Needs Improvement
- **D**: Below 60% average score - Critical

## Status Levels
- **excellent**: High performing teams (A/A+ grades)
- **good**: Well performing teams (B/B+ grades)
- **needs_improvement**: Teams requiring attention (C/C+ grades)
- **critical**: Teams requiring immediate intervention (D grade)

## Recommendations
The system automatically generates recommendations based on:
- Low efficiency (< 75%)
- Low collaboration scores (< 75%)
- Team size vs efficiency ratio
- Project overload indicators

## Example UI Integration
```typescript
// In your component
const [departmentPerformance, setDepartmentPerformance] = useState(null);

useEffect(() => {
  const fetchPerformance = async () => {
    const data = await AIDataService.getDepartmentPerformance(userId, workspaceId);
    setDepartmentPerformance(data);
  };
  
  fetchPerformance();
}, [userId, workspaceId]);

// Render performance cards
{departmentPerformance?.departmentMetrics.map(dept => (
  <div key={dept.id} className="performance-card">
    <h3>{dept.name}</h3>
    <div className="grade">{dept.performanceGrade}</div>
    <div className="metrics">
      <span>Efficiency: {dept.efficiency}%</span>
      <span>Collaboration: {dept.collaborationScore}%</span>
    </div>
    <div className="recommendations">
      {dept.recommendations.map(rec => (
        <p key={rec}>{rec}</p>
      ))}
    </div>
  </div>
))}
```

## Cross-Workspace Support
For workspace owners, this method automatically aggregates department performance across all managed workspaces, providing a comprehensive view of organizational performance.
