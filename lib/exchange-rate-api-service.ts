/**
 * ExchangeRate-API Service
 * Integrates with ExchangeRate-API.com for live currency conversion rates
 */

export interface ExchangeRateResponse {
  result: 'success' | 'error';
  documentation?: string;
  terms_of_use?: string;
  time_last_update_unix?: number;
  time_last_update_utc?: string;
  time_next_update_unix?: number;
  time_next_update_utc?: string;
  base_code?: string;
  conversion_rates?: Record<string, number>;
  'error-type'?: string;
}

export interface SupportedCurrenciesResponse {
  result: 'success' | 'error';
  documentation?: string;
  terms_of_use?: string;
  supported_codes?: [string, string][]; // [code, name] pairs
  'error-type'?: string;
}

export class ExchangeRateAPIService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY || '';
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_EXCHANGERATE_API_BASE_URL || 'https://v6.exchangerate-api.com/v6';

  /**
   * Get latest exchange rates for a base currency
   */
  static async getLatestRates(baseCurrency: string = 'GHS'): Promise<ExchangeRateResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error('ExchangeRate-API key not configured');
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/latest/${baseCurrency}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();

      if (data.result === 'error') {
        throw new Error(`API Error: ${data['error-type']}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * Get supported currencies
   */
  static async getSupportedCurrencies(): Promise<SupportedCurrenciesResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error('ExchangeRate-API key not configured');
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/codes`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SupportedCurrenciesResponse = await response.json();

      if (data.result === 'error') {
        throw new Error(`API Error: ${data['error-type']}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      throw error;
    }
  }

  /**
   * Convert specific amount between currencies
   */
  static async convertCurrency(
    from: string,
    to: string,
    amount: number
  ): Promise<{
    result: 'success' | 'error';
    base_code?: string;
    target_code?: string;
    conversion_rate?: number;
    conversion_result?: number;
    'error-type'?: string;
  }> {
    try {
      if (!this.API_KEY) {
        throw new Error('ExchangeRate-API key not configured');
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/pair/${from}/${to}/${amount}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.result === 'error') {
        throw new Error(`API Error: ${data['error-type']}`);
      }

      return data;
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get historical exchange rates (if you upgrade to paid plan)
   */
  static async getHistoricalRates(
    baseCurrency: string,
    year: number,
    month: number,
    day: number
  ): Promise<ExchangeRateResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error('ExchangeRate-API key not configured');
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/history/${baseCurrency}/${year}/${month}/${day}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();

      if (data.result === 'error') {
        throw new Error(`API Error: ${data['error-type']}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      throw error;
    }
  }

  /**
   * Get rates for Ghana Cedi (GHS) to all other currencies
   * This is our primary use case
   */
  static async getGHSRates(): Promise<Record<string, number>> {
    try {
      const response = await this.getLatestRates('GHS');
      
      if (response.result === 'success' && response.conversion_rates) {
        return response.conversion_rates;
      }

      throw new Error('Failed to get GHS rates');
    } catch (error) {
      console.error('Error fetching GHS rates:', error);
      
      // Return fallback rates (the ones you provided earlier)
      return {
        'GHS': 1,
        'USD': 0.0959,
        'EUR': 0.0823,
        'GBP': 0.0714,
        'NGN': 146.9799,
        'ZAR': 1.6949,
        'CAD': 0.1315,
        'AUD': 0.1469,
        'JPY': 14.2450,
        'CNY': 0.6881,
        'CHF': 0.0767,
        'NOK': 0.9744,
        'SEK': 0.9259,
        'NZD': 0.1604,
        'DKK': 0.6144,
        'XOF': 53.9994,
        'GMD': 6.9512,
        'SLL': 2206.2537,
        'MRO': 34.2762
      };
    }
  }

  /**
   * Update workspace currencies with live rates
   */
  static async updateWorkspaceCurrencies(
    workspaceId: string,
    allowedCurrencies: string[]
  ): Promise<{
    success: boolean;
    updatedRates: Record<string, number>;
    errors?: string[];
  }> {
    try {
      const ghsRates = await this.getGHSRates();
      const updatedRates: Record<string, number> = {};
      const errors: string[] = [];

      // Filter rates to only include allowed currencies
      for (const currency of allowedCurrencies) {
        if (ghsRates[currency] !== undefined) {
          updatedRates[currency] = ghsRates[currency];
        } else {
          errors.push(`Currency ${currency} not found in API response`);
        }
      }

      return {
        success: errors.length === 0,
        updatedRates,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error updating workspace currencies:', error);
      return {
        success: false,
        updatedRates: {},
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Check API status and rate limits
   */
  static async checkAPIStatus(): Promise<{
    isAvailable: boolean;
    lastUpdate?: string;
    nextUpdate?: string;
    error?: string;
  }> {
    try {
      const response = await this.getLatestRates('USD');
      
      if (response.result === 'success') {
        return {
          isAvailable: true,
          lastUpdate: response.time_last_update_utc,
          nextUpdate: response.time_next_update_utc
        };
      }

      return {
        isAvailable: false,
        error: response['error-type']
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate API key
   */
  static async validateAPIKey(): Promise<boolean> {
    try {
      const response = await this.getLatestRates('USD');
      return response.result === 'success';
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}
