/**
 * Enhanced Currency Service with comprehensive configuration options
 * Handles currency management, rate updates, and automatic conversions
 */

import { 
  Currency, 
  CurrencySettings
} from '@/lib/types/financial-types';
import { ExchangeRateAPIService } from '@/lib/exchange-rate-api-service';

export class EnhancedCurrencyService {
  
  /**
   * Update currency settings with advanced configuration
   */
  static async updateCurrencySettings(
    workspaceId: string,
    settings: Partial<CurrencySettings>,
    userId: string
  ): Promise<void> {
    try {
      // TODO: Implement Firebase update
      console.log('Updating currency settings:', settings);
      
      // If changing update frequency, schedule next update
      if (settings.updateFrequency) {
        await this.scheduleNextUpdate(workspaceId, settings.updateFrequency);
      }
      
      // If enabling automatic sync, trigger immediate sync
      if (settings.enableAutomaticSync) {
        await this.syncWithExchangeRateAPI(workspaceId);
      }
      
    } catch (error) {
      console.error('Error updating currency settings:', error);
      throw new Error('Failed to update currency settings');
    }
  }

  /**
   * Sync exchange rates with ExchangeRate-API
   */
  static async syncWithExchangeRateAPI(workspaceId: string): Promise<void> {
    try {
      console.log('Syncing with ExchangeRate-API...');
      
      // Get live rates from ExchangeRate-API
      const liveRates = await ExchangeRateAPIService.getGHSRates();
      
      // Update rates in database
      await this.updateExchangeRates(workspaceId, liveRates);
      
      console.log('Successfully synced with ExchangeRate-API');
      
    } catch (error) {
      console.error('Error syncing with ExchangeRate-API:', error);
      throw new Error('Failed to sync with ExchangeRate-API');
    }
  }

  /**
   * Update exchange rates and check for significant changes
   */
  static async updateExchangeRates(
    workspaceId: string, 
    newRates: Record<string, number>
  ): Promise<void> {
    try {
      // TODO: Get current rates from database
      const currentRates: Record<string, number> = {};
      
      // Check for significant changes
      const significantChanges: Array<{
        currency: string;
        oldRate: number;
        newRate: number;
        changePercent: number;
      }> = [];
      
      for (const [currency, newRate] of Object.entries(newRates)) {
        const oldRate = currentRates[currency];
        if (oldRate) {
          const changePercent = Math.abs((newRate - oldRate) / oldRate) * 100;
          if (changePercent > 5) { // 5% threshold
            significantChanges.push({
              currency,
              oldRate,
              newRate,
              changePercent
            });
          }
        }
      }
      
      // Send alerts if enabled and there are significant changes
      if (significantChanges.length > 0) {
        await this.sendRateChangeAlerts(workspaceId, significantChanges);
      }
      
      // Update rates in database
      console.log('Updating exchange rates:', newRates);
      
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      throw new Error('Failed to update exchange rates');
    }
  }

  /**
   * Send rate change alerts to workspace admins
   */
  static async sendRateChangeAlerts(
    workspaceId: string,
    changes: Array<{
      currency: string;
      oldRate: number;
      newRate: number;
      changePercent: number;
    }>
  ): Promise<void> {
    try {
      // TODO: Implement notification service integration
      console.log('Sending rate change alerts:', changes);
      
      const alertMessage = changes.map(change => 
        `${change.currency}: ${change.changePercent.toFixed(2)}% change`
      ).join(', ');
      
      console.log('Rate change alert:', alertMessage);
      
    } catch (error) {
      console.error('Error sending rate change alerts:', error);
    }
  }

  /**
   * Schedule next automatic update based on frequency
   */
  static async scheduleNextUpdate(
    workspaceId: string,
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual'
  ): Promise<Date> {
    const now = new Date();
    let nextUpdate: Date;
    
    switch (frequency) {
      case 'realtime':
        nextUpdate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
        break;
      case 'hourly':
        nextUpdate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        break;
      case 'daily':
        nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'weekly':
        nextUpdate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      default:
        nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
    }
    
    // TODO: Update database with next update time
    console.log(`Next update scheduled for: ${nextUpdate.toISOString()}`);
    
    return nextUpdate;
  }

  /**
   * Convert amount between currencies with precision control
   */
  static convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    fromRate: number,
    toRate: number,
    precision: number = 4
  ): number {
    // Convert to base currency (GHS) first, then to target currency
    const amountInGHS = amount / fromRate;
    const converted = amountInGHS * toRate;
    
    // Apply precision rounding
    return parseFloat(converted.toFixed(precision));
  }

  /**
   * Get formatted currency display
   */
  static formatCurrency(
    amount: number,
    currency: Currency,
    precision?: number
  ): string {
    const actualPrecision = precision || (amount < 1 ? 4 : 2);
    const formattedAmount = amount.toFixed(actualPrecision);
    return `${currency.symbol}${formattedAmount}`;
  }

  /**
   * Validate currency settings
   */
  static validateCurrencySettings(settings: Partial<CurrencySettings>): string[] {
    const errors: string[] = [];
    
    if (settings.rateTolerance && (settings.rateTolerance < 1 || settings.rateTolerance > 50)) {
      errors.push('Rate tolerance must be between 1% and 50%');
    }
    
    if (settings.roundingPrecision && (settings.roundingPrecision < 2 || settings.roundingPrecision > 6)) {
      errors.push('Rounding precision must be between 2 and 6 decimal places');
    }
    
    if (settings.exchangeRateProvider === 'manual' && settings.updateFrequency !== 'manual') {
      errors.push('Manual rate provider requires manual update frequency');
    }
    
    return errors;
  }

  /**
   * Get currency conversion rate with fallback
   */
  static async getConversionRate(
    fromCurrency: string,
    toCurrency: string,
    workspaceId: string
  ): Promise<{ rate: number; source: 'live' | 'cached' | 'manual' }> {
    try {
      // Try to get live rate first
      if (fromCurrency === 'GHS') {
        const liveRates = await ExchangeRateAPIService.getGHSRates();
        if (liveRates[toCurrency]) {
          return {
            rate: liveRates[toCurrency],
            source: 'live'
          };
        }
      } else if (toCurrency === 'GHS') {
        const liveRates = await ExchangeRateAPIService.getLatestRates(fromCurrency);
        if (liveRates.result === 'success' && liveRates.conversion_rates?.['GHS']) {
          return {
            rate: liveRates.conversion_rates['GHS'],
            source: 'live'
          };
        }
      } else {
        // For non-GHS pairs, convert through GHS
        const ghsRates = await ExchangeRateAPIService.getGHSRates();
        if (ghsRates[fromCurrency] && ghsRates[toCurrency]) {
          const rate = ghsRates[toCurrency] / ghsRates[fromCurrency];
          return {
            rate,
            source: 'live'
          };
        }
      }
      
      // Fallback to cached rate
      // TODO: Get from database
      
      // Mock return for fallback
      return {
        rate: 0.0959, // Mock USD rate
        source: 'cached'
      };
      
    } catch (error) {
      console.error('Error getting conversion rate:', error);
      throw new Error('Failed to get conversion rate');
    }
  }

  /**
   * Check API rate limits
   */
  static async checkRateLimits(workspaceId: string): Promise<{
    current: number;
    max: number;
    resetAt: Date;
    canMakeRequest: boolean;
  }> {
    // TODO: Get from database
    const mockLimits = {
      current: 45,
      max: 1000,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      canMakeRequest: true
    };
    
    return mockLimits;
  }
}
