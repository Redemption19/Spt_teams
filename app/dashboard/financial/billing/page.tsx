'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Zap, 
  Crown, 
  Shield, 
  Check, 
  AlertTriangle,
  TrendingUp,
  Settings,
  Plus,
  Download
} from 'lucide-react';

// Mock subscription data
const mockCurrentPlan = {
  id: 'pro-plan',
  name: 'Professional Plan',
  description: 'Perfect for growing teams',
  price: 29,
  currency: 'USD',
  billing: 'monthly' as const,
  status: 'active' as const,
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  nextBillingDate: new Date('2024-02-01'),
  features: [
    'Up to 50 team members',
    'Unlimited projects',
    'Advanced analytics',
    'Priority support',
    'Custom integrations'
  ],
  usage: {
    users: { current: 32, limit: 50 },
    projects: { current: 18, limit: null },
    storage: { current: 45.2, limit: 100 } // GB
  }
};

const mockPlans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams',
    monthlyPrice: 9,
    yearlyPrice: 90,
    currency: 'USD',
    popular: false,
    features: [
      'Up to 10 team members',
      '10 projects',
      'Basic analytics',
      'Email support',
      '10GB storage'
    ],
    limits: {
      users: 10,
      projects: 10,
      storage: 10
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Perfect for growing teams',
    monthlyPrice: 29,
    yearlyPrice: 290,
    currency: 'USD',
    popular: true,
    features: [
      'Up to 50 team members',
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      '100GB storage'
    ],
    limits: {
      users: 50,
      projects: null,
      storage: 100
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 99,
    yearlyPrice: 990,
    currency: 'USD',
    popular: false,
    features: [
      'Unlimited team members',
      'Unlimited projects',
      'Enterprise analytics',
      'Dedicated support',
      'Custom integrations',
      'Unlimited storage',
      'SSO & SAML',
      'Advanced security'
    ],
    limits: {
      users: null,
      projects: null,
      storage: null
    }
  }
];

const mockBillingHistory = [
  {
    id: 'inv-2024-001',
    date: new Date('2024-01-01'),
    amount: 29.00,
    currency: 'USD',
    status: 'paid' as const,
    description: 'Professional Plan - January 2024',
    downloadUrl: '/invoices/inv-2024-001.pdf'
  },
  {
    id: 'inv-2023-012',
    date: new Date('2023-12-01'),
    amount: 29.00,
    currency: 'USD',
    status: 'paid' as const,
    description: 'Professional Plan - December 2023',
    downloadUrl: '/invoices/inv-2023-012.pdf'
  },
  {
    id: 'inv-2023-011',
    date: new Date('2023-11-01'),
    amount: 29.00,
    currency: 'USD',
    status: 'paid' as const,
    description: 'Professional Plan - November 2023',
    downloadUrl: '/invoices/inv-2023-011.pdf'
  }
];

const mockPaymentMethod = {
  id: 'pm-123',
  type: 'card' as const,
  brand: 'visa',
  last4: '4242',
  expiryMonth: 12,
  expiryYear: 2025,
  isDefault: true
};

const getPlanIcon = (planId: string) => {
  switch (planId) {
    case 'starter':
      return <Zap className="w-6 h-6 text-blue-500" />;
    case 'professional':
      return <Crown className="w-6 h-6 text-purple-500" />;
    case 'enterprise':
      return <Shield className="w-6 h-6 text-gold-500" />;
    default:
      return <Zap className="w-6 h-6 text-gray-500" />;
  }
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const usagePercentage = (current: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing, and payment methods
          </p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Billing Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    {getPlanIcon('professional')}
                    Current Plan: {mockCurrentPlan.name}
                  </CardTitle>
                  <CardDescription>{mockCurrentPlan.description}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${mockCurrentPlan.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    {mockCurrentPlan.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Billing Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing Cycle:</span>
                      <span className="capitalize">{mockCurrentPlan.billing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Period:</span>
                      <span>
                        {mockCurrentPlan.currentPeriodStart.toLocaleDateString()} - {mockCurrentPlan.currentPeriodEnd.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Billing:</span>
                      <span>{mockCurrentPlan.nextBillingDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Plan Features</h4>
                  <ul className="space-y-1 text-sm">
                    {mockCurrentPlan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button variant="outline">
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Current usage for your {mockCurrentPlan.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Users */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Members
                    </span>
                    <span className={getUsageColor(usagePercentage(mockCurrentPlan.usage.users.current, mockCurrentPlan.usage.users.limit))}>
                      {mockCurrentPlan.usage.users.current} / {mockCurrentPlan.usage.users.limit || '∞'}
                    </span>
                  </div>
                  <Progress 
                    value={usagePercentage(mockCurrentPlan.usage.users.current, mockCurrentPlan.usage.users.limit)} 
                    className="h-2" 
                  />
                </div>

                {/* Projects */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Projects
                    </span>
                    <span className="text-green-600">
                      {mockCurrentPlan.usage.projects.current} / {mockCurrentPlan.usage.projects.limit || '∞'}
                    </span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-muted-foreground">Unlimited projects in your plan</p>
                </div>

                {/* Storage */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Storage
                    </span>
                    <span className={getUsageColor(usagePercentage(mockCurrentPlan.usage.storage.current, mockCurrentPlan.usage.storage.limit))}>
                      {mockCurrentPlan.usage.storage.current}GB / {mockCurrentPlan.usage.storage.limit || '∞'}GB
                    </span>
                  </div>
                  <Progress 
                    value={usagePercentage(mockCurrentPlan.usage.storage.current, mockCurrentPlan.usage.storage.limit)} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Invoice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Next Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">${mockCurrentPlan.price}.00 USD</p>
                  <p className="text-sm text-muted-foreground">
                    Due on {mockCurrentPlan.nextBillingDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">•••• {mockPaymentMethod.last4}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {/* Billing Cycle Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your team&apos;s needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className={billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}>
                  Yearly
                </span>
                {billingCycle === 'yearly' && (
                  <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockPlans.map((plan) => {
                  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                  const isCurrentPlan = plan.id === 'professional';
                  
                  return (
                    <Card key={plan.id} className={`relative ${plan.popular ? 'border-purple-300 shadow-lg' : ''}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-2">
                          {getPlanIcon(plan.id)}
                        </div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="text-3xl font-bold">
                          ${price}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="text-sm text-muted-foreground">
                            ${(price / 12).toFixed(2)}/month billed annually
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full" 
                          variant={isCurrentPlan ? "outline" : "default"}
                          disabled={isCurrentPlan}
                        >
                          {isCurrentPlan ? 'Current Plan' : 'Upgrade to ' + plan.name}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBillingHistory.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.date.toLocaleDateString()} • {invoice.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">${invoice.amount.toFixed(2)} {invoice.currency}</p>
                        <Badge 
                          className={invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        •••• •••• •••• {mockPaymentMethod.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {mockPaymentMethod.brand.toUpperCase()} • Expires {mockPaymentMethod.expiryMonth}/{mockPaymentMethod.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mockPaymentMethod.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No additional payment methods</p>
                  <Button variant="outline" className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
