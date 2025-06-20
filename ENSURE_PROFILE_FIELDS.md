# Ensure Profile Fields in Database

## Profile Fields Structure

Your user document in Firestore should have all these fields for complete profile functionality:

### Core Fields (Created during registration)
```json
{
  "id": "user-id",
  "email": "abbanb2@gmail.com",
  "name": "Bismark Abban",
  "firstName": "Bismark",
  "lastName": "Abban",
  "phone": "+233205430962",
  "role": "owner", // <-- Change this to "owner"
  "status": "active",
  "jobTitle": "React Developer",
  "department": "development",
  "workspaceId": "your-workspace-id",
  "teamIds": [],
  "branchId": null,
  "regionId": null,
  "createdAt": "timestamp",
  "lastActive": "timestamp"
}
```

### Additional Profile Fields (Added via profile update)
```json
{
  "avatar": "url-to-avatar-image",
  "bio": "Your bio text",
  "dateOfBirth": null,
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "country": "",
    "postalCode": ""
  },
  "socialLinks": {
    "linkedin": "",
    "twitter": "",
    "github": "",
    "website": ""
  },
  "skills": ["React", "TypeScript", "Firebase"],
  "languages": ["English", "Twi"],
  "timezone": "GMT",
  "preferredContactMethod": "email",
  "profileCompleteness": 60
}
```

## How to Add Missing Fields

### Option 1: Update via UI
1. Go to your Profile page (`/dashboard/profile`)
2. Fill in all the fields
3. Click "Save Changes" - this will create any missing fields

### Option 2: Manual Firebase Console Update
1. Go to Firebase Console → Firestore
2. Find your user document in the `users` collection
3. Add any missing fields manually
4. Make sure to set `role` to `"owner"`

### Option 3: Use the Profile Update Function
The profile update is now working properly:
- Settings page saves basic profile info
- Profile page saves extended profile info
- All fields are automatically created when you save

## Testing Profile Update

1. **Update via Settings**:
   - Go to `/dashboard/settings`
   - Change any field (e.g., job title)
   - Click "Save Changes"
   - Check Firebase Console to verify update

2. **Update via Profile Page**:
   - Go to `/dashboard/profile`
   - Add skills, languages, bio, etc.
   - Save each section
   - Verify in Firebase Console

## Profile Completeness Calculation

The system automatically calculates profile completeness based on:
- **Required fields (60% weight)**: firstName, lastName, email, phone, jobTitle, department
- **Optional fields (40% weight)**: bio, avatar, address, socialLinks, skills, languages, timezone

## What's Working Now

✅ Profile updates save to Firebase
✅ Settings page updates basic info
✅ Profile page updates extended info
✅ Profile completeness is calculated
✅ All fields are properly typed
✅ Real-time updates reflect immediately

## Next Steps

1. Fix your role to "owner" in Firebase
2. Test profile updates to ensure they're saving
3. Upload an avatar to test file storage
4. Add some skills and languages to test arrays 