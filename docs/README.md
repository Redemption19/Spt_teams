# SPT Teams Documentation

This documentation website is built with Next.js and MDX, providing a comprehensive guide to the SPT Teams enterprise platform.

## 🚀 Quick Start

The documentation is already integrated into your existing Next.js application. You can access it at:

```
/docs
```

## 📁 Structure

```
docs/
├── README.md                 # This file
├── sidebar.tsx              # Navigation configuration
├── introduction.mdx         # Platform introduction
├── getting-started.mdx      # Setup guide
├── workspaces.mdx          # Workspace management
├── roles-and-permissions.mdx # RBAC system
├── financial-management.mdx # Financial features
├── hr-management.mdx       # HR management
├── ai-assistant.mdx        # AI capabilities
├── team-management.mdx     # Team features
├── security.mdx            # Security guide
├── troubleshooting.mdx     # FAQs and solutions
└── changelog.mdx           # Updates and releases

app/docs/
├── layout.tsx              # Documentation layout
├── page.tsx                # Redirects to introduction
├── providers.tsx           # MDX providers
├── introduction/page.tsx   # Introduction page
├── getting-started/page.tsx
├── workspaces/page.tsx
├── roles-and-permissions/page.tsx
├── financial-management/page.tsx
├── hr-management/page.tsx
├── ai-assistant/page.tsx
├── team-management/page.tsx
├── security/page.tsx
├── troubleshooting/page.tsx
├── changelog/page.tsx
├── reporting-analytics/page.tsx    # Placeholder
├── document-management/page.tsx    # Placeholder
└── calendar-tasks/page.tsx         # Placeholder

components/
└── docs-search.tsx         # Documentation search
```

## ✨ Features

- **Modern Design**: Integrated with your existing brand design system
- **Mobile Responsive**: Works perfectly on all devices
- **Search Functionality**: Fast search with keyboard shortcuts (Cmd/Ctrl + K)
- **Navigation**: Organized sidebar with categorized sections
- **Custom Components**: Enhanced MDX components for better UX
- **SEO Optimized**: Proper metadata and structured content

## 🎨 Brand Integration

The documentation uses your brand colors:
- **Primary**: Deep Maroon (#8A0F3C)
- **Accent**: Bright Crimson (#CF163C)
- **Consistent Spacing**: space-y-6 design system
- **Professional Typography**: Clean, readable fonts

## 📝 Content Overview

### ✅ Complete Documentation
- **Introduction**: Platform overview and features
- **Getting Started**: Quick setup guide
- **Workspace Management**: Hierarchical workspace features
- **Roles & Permissions**: RBAC system
- **Financial Management**: Expenses, budgets, invoices
- **HR Management**: Employee lifecycle, payroll, recruitment
- **AI Assistant**: AI-powered features
- **Team Management**: Team collaboration
- **Security**: Security features and best practices
- **Troubleshooting**: Common issues and solutions
- **Changelog**: Platform updates

### 🚧 Placeholder Pages (Coming Soon)
- **Reporting & Analytics**: Dynamic reporting features
- **Document Management**: File storage and collaboration
- **Calendar & Tasks**: Scheduling and task management

## 🔍 Search Features

The documentation includes a powerful search system:
- **Global Search**: Search across all documentation
- **Keyboard Shortcut**: Cmd/Ctrl + K to open search
- **Smart Results**: Relevance-based search results
- **Category Filtering**: Browse by documentation sections

## 🛠 Customization

### Adding New Pages

1. Create an MDX file in the `docs/` directory
2. Add a corresponding page in `app/docs/[section]/page.tsx`
3. Update `docs/sidebar.tsx` to include the new page

### Custom Components

The documentation uses React components with consistent styling and your brand design system. All pages follow the same layout structure with proper typography, spacing, and responsive design.

## 📱 Mobile Experience

The documentation is fully responsive with:
- **Collapsible Sidebar**: Hamburger menu on mobile
- **Touch-Friendly**: Large touch targets
- **Readable Typography**: Optimized for small screens
- **Fast Loading**: Optimized performance

## 🚀 Deployment

The documentation is part of your main Next.js application, so it deploys automatically with your existing deployment process.

## 📞 Support

For questions about the documentation system or to request additional content, please refer to the main SPT Teams support channels.

---

**Built with ❤️ for SPT Teams**