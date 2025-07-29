'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { ClientService, type Client } from '@/lib/client-service';
import CreateClientModal from '@/components/financial/CreateClientModal';
import { Search, Plus, Edit, Trash2, Mail, Phone, Globe, Building, MapPin } from 'lucide-react';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { useDeleteDialog } from '@/components/ui/delete-dialog';

interface ClientManagementProps {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function ClientManagement({ 
  canCreate = true, 
  canEdit = true, 
  canDelete = true 
}: ClientManagementProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const deleteDialog = useDeleteDialog();

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const clientsData = await ClientService.getWorkspaceClients(currentWorkspace.id);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    fetchClients();
  }, [currentWorkspace, fetchClients]);

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle client creation
  const handleClientCreated = async (clientId: string) => {
    await fetchClients();
    toast({
      title: "Success",
      description: "Client created successfully"
    });
  };

  // Handle client deletion
  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    deleteDialog.openDialog({ 
      id: clientId, 
      name: client.name,
      company: client.company,
      email: client.email
    });
  };

  const confirmDeleteClient = async () => {
    if (!deleteDialog.item) return;

    try {
      await ClientService.deleteClient(deleteDialog.item.id);
      await fetchClients();
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Client Management</h2>
            <p className="text-muted-foreground">Manage your clients and their information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Client Management</h2>
          <p className="text-muted-foreground">Manage your clients and their information</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.company && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building className="w-3 h-3" />
                      {client.company}
                    </div>
                  )}
                </div>
                <Badge variant={client.isActive ? 'default' : 'secondary'}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Contact Information */}
              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{client.website}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                    <span className="text-xs leading-relaxed">{client.address}</span>
                  </div>
                )}
              </div>

              {/* Tax ID */}
              {client.taxId && (
                <div className="text-xs text-muted-foreground">
                  Tax ID: {client.taxId}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Created {new Date(client.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {clients.length === 0 
                ? 'No clients found. Create your first client to get started.' 
                : 'No clients found matching your search.'}
            </p>
            {canCreate && clients.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CreateClientModal
        open={showCreateModal || !!editingClient}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingClient(null);
          }
        }}
        onClientCreated={handleClientCreated}
        initialData={editingClient}
        isEdit={!!editingClient}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeDialog}
        onConfirm={confirmDeleteClient}
        title="Delete Client"
        description="You are about to permanently delete this client. This action cannot be undone."
        item={deleteDialog.item}
        itemDetails={[
          { label: 'Client Name', value: deleteDialog.item?.name || '' },
          { label: 'Company', value: deleteDialog.item?.company || 'N/A' },
          { label: 'Email', value: deleteDialog.item?.email || 'N/A' }
        ]}
        consequences={[
          'Permanently remove this client from the system',
          'Remove all associated invoices and transactions',
          'This client will no longer be accessible to anyone',
          'Any reports including this client will be affected'
        ]}
        confirmText="Delete Client"
        isLoading={deleteDialog.isLoading}
        warningLevel="high"
      />
    </div>
  );
}