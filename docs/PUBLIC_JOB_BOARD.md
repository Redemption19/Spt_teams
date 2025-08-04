# Public Job Board & Application System

## Overview

The recruitment system includes a public job board that allows job seekers to view and apply for job postings without requiring authentication. This creates a seamless experience for potential candidates while maintaining data integrity in your recruitment pipeline.

## How It Works

### 1. **Public Job Board** (`/careers`)

- **URL**: `https://yourdomain.com/careers`
- **Access**: Public (no login required)
- **Features**:
  - View all active job postings
  - Search jobs by title, description, or keywords
  - Filter by department, job type, and location
  - Apply directly through an online form

### 2. **Job Posting Visibility**

Jobs are automatically made public when:
- Status is set to `'active'`
- Posted date is current
- No additional authentication required

### 3. **Application Process**

When a candidate applies:

1. **Form Submission**: Candidate fills out application form
2. **Data Creation**: Creates a new `Candidate` record in the database
3. **Status Tracking**: Application status set to `'applied'`
4. **Counter Update**: Job posting application count increments
5. **Notification**: Admin/HR team can see new applications in dashboard

## Implementation Details

### Database Structure

```typescript
// Job Posting (Public)
interface JobPosting {
  id: string;
  workspaceId: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote' | 'hybrid';
  salaryRange: { min: number; max: number; currency: string };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  postedDate: Date;
  applications: number; // Auto-incremented on each application
  views: number;
  // ... other fields
}

// Candidate Application (Created from public form)
interface Candidate {
  id: string;
  workspaceId: string;
  jobPostingId: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  education: string;
  location: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  appliedDate: Date;
  notes: string; // Cover letter content
  createdBy: 'public-application'; // Identifies source
  // ... other fields
}
```

### Service Methods

```typescript
// Get public job postings (no authentication required)
RecruitmentService.getPublicJobPostings(): Promise<JobPosting[]>

// Create candidate from public application
RecruitmentService.createCandidate(data): Promise<string>

// Increment application counter
RecruitmentService.incrementJobApplications(jobId): Promise<void>
```

## Workflow Integration

### 1. **Admin/HR Workflow**

1. **Create Job Posting**: Use the recruitment dashboard
2. **Set Status to Active**: Makes it visible on public board
3. **Monitor Applications**: View new applications in Candidates tab
4. **Start Interview Process**: Use Interview Management tab
5. **Track in Pipeline**: Use Hiring Pipeline tab
6. **Onboard Hires**: Use Onboarding Management tab

### 2. **Candidate Journey**

1. **Discover Jobs**: Visit `/careers`
2. **Search & Filter**: Find relevant positions
3. **Apply Online**: Fill out application form
4. **Receive Confirmation**: Application submitted successfully
5. **Wait for Contact**: HR team reviews and contacts

## Security Considerations

### Data Protection
- Public job board only shows active job postings
- No sensitive company information exposed
- Application data stored securely in Firestore
- Rate limiting can be implemented for applications

### Spam Prevention
- Form validation on client and server side
- Email verification can be added
- CAPTCHA integration possible
- Duplicate application detection

## Customization Options

### 1. **Branding**
- Customize colors and styling
- Add company logo and branding
- Modify application form fields
- Add company-specific questions

### 2. **Workflow**
- Add email notifications for new applications
- Implement application status updates
- Add automated screening questions
- Integrate with ATS systems

### 3. **Analytics**
- Track application sources
- Monitor conversion rates
- Analyze candidate demographics
- Measure time-to-hire metrics

## Usage Instructions

### For HR/Admin Users

1. **Post a Job**:
   - Go to `/dashboard/hr/recruitment`
   - Click "Post Job" button
   - Fill out job details
   - Set status to "Active"
   - Job automatically appears on public board

2. **Monitor Applications**:
   - Check "Candidates" tab for new applications
   - Review candidate details and cover letters
   - Update application status as needed

3. **Start Interview Process**:
   - Use "Interviews" tab to schedule interviews
   - Track interview feedback and ratings
   - Move candidates through hiring pipeline

### For Job Seekers

1. **Find Jobs**:
   - Visit `/careers`
   - Browse available positions
   - Use search and filters

2. **Apply**:
   - Click "Apply Now" on desired job
   - Fill out application form
   - Submit application
   - Receive confirmation

## Technical Notes

### File Structure
```
app/
├── careers/
│   └── page.tsx              # Public job board
├── dashboard/hr/recruitment/
│   └── page.tsx              # Admin recruitment dashboard
components/
├── recruitment/
│   ├── JobPostingsList.tsx   # Job management
│   ├── CandidatesList.tsx    # Application management
│   ├── InterviewManagement.tsx
│   ├── HiringPipelineManagement.tsx
│   └── OnboardingManagement.tsx
lib/
└── recruitment-service.ts    # Data operations
```

### API Endpoints
- `GET /careers` - Public job board
- `POST /api/recruitment/candidates` - Submit application
- `GET /api/recruitment/jobs/public` - Get public jobs

### Environment Variables
```env
# Optional: Add rate limiting
NEXT_PUBLIC_MAX_APPLICATIONS_PER_DAY=10
NEXT_PUBLIC_ENABLE_CAPTCHA=false
```

## Troubleshooting

### Common Issues

1. **Jobs not appearing on public board**:
   - Check job status is set to "active"
   - Verify posted date is current
   - Check for any workspace restrictions

2. **Applications not being created**:
   - Verify form validation
   - Check Firestore permissions
   - Review console for errors

3. **Application counter not updating**:
   - Check increment function
   - Verify job posting ID
   - Review database rules

### Support

For technical support or customization requests, please refer to the main documentation or contact the development team. 