# Initial Data Setup Guide

## Setting Up Branches and Regions

Since the registration form references branches and regions, you need to create them in Firestore first.

### Option 1: Use Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Firestore Database**
3. Create collections manually:

#### Create Regions:
- Collection: `regions`
- Add documents with IDs: `greater-accra`, `ashanti`, `eastern`, `western`, `northern`

Example document structure:
```json
{
  "id": "greater-accra",
  "name": "Greater Accra",
  "description": "Capital region",
  "workspaceId": "workspace-1",
  "branches": [],
  "adminIds": [],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Create Branches:
- Collection: `branches`
- Add documents with IDs: `central-branch`, `east-legon-branch`, `kumasi-central`, `tema-branch`

Example document structure:
```json
{
  "id": "central-branch",
  "name": "Accra Branch",
  "description": "Main headquarters",
  "regionId": "greater-accra",
  "workspaceId": "workspace-1",
  "managerId": null,
  "adminIds": [],
  "teamIds": [],
  "userIds": [],
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Option 2: Remove Branch/Region from Registration

For now, you can simply:
1. Leave the Branch and Region fields empty when registering
2. Set them up later through the admin dashboard
3. The system will create users without branch assignment

### Option 3: Create a Setup Script

Once logged in as admin, you can go to the dashboard and:
1. Navigate to `/dashboard/regions` to create regions
2. Navigate to `/dashboard/branches` to create branches
3. Then assign users to branches later

## Testing Registration Without Branches

1. Try registering with:
   - Email: test@example.com
   - Password: test123456
   - Leave Region and Branch as "None"

2. The user should be created successfully
3. Branch assignment can be done later by admin

## Next Steps

After successful registration:
1. First user becomes workspace owner
2. Owner can create regions and branches
3. Owner can then assign users to branches
4. Team structure can be built out 