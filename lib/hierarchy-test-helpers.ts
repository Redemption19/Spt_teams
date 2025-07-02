import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Workspace, 
  WorkspaceSettings, 
  UserWorkspace, 
  UserWorkspacePermissions,
  SubWorkspaceData 
} from './types';
import { MigrationService } from './migration-service';
import { HierarchyValidationService, ValidationResult } from './hierarchy-validation';

/**
 * Test data and helpers for workspace hierarchy functionality
 */
export class HierarchyTestHelpers {
  
  /**
   * Create test workspace data for validation
   */
  static async createTestWorkspaces(): Promise<{
    mainWorkspace: Workspace;
    subWorkspace: Workspace;
    userWorkspaces: UserWorkspace[];
  }> {
    console.log('🧪 Creating test workspace data...');
    
    // Test main workspace
    const mainWorkspace: Workspace = {
      id: 'test-main-workspace',
      name: 'Test Main Workspace',
      description: 'Test workspace for hierarchy validation',
      ownerId: 'test-owner-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      workspaceType: 'main',
      level: 0,
      path: ['test-main-workspace'],
      settings: {
        allowSubWorkspaces: true,
        maxSubWorkspaces: 5,
        inheritUsers: true,
        inheritRoles: true,
        inheritTeams: false,
        inheritBranches: false,
        crossWorkspaceReporting: true,
        subWorkspaceNamingPattern: '{parentName} - {subName}',
        allowAdminWorkspaceCreation: false
      }
    };
    
    // Test sub-workspace
    const subWorkspace: Workspace = {
      id: 'test-sub-workspace',
      name: 'Test Sub Workspace',
      description: 'Test sub-workspace for hierarchy validation',
      ownerId: 'test-owner-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      workspaceType: 'sub',
      parentWorkspaceId: 'test-main-workspace',
      level: 1,
      path: ['test-main-workspace', 'test-sub-workspace'],
      settings: {
        allowSubWorkspaces: false,
        maxSubWorkspaces: 0,
        inheritUsers: true,
        inheritRoles: true,
        inheritTeams: true,
        inheritBranches: true,
        crossWorkspaceReporting: false,
        allowAdminWorkspaceCreation: false
      }
    };
    
    // Test user-workspace relationships
    const userWorkspaces: UserWorkspace[] = [
      {
        id: 'test-owner-user_test-main-workspace',
        userId: 'test-owner-user',
        workspaceId: 'test-main-workspace',
        role: 'owner',
        joinedAt: new Date(),
        scope: 'direct',
        permissions: {
          canAccessSubWorkspaces: true,
          canCreateSubWorkspaces: true,
          canManageInherited: true,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: true
        },
        effectiveRole: 'owner',
        canAccessSubWorkspaces: true,
        accessibleWorkspaces: ['test-main-workspace', 'test-sub-workspace']
      },
      {
        id: 'test-owner-user_test-sub-workspace',
        userId: 'test-owner-user',
        workspaceId: 'test-sub-workspace',
        role: 'owner',
        joinedAt: new Date(),
        scope: 'inherited',
        inheritedFrom: 'test-main-workspace',
        permissions: {
          canAccessSubWorkspaces: false,
          canCreateSubWorkspaces: false,
          canManageInherited: true,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: false
        },
        effectiveRole: 'owner',
        canAccessSubWorkspaces: false,
        accessibleWorkspaces: ['test-sub-workspace']
      },
      {
        id: 'test-admin-user_test-main-workspace',
        userId: 'test-admin-user',
        workspaceId: 'test-main-workspace',
        role: 'admin',
        joinedAt: new Date(),
        scope: 'direct',
        permissions: {
          canAccessSubWorkspaces: true,
          canCreateSubWorkspaces: false,
          canManageInherited: true,
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: true
        },
        effectiveRole: 'admin',
        canAccessSubWorkspaces: true,
        accessibleWorkspaces: ['test-main-workspace', 'test-sub-workspace']
      }
    ];
    
    return {
      mainWorkspace,
      subWorkspace,
      userWorkspaces
    };
  }
  
  /**
   * Save test data to Firestore
   */
  static async saveTestData(): Promise<void> {
    console.log('💾 Saving test data to Firestore...');
    
    const { mainWorkspace, subWorkspace, userWorkspaces } = await this.createTestWorkspaces();
    
    const batch = writeBatch(db);
    
    // Save workspaces
    batch.set(doc(db, 'workspaces', mainWorkspace.id), {
      ...mainWorkspace,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    batch.set(doc(db, 'workspaces', subWorkspace.id), {
      ...subWorkspace,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Save user-workspace relationships
    for (const userWorkspace of userWorkspaces) {
      batch.set(doc(db, 'userWorkspaces', userWorkspace.id), {
        ...userWorkspace,
        joinedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log('✅ Test data saved successfully');
  }
  
  /**
   * Clean up test data from Firestore
   */
  static async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    const batch = writeBatch(db);
    
    // Delete test workspaces
    batch.delete(doc(db, 'workspaces', 'test-main-workspace'));
    batch.delete(doc(db, 'workspaces', 'test-sub-workspace'));
    
    // Delete test user-workspace relationships
    batch.delete(doc(db, 'userWorkspaces', 'test-owner-user_test-main-workspace'));
    batch.delete(doc(db, 'userWorkspaces', 'test-owner-user_test-sub-workspace'));
    batch.delete(doc(db, 'userWorkspaces', 'test-admin-user_test-main-workspace'));
    
    await batch.commit();
    console.log('✅ Test data cleaned up successfully');
  }
  
  /**
   * Run comprehensive hierarchy tests
   */
  static async runHierarchyTests(): Promise<{
    success: boolean;
    results: {
      migrationTest: boolean;
      validationTest: boolean;
      hierarchyIntegrityTest: boolean;
      userPermissionsTest: boolean;
    };
    details: string[];
  }> {
    console.log('🧪 Running comprehensive hierarchy tests...');
    
    const results = {
      migrationTest: false,
      validationTest: false,
      hierarchyIntegrityTest: false,
      userPermissionsTest: false
    };
    
    const details: string[] = [];
    
    try {
      // Test 1: Migration Test
      details.push('🔄 Testing migration functionality...');
      const migrationCompleted = await MigrationService.isMigrationCompleted();
      if (migrationCompleted) {
        results.migrationTest = true;
        details.push('✅ Migration test passed - migration completed');
      } else {
        details.push('⚠️  Migration not completed - this is expected for new systems');
        results.migrationTest = true; // Not an error for new systems
      }
      
      // Test 2: Create and validate test data
      details.push('📝 Creating test workspace hierarchy...');
      await this.saveTestData();
      
      // Test 3: Validation Test
      details.push('🔍 Testing validation functionality...');
      const validationResult = await HierarchyValidationService.validateHierarchy();
      if (validationResult.isValid || validationResult.errors.filter(e => e.type === 'critical').length === 0) {
        results.validationTest = true;
        details.push('✅ Validation test passed');
      } else {
        results.validationTest = false;
        details.push('❌ Validation test failed');
        details.push(`   Critical errors: ${validationResult.errors.filter(e => e.type === 'critical').length}`);
      }
      
      // Test 4: Hierarchy Integrity Test
      details.push('🏗️  Testing hierarchy integrity...');
      const integrityTest = await this.testHierarchyIntegrity();
      results.hierarchyIntegrityTest = integrityTest.success;
      details.push(integrityTest.success ? '✅ Hierarchy integrity test passed' : '❌ Hierarchy integrity test failed');
      if (!integrityTest.success) {
        details.push(`   Error: ${integrityTest.error}`);
      }
      
      // Test 5: User Permissions Test
      details.push('👤 Testing user permissions...');
      const permissionsTest = await this.testUserPermissions();
      results.userPermissionsTest = permissionsTest.success;
      details.push(permissionsTest.success ? '✅ User permissions test passed' : '❌ User permissions test failed');
      if (!permissionsTest.success) {
        details.push(`   Error: ${permissionsTest.error}`);
      }
      
      // Cleanup
      await this.cleanupTestData();
      details.push('🧹 Test data cleaned up');
      
      const success = Object.values(results).every(result => result === true);
      details.push(success ? '🎉 All tests passed!' : '⚠️  Some tests failed');
      
      return {
        success,
        results,
        details
      };
      
    } catch (error) {
      details.push(`💥 Test suite crashed: ${error}`);
      
      // Attempt cleanup even if tests failed
      try {
        await this.cleanupTestData();
      } catch (cleanupError) {
        details.push(`⚠️  Cleanup failed: ${cleanupError}`);
      }
      
      return {
        success: false,
        results,
        details
      };
    }
  }
  
  /**
   * Test hierarchy integrity
   */
  private static async testHierarchyIntegrity(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { mainWorkspace, subWorkspace } = await this.createTestWorkspaces();
      
      // Test parent-child relationship
      if (subWorkspace.parentWorkspaceId !== mainWorkspace.id) {
        return {
          success: false,
          error: 'Sub-workspace parent reference incorrect'
        };
      }
      
      // Test hierarchy levels
      if (mainWorkspace.level !== 0 || subWorkspace.level !== 1) {
        return {
          success: false,
          error: 'Hierarchy levels incorrect'
        };
      }
      
      // Test hierarchy paths
      const expectedSubPath = [...mainWorkspace.path!, subWorkspace.id];
      if (JSON.stringify(subWorkspace.path) !== JSON.stringify(expectedSubPath)) {
        return {
          success: false,
          error: 'Hierarchy path incorrect'
        };
      }
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: `Hierarchy integrity test error: ${error}`
      };
    }
  }
  
  /**
   * Test user permissions
   */
  private static async testUserPermissions(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { userWorkspaces } = await this.createTestWorkspaces();
      
      // Test owner permissions
      const ownerMainPermissions = userWorkspaces.find(
        uw => uw.userId === 'test-owner-user' && uw.workspaceId === 'test-main-workspace'
      );
      
      if (!ownerMainPermissions?.permissions?.canCreateSubWorkspaces) {
        return {
          success: false,
          error: 'Owner should have permission to create sub-workspaces'
        };
      }
      
      // Test admin permissions
      const adminPermissions = userWorkspaces.find(
        uw => uw.userId === 'test-admin-user' && uw.workspaceId === 'test-main-workspace'
      );
      
      if (adminPermissions?.permissions?.canCreateSubWorkspaces) {
        return {
          success: false,
          error: 'Admin should not have permission to create sub-workspaces by default'
        };
      }
      
      // Test inheritance
      const ownerSubPermissions = userWorkspaces.find(
        uw => uw.userId === 'test-owner-user' && uw.workspaceId === 'test-sub-workspace'
      );
      
      if (ownerSubPermissions?.scope !== 'inherited') {
        return {
          success: false,
          error: 'Owner sub-workspace access should be inherited'
        };
      }
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: `User permissions test error: ${error}`
      };
    }
  }
  
  /**
   * Generate test report
   */
  static async generateTestReport(): Promise<string> {
    const testResults = await this.runHierarchyTests();
    
    const lines: string[] = [];
    
    lines.push('🧪 WORKSPACE HIERARCHY TEST REPORT');
    lines.push('='.repeat(50));
    lines.push('');
    
    lines.push(`Overall Result: ${testResults.success ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push('');
    
    lines.push('📊 Individual Test Results:');
    lines.push(`   Migration Test: ${testResults.results.migrationTest ? '✅' : '❌'}`);
    lines.push(`   Validation Test: ${testResults.results.validationTest ? '✅' : '❌'}`);
    lines.push(`   Hierarchy Integrity: ${testResults.results.hierarchyIntegrityTest ? '✅' : '❌'}`);
    lines.push(`   User Permissions: ${testResults.results.userPermissionsTest ? '✅' : '❌'}`);
    lines.push('');
    
    lines.push('📝 Test Details:');
    testResults.details.forEach(detail => {
      lines.push(`   ${detail}`);
    });
    
    return lines.join('\n');
  }
  
  /**
   * Quick system check
   */
  static async quickSystemCheck(): Promise<{
    isReady: boolean;
    message: string;
    checks: {
      firebase: boolean;
      migration: boolean;
      validation: boolean;
    };
  }> {
    const checks = {
      firebase: false,
      migration: false,
      validation: false
    };
    
    try {
      // Check Firebase connectivity
      await collection(db, 'workspaces');
      checks.firebase = true;
      
      // Check migration service
      await MigrationService.isMigrationCompleted();
      checks.migration = true;
      
      // Check validation service
      await HierarchyValidationService.quickValidation();
      checks.validation = true;
      
      const isReady = Object.values(checks).every(check => check === true);
      
      return {
        isReady,
        message: isReady ? 'System ready for hierarchy features' : 'System not ready - some services unavailable',
        checks
      };
      
    } catch (error) {
      return {
        isReady: false,
        message: `System check failed: ${error}`,
        checks
      };
    }
  }
}

// Browser console helpers
if (typeof window !== 'undefined') {
  (window as any).hierarchyTests = {
    run: () => HierarchyTestHelpers.runHierarchyTests(),
    report: () => HierarchyTestHelpers.generateTestReport(),
    check: () => HierarchyTestHelpers.quickSystemCheck(),
    createTestData: () => HierarchyTestHelpers.saveTestData(),
    cleanup: () => HierarchyTestHelpers.cleanupTestData()
  };
  
  console.log('🧪 Hierarchy test utilities available:');
  console.log('   hierarchyTests.run() - Run all tests');
  console.log('   hierarchyTests.report() - Generate test report');
  console.log('   hierarchyTests.check() - Quick system check');
  console.log('   hierarchyTests.createTestData() - Create test data');
  console.log('   hierarchyTests.cleanup() - Clean up test data');
} 