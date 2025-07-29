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
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  SubscriptionPlan, 
  Subscription, 
  PaymentMethod, 
  UsageMetrics,
  Address
} from './types/financial-types';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';

export class BillingService {
  
  // ===== SUBSCRIPTION PLANS =====
  
  /**
   * Create a new subscription plan
   */
  static async createSubscriptionPlan(planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const planRef = doc(collection(db, 'subscriptionPlans'));
      const planId = planRef.id;
      
      const plan: SubscriptionPlan = {
        id: planId,
        name: planData.name || 'Untitled Plan',
        description: planData.description || '',
        price: planData.price || 0,
        currency: planData.currency || 'USD',
        billingPeriod: planData.billingPeriod || 'monthly',
        features: planData.features || [],
        maxUsers: planData.maxUsers,
        maxWorkspaces: planData.maxWorkspaces,
        maxStorage: planData.maxStorage,
        isActive: planData.isActive !== undefined ? planData.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(planRef, plan);
      return planId;
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      throw error;
    }
  }
  
  /**
   * Get all active subscription plans
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const q = query(
        collection(db, 'subscriptionPlans'),
        where('isActive', '==', true),
        orderBy('price', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionPlan[];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }
  
  /**
   * Update subscription plan
   */
  static async updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<void> {
    try {
      const planRef = doc(db, 'subscriptionPlans', planId);
      const updateData = createUpdateData(cleanFirestoreData(updates));
      
      await updateDoc(planRef, updateData);
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }
  
  // ===== WORKSPACE SUBSCRIPTIONS =====
  
  /**
   * Create subscription for workspace
   */
  static async createSubscription(
    workspaceId: string, 
    planId: string, 
    billingEmail: string,
    paymentMethodId?: string
  ): Promise<string> {
    try {
      // Get plan details
      const plan = await this.getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }
      
      const subscriptionRef = doc(collection(db, 'subscriptions'));
      const subscriptionId = subscriptionRef.id;
      
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
      const currentPeriodEnd = plan.billingPeriod === 'yearly' 
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const subscription: Subscription = {
        id: subscriptionId,
        workspaceId,
        planId,
        status: 'trial',
        startDate: now,
        trialEndDate,
        currentPeriodStart: now,
        currentPeriodEnd,
        nextBillingDate: trialEndDate,
        amount: plan.price,
        currency: plan.currency,
        paymentMethodId,
        billingEmail,
        autoRenew: true,
        usageTracking: {
          users: 0,
          workspaces: 1,
          storage: 0,
          apiCalls: 0,
          lastUpdated: now
        },
        invoices: [],
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(subscriptionRef, cleanFirestoreData(subscription));
      
      // Update workspace with subscription info
      await updateDoc(doc(db, 'workspaces', workspaceId), {
        subscriptionId,
        subscriptionStatus: 'trial',
        updatedAt: now
      });
      
      return subscriptionId;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }
  
  /**
   * Get workspace subscription
   */
  static async getWorkspaceSubscription(workspaceId: string): Promise<Subscription | null> {
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Subscription;
    } catch (error) {
      console.error('Error fetching workspace subscription:', error);
      throw error;
    }
  }
  
  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(subscriptionId: string, status: Subscription['status']): Promise<void> {
    try {
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }
  
  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelAt: 'immediately' | 'period_end' = 'period_end'): Promise<void> {
    try {
      const updates: any = {
        autoRenew: false,
        updatedAt: new Date()
      };
      
      if (cancelAt === 'immediately') {
        updates.status = 'cancelled';
        updates.endDate = new Date();
      } else {
        updates.status = 'cancelled';
        // Will be cancelled at the end of current period
      }
      
      await updateDoc(doc(db, 'subscriptions', subscriptionId), updates);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
  
  // ===== USAGE TRACKING =====
  
  /**
   * Update usage metrics for subscription
   */
  static async updateUsageMetrics(workspaceId: string, metrics: Partial<UsageMetrics>): Promise<void> {
    try {
      const subscription = await this.getWorkspaceSubscription(workspaceId);
      if (!subscription) return;
      
      const updatedMetrics = {
        ...subscription.usageTracking,
        ...metrics,
        lastUpdated: new Date()
      };
      
      await updateDoc(doc(db, 'subscriptions', subscription.id), {
        usageTracking: updatedMetrics,
        updatedAt: new Date()
      });
      
      // Check usage limits and send alerts if needed
      await this.checkUsageLimits(subscription.id, updatedMetrics);
    } catch (error) {
      console.error('Error updating usage metrics:', error);
      throw error;
    }
  }
  
  /**
   * Check if workspace is within usage limits
   */
  static async checkUsageLimits(subscriptionId: string, metrics: UsageMetrics): Promise<void> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) return;
      
      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) return;
      
      const alerts = [];
      
      // Check user limit
      if (plan.maxUsers && metrics.users > plan.maxUsers) {
        alerts.push({
          type: 'user_limit_exceeded',
          message: `User limit exceeded: ${metrics.users}/${plan.maxUsers}`,
          severity: 'critical'
        });
      }
      
      // Check storage limit
      if (plan.maxStorage && metrics.storage > plan.maxStorage) {
        alerts.push({
          type: 'storage_limit_exceeded',
          message: `Storage limit exceeded: ${metrics.storage}GB/${plan.maxStorage}GB`,
          severity: 'critical'
        });
      }
      
      // Send alerts if any
      if (alerts.length > 0) {
        await this.sendUsageAlerts(subscription.workspaceId, alerts);
      }
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
  }
  
  // ===== PAYMENT METHODS =====
  
  /**
   * Add payment method to workspace
   */
  static async addPaymentMethod(
    workspaceId: string, 
    paymentData: Omit<PaymentMethod, 'id' | 'workspaceId' | 'createdAt'>
  ): Promise<string> {
    try {
      const paymentRef = doc(collection(db, 'paymentMethods'));
      const paymentId = paymentRef.id;
      
      // If this is set as default, unset other default methods
      if (paymentData.isDefault) {
        await this.unsetDefaultPaymentMethods(workspaceId);
      }
      
      const paymentMethod: PaymentMethod = {
        id: paymentId,
        workspaceId,
        type: paymentData.type || 'credit_card',
        isDefault: paymentData.isDefault || false,
        cardLastFour: paymentData.cardLastFour,
        cardBrand: paymentData.cardBrand,
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        billingAddress: paymentData.billingAddress,
        isActive: paymentData.isActive !== undefined ? paymentData.isActive : true,
        createdAt: new Date()
      };
      
      await setDoc(paymentRef, paymentMethod);
      return paymentId;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }
  
  /**
   * Get workspace payment methods
   */
  static async getWorkspacePaymentMethods(workspaceId: string): Promise<PaymentMethod[]> {
    try {
      const q = query(
        collection(db, 'paymentMethods'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentMethod[];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }
  
  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(workspaceId: string, paymentMethodId: string): Promise<void> {
    try {
      // Unset all current defaults
      await this.unsetDefaultPaymentMethods(workspaceId);
      
      // Set new default
      await updateDoc(doc(db, 'paymentMethods', paymentMethodId), {
        isDefault: true
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }
  
  /**
   * Remove payment method
   */
  static async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'paymentMethods', paymentMethodId), {
        isActive: false
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }
  
  // ===== BILLING ANALYTICS =====
  
  /**
   * Get billing analytics for workspace
   */
  static async getBillingAnalytics(workspaceId: string): Promise<{
    currentPlan: SubscriptionPlan | null;
    subscription: Subscription | null;
    usage: UsageMetrics | null;
    monthlyRevenue: number;
    yearlyRevenue: number;
    usagePercentages: {
      users: number;
      storage: number;
    };
  }> {
    try {
      const subscription = await this.getWorkspaceSubscription(workspaceId);
      const plan = subscription ? await this.getSubscriptionPlan(subscription.planId) : null;
      
      let monthlyRevenue = 0;
      let yearlyRevenue = 0;
      
      if (subscription && plan) {
        if (plan.billingPeriod === 'monthly') {
          monthlyRevenue = plan.price;
          yearlyRevenue = plan.price * 12;
        } else if (plan.billingPeriod === 'yearly') {
          yearlyRevenue = plan.price;
          monthlyRevenue = plan.price / 12;
        }
      }
      
      const usagePercentages = {
        users: plan?.maxUsers ? Math.round((subscription?.usageTracking.users || 0) / plan.maxUsers * 100) : 0,
        storage: plan?.maxStorage ? Math.round((subscription?.usageTracking.storage || 0) / plan.maxStorage * 100) : 0
      };
      
      return {
        currentPlan: plan,
        subscription,
        usage: subscription?.usageTracking || null,
        monthlyRevenue,
        yearlyRevenue,
        usagePercentages
      };
    } catch (error) {
      console.error('Error getting billing analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get subscription revenue analytics
   */
  static async getRevenueAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    monthlyRevenue: { month: string; revenue: number }[];
    planBreakdown: { planName: string; subscriptions: number; revenue: number }[];
    churnRate: number;
    growthRate: number;
  }> {
    try {
      // This would typically involve more complex queries
      // For now, return mock data structure
      return {
        totalRevenue: 0,
        monthlyRevenue: [],
        planBreakdown: [],
        churnRate: 0,
        growthRate: 0
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get total monthly revenue for multiple workspaces (cross-workspace)
   */
  static async getTotalMonthlyRevenueForWorkspaces(workspaceIds: string[]): Promise<number> {
    try {
      let total = 0;
      for (const wsId of workspaceIds) {
        const analytics = await this.getBillingAnalytics(wsId);
        total += analytics.monthlyRevenue || 0;
      }
      return total;
    } catch (error) {
      console.error('Error aggregating monthly revenue:', error);
      throw error;
    }
  }
  
  // ===== HELPER METHODS =====
  
  private static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const docSnap = await getDoc(doc(db, 'subscriptionPlans', planId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as SubscriptionPlan : null;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }
  }
  
  private static async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const docSnap = await getDoc(doc(db, 'subscriptions', subscriptionId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Subscription : null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }
  
  private static async unsetDefaultPaymentMethods(workspaceId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'paymentMethods'),
        where('workspaceId', '==', workspaceId),
        where('isDefault', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error unsetting default payment methods:', error);
    }
  }
  
  private static async sendUsageAlerts(workspaceId: string, alerts: any[]): Promise<void> {
    try {
      // Implementation for sending alerts
      // This could integrate with your notification system
      console.log('Usage alerts for workspace:', workspaceId, alerts);
    } catch (error) {
      console.error('Error sending usage alerts:', error);
    }
  }
}
