# Profile System - Security Rules

## Firestore Security Rules for Profile Management

Add these rules to your Firestore security rules to ensure proper access control for the profile system:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and update their own profile
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      
      // Only allow certain fields to be updated
      allow update: if request.auth != null && 
        request.auth.uid == userId &&
        !('role' in request.resource.data.diff(resource.data)) && // Prevent role changes
        !('workspaceId' in request.resource.data.diff(resource.data)); // Prevent workspace changes
      
      // Admins and owners can read all users in their workspace
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'owner'] &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId == resource.data.workspaceId;
    }
    
    // Profile images storage rules
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firebase Storage Security Rules

Add these rules to your Firebase Storage for avatar uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload and manage their own avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Validate file size and type for uploads
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 && // Max 5MB
        request.resource.contentType.matches('image/.*'); // Only images
    }
  }
}
```

## Profile Validation Rules

### Client-side Validation:
- ✅ Email format validation
- ✅ Phone number format validation  
- ✅ Required field validation
- ✅ File size validation (5MB max)
- ✅ Image type validation

### Server-side Security:
- ✅ Role changes prevented through UI
- ✅ Workspace changes prevented
- ✅ User can only edit own profile
- ✅ Admins can view team profiles
- ✅ File upload restrictions enforced

## Profile Completeness Calculation

The system calculates profile completeness based on:

### Required Fields (60% weight):
- First Name
- Last Name  
- Email
- Phone
- Job Title
- Department

### Optional Fields (40% weight):
- Bio
- Avatar
- Address (city + country minimum)
- Social Links (at least one)
- Skills (at least one)
- Languages (at least one)
- Timezone

## Usage Examples

### Update Profile:
```typescript
await ProfileService.updateProfile(userId, {
  firstName: 'John',
  lastName: 'Doe',
  bio: 'Updated bio...'
});
```

### Upload Avatar:
```typescript
const avatarUrl = await ProfileService.updateAvatar(userId, fileInput.files[0]);
```

### Add Skills:
```typescript
await ProfileService.addSkill(userId, 'React');
```

### Search Profiles:
```typescript
const users = await ProfileService.searchProfiles('javascript', workspaceId);
```
