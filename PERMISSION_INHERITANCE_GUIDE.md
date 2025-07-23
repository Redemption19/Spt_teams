# Permission Inheritance in Hierarchical Workspaces

## Overview

SPT Teams implements a hierarchical workspace structure where permissions granted in parent workspaces automatically inherit to child workspaces. This ensures consistent access control across the workspace hierarchy while maintaining security and reducing administrative overhead.

## How Permission Inheritance Works

### 1. **Permission Resolution Process**

When checking user permissions for a workspace, the system follows this process:

1. **Primary Lookup**: Check for permissions directly assigned to the user in the current workspace
2. **Inheritance Lookup**: If no permissions found, check the parent workspace(s) recursively
3. **Permission Application**: Apply inherited permissions to the current workspace context

### 2. **Implementation Details**

The inheritance logic is implemented in `lib/permissions-service.ts`:

```typescript
static async getUserPermissions(userId: string, workspaceId: string): Promise<UserPermission | null> {
  // 1. Try current workspace first
  const docRef = doc(db, 'userPermissions', `${userId}_${workspaceId}`);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data(); // Found in current workspace
  }
  
  // 2. Check parent workspace if current workspace is a child
  const workspace = await WorkspaceService.getWorkspace(workspaceId);
  if (workspace && workspace.parentWorkspaceId) {
    const parentPermissions = await getDoc(
      doc(db, 'userPermissions', `${userId}_${workspace.parentWorkspaceId}`)
    );
    
    if (parentPermissions.exists()) {
      // Return inherited permissions with current workspace context
      return {
        ...parentPermissions.data(),
        workspaceId: workspaceId // Keep current workspace ID
      };
    }
  }
  
  return null; // No permissions found
}
```

### 3. **Automatic Inheritance in All Permission Checks**

All permission-related operations automatically benefit from inheritance:

- ✅ `PermissionsService.getUserPermissions()` - Primary inheritance implementation
- ✅ `PermissionsService.hasPermission()` - Uses getUserPermissions internally
- ✅ `PermissionsService.hasAnyPermission()` - OR logic for multiple permissions with inheritance
- ✅ `PermissionsService.hasAllPermissions()` - AND logic for multiple permissions with inheritance
- ✅ `PermissionsService.getEffectivePermissions()` - Returns permissions with inheritance source info
- ✅ `usePermissions` hook - Uses PermissionsService methods
- ✅ `ExpenseAccessControl` - Uses PermissionsService for access decisions
- ✅ All UI components using permission hooks

## Workspace Hierarchy Structure

```
Main Workspace (Level 0)
├── Regional Office A (Level 1)
│   ├── Branch Office A1 (Level 2)
│   │   └── Department A1-Sales (Level 3)
│   └── Branch Office A2 (Level 2)
│       └── Department A2-Marketing (Level 3)
└── Regional Office B (Level 1)
    ├── Branch Office B1 (Level 2)
    └── Branch Office B2 (Level 2)
```

## Permission Inheritance Examples

### Example 1: Cross-Department Expense Access

**Scenario**: Admin granted "View All Expenses" permission in Main Workspace

```typescript
// Main Workspace Permission Grant
{
  userId: "admin123",
  workspaceId: "main-workspace",
  permissions: {
    "expenses.view.all": {
      granted: true,
      grantedBy: "owner456",
      grantedAt: "2025-01-15"
    }
  }
}
```

**Result**: Admin can view all expenses in:
- ✅ Main Workspace
- ✅ Regional Office A (inherited)
- ✅ Branch Office A1 (inherited)
- ✅ Department A1-Sales (inherited)
- ✅ All other child workspaces (inherited)

### Example 2: Department-Level Permission

**Scenario**: Manager granted department permissions in Regional Office A

```typescript
// Regional Office A Permission Grant
{
  userId: "manager789",
  workspaceId: "regional-office-a",
  permissions: {
    "expenses.view.department": {
      granted: true,
      grantedBy: "admin123",
      grantedAt: "2025-01-15"
    }
  }
}
```

**Result**: Manager can view department expenses in:
- ✅ Regional Office A
- ✅ Branch Office A1 (inherited)
- ✅ Branch Office A2 (inherited)
- ❌ Regional Office B (no inheritance - different branch)

## Implementation Guidelines

### 1. **When Adding New Permission Checks**

Always use the standard PermissionsService methods that include inheritance:

```typescript
// ✅ CORRECT - Single permission check with inheritance
const hasPermission = await PermissionsService.hasPermission(
  userId, 
  workspaceId, 
  'expenses.view.all'
);

// ✅ CORRECT - Check multiple permissions (OR logic) with inheritance
const canViewSomething = await PermissionsService.hasAnyPermission(
  userId,
  workspaceId,
  ['expenses.view.all', 'expenses.view.department', 'expenses.view.own']
);

// ✅ CORRECT - Check multiple permissions (AND logic) with inheritance
const canManageEverything = await PermissionsService.hasAllPermissions(
  userId,
  workspaceId,
  ['expenses.view', 'expenses.edit', 'expenses.approve']
);

// ✅ CORRECT - Get permissions with inheritance source info
const effectivePermissions = await PermissionsService.getEffectivePermissions(userId, workspaceId);
console.log(`Permissions source: ${effectivePermissions.source}`); // 'direct', 'inherited', or 'none'
if (effectivePermissions.source === 'inherited') {
  console.log(`Inherited from: ${effectivePermissions.inheritedFrom}`);
}

// ✅ CORRECT - Full permissions object with inheritance
const userPermissions = await PermissionsService.getUserPermissions(userId, workspaceId);

// ❌ INCORRECT - Direct Firestore query bypasses inheritance
const directDoc = await getDoc(doc(db, 'userPermissions', `${userId}_${workspaceId}`));
```

### 2. **When Creating New Access Control Services**

Follow the pattern established in `lib/expense-access-control.ts`:

```typescript
export class FeatureAccessControl {
  static async getUserAccess(userId: string, workspaceId: string) {
    // Use PermissionsService for inheritance support
    const userPermissions = await PermissionsService.getUserPermissions(userId, workspaceId);
    
    if (!userPermissions) {
      return { accessLevel: 'none' };
    }
    
    // Check permissions with inheritance already applied
    const canViewAll = this.hasPermission(userPermissions.permissions, 'feature.view.all');
    // ... rest of access logic
  }
}
```

### 3. **When Building UI Components**

Use permission hooks that automatically include inheritance:

```typescript
import { usePermissions } from '@/hooks/use-permissions';

function FeatureComponent() {
  const { hasPermission } = usePermissions({
    userId: user.id,
    workspaceId: currentWorkspace.id
  });
  
  // This automatically includes inheritance
  if (!hasPermission('feature.view')) {
    return <NoAccessMessage />;
  }
  
  return <FeatureContent />;
}
```

## Debugging Permission Inheritance

### 2. **Debugging Permission Inheritance**

The PermissionsService includes utilities for debugging permission inheritance:

```typescript
// Get detailed permission source information
const effectivePermissions = await PermissionsService.getEffectivePermissions(userId, workspaceId);
console.log('Permission source:', effectivePermissions.source); // 'direct', 'inherited', or 'none'
if (effectivePermissions.source === 'inherited') {
  console.log('Inherited from workspace:', effectivePermissions.inheritedFrom);
}

// Test specific permission
const hasViewAll = await PermissionsService.hasPermission(userId, workspaceId, 'expenses.view.all');
console.log(`User ${userId} has expenses.view.all in ${workspaceId}:`, hasViewAll);

// Check multiple permissions at once
const canViewSomething = await PermissionsService.hasAnyPermission(
  userId, 
  workspaceId, 
  ['expenses.view.all', 'expenses.view.department', 'expenses.view.own']
);
console.log('User can view expenses:', canViewSomething);
```

### 2. **Inheritance Chain Verification**

To verify inheritance is working:

1. Check current workspace permissions
2. Check parent workspace permissions  
3. Verify workspace hierarchy in Firestore
4. Check console logs for inheritance flow
5. Use `getEffectivePermissions()` to see inheritance source

### 3. **Permission Testing Scenarios**

```typescript
// Test inheritance flow
describe('Permission Inheritance Scenarios', () => {
  it('should use direct permissions when available', async () => {
    const effective = await PermissionsService.getEffectivePermissions(userId, childWorkspaceId);
    expect(effective.source).toBe('direct');
  });

  it('should inherit from parent when no direct permissions', async () => {
    const effective = await PermissionsService.getEffectivePermissions(userId, childWorkspaceId);
    expect(effective.source).toBe('inherited');
    expect(effective.inheritedFrom).toBe(parentWorkspaceId);
  });

  it('should return none when no permissions found', async () => {
    const effective = await PermissionsService.getEffectivePermissions(userId, orphanWorkspaceId);
    expect(effective.source).toBe('none');
    expect(effective.permissions).toBeNull();
  });
});
```

## Security Considerations

### 1. **Permission Scope**

- Inherited permissions apply to the **current workspace context**
- Users cannot access parent workspace data directly through inheritance
- Permissions are scoped to the workspace where they're being checked

### 2. **Permission Escalation Prevention**

- Child workspaces cannot grant permissions to parent workspaces
- Only parent → child inheritance is supported
- Direct permission grants always override inherited permissions

### 3. **Audit Trail**

- Inherited permissions maintain original `grantedBy` and `grantedAt` information
- Permission inheritance is logged for audit purposes
- UI clearly indicates when permissions are inherited vs. directly granted

## Future Enhancements

### 1. **Multi-Level Inheritance**

Currently supports parent → child inheritance. Could be extended to:
- Grandparent → parent → child inheritance
- Role-based inheritance across workspace levels

### 2. **Permission Overrides**

Could implement explicit permission overrides in child workspaces:
- Allow child workspace to explicitly deny inherited permissions
- Support "local only" permissions that don't inherit

### 3. **Inheritance Policies**

Could add configurable inheritance policies:
- Which permission types inherit automatically
- Which workspaces participate in inheritance
- Inheritance expiration and renewal policies

## Testing Permission Inheritance

### 1. **Manual Testing Steps**

1. Create parent workspace with user permissions
2. Create child workspace under parent
3. Verify user can access features in child workspace
4. Check console logs for inheritance flow
5. Test permission changes propagate correctly

### 2. **Automated Testing**

```typescript
describe('Permission Inheritance', () => {
  it('should inherit parent workspace permissions', async () => {
    // Setup parent workspace with permissions
    await PermissionsService.setUserPermissions(userId, parentWorkspaceId, permissions, grantedBy);
    
    // Check inheritance in child workspace
    const inheritedPermissions = await PermissionsService.getUserPermissions(userId, childWorkspaceId);
    
    expect(inheritedPermissions).toBeTruthy();
    expect(inheritedPermissions.permissions['feature.view']).toBeTruthy();
  });

  it('should provide inheritance source information', async () => {
    const effective = await PermissionsService.getEffectivePermissions(userId, childWorkspaceId);
    
    expect(effective.source).toBe('inherited');
    expect(effective.inheritedFrom).toBe(parentWorkspaceId);
    expect(effective.permissions).toBeTruthy();
  });

  it('should support complex permission checks', async () => {
    // Test OR logic
    const canViewSomething = await PermissionsService.hasAnyPermission(
      userId, 
      workspaceId, 
      ['feature.view.all', 'feature.view.department']
    );
    expect(canViewSomething).toBe(true);

    // Test AND logic
    const canManageEverything = await PermissionsService.hasAllPermissions(
      userId, 
      workspaceId, 
      ['feature.view', 'feature.edit', 'feature.delete']
    );
    expect(canManageEverything).toBe(false); // Assuming not all permissions granted
  });
});
```

---

**Note**: This inheritance system is fundamental to SPT Teams' hierarchical workspace architecture. Always consider inheritance when implementing new permission-based features to ensure consistent user experience across the workspace hierarchy.
