'use client';

import { FolderOpen, Upload, Share2, Lock, Search, Tag, FileText, Download, Users, Eye, Edit, GitBranch, Clock, Shield, Zap, BarChart3, Settings, Star, Filter, Archive, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DocumentManagementPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Document Management
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          SPT Teams provides secure document storage, organization, and collaboration features 
          with advanced access controls and intelligent document management.
        </p>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📁 Core Features</h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Folder Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize documents in hierarchical folder structures with smart categorization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                File Upload & Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Secure file upload with support for multiple formats and version control.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share documents and collaborate in real-time with team members.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Access Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Granular access controls with role-based permissions and sharing settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Document Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Powerful search capabilities with content indexing and metadata search.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Tagging & Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tag documents and add metadata for better organization and discovery.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Enhanced Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Advanced Document Features
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-green-500" />
                Version Control
              </CardTitle>
              <CardDescription>
                Complete document history and version management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Automatic version tracking</li>
                <li>• Compare document versions</li>
                <li>• Rollback to previous versions</li>
                <li>• Change history logs</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Real-time Collaboration
              </CardTitle>
              <CardDescription>
                Seamless team collaboration and editing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time collaborative editing</li>
                <li>• Comment and annotation system</li>
                <li>• Review and approval workflows</li>
                <li>• Live cursor tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Security & Permissions
              </CardTitle>
              <CardDescription>
                Enterprise-grade security and access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Granular permission controls</li>
                <li>• Document encryption</li>
                <li>• Access audit trails</li>
                <li>• Watermarking and DRM</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Document Management Guide */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📚 Document Management Guide</h2>
        
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="getting-started" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Uploading Documents
                  </CardTitle>
                  <CardDescription>
                    Multiple ways to add documents to your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Upload Methods:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Drag and drop files</li>
                        <li>• Browse and select files</li>
                        <li>• Bulk upload with folders</li>
                        <li>• Email-to-document feature</li>
                        <li>• Cloud storage sync</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Supported Formats:</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">PDF</Badge>
                        <Badge variant="outline">DOCX</Badge>
                        <Badge variant="outline">XLSX</Badge>
                        <Badge variant="outline">PPTX</Badge>
                        <Badge variant="outline">Images</Badge>
                        <Badge variant="outline">Videos</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Viewing & Previewing
                  </CardTitle>
                  <CardDescription>
                    Rich document preview and viewing options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• In-browser document preview</li>
                    <li>• Full-screen viewing mode</li>
                    <li>• Thumbnail grid view</li>
                    <li>• Mobile-optimized viewing</li>
                    <li>• Print and download options</li>
                    <li>• Annotation and markup tools</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="organization" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Folder Structure
                  </CardTitle>
                  <CardDescription>
                    Best practices for organizing documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Recommended Structure:</h4>
                      <div className="bg-muted p-3 rounded text-sm font-mono">
                        📁 Company Documents<br/>
                        ├── 📁 HR & Policies<br/>
                        ├── 📁 Financial Records<br/>
                        ├── 📁 Projects<br/>
                        │   ├── 📁 Project Alpha<br/>
                        │   └── 📁 Project Beta<br/>
                        ├── 📁 Marketing Materials<br/>
                        └── 📁 Legal & Compliance
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tagging System
                  </CardTitle>
                  <CardDescription>
                    Flexible tagging for better organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Tag Categories:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Department</Badge>
                        <Badge>Project</Badge>
                        <Badge>Priority</Badge>
                        <Badge>Status</Badge>
                        <Badge>Type</Badge>
                        <Badge>Confidential</Badge>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Auto-tagging with AI</li>
                      <li>• Custom tag creation</li>
                      <li>• Tag-based filtering</li>
                      <li>• Bulk tag operations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="collaboration" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Collaborative Editing
                  </CardTitle>
                  <CardDescription>
                    Real-time document collaboration features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time collaborative editing</li>
                    <li>• Live cursor and selection tracking</li>
                    <li>• Conflict resolution system</li>
                    <li>• Auto-save and sync</li>
                    <li>• Offline editing with sync</li>
                    <li>• Edit history and attribution</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Comments & Reviews
                  </CardTitle>
                  <CardDescription>
                    Comprehensive review and feedback system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Inline comments and suggestions</li>
                    <li>• Review and approval workflows</li>
                    <li>• @mentions and notifications</li>
                    <li>• Comment threads and discussions</li>
                    <li>• Resolve and track feedback</li>
                    <li>• Review status tracking</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics & Insights
                  </CardTitle>
                  <CardDescription>
                    Document usage and performance analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Document usage statistics</li>
                    <li>• User engagement metrics</li>
                    <li>• Storage utilization reports</li>
                    <li>• Collaboration insights</li>
                    <li>• Performance optimization</li>
                    <li>• Custom analytics dashboards</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Integration & API
                  </CardTitle>
                  <CardDescription>
                    Connect with external systems and tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Cloud storage sync (Google Drive, OneDrive)</li>
                    <li>• Email integration</li>
                    <li>• CRM and ERP connections</li>
                    <li>• Workflow automation tools</li>
                    <li>• REST API access</li>
                    <li>• Webhook notifications</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Security & Compliance */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔒 Security & Compliance</h2>
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Document security is paramount. SPT Teams implements enterprise-grade security measures to protect your sensitive information.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• End-to-end encryption</li>
                <li>• Encrypted storage at rest</li>
                <li>• Secure transmission protocols</li>
                <li>• Regular security audits</li>
                <li>• GDPR compliance</li>
                <li>• Data residency options</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Access Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi-factor authentication</li>
                <li>• Single sign-on (SSO)</li>
                <li>• IP whitelisting</li>
                <li>• Session management</li>
                <li>• Audit trail logging</li>
                <li>• Suspicious activity detection</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Related Documentation */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 Related Documentation</h2>
        <p className="text-muted-foreground">
          While we prepare the detailed document management documentation, explore these related topics:
        </p>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">
                  AI Document Intelligence
                </Link>
              </CardTitle>
              <CardDescription>
                Learn about AI-powered document analysis and improvement suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/ai-assistant">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/roles-and-permissions" className="hover:text-primary transition-colors">
                  Access Controls
                </Link>
              </CardTitle>
              <CardDescription>
                Understand role-based permissions and access control for documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/roles-and-permissions">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/team-management" className="hover:text-primary transition-colors">
                  Team Collaboration
                </Link>
              </CardTitle>
              <CardDescription>
                Learn about team-based document sharing and collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/team-management">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/security" className="hover:text-primary transition-colors">
                  Document Security
                </Link>
              </CardTitle>
              <CardDescription>
                Understand security features for document protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/security">View Guide</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}