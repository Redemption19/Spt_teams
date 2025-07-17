import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Crown, UserCheck, User, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { PermissionsService, PermissionCategory } from '@/lib/permissions-service';

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  permissions: string[];
  category: string;
}

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'full-access',
    name: 'Full Access',
    description: 'Complete system access with all permissions',
    icon: Crown,
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    category: 'Owner',
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.invite', 'users.permissions',
      'workspaces.view', 'workspaces.create', 'workspaces.edit', 'workspaces.delete',
      'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.assign',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign', 'tasks.complete',
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete', 'teams.members',
      'departments.view', 'departments.create', 'departments.edit', 'departments.delete', 'departments.members',
      'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
      'regions.view', 'regions.create', 'regions.edit', 'regions.delete',
      'folders.view', 'folders.create', 'folders.edit', 'folders.delete', 'folders.assign',
      'reports.view', 'reports.create', 'reports.edit', 'reports.delete', 'reports.approve', 'reports.export',
      'analytics.view', 'analytics.export',
      'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.delete',
      'settings.view', 'settings.edit',
      'support.view', 'support.create', 'support.edit', 'support.resolve',
      'database.view', 'database.backup', 'database.restore',
      'ai.view', 'ai.configure'
    ]
  },
  {
    id: 'admin-access',
    name: 'Admin Access',
    description: 'Administrative access with management capabilities',
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    category: 'Admin',
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.invite',
      'workspaces.view', 'workspaces.edit',
      'projects.view', 'projects.create', 'projects.edit', 'projects.assign',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.complete',
      'teams.view', 'teams.create', 'teams.edit', 'teams.members',
      'departments.view', 'departments.create', 'departments.edit', 'departments.members',
      'branches.view', 'branches.create', 'branches.edit',
      'regions.view', 'regions.create', 'regions.edit',
      'folders.view', 'folders.create', 'folders.edit', 'folders.assign',
      'reports.view', 'reports.create', 'reports.edit', 'reports.approve',
      'analytics.view',
      'calendar.view', 'calendar.create', 'calendar.edit',
      'settings.view',
      'support.view', 'support.create', 'support.edit'
    ]
  },
  {
    id: 'manager-access',
    name: 'Manager Access',
    description: 'Team and project management capabilities',
    icon: UserCheck,
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    category: 'Manager',
    permissions: [
      'users.view',
      'projects.view', 'projects.create', 'projects.edit', 'projects.assign',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.complete',
      'teams.view', 'teams.edit', 'teams.members',
      'departments.view', 'departments.edit', 'departments.members',
      'folders.view', 'folders.create', 'folders.edit', 'folders.assign',
      'reports.view', 'reports.create', 'reports.edit',
      'analytics.view',
      'calendar.view', 'calendar.create', 'calendar.edit',
      'support.view', 'support.create'
    ]
  },
  {
    id: 'standard-access',
    name: 'Standard Access',
    description: 'Basic access for regular team members',
    icon: User,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    category: 'Member',
    permissions: [
      'users.view',
      'projects.view',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.complete',
      'teams.view',
      'departments.view',
      'folders.view', 'folders.create', 'folders.edit',
      'reports.view', 'reports.create', 'reports.edit',
      'calendar.view', 'calendar.create', 'calendar.edit',
      'support.view', 'support.create'
    ]
  },
  {
    id: 'limited-access',
    name: 'Limited Access',
    description: 'Restricted access for basic operations',
    icon: User,
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    category: 'Limited',
    permissions: [
      'users.view',
      'projects.view',
      'tasks.view', 'tasks.complete',
      'teams.view',
      'departments.view',
      'folders.view',
      'reports.view',
      'calendar.view',
      'support.view', 'support.create'
    ]
  },
  {
    id: 'view-only',
    name: 'View Only',
    description: 'Read-only access to view information',
    icon: User,
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    category: 'Viewer',
    permissions: [
      'users.view',
      'projects.view',
      'tasks.view',
      'teams.view',
      'departments.view',
      'folders.view',
      'reports.view',
      'calendar.view',
      'support.view'
    ]
  }
];

interface PermissionsTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: PermissionTemplate) => void;
  currentPermissions?: { [key: string]: boolean };
}

export function PermissionsTemplates({
  isOpen,
  onClose,
  onApplyTemplate,
  currentPermissions = {}
}: PermissionsTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleTemplateSelect = (template: PermissionTemplate) => {
    setSelectedTemplate(template);
    setShowConfirmation(true);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
      setSelectedTemplate(null);
      setShowConfirmation(false);
      onClose();
    }
  };

  const getTemplateCompatibility = (template: PermissionTemplate) => {
    const currentPermissionCount = Object.keys(currentPermissions).filter(key => currentPermissions[key]).length;
    const templatePermissionCount = template.permissions.length;
    
    if (templatePermissionCount > currentPermissionCount) {
      return { compatible: true, type: 'upgrade' as const };
    } else if (templatePermissionCount < currentPermissionCount) {
      return { compatible: true, type: 'downgrade' as const };
    } else {
      return { compatible: true, type: 'same' as const };
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Permission Templates</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Choose a predefined permission template to quickly assign permissions to users. 
                Templates can be customized after application.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERMISSION_TEMPLATES.map(template => {
                const Icon = template.icon;
                const compatibility = getTemplateCompatibility(template);
                
                return (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-5 w-5" />
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        <Badge className={`text-xs ${template.color}`}>
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Permissions:</span>
                          <span className="font-medium">{template.permissions.length}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {template.permissions.slice(0, 6).map(permission => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission.split('.')[1]}
                            </Badge>
                          ))}
                          {template.permissions.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.permissions.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {compatibility.type !== 'same' && (
                        <div className="flex items-center space-x-1 text-xs">
                          {compatibility.type === 'upgrade' ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">Upgrade</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                              <span className="text-yellow-600">Downgrade</span>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will replace the current permissions with the &quot;{selectedTemplate.name}&quot; template. 
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Template Details:</p>
                <div className="text-sm space-y-1">
                  <div>• {selectedTemplate.permissions.length} permissions</div>
                  <div>• Category: {selectedTemplate.category}</div>
                  <div>• {selectedTemplate.description}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} className="bg-gradient-to-r from-primary to-accent">
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 