'use client';

import { Shield, Lock, Key, Eye, FileCheck, AlertTriangle, Users, Database, Globe, CheckCircle, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Security & Compliance
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Enterprise-grade security with comprehensive data protection, advanced access controls, and industry-standard compliance frameworks.
        </p>
      </div>

      {/* Security Overview */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security First Approach</AlertTitle>
        <AlertDescription>
          SPT Teams is built with security at its core, featuring end-to-end encryption, zero-trust architecture, and continuous security monitoring to protect your organization&pos;s data.
        </AlertDescription>
      </Alert>

      {/* Core Security Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Core Security Features
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Data Encryption
              </CardTitle>
              <CardDescription>
                End-to-end encryption for all data at rest and in transit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• AES-256 encryption at rest</li>
                <li>• TLS 1.3 for data in transit</li>
                <li>• Zero-knowledge architecture</li>
                <li>• Hardware security modules</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-500" />
                Access Control
              </CardTitle>
              <CardDescription>
                Advanced authentication and authorization systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Multi-factor authentication</li>
                <li>• Single sign-on (SSO)</li>
                <li>• Role-based access control</li>
                <li>• Conditional access policies</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                Monitoring & Auditing
              </CardTitle>
              <CardDescription>
                Comprehensive security monitoring and audit trails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time threat detection</li>
                <li>• Comprehensive audit logs</li>
                <li>• Security incident response</li>
                <li>• Compliance reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-orange-500" />
                Compliance
              </CardTitle>
              <CardDescription>
                Industry-standard compliance certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• SOC 2 Type II certified</li>
                <li>• GDPR compliant</li>
                <li>• HIPAA ready</li>
                <li>• ISO 27001 aligned</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-red-500" />
                Data Protection
              </CardTitle>
              <CardDescription>
                Advanced data loss prevention and backup systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Automated data backups</li>
                <li>• Data loss prevention (DLP)</li>
                <li>• Geographic data residency</li>
                <li>• Right to be forgotten</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                Network Security
              </CardTitle>
              <CardDescription>
                Robust network protection and secure communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Web application firewall</li>
                <li>• DDoS protection</li>
                <li>• IP allowlisting</li>
                <li>• VPN integration</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Security Guide */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Security Configuration Guide
        </h2>
        
        <Tabs defaultValue="authentication" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="access-control">Access Control</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="authentication" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Multi-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Secure user authentication with multiple factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• SMS and email verification</li>
                    <li>• Authenticator app support (TOTP)</li>
                    <li>• Hardware security keys (FIDO2)</li>
                    <li>• Biometric authentication</li>
                    <li>• Backup recovery codes</li>
                    <li>• Adaptive authentication policies</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Single Sign-On (SSO)
                  </CardTitle>
                  <CardDescription>
                    Streamlined authentication with enterprise identity providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• SAML 2.0 integration</li>
                    <li>• OAuth 2.0 and OpenID Connect</li>
                    <li>• Active Directory integration</li>
                    <li>• Azure AD and Google Workspace</li>
                    <li>• Custom identity provider support</li>
                    <li>• Just-in-time (JIT) provisioning</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="access-control" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role-Based Access Control
                  </CardTitle>
                  <CardDescription>
                    Granular permissions and role management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Predefined security roles</li>
                    <li>• Custom role creation</li>
                    <li>• Permission inheritance</li>
                    <li>• Resource-level permissions</li>
                    <li>• Time-based access controls</li>
                    <li>• Emergency access procedures</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Conditional Access
                  </CardTitle>
                  <CardDescription>
                    Context-aware security policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Location-based restrictions</li>
                    <li>• Device compliance requirements</li>
                    <li>• Risk-based authentication</li>
                    <li>• Session management controls</li>
                    <li>• Application-specific policies</li>
                    <li>• Anomaly detection triggers</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Security Monitoring
                  </CardTitle>
                  <CardDescription>
                    Real-time threat detection and response
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 24/7 security operations center</li>
                    <li>• Machine learning threat detection</li>
                    <li>• Behavioral analytics</li>
                    <li>• Automated incident response</li>
                    <li>• Security alert management</li>
                    <li>• Threat intelligence integration</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Audit & Logging
                  </CardTitle>
                  <CardDescription>
                    Comprehensive activity tracking and reporting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Detailed audit trails</li>
                    <li>• User activity monitoring</li>
                    <li>• Data access logging</li>
                    <li>• Administrative action tracking</li>
                    <li>• Compliance report generation</li>
                    <li>• Log retention and archival</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Compliance Standards
                  </CardTitle>
                  <CardDescription>
                    Industry certifications and frameworks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• SOC 2 Type II certification</li>
                    <li>• ISO 27001 information security</li>
                    <li>• GDPR data protection compliance</li>
                    <li>• HIPAA healthcare standards</li>
                    <li>• PCI DSS payment security</li>
                    <li>• FedRAMP government standards</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Governance
                  </CardTitle>
                  <CardDescription>
                    Data protection and privacy controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Data classification and labeling</li>
                    <li>• Privacy impact assessments</li>
                    <li>• Data retention policies</li>
                    <li>• Right to erasure (GDPR)</li>
                    <li>• Cross-border data transfer controls</li>
                    <li>• Data processing agreements</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Security Certifications */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <CheckCircle className="h-8 w-8 text-primary" />
          Security Certifications
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>SOC 2 Type II</CardTitle>
              <CardDescription>
                Security, availability, and confidentiality controls
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>ISO 27001</CardTitle>
              <CardDescription>
                International information security management
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>GDPR</CardTitle>
              <CardDescription>
                European data protection regulation compliance
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <FileCheck className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle>HIPAA</CardTitle>
              <CardDescription>
                Healthcare information protection standards
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Security Best Practices */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Security Best Practices</h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Badge variant="secondary">Authentication</Badge>
            <h4 className="font-medium">Strong Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Enable multi-factor authentication and use strong, unique passwords for all accounts.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Access</Badge>
            <h4 className="font-medium">Principle of Least Privilege</h4>
            <p className="text-sm text-muted-foreground">
              Grant users only the minimum access required to perform their job functions.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Monitoring</Badge>
            <h4 className="font-medium">Regular Security Reviews</h4>
            <p className="text-sm text-muted-foreground">
              Conduct regular security assessments and review access permissions quarterly.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Training</Badge>
            <h4 className="font-medium">Security Awareness</h4>
            <p className="text-sm text-muted-foreground">
              Provide regular security training to all team members and stakeholders.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Incident Response</Badge>
            <h4 className="font-medium">Incident Preparedness</h4>
            <p className="text-sm text-muted-foreground">
              Maintain an incident response plan and conduct regular security drills.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Updates</Badge>
            <h4 className="font-medium">Keep Systems Updated</h4>
            <p className="text-sm text-muted-foreground">
              Regularly update software and apply security patches promptly.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/roles-and-permissions">
              <Shield className="mr-2 h-4 w-4" />
              Configure Access Controls
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/getting-started">
              Security Setup Guide
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/troubleshooting">
              Security Troubleshooting
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}