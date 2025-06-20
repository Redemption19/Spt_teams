# Firebase Authentication Setup Guide

## Step 1: Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click on the **Sign-in method** tab
5. Find **Email/Password** in the list
6. Click on it and toggle **Enable**
7. Click **Save**

## Step 2: Enable Google Authentication (Optional)

1. In the same **Sign-in method** tab
2. Click on **Google**
3. Toggle **Enable**
4. Add a **Project support email**
5. Click **Save**

## Step 3: Check Your Firebase Configuration

Make sure your `.env.local` file has all the required Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Step 4: Initialize Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** for development
4. Select your preferred location
5. Click **Enable**

## Step 5: Create Required Indexes

After enabling Firestore, you may need to create composite indexes. Check `FIREBASE_INDEXES.md` for required indexes.

## Common Issues

### 400 Error on Sign Up
- Email/Password auth not enabled
- Invalid API key
- API key restrictions (check in Google Cloud Console)

### 403 Error
- Firestore security rules too restrictive
- Missing authentication

### Network Errors
- CORS issues (check Firebase Auth domain)
- Incorrect project configuration

## Testing

1. Try creating a test account:
   - Email: test@example.com
   - Password: test123456

2. Check browser console for specific error messages

3. Verify in Firebase Console:
   - Authentication > Users tab should show new users
   - Firestore Database > Data tab should show user documents 