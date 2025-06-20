# Firebase Firestore Index Setup

## Required Indexes

The application requires several composite indexes for Firestore queries to work properly.

### 1. User Workspaces Query

**Collection:** `userWorkspaces`
**Fields:**
- `userId` (Ascending)
- `joinedAt` (Descending)

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Cluster9c2VyV29ya3NwYWNlcxJUChEKBXVzZXJJZBABGgwKCGpvaW5lZEF0EAIaDAgIX19uYW1lX18QAg

### 2. Teams Query

**Collection:** `teams`
**Fields:**
- `workspaceId` (Ascending)  
- `createdAt` (Descending)

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=CkZwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdGVhbXMvaW5kZXhlcy9fEAEaDwoLd29ya3NwYWNlSWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC

### 3. Regions Query

**Collection:** `regions`
**Fields:**
- `workspaceId` (Ascending)
- `createdAt` (Descending)

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVnaW9ucy9pbmRleGVzL18QARoPCgt3b3Jrc3BhY2VJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI

### 4. Branches Query

**Collection:** `branches`
**Fields:**
- `workspaceId` (Ascending)
- `createdAt` (Descending)

### 5. Users Query

**Collection:** `users`
**Fields:**
- `workspaceId` (Ascending)
- `createdAt` (Descending)

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=CkZwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdXNlcnMvaW5kZXhlcy9fEAEaDwoLd29ya3NwYWNlSWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC

## Manual Index Creation

If the auto-create links don't work, manually create the indexes:

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Select your project: `spt-team`
3. Navigate to Firestore Database > Indexes
4. Click "Create Index"
5. Configure each index with the specified collection and fields

## Development Workaround

For development, you can temporarily remove the `orderBy` clause from queries to avoid index requirements. However, this should only be used during development and the proper indexes should be created for production.

## Additional Indexes That May Be Needed

Based on the application queries, you may also need these indexes:

### For Team Members Query
```
Collection: teamUsers
Fields:
  - teamId (Ascending)
  - joinedAt (Descending)
```

### For Workspace Members Query  
```
Collection: userWorkspaces
Fields:
  - workspaceId (Ascending)
  - joinedAt (Descending)
```

### For Invitations Query
```
Collection: invitations
Fields:
  - workspaceId (Ascending)
  - createdAt (Descending)
```

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvaW52aXRhdGlvbnMvaW5kZXhlcy9fEAEaDgoKd29ya3NwYWNlSWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC

### For Email-based Invitation Lookup
```
Collection: invitations
Fields:
  - email (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvaW52aXRhdGlvbnMvaW5kZXhlcy9fEAEaCQoFZW1haWwQARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC

### For Activity Logs Query
```
Collection: activityLogs
Fields:
  - workspaceId (Ascending)
  - timestamp (Descending)
```

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYWN0aXZpdHlMb2dzL2luZGV4ZXMvXxABGg4KCndvcmtzcGFjZUlkEAEaDQoJdGltZXN0YW1wEAIaDAgIX19uYW1lX18QAg

### For Activity Logs by User Query
```
Collection: activityLogs
Fields:
  - workspaceId (Ascending)
  - userId (Ascending)
  - timestamp (Descending)
```

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYWN0aXZpdHlMb2dzL2luZGV4ZXMvXxABGg4KCndvcmtzcGFjZUlkEAEaCgoGdXNlcklkEAEaDQoJdGltZXN0YW1wEAIaDAgIX19uYW1lX18QAg

### For Activity Logs by Type Query
```
Collection: activityLogs
Fields:
  - workspaceId (Ascending)
  - action (Ascending)
  - timestamp (Descending)
```

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYWN0aXZpdHlMb2dzL2luZGV4ZXMvXxABGg4KCndvcmtzcGFjZUlkEAEaCgoGYWN0aW9uEAEaDQoJdGltZXN0YW1wEAIaDAgIX19uYW1lX18QAg

### For Activity Stats Query (Date Range)
```
Collection: activityLogs
Fields:
  - workspaceId (Ascending)
  - timestamp (Ascending)
```

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/spt-team/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9zcHQtdGVhbS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYWN0aXZpdHlMb2dzL2luZGV4ZXMvXxABGg4KCndvcmtzcGFjZUlkEAEaDQoJdGltZXN0YW1wEAEaDAgIX19uYW1lX18QAg

### For Role-Based Access Control

```
Collection: userWorkspaces
Fields:
  - workspaceId (Ascending)
  - role (Ascending)
```

```
Collection: users
Fields:
  - workspaceId (Ascending)
  - role (Ascending)
```

```
Collection: teamUsers
Fields:
  - teamId (Ascending)
  - role (Ascending)
```

## Development vs Production

- **Development**: You can use the temporary fix below to avoid creating indexes
- **Production**: Always create proper indexes for better performance and reliability
