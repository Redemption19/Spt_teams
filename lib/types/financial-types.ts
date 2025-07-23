// Financial Management Types
export interface Currency {
  id: string;
  code: string; // USD, EUR, GBP, GHS, etc.
  name: string;
  symbol: string;
  exchangeRate: number; // Rate to base currency (GHS - Ghana Cedis)
  isActive: boolean;
  isDefault: boolean; // Default currency for the workspace
  updatedAt: Date;
}

export interface CurrencySettings {
  id: string;
  workspaceId: string;
  defaultCurrency: string; // Currency code (e.g., 'GHS')
  allowedCurrencies: string[]; // List of currency codes
  autoConversion: boolean; // Automatically convert to default currency
  exchangeRateProvider: 'manual' | 'api' | 'bank'; // Source of exchange rates
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual'; // How often to update rates
  rateTolerance: number; // Percentage threshold for rate change alerts (e.g., 5 = 5%)
  enableRateAlerts: boolean; // Send alerts when rates change significantly
  roundingPrecision: number; // Number of decimal places (2-6)
  enableAutomaticSync: boolean; // Auto-sync with Bank of Ghana
  bankOfGhanaApiKey?: string; // API key for Bank of Ghana
  fallbackProvider: 'manual' | 'cached'; // What to do if primary provider fails
  lastUpdated: Date;
  nextUpdateAt?: Date;
  rateLimits: {
    maxDailyRequests: number;
    currentDailyRequests: number;
    resetAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  workspaceId: string;
  departmentId?: string;
  branchId?: string;
  regionId?: string;
  managerId?: string;
  budget?: number;
  budgetPeriod?: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  amountInBaseCurrency: number; // Converted to USD
  category: ExpenseCategory;
  subcategory?: string;
  workspaceId: string;
  costCenterId?: string;
  departmentId?: string;
  projectId?: string;
  taskId?: string;
  teamId?: string;
  branchId?: string;
  regionId?: string;
  submittedBy: string;
  approvedBy?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  expenseDate: Date;
  receiptUrl?: string;
  tags?: string[];
  billable: boolean;
  clientId?: string;
  reimbursable: boolean;
  approvalWorkflow?: ApprovalStep[];
  vendor?: string;
  paymentMethod?: string;
  notes?: string;
  receipts?: string[]; // Array of receipt URLs/file paths
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  defaultCostCenter?: string;
  requiresApproval: boolean;
  approvalLimit?: number;
  isActive: boolean;
  workspaceId: string;
}

export interface Budget {
  id: string;
  name: string;
  type: 'workspace' | 'department' | 'project' | 'costCenter' | 'team';
  entityId: string; // ID of workspace, department, etc.
  workspaceId: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  categories?: string[]; // Expense categories this budget covers
  spent: number;
  committed: number; // Pending approvals
  remaining: number;
  alerts: BudgetAlert[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  threshold: number; // Percentage
  type: 'warning' | 'critical' | 'exceeded';
  message: string;
  notifyUsers: string[];
  triggered: boolean;
  triggeredAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  workspaceId: string;
  clientId?: string;
  projectId?: string;
  type: 'expense_reimbursement' | 'project_billing' | 'subscription' | 'service';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount?: number;
  total: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
  terms?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  expenseId?: string;
  taskId?: string;
  projectId?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly' | 'one-time';
  features: string[];
  maxUsers?: number;
  maxWorkspaces?: number;
  maxStorage?: number; // GB
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'suspended';
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  lastBillingDate?: Date;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  billingEmail: string;
  autoRenew: boolean;
  usageTracking: UsageMetrics;
  invoices: string[]; // Invoice IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageMetrics {
  users: number;
  workspaces: number;
  storage: number; // GB used
  apiCalls: number;
  lastUpdated: Date;
}

export interface PaymentMethod {
  id: string;
  workspaceId: string;
  type: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  isDefault: boolean;
  cardLastFour?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  billingAddress?: Address;
  isActive: boolean;
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ApprovalStep {
  id: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
  order: number;
}

export interface FinancialReport {
  id: string;
  name: string;
  type: 'expense' | 'budget' | 'invoice' | 'profit_loss' | 'cash_flow' | 'roi';
  workspaceId: string;
  filters: ReportFilters;
  data: any;
  generatedBy: string;
  generatedAt: Date;
  scheduledReport?: ScheduledReportConfig;
}

export interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  workspaces?: string[];
  departments?: string[];
  costCenters?: string[];
  projects?: string[];
  categories?: string[];
  currency?: string;
  status?: string[];
}

export interface ScheduledReportConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  nextRun: Date;
  isActive: boolean;
}

// Analytics interfaces
export interface ExpenseAnalytics {
  totalExpenses: number;
  totalByCategory: { [category: string]: number };
  totalByDepartment: { [department: string]: number };
  totalByProject: { [project: string]: number };
  monthlyTrend: { month: string; amount: number }[];
  topExpenseCategories: { category: string; amount: number; percentage: number }[];
  budgetUtilization: { budgetName: string; used: number; total: number; percentage: number }[];
}

export interface BudgetAnalytics {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
  departmentBreakdown: { department: string; budget: number; spent: number; remaining: number }[];
  alerts: BudgetAlert[];
  projectedOverruns: { entity: string; projectedAmount: number; timeline: string }[];
}

// Form interfaces for UI
export interface ExpenseFormData {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  costCenterId?: string;
  departmentId?: string;
  projectId?: string;
  taskId?: string;
  expenseDate: Date;
  billable: boolean;
  reimbursable: boolean;
  receiptFile?: File;
  receipts?: string[]; // For bulk import
  tags?: string[];
  vendor?: string; // For bulk import and receipt scanning
  paymentMethod?: string; // For bulk import and receipt scanning
  notes?: string; // For bulk import and receipt scanning
}

export interface BudgetFormData {
  name: string;
  type: 'workspace' | 'department' | 'project' | 'costCenter' | 'team';
  entityId: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  categories?: string[];
  alerts: {
    threshold: number;
    notifyUsers: string[];
  }[];
}

export interface InvoiceFormData {
  clientId?: string;
  projectId?: string;
  type: 'expense_reimbursement' | 'project_billing' | 'subscription' | 'service';
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  taxRate: number;
  discount?: number;
  currency: string;
  dueDate: Date;
  notes?: string;
  terms?: string;
}
