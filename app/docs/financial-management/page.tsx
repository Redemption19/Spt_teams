'use client';

import { Wallet, CreditCard, PieChart, TrendingUp, Receipt, Calculator, FileText, Users, Shield, BarChart3, Settings, Calendar, Target, AlertCircle, CheckCircle, Clock, Globe, Scan, Building2, Brain, Layers, Workflow, Eye, Zap, Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function FinancialManagementPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Financial Management
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Comprehensive financial tools for expense tracking, budget management, invoicing, and financial reporting with multi-currency support.
        </p>
      </div>

      {/* Core Financial Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" />
          Core Financial Features
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-500" />
                Comprehensive Expense Management
              </CardTitle>
              <CardDescription>
                Advanced expense tracking with OCR, multi-currency support, and intelligent workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Receipt scanning with OCR capabilities</li>
                <li>• Multi-currency expense tracking with real-time conversion</li>
                <li>• Department & project allocation</li>
                <li>• Multi-level approval workflows with notification chains</li>
                <li>• Real-time spending insights and trend analysis</li>
                <li>• Automated expense categorization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Advanced Budget Control
              </CardTitle>
              <CardDescription>
                Comprehensive budget planning with cost center management and real-time tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Department, project, and cost center budgets</li>
                <li>• Real-time budget tracking with detailed updates</li>
                <li>• Automated alert systems for budget thresholds</li>
                <li>• Variance analysis with detailed reports</li>
                <li>• Cost center analytics and performance tracking</li>
                <li>• Budget overrun notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Invoice Management
              </CardTitle>
              <CardDescription>
                Create, send, and track invoices efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Professional invoice templates</li>
                <li>• Automated invoice generation</li>
                <li>• Payment tracking and reminders</li>
                <li>• Multi-currency invoicing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Financial Reporting & Analytics
              </CardTitle>
              <CardDescription>
                Advanced reporting with AI-powered insights and drill-down analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Dynamic reports with drag-and-drop interface</li>
                <li>• Real-time financial KPIs and metrics visualization</li>
                <li>• AI-powered budget forecasting and trend prediction</li>
                <li>• Drill-down analysis for detailed breakdowns</li>
                <li>• Export capabilities (PDF, Excel, CSV)</li>
                <li>• Performance dashboards</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-red-500" />
                Multi-Currency Support
              </CardTitle>
              <CardDescription>
                Handle international transactions seamlessly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time exchange rates</li>
                <li>• Currency conversion tracking</li>
                <li>• Multi-currency reporting</li>
                <li>• Foreign exchange management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Compliance & Security
              </CardTitle>
              <CardDescription>
                Ensure financial compliance and data security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Tax compliance features</li>
                <li>• Audit trail maintenance</li>
                <li>• Financial data encryption</li>
                <li>• Regulatory reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-cyan-500" />
                OCR Receipt Management
              </CardTitle>
              <CardDescription>
                Intelligent receipt processing with optical character recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Automatic data extraction from receipts</li>
                <li>• Smart categorization and tagging</li>
                <li>• Mobile receipt capture</li>
                <li>• Duplicate detection and prevention</li>
                <li>• Multi-format support (PDF, JPG, PNG)</li>
                <li>• Receipt validation and verification</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" />
                Cost Center Management
              </CardTitle>
              <CardDescription>
                Detailed cost center analytics and performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Hierarchical cost center structure</li>
                <li>• Real-time cost allocation tracking</li>
                <li>• Performance metrics and KPIs</li>
                <li>• Cross-departmental cost analysis</li>
                <li>• Budget vs. actual cost comparisons</li>
                <li>• Cost center profitability analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-500" />
                AI-Powered Forecasting
              </CardTitle>
              <CardDescription>
                Intelligent budget forecasting and trend prediction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Machine learning-based predictions</li>
                <li>• Seasonal trend analysis</li>
                <li>• Anomaly detection and alerts</li>
                <li>• Scenario planning and modeling</li>
                <li>• Predictive cash flow analysis</li>
                <li>• Risk assessment and mitigation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Financial Management Guide */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">💰 Financial Management Guide</h2>
        
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="expenses">Expense Tracking</TabsTrigger>
            <TabsTrigger value="budgets">Budget Management</TabsTrigger>
            <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
            <TabsTrigger value="reporting">Financial Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Expense Submission
                  </CardTitle>
                  <CardDescription>
                    How to submit and track business expenses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Submission Methods:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Mobile app with receipt scanning</li>
                        <li>• Web portal for bulk uploads</li>
                        <li>• Email forwarding to expense system</li>
                        <li>• Integration with corporate cards</li>
                        <li>• Mileage tracking with GPS</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Expense Categories:</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">Travel</Badge>
                        <Badge variant="outline">Meals</Badge>
                        <Badge variant="outline">Office Supplies</Badge>
                        <Badge variant="outline">Software</Badge>
                        <Badge variant="outline">Marketing</Badge>
                        <Badge variant="outline">Training</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Approval Workflow
                  </CardTitle>
                  <CardDescription>
                    Streamlined expense approval process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Approval Levels:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                           <span className="text-sm">Manager Approval (&lt; $500)</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                           <span className="text-sm">Director Approval ($500 - $2000)</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                           <span className="text-sm">Executive Approval (&gt; $2000)</span>
                         </div>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Automated routing based on amount</li>
                      <li>• Email notifications to approvers</li>
                      <li>• Mobile approval capabilities</li>
                      <li>• Bulk approval for managers</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Corporate Card Integration
                  </CardTitle>
                  <CardDescription>
                    Seamless integration with corporate credit cards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automatic transaction import</li>
                    <li>• Real-time expense matching</li>
                    <li>• Missing receipt alerts</li>
                    <li>• Spending limit enforcement</li>
                    <li>• Merchant category mapping</li>
                    <li>• Fraud detection and alerts</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Reimbursement Process
                  </CardTitle>
                  <CardDescription>
                    Fast and efficient reimbursement workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automated reimbursement calculations</li>
                    <li>• Direct deposit integration</li>
                    <li>• Reimbursement status tracking</li>
                    <li>• Tax-compliant processing</li>
                    <li>• Multi-currency reimbursements</li>
                    <li>• Expense report generation</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="budgets" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Budget Creation
                  </CardTitle>
                  <CardDescription>
                    Set up comprehensive budgets for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Budget Types:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Annual operating budgets</li>
                        <li>• Department-specific budgets</li>
                        <li>• Project-based budgets</li>
                        <li>• Capital expenditure budgets</li>
                        <li>• Travel and entertainment budgets</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Budget Planning Features:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Historical data analysis</li>
                        <li>• Forecasting and projections</li>
                        <li>• Template-based budget creation</li>
                        <li>• Collaborative budget planning</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Budget Monitoring
                  </CardTitle>
                  <CardDescription>
                    Real-time budget tracking and variance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Sample Budget Status:</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Marketing Budget</span>
                            <span>$8,500 / $10,000</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Travel Budget</span>
                            <span>$3,200 / $5,000</span>
                          </div>
                          <Progress value={64} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Office Supplies</span>
                            <span>$1,800 / $2,000</span>
                          </div>
                          <Progress value={90} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Budget Alerts
                  </CardTitle>
                  <CardDescription>
                    Proactive notifications for budget management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Alert Thresholds:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">75% budget utilization warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">90% budget utilization alert</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Budget exceeded notification</span>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Email and SMS notifications</li>
                      <li>• Dashboard alerts</li>
                      <li>• Customizable alert rules</li>
                      <li>• Escalation procedures</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Budget Analysis
                  </CardTitle>
                  <CardDescription>
                    Comprehensive budget performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Variance analysis reports</li>
                    <li>• Trend analysis and forecasting</li>
                    <li>• Budget vs. actual comparisons</li>
                    <li>• Department performance metrics</li>
                    <li>• Cost center analysis</li>
                    <li>• ROI calculations</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="invoicing" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Creation
                  </CardTitle>
                  <CardDescription>
                    Professional invoice generation and customization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Invoice Features:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Professional templates</li>
                        <li>• Custom branding and logos</li>
                        <li>• Automated numbering system</li>
                        <li>• Multi-language support</li>
                        <li>• Tax calculations</li>
                        <li>• Discount and promotion codes</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Invoice Types:</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">Standard</Badge>
                        <Badge variant="outline">Recurring</Badge>
                        <Badge variant="outline">Proforma</Badge>
                        <Badge variant="outline">Credit Note</Badge>
                        <Badge variant="outline">Quote</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client Management
                  </CardTitle>
                  <CardDescription>
                    Comprehensive client and billing information management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Client database management</li>
                    <li>• Billing address management</li>
                    <li>• Payment terms configuration</li>
                    <li>• Client-specific pricing</li>
                    <li>• Communication history</li>
                    <li>• Credit limit management</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Payment Processing
                  </CardTitle>
                  <CardDescription>
                    Integrated payment solutions and tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Payment Methods:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Credit card processing</li>
                        <li>• Bank transfers (ACH)</li>
                        <li>• PayPal integration</li>
                        <li>• Cryptocurrency payments</li>
                        <li>• Check payments</li>
                        <li>• Wire transfers</li>
                      </ul>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Automated payment reminders</li>
                      <li>• Late fee calculations</li>
                      <li>• Payment plan options</li>
                      <li>• Refund processing</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recurring Invoices
                  </CardTitle>
                  <CardDescription>
                    Automated recurring billing and subscription management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Flexible billing cycles (monthly, quarterly, annual)</li>
                    <li>• Automated invoice generation</li>
                    <li>• Subscription management</li>
                    <li>• Proration calculations</li>
                    <li>• Billing cycle customization</li>
                    <li>• Automatic payment collection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="reporting" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Financial Reports
                  </CardTitle>
                  <CardDescription>
                    Comprehensive financial reporting and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Standard Reports:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Profit & Loss statements</li>
                        <li>• Balance sheet</li>
                        <li>• Cash flow statements</li>
                        <li>• Accounts receivable aging</li>
                        <li>• Expense reports by category</li>
                        <li>• Budget vs. actual reports</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Report Formats:</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">PDF</Badge>
                        <Badge variant="outline">Excel</Badge>
                        <Badge variant="outline">CSV</Badge>
                        <Badge variant="outline">Dashboard</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Real-time financial insights and KPIs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Metrics:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Revenue trends</li>
                        <li>• Expense breakdown</li>
                        <li>• Cash flow projections</li>
                        <li>• Outstanding invoices</li>
                        <li>• Budget utilization</li>
                        <li>• Profitability analysis</li>
                      </ul>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Interactive charts and graphs</li>
                      <li>• Customizable dashboard widgets</li>
                      <li>• Real-time data updates</li>
                      <li>• Mobile-responsive design</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Custom Reports
                  </CardTitle>
                  <CardDescription>
                    Build custom reports tailored to your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Drag-and-drop report builder</li>
                    <li>• Custom field selection</li>
                    <li>• Advanced filtering options</li>
                    <li>• Scheduled report delivery</li>
                    <li>• Report sharing and collaboration</li>
                    <li>• Template library</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Multi-Currency Reporting
                  </CardTitle>
                  <CardDescription>
                    Global financial reporting with currency conversion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Multi-currency financial statements</li>
                    <li>• Exchange rate tracking</li>
                    <li>• Currency gain/loss reporting</li>
                    <li>• Consolidated reporting</li>
                    <li>• Regional financial analysis</li>
                    <li>• Tax reporting by jurisdiction</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Integration & Automation */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 Integration & Automation</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Accounting Software Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Supported Platforms:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>QuickBooks</Badge>
                    <Badge>Xero</Badge>
                    <Badge>Sage</Badge>
                    <Badge>NetSuite</Badge>
                    <Badge>FreshBooks</Badge>
                  </div>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Real-time data synchronization</li>
                  <li>• Automated journal entries</li>
                  <li>• Chart of accounts mapping</li>
                  <li>• Two-way data sync</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Banking Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Bank account connectivity</li>
                <li>• Automatic transaction import</li>
                <li>• Bank reconciliation tools</li>
                <li>• Real-time balance updates</li>
                <li>• Transaction categorization</li>
                <li>• Fraud detection alerts</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Supported Gateways:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Stripe</Badge>
                    <Badge>PayPal</Badge>
                    <Badge>Square</Badge>
                    <Badge>Authorize.Net</Badge>
                  </div>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Secure payment processing</li>
                  <li>• Automated payment matching</li>
                  <li>• Refund processing</li>
                  <li>• Subscription billing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Workflow Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Automated expense categorization</li>
                <li>• Invoice generation workflows</li>
                <li>• Payment reminder automation</li>
                <li>• Budget alert triggers</li>
                <li>• Approval workflow automation</li>
                <li>• Report scheduling</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Best Practices */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">💡 Financial Management Best Practices</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement clear expense policies</li>
                <li>• Require receipts for all expenses</li>
                <li>• Set up automated approval workflows</li>
                <li>• Regular expense audits</li>
                <li>• Use corporate cards for better tracking</li>
                <li>• Train employees on expense procedures</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Budget Planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Base budgets on historical data</li>
                <li>• Include contingency funds</li>
                <li>• Review and adjust budgets regularly</li>
                <li>• Involve department heads in planning</li>
                <li>• Set realistic and achievable targets</li>
                <li>• Monitor budget performance monthly</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Maintain accurate cash flow forecasts</li>
                <li>• Optimize payment terms with vendors</li>
                <li>• Implement efficient collection processes</li>
                <li>• Monitor accounts receivable aging</li>
                <li>• Maintain adequate cash reserves</li>
                <li>• Use cash flow analytics for planning</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Financial Reporting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Generate reports regularly</li>
                <li>• Ensure data accuracy and completeness</li>
                <li>• Use visual dashboards for insights</li>
                <li>• Share reports with stakeholders</li>
                <li>• Archive reports for compliance</li>
                <li>• Automate routine reporting tasks</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-2xl font-bold">🎯 Ready to Optimize Your Finances?</h2>
        <p className="text-muted-foreground">
          Start managing your finances more effectively with SPT&apos; Teams comprehensive financial management tools.
        </p>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Badge variant="secondary">Setup</Badge>
            <h4 className="font-medium">Initial Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Configure your chart of accounts, budgets, and expense categories.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Integrate</Badge>
            <h4 className="font-medium">Connect Your Systems</h4>
            <p className="text-sm text-muted-foreground">
              Integrate with your existing accounting software and banking systems.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Optimize</Badge>
            <h4 className="font-medium">Automate & Analyze</h4>
            <p className="text-sm text-muted-foreground">
              Set up automation workflows and leverage financial analytics.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/getting-started">
              <Wallet className="mr-2 h-4 w-4" />
              Get Started
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/reporting-analytics">
              Financial Reports
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/security">
              Security Guide
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}