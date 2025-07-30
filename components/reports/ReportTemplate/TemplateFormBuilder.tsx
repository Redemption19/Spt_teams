'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Upload,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  Move,
  Edit,
  Copy,
  ChevronUp,
  ChevronRight,
  FileText,
  Zap
} from 'lucide-react';
import { 
  ReportTemplate, 
  TemplateFieldDraft, 
  ReportFieldType,
  TemplateBuilderState 
} from '@/lib/types';
import { ReportTemplateService } from '@/lib/report-template-service';

interface TemplateFormBuilderProps {
  templateForm: {
    name: string;
    description: string;
    category: string;
    department: string;
    tags: string[];
    visibility: 'public' | 'restricted';
    allowedRoles: ('owner' | 'admin' | 'member')[];
    departmentAccess: {
      type: 'global' | 'department_specific' | 'multi_department' | 'custom';
      allowedDepartments?: string[];
      restrictedDepartments?: string[];
      ownerDepartment?: string;
      inheritFromParent?: boolean;
    };
    settings: {
      allowFileAttachments: boolean;
      maxFileAttachments: number;
      autoSave: boolean;
      autoSaveInterval: number;
      requiresApproval: boolean;
      notifications: {
        onSubmission: boolean;
        onApproval: boolean;
        onRejection: boolean;
        recipientRoles: ('owner' | 'admin' | 'author')[];
      };
    };
  };
  setTemplateForm: (form: any) => void;
  builderState: TemplateBuilderState;
  setBuilderState: (state: TemplateBuilderState) => void;
  categories: string[];
  availableDepartments?: string[];
  isEditing?: boolean;
}

const FIELD_TYPES: { type: ReportFieldType; label: string; icon: any; description: string }[] = [
  { type: 'text', label: 'Text', icon: Type, description: 'Single line text input' },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft, description: 'Multi-line text area' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input with validation' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown, description: 'Select from predefined options' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Yes/No or multiple choice' },
  { type: 'file', label: 'File Upload', icon: Upload, description: 'File attachment field' },
];

export function TemplateFormBuilder({
  templateForm,
  setTemplateForm,
  builderState,
  setBuilderState,
  categories,
  availableDepartments,
  isEditing = false
}: TemplateFormBuilderProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  <TemplateFormBuilder
  templateForm={templateForm}
  setTemplateForm={setTemplateForm}
  builderState={builderState}
  setBuilderState={setBuilderState}
  categories={categories}
  availableDepartments={availableDepartments} // ADD THIS
  isEditing={isEditing}
/>

  // Update builder state validation
  useEffect(() => {
    const isValid = templateForm.name.trim().length > 0 && builderState.fields.length > 0;
    if (builderState.isValid !== isValid || builderState.isDirty !== true) {
      setBuilderState({
        ...builderState,
        isValid,
        isDirty: true
      });
    }
  }, [templateForm.name, builderState.fields, builderState.isValid, builderState.isDirty, setBuilderState, builderState]);

  // Handle basic form changes
  const handleFormChange = (field: string, value: any) => {
    setTemplateForm({
      ...templateForm,
      [field]: value
    });
  };

  // Handle settings changes
  const handleSettingsChange = (field: string, value: any) => {
    setTemplateForm({
      ...templateForm,
      settings: {
        ...templateForm.settings,
        [field]: value
      }
    });
  };

  // Handle notification settings changes
  const handleNotificationChange = (field: string, value: any) => {
    setTemplateForm({
      ...templateForm,
      settings: {
        ...templateForm.settings,
        notifications: {
          ...templateForm.settings.notifications,
          [field]: value
        }
      }
    });
  };
// Handle department access changes
const handleDepartmentAccessChange = (field: string, value: any) => {
    setTemplateForm({
      ...templateForm,
      departmentAccess: {
        ...templateForm.departmentAccess,
        [field]: value
      }
    });
  };

  // Add new field
  const addField = (type: ReportFieldType) => {
    const newField = ReportTemplateService.createDefaultField(type);
    newField.order = builderState.fields.length;
    
    setBuilderState({
      ...builderState,
      fields: [...builderState.fields, newField]
    });
    
    // Expand the new field for editing
    setExpandedFields(new Set([...Array.from(expandedFields), newField.id]));
  };

  // Update field
  const updateField = (fieldId: string, updates: Partial<TemplateFieldDraft>) => {
    setBuilderState({
      ...builderState,
      fields: builderState.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  };

  // Delete field
  const deleteField = (fieldId: string) => {
    setBuilderState({
      ...builderState,
      fields: builderState.fields.filter(field => field.id !== fieldId)
    });
    
    // Remove from expanded fields
    const newExpanded = new Set(expandedFields);
    newExpanded.delete(fieldId);
    setExpandedFields(newExpanded);
  };

  // Duplicate field
  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = builderState.fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField: TemplateFieldDraft = {
      ...fieldToDuplicate,
      id: ReportTemplateService.generateFieldId(),
      label: `${fieldToDuplicate.label} (Copy)`,
      order: builderState.fields.length,
      isNew: true
    };

    setBuilderState({
      ...builderState,
      fields: [...builderState.fields, newField]
    });
  };

  // Move field up/down
  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = builderState.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...builderState.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    // Swap fields
    [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
    
    // Update order
    newFields.forEach((field, index) => {
      field.order = index;
    });

    setBuilderState({
      ...builderState,
      fields: newFields
    });
  };

  // Toggle field expansion
  const toggleFieldExpansion = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  // Handle tags input
  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleFormChange('tags', tags);
  };

  // Handle dropdown options
  const updateDropdownOptions = (fieldId: string, options: string[]) => {
    updateField(fieldId, { options });
  };

  // Render field editor
  const renderFieldEditor = (field: TemplateFieldDraft) => {
    const isExpanded = expandedFields.has(field.id);

    return (
      <Card key={field.id} className="field-editor">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFieldExpansion(field.id)}
                className="p-1 h-auto"
              >
                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = FIELD_TYPES.find(t => t.type === field.type)?.icon;
                  return IconComponent ? (
                    <div className="p-1 bg-muted rounded">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  ) : null;
                })()}
                <div>
                  <div className="font-medium">{field.label || 'Untitled Field'}</div>
                  <div className="text-sm text-muted-foreground">
                    {FIELD_TYPES.find(t => t.type === field.type)?.label} Field
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveField(field.id, 'up')}
                disabled={field.order === 0}
                className="p-1 h-auto"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveField(field.id, 'down')}
                disabled={field.order === builderState.fields.length - 1}
                className="p-1 h-auto"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => duplicateField(field.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteField(field.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Field Label */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${field.id}-label`}>Field Label *</Label>
                <Input
                  id={`${field.id}-label`}
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="Enter field label"
                />
              </div>
              <div>
                <Label htmlFor={`${field.id}-placeholder`}>Placeholder</Label>
                <Input
                  id={`${field.id}-placeholder`}
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>
            </div>

            {/* Help Text */}
            <div>
              <Label htmlFor={`${field.id}-help`}>Help Text</Label>
              <Textarea
                id={`${field.id}-help`}
                value={field.helpText || ''}
                onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                placeholder="Optional help text for users"
                rows={2}
              />
            </div>

            {/* Field Type Specific Options */}
            {field.type === 'dropdown' && (
              <div>
                <Label>Dropdown Options *</Label>
                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(field.options || [])];
                          newOptions[index] = e.target.value;
                          updateDropdownOptions(field.id, newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = field.options?.filter((_, i) => i !== index) || [];
                          updateDropdownOptions(field.id, newOptions);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(field.options || []), ''];
                      updateDropdownOptions(field.id, newOptions);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Number Field Validation */}
            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${field.id}-min`}>Minimum Value</Label>
                  <Input
                    id={`${field.id}-min`}
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) => updateField(field.id, {
                      validation: { 
                        ...field.validation, 
                        min: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor={`${field.id}-max`}>Maximum Value</Label>
                  <Input
                    id={`${field.id}-max`}
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) => updateField(field.id, {
                      validation: { 
                        ...field.validation, 
                        max: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
              </div>
            )}

            {/* Text Field Validation */}
            {(field.type === 'text' || field.type === 'textarea') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${field.id}-minLength`}>Minimum Length</Label>
                  <Input
                    id={`${field.id}-minLength`}
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => updateField(field.id, {
                      validation: { 
                        ...field.validation, 
                        minLength: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor={`${field.id}-maxLength`}>Maximum Length</Label>
                  <Input
                    id={`${field.id}-maxLength`}
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => updateField(field.id, {
                      validation: { 
                        ...field.validation, 
                        maxLength: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
              </div>
            )}

            {/* File Field Options */}
            {field.type === 'file' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${field.id}-maxFiles`}>Maximum Files</Label>
                    <Input
                      id={`${field.id}-maxFiles`}
                      type="number"
                      min="1"
                      value={field.maxFiles || 1}
                      onChange={(e) => updateField(field.id, { maxFiles: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${field.id}-maxSize`}>Max Size (MB)</Label>
                    <Input
                      id={`${field.id}-maxSize`}
                      type="number"
                      min="1"
                      value={field.maxFileSize ? Math.round(field.maxFileSize / (1024 * 1024)) : 10}
                      onChange={(e) => updateField(field.id, { 
                        maxFileSize: Number(e.target.value) * 1024 * 1024 
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Accepted File Types</Label>
                  <Input
                    value={(field.acceptedFileTypes || []).join(', ')}
                    onChange={(e) => updateField(field.id, {
                      acceptedFileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="pdf, doc, docx, jpg, png"
                  />
                </div>
              </div>
            )}

            {/* Field Options */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${field.id}-required`}
                  checked={field.required}
                  onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
                />
                <Label htmlFor={`${field.id}-required`}>Required Field</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor={`${field.id}-width`}>Width:</Label>
                <Select
                  value={field.columnSpan?.toString() || '1'}
                  onValueChange={(value) => updateField(field.id, { columnSpan: Number(value) as 1 | 2 | 3 })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1/3</SelectItem>
                    <SelectItem value="2">2/3</SelectItem>
                    <SelectItem value="3">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="fields">Form Fields</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={templateForm.category} 
                    onValueChange={(value) => handleFormChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe what this template is for"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-department">Department</Label>
                  <Input
                    id="template-department"
                    value={templateForm.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    placeholder="e.g., Finance, HR, Marketing"
                  />
                </div>
                <div>
                  <Label htmlFor="template-tags">Tags</Label>
                  <Input
                    id="template-tags"
                    value={templateForm.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="Enter tags separated by commas"
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
              <div>
                <Label>Visibility</Label>
                <Select 
                  value={templateForm.visibility} 
                  onValueChange={(value) => handleFormChange('visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - All workspace members</SelectItem>
                    <SelectItem value="restricted">Restricted - Specific roles only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {templateForm.visibility === 'restricted' && (
                <div>
                  <Label>Allowed Roles</Label>
                  <div className="flex gap-4 mt-2">
                    {(['owner', 'admin', 'member'] as const).map(role => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={templateForm.allowedRoles.includes(role)}
                          onCheckedChange={(checked) => {
                            const newRoles = checked
                              ? [...templateForm.allowedRoles, role]
                              : templateForm.allowedRoles.filter(r => r !== role);
                            handleFormChange('allowedRoles', newRoles);
                          }}
                        />
                        <Label htmlFor={`role-${role}`} className="capitalize">
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              {/* Department Access Control */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Department Access</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control which departments can access and use this template
                  </p>
                </div>

                <div>
                  <Label>Access Type</Label>
                  <Select 
                    value={templateForm.departmentAccess.type} 
                    onValueChange={(value) => handleDepartmentAccessChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">🌐 Global - All departments can access</SelectItem>
                      <SelectItem value="department_specific">🏢 Department Specific - Only owner department</SelectItem>
                      <SelectItem value="multi_department">👥 Multi-Department - Selected departments only</SelectItem>
                      <SelectItem value="custom">⚙️ Custom - Advanced access rules</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner Department */}
                {(templateForm.departmentAccess.type === 'department_specific' || 
                  templateForm.departmentAccess.type === 'custom') && (
                  <div>
                    <Label>Owner Department</Label>
                    <Select 
                      value={templateForm.departmentAccess.ownerDepartment || templateForm.department} 
                      onValueChange={(value) => handleDepartmentAccessChange('ownerDepartment', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner department" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments?.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Multi-Department Selection */}
                {(templateForm.departmentAccess.type === 'multi_department' || 
                  templateForm.departmentAccess.type === 'custom') && (
                  <div>
                    <Label>Allowed Departments</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select which departments can access this template
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {availableDepartments?.map(dept => (
                        <div key={dept} className="flex items-center gap-2">
                          <Checkbox
                            id={`dept-${dept}`}
                            checked={templateForm.departmentAccess.allowedDepartments?.includes(dept) || false}
                            onCheckedChange={(checked) => {
                              const current = templateForm.departmentAccess.allowedDepartments || [];
                              const updated = checked
                                ? [...current, dept]
                                : current.filter(d => d !== dept);
                              handleDepartmentAccessChange('allowedDepartments', updated);
                            }}
                          />
                          <Label htmlFor={`dept-${dept}`} className="text-sm">
                            {dept}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Restrictions */}
                {templateForm.departmentAccess.type === 'custom' && (
                  <div>
                    <Label>Restricted Departments (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Explicitly deny access to specific departments
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {availableDepartments?.map(dept => (
                        <div key={dept} className="flex items-center gap-2">
                          <Checkbox
                            id={`restrict-${dept}`}
                            checked={templateForm.departmentAccess.restrictedDepartments?.includes(dept) || false}
                            onCheckedChange={(checked) => {
                              const current = templateForm.departmentAccess.restrictedDepartments || [];
                              const updated = checked
                                ? [...current, dept]
                                : current.filter(d => d !== dept);
                              handleDepartmentAccessChange('restrictedDepartments', updated);
                            }}
                          />
                          <Label htmlFor={`restrict-${dept}`} className="text-sm">
                            {dept}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Access Summary */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <h4 className="text-sm font-medium mb-2">📋 Access Summary</h4>
                  <div className="text-sm text-muted-foreground">
                    {templateForm.departmentAccess.type === 'global' && (
                      <p>✅ All departments in the workspace can access this template</p>
                    )}
                    {templateForm.departmentAccess.type === 'department_specific' && (
                      <p>🏢 Only the <strong>{templateForm.departmentAccess.ownerDepartment || templateForm.department}</strong> department can access this template</p>
                    )}
                    {templateForm.departmentAccess.type === 'multi_department' && (
                      <p>👥 Only <strong>{templateForm.departmentAccess.allowedDepartments?.length || 0}</strong> selected department(s) can access this template</p>
                    )}
                    {templateForm.departmentAccess.type === 'custom' && (
                      <div>
                        <p>⚙️ Custom access rules:</p>
                        <ul className="list-disc list-inside mt-1 ml-2">
                          {templateForm.departmentAccess.allowedDepartments?.length ? (
                            <li>Allowed: {templateForm.departmentAccess.allowedDepartments.join(', ')}</li>
                          ) : (
                            <li>Allowed: All departments</li>
                          )}
                          {templateForm.departmentAccess.restrictedDepartments?.length ? (
                            <li>Restricted: {templateForm.departmentAccess.restrictedDepartments.join(', ')}</li>
                          ) : null}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Fields Tab */}
        <TabsContent value="fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Form Fields</span>
                <Badge variant="outline">
                  {builderState.fields.length} field{builderState.fields.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Field Type Selector */}
              <div className="mb-6">
                <Label className="text-base font-medium mb-3 block">Add New Field</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {FIELD_TYPES.map(fieldType => (
                    <Button
                      key={fieldType.type}
                      variant="outline"
                      size="sm"
                      onClick={() => addField(fieldType.type)}
                      className="flex flex-col items-center gap-2 h-auto py-3 px-2"
                    >
                      <fieldType.icon className="h-4 w-4" />
                      <span className="text-xs">{fieldType.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Fields List */}
              <div className="space-y-4">
                {builderState.fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No fields added yet</p>
                    <p className="text-sm">Click on a field type above to get started</p>
                  </div>
                ) : (
                  builderState.fields
                    .sort((a, b) => a.order - b.order)
                    .map(field => renderFieldEditor(field))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Attachments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow File Attachments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to attach files to reports
                    </p>
                  </div>
                  <Switch
                    checked={templateForm.settings.allowFileAttachments}
                    onCheckedChange={(checked) => handleSettingsChange('allowFileAttachments', checked)}
                  />
                </div>

                {templateForm.settings.allowFileAttachments && (
                  <div>
                    <Label htmlFor="max-attachments">Maximum Attachments</Label>
                    <Input
                      id="max-attachments"
                      type="number"
                      min="1"
                      max="20"
                      value={templateForm.settings.maxFileAttachments}
                      onChange={(e) => handleSettingsChange('maxFileAttachments', Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Auto Save */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save draft reports
                    </p>
                  </div>
                  <Switch
                    checked={templateForm.settings.autoSave}
                    onCheckedChange={(checked) => handleSettingsChange('autoSave', checked)}
                  />
                </div>

                {templateForm.settings.autoSave && (
                  <div>
                    <Label htmlFor="auto-save-interval">Auto Save Interval (minutes)</Label>
                    <Input
                      id="auto-save-interval"
                      type="number"
                      min="1"
                      max="60"
                      value={templateForm.settings.autoSaveInterval}
                      onChange={(e) => handleSettingsChange('autoSaveInterval', Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Approval Workflow */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requires Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Reports need approval before being finalized
                    </p>
                  </div>
                  <Switch
                    checked={templateForm.settings.requiresApproval}
                    onCheckedChange={(checked) => handleSettingsChange('requiresApproval', checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Notifications</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>On Submission</Label>
                      <p className="text-xs text-muted-foreground">
                        When report is submitted
                      </p>
                    </div>
                    <Switch
                      checked={templateForm.settings.notifications.onSubmission}
                      onCheckedChange={(checked) => handleNotificationChange('onSubmission', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>On Approval</Label>
                      <p className="text-xs text-muted-foreground">
                        When report is approved
                      </p>
                    </div>
                    <Switch
                      checked={templateForm.settings.notifications.onApproval}
                      onCheckedChange={(checked) => handleNotificationChange('onApproval', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>On Rejection</Label>
                      <p className="text-xs text-muted-foreground">
                        When report is rejected
                      </p>
                    </div>
                    <Switch
                      checked={templateForm.settings.notifications.onRejection}
                      onCheckedChange={(checked) => handleNotificationChange('onRejection', checked)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notification Recipients</Label>
                  <div className="flex gap-4 mt-2">
                    {(['owner', 'admin', 'author'] as const).map(role => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`notify-${role}`}
                          checked={templateForm.settings.notifications.recipientRoles.includes(role)}
                          onCheckedChange={(checked) => {
                            const newRoles = checked
                              ? [...templateForm.settings.notifications.recipientRoles, role]
                              : templateForm.settings.notifications.recipientRoles.filter(r => r !== role);
                            handleNotificationChange('recipientRoles', newRoles);
                          }}
                        />
                        <Label htmlFor={`notify-${role}`} className="capitalize">
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Alerts */}
      {!builderState.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields:
            {!templateForm.name.trim() && <span className="block">• Template name is required</span>}
            {builderState.fields.length === 0 && <span className="block">• At least one field is required</span>}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}