import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';
import { convertTimestamps } from './utils';

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  name: string;
  email: string;
  company?: string;
  address?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  notes?: string;
}

export class ClientService {
  
  /**
   * Create a new client
   */
  static async createClient(
    workspaceId: string, 
    clientData: ClientFormData, 
    createdBy: string
  ): Promise<string> {
    try {
      const clientRef = doc(collection(db, 'clients'));
      const clientId = clientRef.id;
      
      const client: Client = {
        id: clientId,
        workspaceId,
        name: clientData.name,
        email: clientData.email,
        company: clientData.company,
        address: clientData.address,
        phone: clientData.phone,
        website: clientData.website,
        taxId: clientData.taxId,
        notes: clientData.notes,
        isActive: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(clientRef, cleanFirestoreData(client));
      return clientId;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }
  
  /**
   * Get client by ID
   */
  static async getClient(clientId: string): Promise<Client | null> {
    try {
      const clientDoc = await getDoc(doc(db, 'clients', clientId));
      
      if (!clientDoc.exists()) {
        return null;
      }
      
      const data = clientDoc.data();
      return convertTimestamps(data) as Client;
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  }
  
  /**
   * Get all clients for a workspace
   */
  static async getWorkspaceClients(workspaceId: string): Promise<Client[]> {
    try {
      const q = query(
        collection(db, 'clients'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const clients: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clients.push(convertTimestamps(data) as Client);
      });
      
      return clients;
    } catch (error) {
      console.error('Error getting workspace clients:', error);
      throw error;
    }
  }
  
  /**
   * Update client
   */
  static async updateClient(
    clientId: string, 
    updates: Partial<ClientFormData>
  ): Promise<void> {
    try {
      const clientRef = doc(db, 'clients', clientId);
      const updateData = createUpdateData({
        ...updates,
        updatedAt: new Date()
      });
      
      await updateDoc(clientRef, updateData);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }
  
  /**
   * Delete client (soft delete)
   */
  static async deleteClient(clientId: string): Promise<void> {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
  
  /**
   * Search clients by name or company
   */
  static async searchClients(
    workspaceId: string, 
    searchTerm: string
  ): Promise<Client[]> {
    try {
      const clients = await this.getWorkspaceClients(workspaceId);
      
      const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredClients;
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  }
  
  /**
   * Get client analytics
   */
  static async getClientAnalytics(workspaceId: string) {
    try {
      const clients = await this.getWorkspaceClients(workspaceId);
      
      const totalClients = clients.length;
      const activeClients = clients.filter(client => client.isActive).length;
      
      // Get recent clients (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentClients = clients.filter(client => 
        client.createdAt >= thirtyDaysAgo
      ).length;
      
      return {
        totalClients,
        activeClients,
        recentClients,
        inactiveClients: totalClients - activeClients
      };
    } catch (error) {
      console.error('Error getting client analytics:', error);
      throw error;
    }
  }
}