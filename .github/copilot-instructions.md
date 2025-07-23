# SPT Teams - AI Coding Agent Instructions

## 👨‍💻 Development Philosophy

You are a senior full-stack software development assistant. Your primary responsibility is to help design, debug, and build scalable, secure, and maintainable applications for the SPT Teams platform.

### Core Development Principles
- **Clean Architecture**: Follow separation of concerns and modular design
- **Maintainability**: Write reusable, well-documented code
- **Security First**: Use environment variables, validate inputs, implement proper RBAC
- **Performance**: Optimize database queries, use pagination, implement caching
- **Accessibility**: Follow WCAG guidelines, use semantic HTML, proper ARIA labels
- **Mobile-First**: Design responsive layouts that work across all devices

## 🏗️ Project Architecture

**SPT Teams** is an enterprise workspace management platform built with Next.js 14, TypeScript, Firebase, and Google Gemini AI. It features hierarchical multi-workspace support, advanced RBAC, and AI-powered insights.

### Core Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage), Google Gemini AI
- **UI**: Radix UI components, FullCalendar, EmailJS
- **State**: React Context for auth, workspace, notifications, themes
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui components

### Supported Tech Stack Patterns
- **Frontend**: React, Next.js, Tailwind CSS, Shadcn/ui, Framer Motion
- **Backend**: Node.js (Express, NestJS), Laravel, Django, Python or FastAPI
- **Mobile**: Flutter, React Native
- **Databases**: PostgreSQL, MySQL, MongoDB, Firebase
- **Dev Tools**: Git, GitHub, Docker, Postman, Swagger, CI/CD

## 🎯 Key Architectural Patterns

### 1. Service Layer Architecture
All business logic lives in `lib/` services following this pattern:
```typescript
// Example: lib/workspace-service.ts
export class WorkspaceService {
  static async createWorkspace(data: WorkspaceData, userId: string): Promise<string> {
    // Firebase operations with error handling
  }
}
```

### 2. Hierarchical RBAC System
- **Roles**: `owner` > `admin` > `member` with granular permissions
- **Permissions**: Defined in `lib/permissions-service.ts` with feature-based categorization
- **Inheritance**: Workspace → Department → Project → Task hierarchy
- **Hook**: Use `lib/rbac-hooks.tsx` for permission checks in components

### 3. AI Service Orchestration
The AI system follows a layered architecture in `lib/ai-*`:
```typescript
// Main orchestrator (maintains backward compatibility)
import { AIDataService } from './lib/ai-data-service';

// Specialized services handle specific domains
import { DepartmentService } from './lib/ai-services/department-service';
```

### 4. Firebase Integration Patterns
- **Collections**: Use hierarchical structure (`workspaces/{id}/departments/{id}`)
- **Utils**: `lib/firestore-utils.ts` for data cleaning and transformations
- **Emulators**: Development uses Firebase emulators (see `package.json` scripts)

## 📱 Frontend Development Standards

### Responsive Design (Mobile-First)
Always design with **mobile-first** in mind, then scale up:
- Use **Tailwind CSS breakpoints**: `sm:` (≥640px) → `md:` (≥768px) → `lg:` (≥1024px) → `xl:` (≥1280px) → `2xl:` (≥1536px)
- Ensure **DataTables**, **Cards**, and **Forms** collapse or stack vertically on mobile
- Sidebars should collapse into hamburger drawer on small screens
- Use `overflow-auto`, `max-w-full`, and `flex-wrap` for layout consistency
- Touch targets: minimum `h-10` height, `p-3` padding for mobile use

### Component Development Rules
- **Component-Driven**: Each component in its own file (`FormInput.tsx`, `Sidebar.tsx`)
- **Responsive Utilities**: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for flexible layouts
- **Visibility Control**: Use `hidden md:block` for responsive content
- **Forms**: React Hook Form + Zod validation (see existing patterns)
- **UI Components**: Use shadcn/ui from `components/ui/`
- **Accessibility**: Follow WCAG guidelines, proper ARIA labels

### File Organization Standards
Split logic into **smaller, focused files**:
- **Components**: `components/{feature}/ComponentName.tsx`
- **Services**: `lib/{feature}-service.ts`
- **Types**: `lib/types.ts` (canonical definitions)
- **Hooks**: `hooks/use-{feature}.ts`
- **Schemas**: `lib/schemas/` for Zod validation
- **Utils**: `lib/utils.ts` and feature-specific utilities

## 🚀 Development Workflows

### Essential Commands
```bash
# Development with emulators
npm run dev:emulator

# Firebase emulator management
npm run emulator:export    # Save emulator data
npm run emulator:import    # Load saved data

# Standard Next.js commands
npm run dev                # Development server
npm run build              # Production build
```

### Key Development Patterns

1. **Component Structure**: Follow `components/{feature}/` organization
2. **Route Handlers**: Use App Router in `app/` with nested layouts
3. **Type Safety**: All Firebase operations must use types from `lib/types.ts`
4. **Error Handling**: Services should gracefully fallback (see AI services)

## 🔧 Integration Points

### Firebase Configuration
- Environment variables in `.env.local` (see `lib/firebase.ts`)
- Emulator connection logic for development mode
- Production/development mode switching

### AI Integration
- Google Gemini AI via `lib/gemini-ai-service.ts`
- Fallback to mock data when AI services unavailable
- Real-time data from Firestore with AI analysis overlay

### Email System
- EmailJS integration for notifications and password resets
- Template management in `lib/email-service.ts`
- RBAC-aware email routing

## 🛠️ Backend Development Standards

### MVC Architecture Patterns
- **Controllers**: Handle requests, delegate to services
- **Services**: Business logic and data processing
- **Repositories**: Data access layer (Firebase operations)
- **Middleware**: Authentication, RBAC, validation

### Security & Data Handling
- **Input Validation**: Sanitize all user input using Zod schemas
- **RBAC Implementation**: Role-based access at route and service layers
- **Data Encryption**: Secure sensitive data, use environment variables
- **Error Handling**: Comprehensive logging and user-friendly error messages
- **Audit Trails**: Activity logging for compliance (see `lib/activity-service.ts`)

### API Design Principles
- **RESTful Structure**: Clear resource-based endpoints
- **Pagination**: Use for list endpoints (see analytics services)
- **Filtering & Sorting**: Support query parameters
- **HTTP Status Codes**: Return appropriate codes with clear messages
- **Versioning**: Plan for API evolution

## 📝 Critical Conventions

### 1. Permission Checking
Always use RBAC hooks before rendering sensitive UI:
```typescript
const permissions = usePermissions();
if (!permissions.canManageUsers) return null;
```

### 2. Firebase Data Handling
```typescript
// Always clean data before Firestore writes
const cleanData = cleanFirestoreData(userData);
await setDoc(doc(db, 'users', userId), cleanData);
```

### 3. Service Method Patterns
```typescript
// Standard service method signature
static async methodName(
  primaryId: string, 
  userId: string, 
  optionalData?: DataType
): Promise<ReturnType> {
  // Implementation with try-catch and logging
}
```

### 4. Component Error Boundaries
Use proper error handling in components accessing Firebase:
```typescript
try {
  const data = await ServiceName.getData(id, userId);
  // Handle success
} catch (error) {
  console.error('Service error:', error);
  // Show user-friendly error
}
```

## 🏢 Business Logic Specifics

### Workspace Hierarchy
- **Main Workspaces**: `level: 0`, own departments/projects
- **Sub-workspaces**: Inherit from parent, restricted permissions
- **Branch/Region**: Geographic organization layer

### Report System
- **Templates**: Dynamic field builder in `lib/report-template-service.ts`
- **Approval Flow**: Multi-stage with role-based routing
- **Export**: Multiple formats via `lib/export-service.ts`

### Department Management
- **AI Insights**: Real-time analysis via `lib/ai-services/department-service.ts`
- **Performance Metrics**: Integrated with analytics dashboard
- **Skill Coverage**: AI-powered skill gap analysis

## 📁 Key File Locations

- **Types**: `lib/types.ts` (canonical type definitions)
- **Auth Context**: `lib/auth-context.tsx` (user state management)
- **Permissions**: `lib/permissions-service.ts` + `lib/rbac-hooks.tsx`
- **AI Orchestrator**: `lib/ai-data-service.ts` (main AI interface)
- **Firebase Config**: `lib/firebase.ts` (environment-aware setup)
- **Documentation**: Root-level `.md` files for feature-specific guides

## 🎨 UI/UX Patterns

- **shadcn/ui**: Use existing components from `components/ui/`
- **Responsive**: Mobile-first with Tailwind responsive utilities
- **Dark Mode**: Handled via `lib/theme-context.tsx`
- **Loading States**: Implement skeleton loaders for data fetching
- **Notifications**: Use `lib/notification-context.tsx` for user feedback
- **Breadcrumbs**: Show navigation context in multi-page admin systems
- **Touch Targets**: Ensure minimum `h-10` height for mobile accessibility

## 📊 Data Export & Documentation

### Export Capabilities
- **Multiple Formats**: Support CSV, PDF, Excel exports (see `lib/export-service.ts`)
- **Bulk Operations**: Efficient bulk file operations
- **Scheduled Reports**: Automated report generation and distribution

### API Documentation
- Document APIs using Swagger/OpenAPI patterns
- Include clear examples and error responses
- Version API endpoints appropriately

## ✅ Code Quality Standards

### Testing & Debugging
- Test components using device emulation in Chrome DevTools
- Use Firebase emulators for local development
- Implement comprehensive error boundaries

### Performance Optimization
- Optimize Firebase queries with proper indexing
- Use pagination for large datasets
- Implement caching strategies where appropriate
- Minimize bundle size with code splitting

When implementing new features, always consider the hierarchical permissions, maintain service layer separation, and ensure Firebase operations are properly typed and error-handled.
