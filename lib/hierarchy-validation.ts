import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Workspace, 
  UserWorkspace, 
  Team, 
  Branch, 
  Region,
  WorkspaceHierarchy 
} from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: 'critical' | 'error' | 'warning';
  category: 'workspace' | 'user' | 'team' | 'branch' | 'hierarchy';
  entity: string;
  entityId: string;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'data_quality' | 'consistency';
  category: string;
  message: string;
  affectedEntities: string[];
}

export interface ValidationSummary {
  totalWorkspaces: number;
  mainWorkspaces: number;
  subWorkspaces: number;
  totalUsers: number;
  totalUserWorkspaceRelationships: number;
  hierarchyDepth: number;
  migrationStatus: 'completed' | 'pending' | 'partial' | 'failed';
}

/**
 * Comprehensive validation service for workspace hierarchy
 */
export class HierarchyValidationService {
  
  /**
   * Run complete validation of workspace hierarchy
   */
  static async validateHierarchy(): Promise<ValidationResult> {
    console.log('🔍 Starting comprehensive hierarchy validation...');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Load all relevant data
      const data = await this.loadValidationData();
      
      // Run validation checks
      const workspaceValidation = await this.validateWorkspaces(data.workspaces);
      const userValidation = await this.validateUserWorkspaces(data.userWorkspaces, data.workspaces);
      const hierarchyValidation = await this.validateHierarchyIntegrity(data.workspaces);
      const crossReferenceValidation = await this.validateCrossReferences(data);
      
      // Combine results
      errors.push(...workspaceValidation.errors);
      errors.push(...userValidation.errors);
      errors.push(...hierarchyValidation.errors);
      errors.push(...crossReferenceValidation.errors);
      
      warnings.push(...workspaceValidation.warnings);
      warnings.push(...userValidation.warnings);
      warnings.push(...hierarchyValidation.warnings);
      warnings.push(...crossReferenceValidation.warnings);
      
      // Generate summary
      const summary = this.generateSummary(data, errors);
      
      const isValid = errors.filter(e => e.type === 'critical' || e.type === 'error').length === 0;
      
      console.log(`✅ Validation completed: ${isValid ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 ${errors.length} errors, ${warnings.length} warnings`);
      
      return {
        isValid,
        errors,
        warnings,
        summary
      };
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return {
        isValid: false,
        errors: [{
          type: 'critical',
          category: 'hierarchy',
          entity: 'validation_system',
          entityId: 'system',
          message: `Validation system error: ${error}`,
          suggestion: 'Check database connectivity and permissions'
        }],
        warnings: [],
        summary: {
          totalWorkspaces: 0,
          mainWorkspaces: 0,
          subWorkspaces: 0,
          totalUsers: 0,
          totalUserWorkspaceRelationships: 0,
          hierarchyDepth: 0,
          migrationStatus: 'failed'
        }
      };
    }
  }
  
  /**
   * Load all data needed for validation
   */
  private static async loadValidationData(): Promise<{
    workspaces: Workspace[];
    userWorkspaces: UserWorkspace[];
    teams: Team[];
    branches: Branch[];
    regions: Region[];
  }> {
    const [
      workspacesSnapshot,
      userWorkspacesSnapshot,
      teamsSnapshot,
      branchesSnapshot,
      regionsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'workspaces')),
      getDocs(collection(db, 'userWorkspaces')),
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'branches')),
      getDocs(collection(db, 'regions'))
    ]);
    
    return {
      workspaces: workspacesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workspace)),
      userWorkspaces: userWorkspacesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserWorkspace)),
      teams: teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)),
      branches: branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)),
      regions: regionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region))
    };
  }
  
  /**
   * Validate workspace documents
   */
  private static async validateWorkspaces(workspaces: Workspace[]): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    for (const workspace of workspaces) {
      // Check for required hierarchical fields
      if (workspace.workspaceType === undefined) {
        errors.push({
          type: 'error',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Missing workspaceType field',
          suggestion: 'Run migration to add hierarchical fields'
        });
      }
      
      if (workspace.level === undefined) {
        errors.push({
          type: 'error',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Missing level field',
          suggestion: 'Run migration to add hierarchical fields'
        });
      }
      
      if (!workspace.path || workspace.path.length === 0) {
        errors.push({
          type: 'error',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Missing or empty path field',
          suggestion: 'Run migration to add hierarchical fields'
        });
      }
      
      // Validate workspace type consistency
      if (workspace.workspaceType === 'sub' && !workspace.parentWorkspaceId) {
        errors.push({
          type: 'critical',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Sub-workspace missing parentWorkspaceId',
          suggestion: 'Set parentWorkspaceId or change workspaceType to main'
        });
      }
      
      if (workspace.workspaceType === 'main' && workspace.parentWorkspaceId) {
        errors.push({
          type: 'error',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Main workspace should not have parentWorkspaceId',
          suggestion: 'Remove parentWorkspaceId or change workspaceType to sub'
        });
      }
      
      // Validate level consistency
      if (workspace.workspaceType === 'main' && workspace.level !== 0) {
        errors.push({
          type: 'error',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Main workspace should have level 0',
          suggestion: 'Set level to 0'
        });
      }
      
      if (workspace.workspaceType === 'sub' && workspace.level === 0) {
        errors.push({
          type: 'error',
          category: 'workspace',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Sub-workspace should have level > 0',
          suggestion: 'Set appropriate level (1 for direct sub-workspace)'
        });
      }
      
      // Check settings
      if (!workspace.settings) {
        warnings.push({
          type: 'data_quality',
          category: 'workspace',
          message: 'Workspace missing settings object',
          affectedEntities: [workspace.id]
        });
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate user-workspace relationships
   */
  private static async validateUserWorkspaces(
    userWorkspaces: UserWorkspace[],
    workspaces: Workspace[]
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const workspaceIds = new Set(workspaces.map(w => w.id));
    
    for (const userWorkspace of userWorkspaces) {
      // Check workspace reference
      if (!workspaceIds.has(userWorkspace.workspaceId)) {
        errors.push({
          type: 'critical',
          category: 'user',
          entity: 'userWorkspace',
          entityId: userWorkspace.id,
          message: 'References non-existent workspace',
          suggestion: 'Remove orphaned user-workspace relationship'
        });
      }
      
      // Check for hierarchical fields
      if (userWorkspace.scope === undefined) {
        errors.push({
          type: 'error',
          category: 'user',
          entity: 'userWorkspace',
          entityId: userWorkspace.id,
          message: 'Missing scope field',
          suggestion: 'Run migration to add hierarchical fields'
        });
      }
      
      if (!userWorkspace.permissions) {
        warnings.push({
          type: 'data_quality',
          category: 'user',
          message: 'UserWorkspace missing permissions object',
          affectedEntities: [userWorkspace.id]
        });
      }
      
      // Check effective role consistency
      if (userWorkspace.effectiveRole && userWorkspace.effectiveRole !== userWorkspace.role) {
        warnings.push({
          type: 'consistency',
          category: 'user',
          message: 'Effective role differs from direct role',
          affectedEntities: [userWorkspace.id]
        });
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate hierarchy integrity
   */
  private static async validateHierarchyIntegrity(workspaces: Workspace[]): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const workspaceMap = new Map(workspaces.map(w => [w.id, w]));
    
    // Check parent-child relationships
    for (const workspace of workspaces) {
      if (workspace.parentWorkspaceId) {
        const parent = workspaceMap.get(workspace.parentWorkspaceId);
        
        if (!parent) {
          errors.push({
            type: 'critical',
            category: 'hierarchy',
            entity: 'workspace',
            entityId: workspace.id,
            message: 'References non-existent parent workspace',
            suggestion: 'Fix parent reference or remove parentWorkspaceId'
          });
        } else {
          // Check level consistency
          if (workspace.level !== undefined && parent.level !== undefined && workspace.level !== parent.level + 1) {
            errors.push({
              type: 'error',
              category: 'hierarchy',
              entity: 'workspace',
              entityId: workspace.id,
              message: 'Inconsistent hierarchy level',
              suggestion: `Set level to ${parent.level + 1}`
            });
          }
          
          // Check path consistency
          if (workspace.path && parent.path) {
            const expectedPath = [...parent.path, workspace.id];
            if (JSON.stringify(workspace.path) !== JSON.stringify(expectedPath)) {
              errors.push({
                type: 'error',
                category: 'hierarchy',
                entity: 'workspace',
                entityId: workspace.id,
                message: 'Inconsistent hierarchy path',
                suggestion: `Update path to: [${expectedPath.join(', ')}]`
              });
            }
          }
        }
      }
    }
    
    // Check for circular references
    for (const workspace of workspaces) {
      if (this.hasCircularReference(workspace, workspaceMap)) {
        errors.push({
          type: 'critical',
          category: 'hierarchy',
          entity: 'workspace',
          entityId: workspace.id,
          message: 'Circular reference detected in hierarchy',
          suggestion: 'Fix parent-child relationships to remove cycle'
        });
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate cross-references between entities
   */
  private static async validateCrossReferences(data: {
    workspaces: Workspace[];
    userWorkspaces: UserWorkspace[];
    teams: Team[];
    branches: Branch[];
    regions: Region[];
  }): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const workspaceIds = new Set(data.workspaces.map(w => w.id));
    
    // Validate team workspace references
    for (const team of data.teams) {
      if (!workspaceIds.has(team.workspaceId)) {
        errors.push({
          type: 'critical',
          category: 'team',
          entity: 'team',
          entityId: team.id,
          message: 'References non-existent workspace',
          suggestion: 'Update workspace reference or remove team'
        });
      }
    }
    
    // Validate branch workspace references
    for (const branch of data.branches) {
      if (!workspaceIds.has(branch.workspaceId)) {
        errors.push({
          type: 'critical',
          category: 'branch',
          entity: 'branch',
          entityId: branch.id,
          message: 'References non-existent workspace',
          suggestion: 'Update workspace reference or remove branch'
        });
      }
    }
    
    // Validate region workspace references
    for (const region of data.regions) {
      if (!workspaceIds.has(region.workspaceId)) {
        errors.push({
          type: 'critical',
          category: 'branch',
          entity: 'region',
          entityId: region.id,
          message: 'References non-existent workspace',
          suggestion: 'Update workspace reference or remove region'
        });
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Check for circular references in workspace hierarchy
   */
  private static hasCircularReference(
    workspace: Workspace,
    workspaceMap: Map<string, Workspace>,
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(workspace.id)) {
      return true;
    }
    
    if (!workspace.parentWorkspaceId) {
      return false;
    }
    
    visited.add(workspace.id);
    const parent = workspaceMap.get(workspace.parentWorkspaceId);
    
    if (!parent) {
      return false;
    }
    
    return this.hasCircularReference(parent, workspaceMap, visited);
  }
  
  /**
   * Generate validation summary
   */
  private static generateSummary(
    data: {
      workspaces: Workspace[];
      userWorkspaces: UserWorkspace[];
    },
    errors: ValidationError[]
  ): ValidationSummary {
    const mainWorkspaces = data.workspaces.filter(w => w.workspaceType === 'main');
    const subWorkspaces = data.workspaces.filter(w => w.workspaceType === 'sub');
    
    const maxLevel = Math.max(...data.workspaces.map(w => w.level || 0));
    
    const criticalErrors = errors.filter(e => e.type === 'critical').length;
    const regularErrors = errors.filter(e => e.type === 'error').length;
    
    let migrationStatus: 'completed' | 'pending' | 'partial' | 'failed';
    if (criticalErrors > 0) {
      migrationStatus = 'failed';
    } else if (regularErrors > 0) {
      migrationStatus = 'partial';
    } else if (data.workspaces.some(w => w.workspaceType === undefined)) {
      migrationStatus = 'pending';
    } else {
      migrationStatus = 'completed';
    }
    
    return {
      totalWorkspaces: data.workspaces.length,
      mainWorkspaces: mainWorkspaces.length,
      subWorkspaces: subWorkspaces.length,
      totalUsers: new Set(data.userWorkspaces.map(uw => uw.userId)).size,
      totalUserWorkspaceRelationships: data.userWorkspaces.length,
      hierarchyDepth: maxLevel,
      migrationStatus
    };
  }
  
  /**
   * Quick validation check (minimal database queries)
   */
  static async quickValidation(): Promise<{
    isValid: boolean;
    message: string;
    needsMigration: boolean;
  }> {
    try {
      // Check a few workspace documents
      const workspacesSnapshot = await getDocs(
        query(collection(db, 'workspaces'), orderBy('createdAt', 'desc'), orderBy('__name__', 'desc'))
      );
      
      if (workspacesSnapshot.empty) {
        return {
          isValid: true,
          message: 'No workspaces found',
          needsMigration: false
        };
      }
      
      const sampleWorkspace = workspacesSnapshot.docs[0].data() as Workspace;
      
      if (sampleWorkspace.workspaceType === undefined) {
        return {
          isValid: false,
          message: 'Migration required - workspaces missing hierarchical fields',
          needsMigration: true
        };
      }
      
      return {
        isValid: true,
        message: 'Basic validation passed',
        needsMigration: false
      };
      
    } catch (error) {
      return {
        isValid: false,
        message: `Validation error: ${error}`,
        needsMigration: false
      };
    }
  }
  
  /**
   * Generate validation report for display
   */
  static generateReport(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('📊 WORKSPACE HIERARCHY VALIDATION REPORT');
    lines.push('='.repeat(50));
    lines.push('');
    
    // Summary
    lines.push('📈 SUMMARY:');
    lines.push(`   Total Workspaces: ${result.summary.totalWorkspaces}`);
    lines.push(`   Main Workspaces: ${result.summary.mainWorkspaces}`);
    lines.push(`   Sub-Workspaces: ${result.summary.subWorkspaces}`);
    lines.push(`   Hierarchy Depth: ${result.summary.hierarchyDepth}`);
    lines.push(`   Migration Status: ${result.summary.migrationStatus.toUpperCase()}`);
    lines.push(`   Validation Result: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push('');
    
    // Errors
    if (result.errors.length > 0) {
      lines.push('❌ ERRORS:');
      result.errors.forEach(error => {
        lines.push(`   [${error.type.toUpperCase()}] ${error.category}/${error.entity}: ${error.message}`);
        if (error.suggestion) {
          lines.push(`       💡 ${error.suggestion}`);
        }
      });
      lines.push('');
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      result.warnings.forEach(warning => {
        lines.push(`   [${warning.type.toUpperCase()}] ${warning.message}`);
        lines.push(`       Affected: ${warning.affectedEntities.length} entities`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }
} 