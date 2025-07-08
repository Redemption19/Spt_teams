// lib/database-security.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { DatabaseService } from './database-core';

export interface SecuritySettings {
  encryptionEnabled: boolean;
  encryptionAlgorithm: 'AES-256' | 'AES-128' | 'ChaCha20';
  keyRotationEnabled: boolean;
  keyRotationInterval: number; // days
  accessLoggingEnabled: boolean;
  auditTrailEnabled: boolean;
  dataRetentionEnabled: boolean;
  dataRetentionDays: number;
  backupEncryptionEnabled: boolean;
  sslRequired: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  sessionTimeout: number; // minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
}

export interface ComplianceReport {
  id: string;
  workspaceId: string;
  generatedBy: string;
  timestamp: Date;
  complianceType: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI-DSS' | 'ISO-27001' | 'custom';
  status: 'compliant' | 'non-compliant' | 'partial';
  score: number; // 0-100
  findings: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    status: 'open' | 'resolved' | 'in-progress';
  }>;
  recommendations: string[];
  nextReviewDate: Date;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityIncident {
  id: string;
  workspaceId: string;
  reportedBy: string;
  timestamp: Date;
  incidentType: 'unauthorized_access' | 'data_breach' | 'malware' | 'phishing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  description: string;
  affectedUsers?: number;
  affectedData?: string[];
  resolution?: string;
  resolutionDate?: Date;
}

export interface DataClassification {
  id: string;
  workspaceId: string;
  dataType: 'public' | 'internal' | 'confidential' | 'restricted';
  collection: string;
  documentId?: string;
  classificationDate: Date;
  classifiedBy: string;
  sensitivityLevel: number; // 1-5
  retentionPolicy: string;
  encryptionRequired: boolean;
}

export interface SecurityMetrics {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number; // hours
  complianceScore: number; // 0-100
  encryptionCoverage: number; // percentage
  auditLogEntries: number;
  failedLoginAttempts: number;
  suspiciousActivities: number;
  lastSecurityReview: Date;
}

// Private helper methods
async function encryptData(data: any, algorithm: string): Promise<string> {
  // Simulate encryption - in production, use proper encryption libraries
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);
  
  // Simple base64 encoding for demo purposes
  // In production, use proper encryption like Web Crypto API
  return btoa(String.fromCharCode(...new Uint8Array(dataBuffer)));
}

async function decryptData(encryptedData: string, algorithm: string): Promise<any> {
  // Simulate decryption - in production, use proper decryption libraries
  try {
    const decoded = atob(encryptedData);
    const decoder = new TextDecoder();
    const dataString = decoder.decode(new Uint8Array([...decoded].map(c => c.charCodeAt(0))));
    return JSON.parse(dataString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

async function generateAuditLog(
  workspaceId: string,
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<void> {
  try {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      userId,
      action,
      resource,
      resourceId,
      timestamp: new Date(),
      details,
      severity
    };

    const auditRef = doc(db, 'audit_logs', auditLog.id);
    await setDoc(auditRef, auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

async function checkCompliance(
  workspaceId: string,
  complianceType: string
): Promise<{
  status: 'compliant' | 'non-compliant' | 'partial';
  score: number;
  findings: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    status: 'open' | 'resolved' | 'in-progress';
  }>;
}> {
  const findings: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    status: 'open' | 'resolved' | 'in-progress';
  }> = [];

  let score = 100;

  // Check encryption settings
  const securitySettings = await DatabaseSecurityService.getSecuritySettings(workspaceId);
  if (!securitySettings.encryptionEnabled) {
    findings.push({
      category: 'Data Protection',
      severity: 'high',
      description: 'Data encryption is not enabled',
      recommendation: 'Enable encryption for all sensitive data',
      status: 'open'
    });
    score -= 20;
  }

  // Check access logging
  if (!securitySettings.accessLoggingEnabled) {
    findings.push({
      category: 'Audit & Monitoring',
      severity: 'medium',
      description: 'Access logging is not enabled',
      recommendation: 'Enable access logging for compliance',
      status: 'open'
    });
    score -= 15;
  }

  // Check data retention
  if (!securitySettings.dataRetentionEnabled) {
    findings.push({
      category: 'Data Management',
      severity: 'medium',
      description: 'Data retention policy is not configured',
      recommendation: 'Configure data retention policies',
      status: 'open'
    });
    score -= 10;
  }

  // Check password policy
  if (securitySettings.passwordPolicy.minLength < 8) {
    findings.push({
      category: 'Access Control',
      severity: 'medium',
      description: 'Password policy is too weak',
      recommendation: 'Strengthen password requirements',
      status: 'open'
    });
    score -= 10;
  }

  // Determine overall status
  let status: 'compliant' | 'non-compliant' | 'partial';
  if (score >= 90) {
    status = 'compliant';
  } else if (score >= 70) {
    status = 'partial';
  } else {
    status = 'non-compliant';
  }

  return { status, score, findings };
}

export class DatabaseSecurityService extends DatabaseService {
  protected static readonly SECURITY_COLLECTION = 'database_security';
  protected static readonly AUDIT_COLLECTION = 'audit_logs';
  protected static readonly INCIDENTS_COLLECTION = 'security_incidents';
  protected static readonly COMPLIANCE_COLLECTION = 'compliance_reports';
  protected static readonly CLASSIFICATION_COLLECTION = 'data_classification';

  /**
   * Get security settings for a workspace
   */
  static async getSecuritySettings(workspaceId: string): Promise<SecuritySettings> {
    try {
      const settingsRef = doc(db, this.SECURITY_COLLECTION, workspaceId);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        return settingsDoc.data() as SecuritySettings;
      }

      // Return default security settings
      return {
        encryptionEnabled: true,
        encryptionAlgorithm: 'AES-256',
        keyRotationEnabled: true,
        keyRotationInterval: 90,
        accessLoggingEnabled: true,
        auditTrailEnabled: true,
        dataRetentionEnabled: true,
        dataRetentionDays: 2555, // 7 years
        backupEncryptionEnabled: true,
        sslRequired: true,
        ipWhitelistEnabled: false,
        ipWhitelist: [],
        sessionTimeout: 480, // 8 hours
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90
        }
      };
    } catch (error) {
      console.error('Error getting security settings:', error);
      throw error;
    }
  }

  /**
   * Update security settings
   */
  static async updateSecuritySettings(
    workspaceId: string,
    settings: Partial<SecuritySettings>
  ): Promise<void> {
    try {
      const settingsRef = doc(db, this.SECURITY_COLLECTION, workspaceId);
      await setDoc(settingsRef, settings, { merge: true });

      // Log the security settings update
      await generateAuditLog(
        workspaceId,
        'system',
        'security_settings_updated',
        'security_settings',
        workspaceId,
        { updatedSettings: Object.keys(settings) },
        'medium'
      );
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  static async encryptSensitiveData(
    data: any,
    workspaceId: string,
    algorithm: string = 'AES-256'
  ): Promise<string> {
    try {
      const encryptedData = await encryptData(data, algorithm);
      
      // Log encryption activity
      await generateAuditLog(
        workspaceId,
        'system',
        'data_encrypted',
        'sensitive_data',
        'encryption',
        { algorithm, dataSize: JSON.stringify(data).length },
        'low'
      );

      return encryptedData;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decryptSensitiveData(
    encryptedData: string,
    workspaceId: string,
    algorithm: string = 'AES-256'
  ): Promise<any> {
    try {
      const decryptedData = await decryptData(encryptedData, algorithm);
      
      // Log decryption activity
      await generateAuditLog(
        workspaceId,
        'system',
        'data_decrypted',
        'sensitive_data',
        'decryption',
        { algorithm, dataSize: encryptedData.length },
        'low'
      );

      return decryptedData;
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(
    workspaceId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      action?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      limit?: number;
    } = {}
  ): Promise<AuditLog[]> {
    try {
      let auditQuery = query(
        collection(db, this.AUDIT_COLLECTION),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc')
      );

      if (options.startDate) {
        auditQuery = query(auditQuery, where('timestamp', '>=', options.startDate));
      }

      if (options.endDate) {
        auditQuery = query(auditQuery, where('timestamp', '<=', options.endDate));
      }

      if (options.userId) {
        auditQuery = query(auditQuery, where('userId', '==', options.userId));
      }

      if (options.action) {
        auditQuery = query(auditQuery, where('action', '==', options.action));
      }

      if (options.severity) {
        auditQuery = query(auditQuery, where('severity', '==', options.severity));
      }

      if (options.limit) {
        auditQuery = query(auditQuery, limit(options.limit));
      }

      const auditSnapshot = await getDocs(auditQuery);
      return auditSnapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Report security incident
   */
  static async reportSecurityIncident(
    workspaceId: string,
    userId: string,
    incident: Omit<SecurityIncident, 'id' | 'workspaceId' | 'reportedBy' | 'timestamp'>
  ): Promise<SecurityIncident> {
    try {
      const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const securityIncident: SecurityIncident = {
        id: incidentId,
        workspaceId,
        reportedBy: userId,
        timestamp: new Date(),
        ...incident
      };

      const incidentRef = doc(db, this.INCIDENTS_COLLECTION, incidentId);
      await setDoc(incidentRef, securityIncident);

      // Log the incident report
      await generateAuditLog(
        workspaceId,
        userId,
        'security_incident_reported',
        'security_incident',
        incidentId,
        {
          incidentType: incident.incidentType,
          severity: incident.severity,
          description: incident.description
        },
        incident.severity
      );

      return securityIncident;
    } catch (error) {
      console.error('Error reporting security incident:', error);
      throw error;
    }
  }

  /**
   * Get security incidents
   */
  static async getSecurityIncidents(
    workspaceId: string,
    options: {
      status?: 'open' | 'investigating' | 'resolved' | 'closed';
      severity?: 'low' | 'medium' | 'high' | 'critical';
      limit?: number;
    } = {}
  ): Promise<SecurityIncident[]> {
    try {
      let incidentsQuery = query(
        collection(db, this.INCIDENTS_COLLECTION),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc')
      );

      if (options.status) {
        incidentsQuery = query(incidentsQuery, where('status', '==', options.status));
      }

      if (options.severity) {
        incidentsQuery = query(incidentsQuery, where('severity', '==', options.severity));
      }

      if (options.limit) {
        incidentsQuery = query(incidentsQuery, limit(options.limit));
      }

      const incidentsSnapshot = await getDocs(incidentsQuery);
      return incidentsSnapshot.docs.map(doc => doc.data() as SecurityIncident);
    } catch (error) {
      console.error('Error getting security incidents:', error);
      throw error;
    }
  }

  /**
   * Update security incident
   */
  static async updateSecurityIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<void> {
    try {
      const incidentRef = doc(db, this.INCIDENTS_COLLECTION, incidentId);
      await updateDoc(incidentRef, updates);

      // Log the incident update
      const incidentDoc = await getDoc(incidentRef);
      if (incidentDoc.exists()) {
        const incident = incidentDoc.data() as SecurityIncident;
        await generateAuditLog(
          incident.workspaceId,
          'system',
          'security_incident_updated',
          'security_incident',
          incidentId,
          { updatedFields: Object.keys(updates) },
          'medium'
        );
      }
    } catch (error) {
      console.error('Error updating security incident:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(
    workspaceId: string,
    userId: string,
    complianceType: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI-DSS' | 'ISO-27001' | 'custom'
  ): Promise<ComplianceReport> {
    try {
      const complianceCheck = await checkCompliance(workspaceId, complianceType);
      
      const report: ComplianceReport = {
        id: `compliance_${workspaceId}_${Date.now()}`,
        workspaceId,
        generatedBy: userId,
        timestamp: new Date(),
        complianceType,
        status: complianceCheck.status,
        score: complianceCheck.score,
        findings: complianceCheck.findings,
        recommendations: complianceCheck.findings
          .filter(f => f.status === 'open')
          .map(f => f.recommendation),
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      const reportRef = doc(db, this.COMPLIANCE_COLLECTION, report.id);
      await setDoc(reportRef, report);

      // Log compliance report generation
      await generateAuditLog(
        workspaceId,
        userId,
        'compliance_report_generated',
        'compliance_report',
        report.id,
        {
          complianceType,
          status: report.status,
          score: report.score,
          findingsCount: report.findings.length
        },
        'medium'
      );

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get compliance reports
   */
  static async getComplianceReports(workspaceId: string): Promise<ComplianceReport[]> {
    try {
      const reportsQuery = query(
        collection(db, this.COMPLIANCE_COLLECTION),
        where('workspaceId', '==', workspaceId),
        orderBy('timestamp', 'desc')
      );

      const reportsSnapshot = await getDocs(reportsQuery);
      return reportsSnapshot.docs.map(doc => doc.data() as ComplianceReport);
    } catch (error) {
      console.error('Error getting compliance reports:', error);
      throw error;
    }
  }

  /**
   * Classify data
   */
  static async classifyData(
    workspaceId: string,
    userId: string,
    classification: Omit<DataClassification, 'id' | 'workspaceId' | 'classificationDate' | 'classifiedBy'>
  ): Promise<DataClassification> {
    try {
      const dataClassification: DataClassification = {
        id: `classification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        classifiedBy: userId,
        classificationDate: new Date(),
        ...classification
      };

      const classificationRef = doc(db, this.CLASSIFICATION_COLLECTION, dataClassification.id);
      await setDoc(classificationRef, dataClassification);

      // Log data classification
      await generateAuditLog(
        workspaceId,
        userId,
        'data_classified',
        'data_classification',
        dataClassification.id,
        {
          dataType: classification.dataType,
          collection: classification.collection,
          sensitivityLevel: classification.sensitivityLevel
        },
        'low'
      );

      return dataClassification;
    } catch (error) {
      console.error('Error classifying data:', error);
      throw error;
    }
  }

  /**
   * Get data classifications
   */
  static async getDataClassifications(workspaceId: string): Promise<DataClassification[]> {
    try {
      const classificationsQuery = query(
        collection(db, this.CLASSIFICATION_COLLECTION),
        where('workspaceId', '==', workspaceId),
        orderBy('classificationDate', 'desc')
      );

      const classificationsSnapshot = await getDocs(classificationsQuery);
      return classificationsSnapshot.docs.map(doc => doc.data() as DataClassification);
    } catch (error) {
      console.error('Error getting data classifications:', error);
      throw error;
    }
  }

  /**
   * Get security metrics
   */
  static async getSecurityMetrics(workspaceId: string): Promise<SecurityMetrics> {
    try {
      const [
        incidents,
        complianceReports,
        auditLogs,
        securitySettings
      ] = await Promise.all([
        this.getSecurityIncidents(workspaceId),
        this.getComplianceReports(workspaceId),
        this.getAuditLogs(workspaceId),
        this.getSecuritySettings(workspaceId)
      ]);

      const totalIncidents = incidents.length;
      const openIncidents = incidents.filter(i => i.status === 'open').length;
      const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

      // Calculate average resolution time
      const resolvedIncidentsWithResolution = incidents.filter(i => i.resolutionDate);
      const averageResolutionTime = resolvedIncidentsWithResolution.length > 0
        ? resolvedIncidentsWithResolution.reduce((total, incident) => {
            const resolutionTime = incident.resolutionDate!.getTime() - incident.timestamp.getTime();
            return total + resolutionTime;
          }, 0) / resolvedIncidentsWithResolution.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Get latest compliance score
      const latestComplianceReport = complianceReports[0];
      const complianceScore = latestComplianceReport?.score || 0;

      // Calculate encryption coverage
      const encryptionCoverage = securitySettings.encryptionEnabled ? 100 : 0;

      // Count audit log entries
      const auditLogEntries = auditLogs.length;

      // Simulate other metrics
      const failedLoginAttempts = Math.floor(Math.random() * 50);
      const suspiciousActivities = Math.floor(Math.random() * 10);

      return {
        totalIncidents,
        openIncidents,
        resolvedIncidents,
        averageResolutionTime,
        complianceScore,
        encryptionCoverage,
        auditLogEntries,
        failedLoginAttempts,
        suspiciousActivities,
        lastSecurityReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  static async cleanupOldAuditLogs(workspaceId: string, retentionDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldLogsQuery = query(
        collection(db, this.AUDIT_COLLECTION),
        where('workspaceId', '==', workspaceId),
        where('timestamp', '<', cutoffDate)
      );

      const oldLogsSnapshot = await getDocs(oldLogsQuery);
      let deletedCount = 0;

      for (const logDoc of oldLogsSnapshot.docs) {
        await deleteDoc(logDoc.ref);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }
} 