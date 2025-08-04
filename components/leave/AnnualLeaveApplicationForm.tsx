'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover as CommandPopover, PopoverContent as CommandPopoverContent, PopoverTrigger as CommandPopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  User,
  Building,
  Loader2,
  ArrowLeft,
  Save,
  Send,
  FileText,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { LeaveService, CreateLeaveRequestData, AnnualLeaveApplicationData } from '@/lib/leave-service';
import { UserService } from '@/lib/user-service';
import { DepartmentService } from '@/lib/department-service';

interface AnnualLeaveApplicationFormProps {
  workspaceId?: string;
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
  isEditing?: boolean;
  existingData?: AnnualLeaveApplicationData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AnnualLeaveApplicationForm({
  workspaceId,
  allWorkspaces = [],
  shouldShowCrossWorkspace = false,
  isEditing,
  existingData,
  onSuccess,
  onCancel
}: AnnualLeaveApplicationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { currentWorkspace, userRole } = useWorkspace();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [substituteOpen, setSubstituteOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    // Applicant/Employee Section
    applicationDate: existingData?.applicationDate || new Date(),
    employeeName: existingData?.employeeName || '',
    employeeId: existingData?.employeeId || '',
    department: existingData?.department || '',
    annualLeaveEntitlement: existingData?.annualLeaveEntitlement || '',
    daysTaken: existingData?.daysTaken || '',
    fromDate: existingData?.fromDate || undefined as Date | undefined,
    toDate: existingData?.toDate || undefined as Date | undefined,
    periodOfLeave: existingData?.periodOfLeave || '',
    leaveDaysOutstanding: existingData?.leaveDaysOutstanding || '',
    natureOfLeave: existingData?.natureOfLeave || '',
    phoneNumber: existingData?.phoneNumber || '',
    employeeSignature: existingData?.employeeSignature || '',
    
    // Substitute Section
    substituteName: existingData?.substituteName || '',
    substituteSignature: existingData?.substituteSignature || '',
    substituteDate: existingData?.substituteDate || new Date(),
    
    // Office Use Only - HR Section
    totalCasualLeaveTaken: existingData?.totalCasualLeaveTaken || '',
    daysGranted: existingData?.daysGranted || '',
    daysOutstanding: existingData?.daysOutstanding || '',
    hrSignature: existingData?.hrSignature || '',
    hrDate: existingData?.hrDate || new Date(),
    
    // Office Use Only - Approval Section
    approvedBy: existingData?.approvedBy || '',
    approvalSignature: existingData?.approvalSignature || '',
    approvalDate: existingData?.approvalDate || new Date(),
    approvalStatus: existingData?.approvalStatus || 'pending' as 'pending' | 'approved' | 'rejected'
  });

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  // Check if current user is admin or owner
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

  // Load employees, departments and leave types
  useEffect(() => {
    const loadFormData = async () => {
      if (!workspaceId) return;

      try {
        setLoading(true);
        const targetWorkspaceId = shouldShowCrossWorkspace && selectedWorkspace ? selectedWorkspace : workspaceId;

        const [workspaceUsers, workspaceDepartments, workspaceLeaveTypes] = await Promise.all([
          UserService.getUsersByWorkspace(targetWorkspaceId),
          DepartmentService.getWorkspaceDepartments(targetWorkspaceId),
          LeaveService.getLeaveTypes(targetWorkspaceId)
        ]);

        setUsers(workspaceUsers);
        setDepartments(workspaceDepartments);
        setLeaveTypes(workspaceLeaveTypes);
      } catch (error) {
        console.error('Error loading form data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [workspaceId, shouldShowCrossWorkspace, selectedWorkspace, toast]);

  const calculateDays = () => {
    if (!formData.fromDate || !formData.toDate) return 0;
    return differenceInDays(addDays(formData.toDate, 1), formData.fromDate);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.fromDate || !formData.toDate || !formData.natureOfLeave) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const selectedUser = users.find(user => user.id === formData.employeeId);
      const selectedLeaveType = leaveTypes.find(type => type.name.toLowerCase().includes(formData.natureOfLeave.toLowerCase()));

      if (!selectedUser) {
        toast({
          title: 'Error',
          description: 'Invalid user selected.',
          variant: 'destructive'
        });
        return;
      }

      const targetWorkspaceId = shouldShowCrossWorkspace && selectedWorkspace ? selectedWorkspace : workspaceId;

      const annualLeaveApplicationData: Omit<AnnualLeaveApplicationData, 'id' | 'createdAt' | 'updatedAt'> = {
        // Applicant/Employee Section
        applicationDate: formData.applicationDate,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName || `${selectedUser.firstName || selectedUser.name} ${selectedUser.lastName || ''}`,
        department: formData.department,
        annualLeaveEntitlement: formData.annualLeaveEntitlement,
        daysTaken: formData.daysTaken,
        fromDate: formData.fromDate!,
        toDate: formData.toDate!,
        periodOfLeave: formData.periodOfLeave,
        leaveDaysOutstanding: formData.leaveDaysOutstanding,
        natureOfLeave: formData.natureOfLeave,
        phoneNumber: formData.phoneNumber,
        employeeSignature: formData.employeeSignature,
        
        // Substitute Section
        substituteName: formData.substituteName,
        substituteSignature: formData.substituteSignature,
        substituteDate: formData.substituteDate,
        
        // Office Use Only - HR Section
        totalCasualLeaveTaken: formData.totalCasualLeaveTaken,
        daysGranted: formData.daysGranted,
        daysOutstanding: formData.daysOutstanding,
        hrSignature: formData.hrSignature,
        hrDate: formData.hrDate,
        
        // Office Use Only - Approval Section
        approvedBy: formData.approvedBy,
        approvalSignature: formData.approvalSignature,
        approvalDate: formData.approvalDate,
        approvalStatus: formData.approvalStatus,
        
        // Additional metadata
        workspaceId: targetWorkspaceId!,
        workspaceName: currentWorkspace?.name
      };

      if (isEditing && existingData?.id) {
        // Update existing application
        await LeaveService.updateAnnualLeaveApplication(existingData.id, annualLeaveApplicationData);
        toast({
          title: 'Success',
          description: 'Annual leave application updated successfully.',
        });
      } else {
        // Create new application
        await LeaveService.createAnnualLeaveApplication(annualLeaveApplicationData);
        toast({
          title: 'Success',
          description: 'Annual leave application submitted successfully.',
        });
      }

      // Redirect back to leaves page after successful submission
      router.push('/dashboard/hr/leaves');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting leave application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit leave application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save as draft functionality
    toast({
      title: 'Draft Saved',
      description: 'Leave application saved as draft.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'EDIT ANNUAL LEAVE APPLICATION' : 'ANNUAL LEAVE APPLICATION FORM'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Update your leave application details' : 'Complete all sections below'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isEditing ? 'Update Application' : 'Submit Application'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Workspace Selection */}
        {shouldShowCrossWorkspace && allWorkspaces.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {allWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {workspace.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Applicant/Employee Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Applicant/Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.applicationDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.applicationDate}
                      onSelect={(date) => handleInputChange('applicationDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <CommandPopover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                  <CommandPopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeOpen}
                      className="w-full justify-between border-border/50 focus:border-primary"
                    >
                      {formData.employeeId
                        ? users.find((user) => user.id === formData.employeeId)?.firstName && users.find((user) => user.id === formData.employeeId)?.lastName
                          ? `${users.find((user) => user.id === formData.employeeId)?.firstName} ${users.find((user) => user.id === formData.employeeId)?.lastName}`
                          : users.find((user) => user.id === formData.employeeId)?.name
                        : isAdminOrOwner ? "Select employee..." : "Select your name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </CommandPopoverTrigger>
                  <CommandPopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search your name..." />
                      <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                              onSelect={() => {
                                handleInputChange('employeeId', user.id);
                                handleInputChange('employeeName', user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name);
                                setEmployeeOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.employeeId === user.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <User className="mr-2 h-4 w-4" />
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </CommandPopoverContent>
                </CommandPopover>
              </div>
            </div>

            {/* Employee ID and Department Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  placeholder="Enter employee ID"
                  className="border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger className="border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Annual Leave Entitlement and Days Taken Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Annual Leave Entitlement</Label>
                <Input
                  value={formData.annualLeaveEntitlement}
                  onChange={(e) => handleInputChange('annualLeaveEntitlement', e.target.value)}
                  placeholder="e.g., 21 days"
                  className="border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Days Taken</Label>
                <Input
                  value={formData.daysTaken}
                  onChange={(e) => handleInputChange('daysTaken', e.target.value)}
                  placeholder="e.g., 5 days"
                  className="border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* From Date and To Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fromDate ? format(formData.fromDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fromDate}
                      onSelect={(date) => handleInputChange('fromDate', date)}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.toDate ? format(formData.toDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.toDate}
                      onSelect={(date) => handleInputChange('toDate', date)}
                      initialFocus
                      disabled={(date) => 
                        date < new Date() || 
                        (formData.fromDate ? date < formData.fromDate : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Days calculation */}
            {calculateDays() > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Period of Leave and Leave Days Outstanding Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Period of Leave</Label>
                <Input
                  value={formData.periodOfLeave}
                  onChange={(e) => handleInputChange('periodOfLeave', e.target.value)}
                  placeholder="e.g., 2 weeks"
                  className="border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Leave Days Outstanding</Label>
                <Input
                  value={formData.leaveDaysOutstanding}
                  onChange={(e) => handleInputChange('leaveDaysOutstanding', e.target.value)}
                  placeholder="e.g., 16 days"
                  className="border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Nature of Leave and Phone Number Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nature of Leave *</Label>
                <Select value={formData.natureOfLeave} onValueChange={(value) => handleInputChange('natureOfLeave', value)}>
                  <SelectTrigger className="border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  className="border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Employee Signature */}
            <div className="space-y-2">
              <Label>Employee Signature</Label>
              <Input
                value={formData.employeeSignature}
                onChange={(e) => handleInputChange('employeeSignature', e.target.value)}
                placeholder="Enter your name as signature"
                className="border-border/50 focus:border-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Substitute Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Substitute Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Name of Substitute</Label>
              <CommandPopover open={substituteOpen} onOpenChange={setSubstituteOpen}>
                <CommandPopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={substituteOpen}
                    className="w-full justify-between border-border/50 focus:border-primary"
                  >
                    {formData.substituteName || "Select substitute employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </CommandPopoverTrigger>
                <CommandPopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search substitute employees..." />
                    <CommandList>
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                            onSelect={() => {
                              handleInputChange('substituteName', user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name);
                              setSubstituteOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.substituteName === (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name) ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <User className="mr-2 h-4 w-4" />
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CommandPopoverContent>
              </CommandPopover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Substitute Signature</Label>
                <Input
                  value={formData.substituteSignature}
                  onChange={(e) => handleInputChange('substituteSignature', e.target.value)}
                  placeholder="Enter substitute name as signature"
                  className="border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.substituteDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.substituteDate}
                      onSelect={(date) => handleInputChange('substituteDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FOR OFFICE USE ONLY Section */}
        {isAdminOrOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                FOR OFFICE USE ONLY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* HR Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">A) By HR</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Total Casual Leave Taken</Label>
                    <Input
                      value={formData.totalCasualLeaveTaken}
                      onChange={(e) => handleInputChange('totalCasualLeaveTaken', e.target.value)}
                      placeholder="e.g., 3 days"
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Days Granted</Label>
                    <Input
                      value={formData.daysGranted}
                      onChange={(e) => handleInputChange('daysGranted', e.target.value)}
                      placeholder="e.g., 5 days"
                      className="border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Number of Days Outstanding</Label>
                  <Input
                    value={formData.daysOutstanding}
                    onChange={(e) => handleInputChange('daysOutstanding', e.target.value)}
                    placeholder="e.g., 16 days"
                    className="border-border/50 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>HR Signature</Label>
                    <Input
                      value={formData.hrSignature}
                      onChange={(e) => handleInputChange('hrSignature', e.target.value)}
                      placeholder="Enter HR signature"
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.hrDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.hrDate}
                          onSelect={(date) => handleInputChange('hrDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Approval Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">B) Approved/Not Approved by</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label>Approved/Not Approved by</Label>
                  <Input
                    value={formData.approvedBy}
                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                    placeholder="Enter approver name"
                    className="border-border/50 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Approval Signature</Label>
                    <Input
                      value={formData.approvalSignature}
                      onChange={(e) => handleInputChange('approvalSignature', e.target.value)}
                      placeholder="Enter approval signature"
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-border/50 focus:border-primary"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.approvalDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.approvalDate}
                          onSelect={(date) => handleInputChange('approvalDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Approval Status</Label>
                  <Select value={formData.approvalStatus} onValueChange={(value) => handleInputChange('approvalStatus', value)}>
                    <SelectTrigger className="border-border/50 focus:border-primary">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Please review all information before submitting</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isEditing ? 'Update Application' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 