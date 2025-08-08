# 📱 SPT Teams Mobile App

A comprehensive React Native mobile application for enterprise workspace management, built with Expo and Firebase.

## 🚀 Features

- **Authentication**: Email/password, Google OAuth, and guest access
- **Dashboard**: Unified workspace overview with quick actions
- **Workspace Management**: Hierarchical workspace navigation
- **Task Management**: Create, assign, and track tasks
- **Financial Management**: Expense tracking and budget management
- **HR Management**: Employee directory, attendance, and leave management
- **Document Management**: File sharing and collaboration
- **Analytics**: Custom dashboards and reporting
- **AI Assistant**: Natural language queries and insights
- **Calendar & Scheduling**: Event management and meeting scheduling
- **Communication**: Messaging and video calls
- **Mobile-First Design**: Optimized for smartphones and tablets

## 🛠️ Tech Stack

- **Frontend**: React Native 0.79+ with Expo SDK 53
- **Navigation**: Expo Router with file-based routing
- **State Management**: Zustand with persistence
- **Backend**: Firebase (Firestore, Auth, Storage)
- **UI Framework**: React Native Paper + Custom Components
- **Icons**: Expo Vector Icons (Ionicons)
- **Storage**: AsyncStorage + Expo SecureStore
- **Development**: TypeScript, ESLint, Prettier

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Firebase project setup

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd workflow_app
npm install
```

### 2. Environment Configuration

✅ **Already configured** - The `.env` file contains all necessary Firebase configuration from your web app:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDCjjos8UaA3ICFGiUBc6N3aWNTrcoA-Uc
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=spt-team.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=spt-team
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=spt-team.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=885493648343
EXPO_PUBLIC_FIREBASE_APP_ID=1:885493648343:web:a45f82cb9b55d56ece1992

# Additional Services (for future features)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyDxPMdRzwJ2jNA5M3Rmm2s26tmC7dyFXHw
EXPO_PUBLIC_AGORA_APP_ID=821a4893963f4896868d01c3aff9c6e9
EXPO_PUBLIC_EXCHANGERATE_API_KEY=4028b9c9111ba9b05551162f
```

### 3. Firebase Setup

✅ **Already configured** - Using the same Firebase project as your web app:
- Project: `spt-team`
- Authentication: Email/Password and Google providers enabled
- Firestore: Database created and configured
- Storage: Enabled and configured

### 4. Google Authentication Setup

✅ **Already configured** - Using the same Google Auth setup as your web app:
- Google provider enabled in Firebase Console
- OAuth consent screen configured
- **Note**: SHA-1 fingerprint will need to be added for Android builds when you're ready to deploy

### 5. Run the App

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## 📱 App Structure

```
workflow_app/
├── app/                    # Expo Router screens
│   ├── auth/              # Authentication screens
│   ├── dashboard.tsx      # Main dashboard
│   ├── tasks/             # Task management
│   ├── financial/         # Financial management
│   ├── hr/                # HR management
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── constants/             # App constants and theme
├── hooks/                 # Custom React hooks
├── lib/                   # Firebase configuration
├── services/              # API services
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── assets/                # Images and fonts
```

## 🎨 Design System

The app follows the SPT Teams brand design with:

- **Primary Colors**: Deep maroon (#8A0F3C) and bright crimson (#CF163C)
- **Brand Colors**: Indigo, cyan, orange, rose, emerald
- **Typography**: System fonts with responsive sizing
- **Layout**: Card-based design with glass morphism effects
- **Icons**: Ionicons with consistent sizing
- **Animations**: Smooth transitions and spring animations

## 🔐 Authentication Flow

1. **Login/Register**: Email/password or Google OAuth
2. **Onboarding**: New users are guided through workspace setup
3. **Dashboard**: Main workspace overview
4. **Role-based Access**: Owner, Admin, and Member permissions

## 📊 Data Architecture

The app uses the same Firebase collections as the web app:

- `users`: User profiles and preferences
- `workspaces`: Workspace information and settings
- `tasks`: Task management and tracking
- `expenses`: Financial expense tracking
- `employees`: HR employee data
- `documents`: File management and sharing
- `activities`: User activity logging

## 🚀 Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and Firebase integration
- [x] Authentication system
- [x] Basic navigation and dashboard
- [x] Core UI components

### Phase 2: Core Features 🚧
- [ ] Task management implementation
- [ ] Team collaboration features
- [ ] Document management
- [ ] Basic analytics

### Phase 3: Business Features 📋
- [ ] Financial management
- [ ] HR management
- [ ] Advanced analytics
- [ ] Calendar integration

### Phase 4: Advanced Features 📋
- [ ] AI assistant integration
- [ ] Push notifications
- [ ] Offline functionality
- [ ] Performance optimization

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📦 Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software for SPT Teams workspace management.

## 🆘 Support

For support and questions:
- Check the documentation
- Review Firebase setup guides
- Contact the development team

## 🔄 Updates

The mobile app is designed to stay in sync with the web application, sharing the same Firebase backend and data structure for seamless cross-platform experience.
