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
  Users,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 flex-shrink-0 h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Back</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">
              {isEditing ? 'EDIT ANNUAL LEAVE APPLICATION' : 'ANNUAL LEAVE APPLICATION FORM'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isEditing ? 'Update your leave application details' : 'Complete all sections below'}
            </p>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="flex items-center justify-center gap-2 h-10 text-sm"
          >
            <Save className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Save Draft</span>
            <span className="xs:hidden">Save</span>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 h-10 text-sm"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            ) : (
              <Send className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="hidden xs:inline">
              {isEditing ? 'Update Application' : 'Submit Application'}
            </span>
            <span className="xs:hidden">
              {isEditing ? 'Update' : 'Submit'}
            </span>
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
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant/Employee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-6">
            {/* Date and Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{format(formData.applicationDate, 'PPP')}</span>
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
                <Label className="text-sm font-medium">Name *</Label>
                <CommandPopover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                  <CommandPopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeOpen}
                      className="w-full justify-between border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <span className="truncate">
                        {formData.employeeId
                          ? users.find((user) => user.id === formData.employeeId)?.firstName && users.find((user) => user.id === formData.employeeId)?.lastName
                            ? `${users.find((user) => user.id === formData.employeeId)?.firstName} ${users.find((user) => user.id === formData.employeeId)?.lastName}`
                            : users.find((user) => user.id === formData.employeeId)?.name
                          : isAdminOrOwner ? "Select employee..." : "Select your name..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                    </Button>
                  </CommandPopoverTrigger>
                  <CommandPopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search your name..." className="h-10 sm:h-11 text-sm sm:text-base" />
                      <CommandList className="max-h-[150px] sm:max-h-[200px]">
                        <CommandEmpty className="text-sm text-muted-foreground py-4">No user found.</CommandEmpty>
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
                              className="cursor-pointer hover:bg-accent p-3 sm:p-2"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 flex-shrink-0 ${
                                  formData.employeeId === user.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <User className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span className="truncate text-sm sm:text-base">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                              </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Employee ID</Label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  placeholder="Enter employee ID"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Annual Leave Entitlement</Label>
                <Input
                  value={formData.annualLeaveEntitlement}
                  onChange={(e) => handleInputChange('annualLeaveEntitlement', e.target.value)}
                  placeholder="e.g., 21 days"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Days Taken</Label>
                <Input
                  value={formData.daysTaken}
                  onChange={(e) => handleInputChange('daysTaken', e.target.value)}
                  placeholder="e.g., 5 days"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* From Date and To Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">From Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.fromDate ? format(formData.fromDate, 'PPP') : 'Pick a date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fromDate}
                      onSelect={(date) => handleInputChange('fromDate', date)}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="text-sm"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">To Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.toDate ? format(formData.toDate, 'PPP') : 'Pick a date'}
                      </span>
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
                      className="text-sm"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Days calculation */}
            {calculateDays() > 0 && (
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                    Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Period of Leave and Leave Days Outstanding Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Period of Leave</Label>
                <Input
                  value={formData.periodOfLeave}
                  onChange={(e) => handleInputChange('periodOfLeave', e.target.value)}
                  placeholder="e.g., 2 weeks"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Leave Days Outstanding</Label>
                <Input
                  value={formData.leaveDaysOutstanding}
                  onChange={(e) => handleInputChange('leaveDaysOutstanding', e.target.value)}
                  placeholder="e.g., 16 days"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Nature of Leave and Phone Number Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nature of Leave *</Label>
                <Select value={formData.natureOfLeave} onValueChange={(value) => handleInputChange('natureOfLeave', value)}>
                  <SelectTrigger className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base">
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
                <Label className="text-sm font-medium">Phone Number</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Employee Signature */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Employee Signature</Label>
              <Input
                value={formData.employeeSignature}
                onChange={(e) => handleInputChange('employeeSignature', e.target.value)}
                placeholder="Enter your name as signature"
                className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Substitute Section */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Substitute Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name of Substitute</Label>
              <CommandPopover open={substituteOpen} onOpenChange={setSubstituteOpen}>
                <CommandPopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={substituteOpen}
                    className="w-full justify-between border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                  >
                    <span className="truncate">
                      {formData.substituteName || "Select substitute employee..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                  </Button>
                </CommandPopoverTrigger>
                <CommandPopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search substitute employees..." className="h-10 sm:h-11 text-sm sm:text-base" />
                    <CommandList className="max-h-[150px] sm:max-h-[200px]">
                      <CommandEmpty className="text-sm text-muted-foreground py-4">No user found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                            onSelect={() => {
                              handleInputChange('substituteName', user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name);
                              setSubstituteOpen(false);
                            }}
                            className="cursor-pointer hover:bg-accent p-3 sm:p-2"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 flex-shrink-0 ${
                                formData.substituteName === (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name) ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <User className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate text-sm sm:text-base">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CommandPopoverContent>
              </CommandPopover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Substitute Signature</Label>
                <Input
                  value={formData.substituteSignature}
                  onChange={(e) => handleInputChange('substituteSignature', e.target.value)}
                  placeholder="Enter substitute name as signature"
                  className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {format(formData.substituteDate, 'PPP')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.substituteDate}
                      onSelect={(date) => handleInputChange('substituteDate', date)}
                      initialFocus
                      className="text-sm"
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
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                FOR OFFICE USE ONLY
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-8">
              {/* HR Section */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">A) By HR</Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total Casual Leave Taken</Label>
                    <Input
                      value={formData.totalCasualLeaveTaken}
                      onChange={(e) => handleInputChange('totalCasualLeaveTaken', e.target.value)}
                      placeholder="e.g., 3 days"
                      className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Number of Days Granted</Label>
                    <Input
                      value={formData.daysGranted}
                      onChange={(e) => handleInputChange('daysGranted', e.target.value)}
                      placeholder="e.g., 5 days"
                      className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Number of Days Outstanding</Label>
                  <Input
                    value={formData.daysOutstanding}
                    onChange={(e) => handleInputChange('daysOutstanding', e.target.value)}
                    placeholder="e.g., 16 days"
                    className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">HR Signature</Label>
                    <Input
                      value={formData.hrSignature}
                      onChange={(e) => handleInputChange('hrSignature', e.target.value)}
                      placeholder="Enter HR signature"
                      className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(formData.hrDate, 'PPP')}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.hrDate}
                          onSelect={(date) => handleInputChange('hrDate', date)}
                          initialFocus
                          className="text-sm"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Approval Section */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">B) Approved/Not Approved by</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Approved/Not Approved by</Label>
                  <Input
                    value={formData.approvedBy}
                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                    placeholder="Enter approver name"
                    className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Approval Signature</Label>
                    <Input
                      value={formData.approvalSignature}
                      onChange={(e) => handleInputChange('approvalSignature', e.target.value)}
                      placeholder="Enter approval signature"
                      className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(formData.approvalDate, 'PPP')}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.approvalDate}
                          onSelect={(date) => handleInputChange('approvalDate', date)}
                          initialFocus
                          className="text-sm"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Approval Status</Label>
                  <Select value={formData.approvalStatus} onValueChange={(value) => handleInputChange('approvalStatus', value)}>
                    <SelectTrigger className="border-border/50 focus:border-primary h-10 sm:h-11 text-sm sm:text-base">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 sm:pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 sm:order-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Please review all information before submitting</span>
            <span className="sm:hidden">Review before submitting</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="flex items-center justify-center gap-2 h-10 sm:h-11 text-sm sm:text-base"
            >
              <Save className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Save</span>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 h-10 sm:h-11 text-sm sm:text-base"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <Send className="h-4 w-4 flex-shrink-0" />
              )}
              {submitting ? (
                <>
                  <span className="hidden sm:inline">{isEditing ? 'Updating...' : 'Submitting...'}</span>
                  <span className="sm:hidden">{isEditing ? 'Update' : 'Submit'}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">{isEditing ? 'Update Application' : 'Submit Application'}</span>
                  <span className="sm:hidden">{isEditing ? 'Update' : 'Submit'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}