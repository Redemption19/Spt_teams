# Fix User Role to Owner

## The Issue
Your user was created as a "Member" instead of "Owner" because of a workspace mismatch during registration.

## Quick Fix in Firebase Console

1. **Go to Firebase Console**
   - Open [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Navigate to **Firestore Database**

2. **Find Your User Document**
   - Go to the `users` collection
   - Find the document with your user ID (check the Authentication tab for your UID)
   - Or search for the document with email: `abbanb2@gmail.com`

3. **Update the Role Field**
   - Click on the user document
   - Find the `role` field (currently shows "member")
   - Click the edit icon
   - Change the value from `"member"` to `"owner"`
   - Click **Update**

4. **Update Workspace Association (if needed)**
   - Check the `workspaceId` field
   - If it's `"workspace-1"` but you created a different workspace:
     - Go to `workspaces` collection
     - Find your created workspace
     - Copy its ID
     - Update the user's `workspaceId` field with this ID

5. **Update UserWorkspace Document**
   - Go to `userWorkspaces` collection
   - Find document with ID format: `{yourUserId}_{workspaceId}`
   - Update the `role` field to `"owner"`

## Verification

1. Refresh your profile page
2. You should now see the "Owner" badge
3. You'll have access to all admin features

## Prevention for Future Users

The code has been updated so that:
- When a user creates a workspace, they automatically become the owner
- The first user in any workspace becomes the owner
- Role assignment is properly synchronized

## Alternative: Programmatic Fix

If you prefer, you can create a temporary admin page to fix this programmatically. Let me know if you'd like me to create that. 