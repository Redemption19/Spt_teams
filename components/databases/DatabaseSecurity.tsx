// components/databases/DatabaseSecurity.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Settings,
  Activity,
  Users,
  Database,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  DatabaseSecurityService, 
  type SecuritySettings, 
  type SecurityMetrics,
  type SecurityIncident,
  type ComplianceReport,
  type AuditLog,
  type DataClassification
} from '@/lib/database-management/database-security';

export default function DatabaseSecurity() {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [classifications, setClassifications] = useState<DataClassification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    incidentType: 'unauthorized_access' as const,
    severity: 'medium' as const,
    status: 'open' as const,
    description: '',
    affectedUsers: 0,
    affectedData: [] as string[]
  });

  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentWorkspace) {
      loadSecurityData();
    }
  }, [currentWorkspace]);

  const loadSecurityData = async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      const [
        settings,
        metrics,
        incidentsData,
        complianceData,
        auditData,
        classificationsData
      ] = await Promise.all([
        DatabaseSecurityService.getSecuritySettings(currentWorkspace.id),
        DatabaseSecurityService.getSecurityMetrics(currentWorkspace.id),
        DatabaseSecurityService.getSecurityIncidents(currentWorkspace.id),
        DatabaseSecurityService.getComplianceReports(currentWorkspace.id),
        DatabaseSecurityService.getAuditLogs(currentWorkspace.id, { limit: 50 }),
        DatabaseSecurityService.getDataClassifications(currentWorkspace.id)
      ]);

      setSecuritySettings(settings);
      setSecurityMetrics(metrics);
      setIncidents(incidentsData);
      setComplianceReports(complianceData);
      setAuditLogs(auditData);
      setClassifications(classificationsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySettings = async (updates: Partial<SecuritySettings>) => {
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      await DatabaseSecurityService.updateSecuritySettings(currentWorkspace.id, updates);
      setSecuritySettings(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Settings Updated",
        description: "Security settings have been updated successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const reportIncident = async () => {
    if (!currentWorkspace || !user) return;

    setLoading(true);
    try {
      await DatabaseSecurityService.reportSecurityIncident(
        currentWorkspace.id,
        user.uid,
        newIncident
      );

      setShowIncidentForm(false);
      setNewIncident({
        incidentType: 'unauthorized_access',
        severity: 'medium',
        status: 'open',
        description: '',
        affectedUsers: 0,
        affectedData: []
      });

      // Reload incidents
      const updatedIncidents = await DatabaseSecurityService.getSecurityIncidents(currentWorkspace.id);
      setIncidents(updatedIncidents);

      toast({
        title: "Incident Reported",
        description: "Security incident has been reported successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report security incident",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateComplianceReport = async (complianceType: string) => {
    if (!currentWorkspace || !user) return;

    setLoading(true);
    try {
      const report = await DatabaseSecurityService.generateComplianceReport(
        currentWorkspace.id,
        user.uid,
        complianceType as any
      );

      setComplianceReports(prev => [report, ...prev]);
      
      toast({
        title: "Report Generated",
        description: `${complianceType} compliance report has been generated`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600';
      case 'investigating': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && !securitySettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security & Compliance</h2>
          <p className="text-muted-foreground">
            Manage security settings, monitor incidents, and ensure compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSecurityData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowIncidentForm(true)}
            variant="destructive"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="classification"> Data Classification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {securityMetrics && (
            <>
              {/* Security Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
                        <p className="text-2xl font-bold">{securityMetrics.totalIncidents}</p>
                        <p className="text-xs text-muted-foreground">
                          {securityMetrics.openIncidents} open
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                        <p className={`text-2xl font-bold ${getComplianceStatusColor(securityMetrics.complianceScore >= 90 ? 'compliant' : securityMetrics.complianceScore >= 70 ? 'partial' : 'non-compliant')}`}>
                          {securityMetrics.complianceScore}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {securityMetrics.complianceScore >= 90 ? 'Compliant' : securityMetrics.complianceScore >= 70 ? 'Partial' : 'Non-compliant'}
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Encryption Coverage</p>
                        <p className="text-2xl font-bold text-green-600">
                          {securityMetrics.encryptionCoverage}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Data encrypted
                        </p>
                      </div>
                      <Lock className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Audit Logs</p>
                        <p className="text-2xl font-bold">{securityMetrics.auditLogEntries}</p>
                        <p className="text-xs text-muted-foreground">
                          Total entries
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Security Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityMetrics.openIncidents > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {securityMetrics.openIncidents} open security incident(s) require attention
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {securityMetrics.complianceScore < 70 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Compliance score is below recommended levels. Review security settings.
                        </AlertDescription>
                      </Alert>
                    )}

                    {securityMetrics.failedLoginAttempts > 20 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          High number of failed login attempts detected
                        </AlertDescription>
                      </Alert>
                    )}

                    {securityMetrics.suspiciousActivities > 5 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Multiple suspicious activities detected
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getSeverityColor(log.severity)}`}>
                            <Activity className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.resource} • {log.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {securitySettings && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Encryption Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="encryption-enabled" 
                          checked={securitySettings.encryptionEnabled}
                          onCheckedChange={(checked) => 
                            updateSecuritySettings({ encryptionEnabled: checked as boolean })
                          }
                        />
                        <Label htmlFor="encryption-enabled">Enable Data Encryption</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Encrypt sensitive data at rest and in transit
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Encryption Algorithm</Label>
                      <Select 
                        value={securitySettings.encryptionAlgorithm} 
                        onValueChange={(value) => 
                          updateSecuritySettings({ encryptionAlgorithm: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AES-256">AES-256 (Recommended)</SelectItem>
                          <SelectItem value="AES-128">AES-128</SelectItem>
                          <SelectItem value="ChaCha20">ChaCha20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="key-rotation" 
                          checked={securitySettings.keyRotationEnabled}
                          onCheckedChange={(checked) => 
                            updateSecuritySettings({ keyRotationEnabled: checked as boolean })
                          }
                        />
                        <Label htmlFor="key-rotation">Enable Key Rotation</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Automatically rotate encryption keys
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Key Rotation Interval (days)</Label>
                      <Input 
                        type="number" 
                        value={securitySettings.keyRotationInterval}
                        onChange={(e) => 
                          updateSecuritySettings({ keyRotationInterval: parseInt(e.target.value) })
                        }
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="access-logging" 
                          checked={securitySettings.accessLoggingEnabled}
                          onCheckedChange={(checked) => 
                            updateSecuritySettings({ accessLoggingEnabled: checked as boolean })
                          }
                        />
                        <Label htmlFor="access-logging">Enable Access Logging</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="audit-trail" 
                          checked={securitySettings.auditTrailEnabled}
                          onCheckedChange={(checked) => 
                            updateSecuritySettings({ auditTrailEnabled: checked as boolean })
                          }
                        />
                        <Label htmlFor="audit-trail">Enable Audit Trail</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="ssl-required" 
                          checked={securitySettings.sslRequired}
                          onCheckedChange={(checked) => 
                            updateSecuritySettings({ sslRequired: checked as boolean })
                          }
                        />
                        <Label htmlFor="ssl-required">Require SSL/TLS</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input 
                        type="number" 
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => 
                          updateSecuritySettings({ sessionTimeout: parseInt(e.target.value) })
                        }
                        min="15"
                        max="1440"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="data-retention" 
                          checked={securitySettings.dataRetentionEnabled}
                          onCheckedChange={(checked) => 
                            updateSecuritySettings({ dataRetentionEnabled: checked as boolean })
                          }
                        />
                        <Label htmlFor="data-retention">Enable Data Retention</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Retention Period (days)</Label>
                      <Input 
                        type="number" 
                        value={securitySettings.dataRetentionDays}
                        onChange={(e) => 
                          updateSecuritySettings({ dataRetentionDays: parseInt(e.target.value) })
                        }
                        min="30"
                        max="3650"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Incidents</h3>
            <Button onClick={() => setShowIncidentForm(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </div>

          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {incident.incidentType.replace('_', ' ')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Reported on {incident.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{incident.description}</p>
                  
                  {incident.affectedUsers && incident.affectedUsers > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {incident.affectedUsers} users affected
                      </span>
                    </div>
                  )}

                  {incident.affectedData && incident.affectedData.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Affected data: {incident.affectedData.join(', ')}
                      </span>
                    </div>
                  )}

                  {incident.resolution && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Resolution:</p>
                      <p className="text-sm text-green-700">{incident.resolution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {incidents.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No security incidents reported</p>
                  <p className="text-sm text-muted-foreground">
                    All systems are secure and operating normally
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Incident Report Form */}
          {showIncidentForm && (
            <Card>
              <CardHeader>
                <CardTitle>Report Security Incident</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Incident Type</Label>
                    <Select 
                      value={newIncident.incidentType} 
                      onValueChange={(value) => 
                        setNewIncident(prev => ({ ...prev, incidentType: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                        <SelectItem value="data_breach">Data Breach</SelectItem>
                        <SelectItem value="malware">Malware</SelectItem>
                        <SelectItem value="phishing">Phishing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select 
                      value={newIncident.severity} 
                      onValueChange={(value) => 
                        setNewIncident(prev => ({ ...prev, severity: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newIncident.description}
                    onChange={(e) => 
                      setNewIncident(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe the security incident..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Affected Users</Label>
                    <Input 
                      type="number" 
                      value={newIncident.affectedUsers}
                      onChange={(e) => 
                        setNewIncident(prev => ({ ...prev, affectedUsers: parseInt(e.target.value) }))
                      }
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Affected Data (comma-separated)</Label>
                    <Input 
                      value={newIncident.affectedData.join(', ')}
                      onChange={(e) => 
                        setNewIncident(prev => ({ 
                          ...prev, 
                          affectedData: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }))
                      }
                      placeholder="users, projects, tasks"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={reportIncident} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Report Incident
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowIncidentForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Reports</h3>
            <div className="flex gap-2">
              <Select onValueChange={generateComplianceReport}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Generate Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                  <SelectItem value="SOX">SOX</SelectItem>
                  <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                  <SelectItem value="ISO-27001">ISO-27001</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {complianceReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.complianceType} Compliance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Generated on {report.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getComplianceStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">
                        {report.score}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Findings</h4>
                      <div className="space-y-2">
                        {report.findings.map((finding, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 border rounded">
                            <div className={`p-1 rounded-full ${getSeverityColor(finding.severity)}`}>
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{finding.category}</p>
                              <p className="text-sm text-muted-foreground">{finding.description}</p>
                              <p className="text-xs text-blue-600">{finding.recommendation}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {finding.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {report.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {complianceReports.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No compliance reports generated</p>
                  <p className="text-sm text-muted-foreground">
                    Generate your first compliance report to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Audit Logs</h3>
            <Badge variant="outline">
              {auditLogs.length} entries
            </Badge>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getSeverityColor(log.severity)}`}>
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.resource} • {log.userId} • {log.timestamp.toLocaleString()}
                        </p>
                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {auditLogs.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No audit logs found</p>
                  <p className="text-sm text-muted-foreground">
                    Audit logs will appear here when activity is logged
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="classification" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Data Classification</h3>
            <Badge variant="outline">
              {classifications.length} classifications
            </Badge>
          </div>

          <div className="space-y-4">
            {classifications.map((classification) => (
              <Card key={classification.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{classification.dataType}</p>
                      <p className="text-sm text-muted-foreground">
                        {classification.collection} • Sensitivity Level: {classification.sensitivityLevel}/5
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Classified by {classification.classifiedBy} on {classification.classificationDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {classification.encryptionRequired ? 'Encrypted' : 'Not Encrypted'}
                      </Badge>
                      <Badge variant="outline">
                        {classification.retentionPolicy}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {classifications.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No data classifications found</p>
                  <p className="text-sm text-muted-foreground">
                    Data classifications will appear here when data is classified
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 