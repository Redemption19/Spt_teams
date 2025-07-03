# 🚀 SPT Teams - Advanced Workspace Management Platform

> A comprehensive, enterprise-grade team collaboration and reporting platform built with Next.js, TypeScript, and Firebase. Designed for organizations that need powerful workspace management, dynamic reporting, and seamless team collaboration.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-9-orange?style=for-the-badge&logo=firebase&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Key Features

### 🏢 **Multi-Workspace Management**
- **Hierarchical Organization**: Support for multiple workspaces with inherited permissions
- **Role-Based Access Control (RBAC)**: Owner, Admin, and Member roles with granular permissions
- **Department Management**: Organize teams by departments with specific access controls
- **Branch Management**: Multi-location support with branch-specific data isolation

### 📊 **Advanced Reporting System**
- **Dynamic Report Templates**: Create custom report templates with drag-and-drop field builder
- **Real-time Analytics Dashboard**: Comprehensive insights with interactive charts and metrics
- **Export Capabilities**: Export reports in multiple formats (PDF, Excel, CSV)
- **Approval Workflows**: Multi-stage approval process with notification system
- **Report Scheduling**: Automated report generation and distribution

### 👥 **Team Collaboration**
- **Smart Invite System**: Role-based invitations with email verification
- **Activity Tracking**: Real-time activity feeds and audit trails
- **Notification Center**: Smart notifications with role-based filtering
- **Comment System**: Collaborative discussions on reports and tasks

### 📁 **Document Management**
- **Folder Hierarchy**: Nested folder structure with inheritance permissions
- **File Sharing**: Secure file sharing with expiration dates and access controls
- **Version Control**: Track document versions and changes
- **Bulk Operations**: Efficient bulk file operations and exports

### 📅 **Calendar & Task Management**
- **Event Management**: Create and manage team events with RBAC permissions
- **Task Assignment**: Assign tasks to team members with priority levels
- **Deadline Tracking**: Visual deadline management with notifications
- **Recurring Events**: Support for recurring meetings and tasks

### 🤖 **AI Integration**
- **AI Assistant**: Powered by Google Gemini AI for intelligent insights
- **Smart Suggestions**: AI-powered recommendations for reports and workflows
- **Natural Language Processing**: Query reports using natural language
- **Automated Insights**: AI-generated insights from data patterns

### 🔐 **Enterprise Security**
- **Firebase Authentication**: Secure user authentication with MFA support
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive audit trails for compliance
- **Privacy Controls**: GDPR-compliant data handling and user privacy controls

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Auth      │  │ Dashboard   │  │   Reports   │  │   AI    │ │
│  │ Components  │  │ Components  │  │ Components  │  │Assistant│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   User      │  │   Report    │  │   Folder    │  │Calendar │ │
│  │  Service    │  │  Service    │  │  Service    │  │Service  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      Firebase Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  Firestore  │  │    Auth     │  │   Storage   │  │Functions│ │
│  │  Database   │  │   Service   │  │   Service   │  │Service  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🚦 Getting Started

### Prerequisites

- **Node.js**: v18.0 or higher
- **npm** or **yarn**: Latest version
- **Firebase Project**: Set up with Firestore, Authentication, and Storage
- **Google Gemini API**: For AI features (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/spt-teams.git
   cd spt-teams
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # AI Configuration (Optional)
   GEMINI_API_KEY=your_gemini_api_key
   
   # Email Configuration
   EMAILJS_SERVICE_ID=your_emailjs_service_id
   EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

4. **Firebase Setup**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase
   firebase init
   ```

5. **Database Migration**
   ```bash
   # Run initial data setup
   npm run setup:initial-data
   
   # Deploy Firestore rules
   firebase deploy --only firestore:rules
   
   # Deploy storage rules
   firebase deploy --only storage
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
spt-teams/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── dashboard/                # Main dashboard pages
│   ├── onboarding/              # User onboarding flow
│   └── globals.css              # Global styles
├── components/                   # Reusable UI components
│   ├── auth/                    # Authentication components
│   ├── dashboard/               # Dashboard widgets
│   ├── reports/                 # Report management
│   ├── calendar/                # Calendar components
│   ├── folders/                 # File management
│   ├── ai-assistant/            # AI chat interface
│   └── ui/                      # Base UI components
├── lib/                         # Business logic and utilities
│   ├── services/                # Service layer
│   ├── hooks/                   # Custom React hooks
│   ├── types.ts                 # TypeScript definitions
│   ├── utils.ts                 # Utility functions
│   └── firebase.ts              # Firebase configuration
├── hooks/                       # Application-wide hooks
├── public/                      # Static assets
├── scripts/                     # Database migration scripts
└── docs/                        # Documentation
```

## 🎯 Core Modules

### 1. **Authentication & User Management**
- **Multi-factor Authentication**: SMS and email-based MFA
- **Social Login**: Google, Microsoft, and GitHub integration
- **Password Reset**: Secure password reset with email verification
- **Profile Management**: Comprehensive user profile with department assignment

### 2. **Workspace Management**
- **Multi-tenant Architecture**: Isolated workspaces with shared resources
- **Invitation System**: Email-based invitations with role assignment
- **Department Hierarchy**: Nested department structure with inheritance
- **Branch Management**: Geographic location-based organization

### 3. **Report Management**
- **Template Builder**: Visual report template designer
- **Dynamic Forms**: Form generation from templates
- **Approval Workflow**: Configurable approval chains
- **Export Engine**: Multi-format export with custom layouts
- **Analytics Dashboard**: Real-time insights and trends

### 4. **Document Management**
- **Folder System**: Hierarchical folder structure
- **File Sharing**: Secure sharing with permissions
- **Version Control**: Document versioning and history
- **Bulk Operations**: Efficient file management tools

### 5. **Calendar & Events**
- **Event Creation**: Rich event creation with attachments
- **Recurring Events**: Complex recurrence patterns
- **Reminders**: Smart notification system
- **Integration**: Calendar sync with external systems

### 6. **AI Assistant**
- **Natural Language Queries**: Ask questions about your data
- **Smart Insights**: AI-generated business insights
- **Report Assistance**: AI-powered report generation
- **Predictive Analytics**: Trend analysis and forecasting

## 🔧 Configuration

### Firebase Setup

1. **Firestore Database Rules** (`firestore.rules`)
   ```javascript
   // Example security rules
   match /workspaces/{workspaceId} {
     allow read, write: if request.auth != null && 
       resource.data.members[request.auth.uid] in ['owner', 'admin', 'member'];
   }
   ```

2. **Storage Rules** (`storage.rules`)
   ```javascript
   // Secure file upload rules
   match /workspaces/{workspaceId}/files/{allPaths=**} {
     allow read, write: if request.auth != null;
   }
   ```

### Email Configuration

Set up EmailJS for transactional emails:
1. Create an EmailJS account
2. Configure email templates for invitations and notifications
3. Add your service credentials to environment variables

## 📊 Analytics & Monitoring

### Performance Monitoring
- **Real-time Analytics**: Built-in analytics dashboard
- **Performance Metrics**: Page load times and user interactions
- **Error Tracking**: Comprehensive error logging
- **User Activity**: Detailed user behavior analytics

### Health Checks
```bash
# Check system health
npm run health-check

# Run performance tests
npm run test:performance

# Analyze bundle size
npm run analyze
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Service layer and API integration tests
- **E2E Tests**: Full user workflow testing with Playwright

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (Recommended)
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Deploy Firebase Functions**
   ```bash
   firebase deploy --only functions
   ```

### Environment Configuration

#### Production Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Performance Optimization
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Route-based code splitting
- **Caching**: Redis caching for frequently accessed data
- **CDN**: Global content delivery for static assets

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple instance deployment
- **Database Sharding**: Firestore collection partitioning
- **Caching Layer**: Redis for session and data caching
- **CDN Integration**: Global asset distribution

### Monitoring & Observability
- **Application Monitoring**: Real-time performance tracking
- **Error Tracking**: Automated error reporting
- **Health Checks**: Endpoint health monitoring
- **Analytics**: User behavior and performance analytics

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: All data encrypted in Firestore
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Access Control**: Role-based permissions system
- **Audit Logging**: Comprehensive activity logging

### Privacy & Compliance
- **GDPR Compliance**: Data export and deletion tools
- **Data Retention**: Configurable data retention policies
- **Privacy Controls**: User privacy preference management
- **Consent Management**: Cookie and data usage consent

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance

## 📚 Documentation

- **[API Documentation](docs/api.md)**: Complete API reference
- **[User Guide](docs/user-guide.md)**: End-user documentation
- **[Admin Guide](docs/admin-guide.md)**: Administrator documentation
- **[Development Guide](docs/development.md)**: Developer resources

## 🆘 Support

### Getting Help
- **Documentation**: Check our comprehensive docs
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join our GitHub Discussions
- **Email**: Contact support@spt-teams.com

### FAQ

**Q: How do I add a new workspace?**
A: Navigate to Settings > Workspaces > Create New Workspace

**Q: Can I customize report templates?**
A: Yes, use the visual template builder in Reports > Templates

**Q: How do I backup my data?**
A: Use the export feature in Settings > Data Export

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Firebase Team**: For the robust backend services
- **Tailwind CSS**: For the utility-first CSS framework
- **Lucide Icons**: For the beautiful icon set
- **shadcn/ui**: For the excellent UI components

---

<p align="center">
  Made with ❤️ by the SPT Teams Development Team
</p>

<p align="center">
  <a href="https://your-domain.com">🌐 Website</a> •
  <a href="https://docs.your-domain.com">📖 Documentation</a> •
  <a href="https://github.com/your-username/spt-teams/issues">🐛 Report Bug</a> •
  <a href="https://github.com/your-username/spt-teams/discussions">💬 Discussions</a>
</p>
