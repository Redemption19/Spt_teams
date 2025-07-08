// lib/database-import-export.ts
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
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { DatabaseService } from './database-core';
  
  // Private helper methods (moved from original file)
  
  async function getCollectionData(workspaceId: string, collectionName: string): Promise<any[]> {
    try {
      const collectionQuery = query(
        collection(db, collectionName),
        where('workspaceId', '==', workspaceId)
      );
      
      const snapshot = await getDocs(collectionQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting ${collectionName} data:`, error);
      return [];
    }
  }
  
  function convertToCSV(data: Record<string, any[]>): string {
    const csvRows: string[] = [];
    
    Object.entries(data).forEach(([collectionName, records]) => {
      if (records.length === 0) return;
      
      // Add collection header
      csvRows.push(`\n# ${collectionName.toUpperCase()}\n`);
      
      // Add headers
      const headers = Object.keys(records[0]);
      csvRows.push(headers.join(','));
      
      // Add data rows
      records.forEach(record => {
        const row = headers.map(header => {
          const value = record[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(row.join(','));
      });
    });
    
    return csvRows.join('\n');
  }
  
  function convertToXML(data: Record<string, any[]>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<workspace-export>\n';
    
    Object.entries(data).forEach(([collectionName, records]) => {
      xml += `  <${collectionName}>\n`;
      records.forEach(record => {
        xml += `    <record>\n`;
        Object.entries(record).forEach(([key, value]) => {
          xml += `      <${key}>${escapeXML(value)}</${key}>\n`;
        });
        xml += `    </record>\n`;
      });
      xml += `  </${collectionName}>\n`;
    });
    
    xml += '</workspace-export>';
    return xml;
  }
  
  function convertToSQL(data: Record<string, any[]>, workspaceId: string): string {
    let sql = `-- Workspace Export SQL\n-- Workspace ID: ${workspaceId}\n-- Generated: ${new Date().toISOString()}\n\n`;
    
    Object.entries(data).forEach(([collectionName, records]) => {
      if (records.length === 0) return;
      
      sql += `-- ${collectionName.toUpperCase()}\n`;
      records.forEach(record => {
        const columns = Object.keys(record);
        const values = Object.values(record).map(value => 
          typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
        );
        sql += `INSERT INTO ${collectionName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      });
      sql += '\n';
    });
    
    return sql;
  }
  
  function parseCSV(csvContent: string): Record<string, any[]> {
    const lines = csvContent.split('\n');
    const data: Record<string, any[]> = {};
    let currentCollection = '';
    let headers: string[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        currentCollection = line.substring(2).toLowerCase();
        data[currentCollection] = [];
        headers = [];
      } else if (line.trim() && currentCollection) {
        if (headers.length === 0) {
          headers = line.split(',').map(h => h.trim());
        } else {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index] || '';
          });
          data[currentCollection].push(record);
        }
      }
    });
    
    return data;
  }
  
  function parseXML(xmlContent: string): Record<string, any[]> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const data: Record<string, any[]> = {};
    
    const collections = xmlDoc.getElementsByTagName('workspace-export')[0]?.children;
    if (collections) {
      Array.from(collections).forEach(collection => {
        const collectionName = collection.tagName;
        data[collectionName] = [];
        
        const records = collection.getElementsByTagName('record');
        Array.from(records).forEach(record => {
          const recordData: any = {};
          Array.from(record.children).forEach(field => {
            recordData[field.tagName] = field.textContent || '';
          });
          data[collectionName].push(recordData);
        });
      });
    }
    
    return data;
  }
  
  function parseSQL(sqlContent: string): Record<string, any[]> {
    const data: Record<string, any[]> = {};
    const insertStatements = sqlContent.match(/INSERT INTO (\w+) \([^)]+\) VALUES \([^)]+\);/g);
    
    if (insertStatements) {
      insertStatements.forEach(statement => {
        const match = statement.match(/INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\);/);
        if (match) {
          const [, tableName, columnsStr, valuesStr] = match;
          const columns = columnsStr.split(',').map(c => c.trim());
          const values = valuesStr.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
          
          if (!data[tableName]) {
            data[tableName] = [];
          }
          
          const record: any = {};
          columns.forEach((column, index) => {
            record[column] = values[index] || '';
          });
          data[tableName].push(record);
        }
      });
    }
    
    return data;
  }
  
  async function validateImportData(
    data: Record<string, any[]>,
    workspaceId: string
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for required fields
    const requiredFields = {
      users: ['email', 'name'],
      projects: ['name', 'description'],
      tasks: ['title', 'projectId'],
      teams: ['name', 'description']
    };
    
    Object.entries(data).forEach(([collection, records]) => {
      if (requiredFields[collection as keyof typeof requiredFields]) {
        const required = requiredFields[collection as keyof typeof requiredFields];
        records.forEach((record, index) => {
          required.forEach(field => {
            if (!record[field]) {
              errors.push(`${collection}[${index}]: Missing required field '${field}'`);
            }
          });
        });
      }
    });
    
    // Check for duplicate records
    Object.entries(data).forEach(([collection, records]) => {
      const seen = new Set();
      records.forEach((record, index) => {
        const key = record.id || record.email || record.name;
        if (key && seen.has(key)) {
          warnings.push(`${collection}[${index}]: Duplicate record detected`);
        }
        seen.add(key);
      });
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  async function performImport(
    workspaceId: string,
    userId: string,
    data: Record<string, any[]>,
    options: {
      conflictResolution: 'overwrite' | 'skip' | 'merge';
      dryRun: boolean;
    }
  ): Promise<{
    success: boolean;
    importedRecords: number;
    skippedRecords: number;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      success: true,
      importedRecords: 0,
      skippedRecords: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };
  
    try {
      const batch = writeBatch(db); // Use writeBatch(db) for Firebase v9+
  
      Object.entries(data).forEach(([collectionName, records]) => {
        records.forEach(record => {
          try {
            // Add workspace ID and metadata
            const importRecord = {
              ...record,
              workspaceId,
              importedAt: serverTimestamp(),
              importedBy: userId
            };
  
            if (options.dryRun) {
              result.importedRecords++;
            } else {
              const docRef = doc(collection(db, collectionName));
              batch.set(docRef, importRecord);
              result.importedRecords++;
            }
          } catch (error) {
            result.errors.push(`Failed to import ${collectionName} record: ${error}`);
          }
        });
      });
  
      if (!options.dryRun) {
        await batch.commit();
      }
  
    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error}`);
    }
  
    return result;
  }
  
  async function compressData(data: string, method: 'gzip' | 'zip'): Promise<string> {
    // In a real implementation, you would use a compression library
    // For now, we'll return the original data
    return data;
  }
  
  function getMimeType(format: string, compression?: string): string {
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
      sql: 'text/plain'
    };
    
    let mimeType = mimeTypes[format] || 'application/octet-stream';
    
    if (compression === 'gzip') {
      mimeType += '+gzip';
    } else if (compression === 'zip') {
      mimeType = 'application/zip';
    }
    
    return mimeType;
  }
  
  function escapeXML(content: any): string {
    if (typeof content !== 'string') {
      content = String(content);
    }
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  async function logExportActivity(
    workspaceId: string,
    userId: string,
    fileName: string,
    options: any
  ): Promise<void> {
    try {
      const activityRef = doc(collection(db, 'export_activities'));
      await setDoc(activityRef, {
        workspaceId,
        userId,
        fileName,
        options,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log export activity:', error);
    }
  }
  
  async function logImportActivity(
    workspaceId: string,
    userId: string,
    fileName: string,
    result: any
  ): Promise<void> {
    try {
      const activityRef = doc(collection(db, 'import_activities'));
      await setDoc(activityRef, {
        workspaceId,
        userId,
        fileName,
        result,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log import activity:', error);
    }
  }
  
  export class DatabaseImportExportService extends DatabaseService { // Extend DatabaseService
    /**
     * Export workspace data in various formats
     */
    static async exportWorkspaceData(
      workspaceId: string,
      userId: string,
      options: {
        format: 'json' | 'csv' | 'xml' | 'sql';
        includeUsers: boolean;
        includeProjects: boolean;
        includeTasks: boolean;
        includeTeams: boolean;
        includeReports: boolean;
        includeSettings: boolean;
        compression: 'none' | 'gzip' | 'zip';
        dateRange?: {
          start: Date;
          end: Date;
        };
      }
    ): Promise<{
      success: boolean;
      downloadUrl?: string;
      fileName: string;
      size: number;
      recordCount: number;
      error?: string;
    }> {
      try {
        // Collect data based on options
        const exportData: Record<string, any[]> = {};
        
        if (options.includeUsers) {
          exportData.users = await getCollectionData(workspaceId, 'users');
        }
        
        if (options.includeProjects) {
          exportData.projects = await getCollectionData(workspaceId, 'projects');
        }
        
        if (options.includeTasks) {
          exportData.tasks = await getCollectionData(workspaceId, 'tasks');
        }
        
        if (options.includeTeams) {
          exportData.teams = await getCollectionData(workspaceId, 'teams');
        }
        
        if (options.includeReports) {
          exportData.reports = await getCollectionData(workspaceId, 'reports');
        }
        
        if (options.includeSettings) {
          exportData.settings = await getCollectionData(workspaceId, 'workspaceSettings');
        }
  
        // Apply date range filter if specified
        if (options.dateRange) {
          Object.keys(exportData).forEach(collection => {
            exportData[collection] = exportData[collection].filter((item: any) => {
              const itemDate = new Date(item.createdAt || item.timestamp || item.updatedAt);
              return itemDate >= options.dateRange!.start && itemDate <= options.dateRange!.end;
            });
          });
        }
  
        // Convert to requested format
        let formattedData: string;
        let fileName: string;
        const timestamp = new Date().toISOString().split('T')[0];
  
        switch (options.format) {
          case 'json':
            formattedData = JSON.stringify(exportData, null, 2);
            fileName = `workspace_${workspaceId}_export_${timestamp}.json`;
            break;
            
          case 'csv':
            formattedData = convertToCSV(exportData);
            fileName = `workspace_${workspaceId}_export_${timestamp}.csv`;
            break;
            
          case 'xml':
            formattedData = convertToXML(exportData);
            fileName = `workspace_${workspaceId}_export_${timestamp}.xml`;
            break;
            
          case 'sql':
            formattedData = convertToSQL(exportData, workspaceId);
            fileName = `workspace_${workspaceId}_export_${timestamp}.sql`;
            break;
            
          default:
            throw new Error(`Unsupported format: ${options.format}`);
        }
  
        // Compress if requested
        let finalData = formattedData;
        if (options.compression === 'gzip') {
          finalData = await compressData(formattedData, 'gzip');
          fileName = fileName.replace(/\.[^/.]+$/, '.gz');
        } else if (options.compression === 'zip') {
          finalData = await compressData(formattedData, 'zip');
          fileName = fileName.replace(/\.[^/.]+$/, '.zip');
        }
  
        // Upload to Firebase Storage
        const storageRef = ref(storage, `exports/${workspaceId}/${fileName}`);
        const blob = new Blob([finalData], { type: getMimeType(options.format, options.compression) });
        
        const uploadResult = await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
  
        // Log export activity
        await logExportActivity(workspaceId, userId, fileName, options);
  
        const recordCount = Object.values(exportData).reduce((sum, collection) => sum + collection.length, 0);
  
        return {
          success: true,
          downloadUrl,
          fileName,
          size: blob.size,
          recordCount
        };
  
      } catch (error) {
        console.error('Export failed:', error);
        return {
          success: false,
          fileName: '',
          size: 0,
          recordCount: 0,
          error: error instanceof Error ? error.message : 'Export failed'
        };
      }
    }
  
    /**
     * Import data into workspace
     */
    static async importWorkspaceData(
      workspaceId: string,
      userId: string,
      file: File,
      options: {
        format: 'json' | 'csv' | 'xml' | 'sql';
        conflictResolution: 'overwrite' | 'skip' | 'merge';
        validateBeforeImport: boolean;
        dryRun: boolean;
      }
    ): Promise<{
      success: boolean;
      importedRecords: number;
      skippedRecords: number;
      errors: string[];
      warnings: string[];
    }> {
      try {
        // Read and parse file
        const fileContent = await file.text();
        let importData: Record<string, any[]>;
  
        switch (options.format) {
          case 'json':
            importData = JSON.parse(fileContent);
            break;
            
          case 'csv':
            importData = parseCSV(fileContent);
            break;
            
          case 'xml':
            importData = parseXML(fileContent);
            break;
            
          case 'sql':
            importData = parseSQL(fileContent);
            break;
            
          default:
            throw new Error(`Unsupported format: ${options.format}`);
        }
  
        // Validate data structure
        if (options.validateBeforeImport) {
          const validation = await validateImportData(importData, workspaceId);
          if (!validation.valid) {
            return {
              success: false,
              importedRecords: 0,
              skippedRecords: 0,
              errors: validation.errors,
              warnings: validation.warnings
            };
          }
        }
  
        // Perform import
        const result = await performImport(workspaceId, userId, importData, options);
  
        // Log import activity
        await logImportActivity(workspaceId, userId, file.name, result);
  
        return result;
  
      } catch (error) {
        console.error('Import failed:', error);
        return {
          success: false,
          importedRecords: 0,
          skippedRecords: 0,
          errors: [error instanceof Error ? error.message : 'Import failed'],
          warnings: []
        };
      }
    }
  }