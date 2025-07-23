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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Currency, CurrencySettings } from './types/financial-types';
import { cleanFirestoreData, createUpdateData } from './firestore-utils';

export class CurrencyService {
  
  // Default currencies with Ghana Cedis as base
  // Updated with Bank of Ghana rates as of July 18, 2025 (1 GHS = X foreign currency)
  private static readonly DEFAULT_CURRENCIES: Omit<Currency, 'id' | 'updatedAt'>[] = [
    {
      code: 'GHS',
      name: 'Ghana Cedi',
      symbol: '₵',
      exchangeRate: 1, // Base currency
      isActive: true,
      isDefault: true
    },
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      exchangeRate: 10.4300, // 1 USD = 10.43 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      exchangeRate: 12.1475, // 1 EUR = 12.1475 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      exchangeRate: 14.0164, // 1 GBP = 14.0164 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      exchangeRate: 0.0068, // 1 NGN = 0.0068 GHS (1 GHS = 146.98 NGN)
      isActive: true,
      isDefault: false
    },
    {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      exchangeRate: 0.5901, // 1 ZAR = 0.5901 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      exchangeRate: 7.6052, // 1 CAD = 7.6052 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      exchangeRate: 6.8071, // 1 AUD = 6.8071 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      exchangeRate: 0.0702, // 1 JPY = 0.0702 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'CNY',
      name: 'Chinese Yuan',
      symbol: '¥',
      exchangeRate: 1.4535, // 1 CNY = 1.4535 GHS
      isActive: true,
      isDefault: false
    },
    {
      code: 'CHF',
      name: 'Swiss Franc',
      symbol: 'CHF',
      exchangeRate: 13.0367, // 1 CHF = 13.0367 GHS
      isActive: true,
      isDefault: false
    }
  ];

  // ===== CURRENCY OPERATIONS =====

  /**
   * Initialize default currencies for a workspace
   */
  static async initializeDefaultCurrencies(workspaceId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const currencyData of this.DEFAULT_CURRENCIES) {
        const currencyRef = doc(collection(db, `workspaces/${workspaceId}/currencies`));
        const currency: Currency = {
          ...currencyData,
          id: currencyRef.id,
          updatedAt: new Date()
        };
        
        batch.set(currencyRef, cleanFirestoreData(currency));
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error initializing default currencies:', error);
      throw error;
    }
  }

  /**
   * Get workspace currencies
   */
  static async getWorkspaceCurrencies(workspaceId: string): Promise<Currency[]> {
    try {
      const q = query(
        collection(db, `workspaces/${workspaceId}/currencies`),
        where('isActive', '==', true),
        orderBy('code', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Currency[];
    } catch (error) {
      console.error('Error fetching workspace currencies:', error);
      return this.getDefaultCurrenciesAsObjects();
    }
  }

  /**
   * Get currency by code
   */
  static async getCurrencyByCode(workspaceId: string, code: string): Promise<Currency | null> {
    try {
      const q = query(
        collection(db, `workspaces/${workspaceId}/currencies`),
        where('code', '==', code),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Currency;
      }
      
      // Fallback to default currencies
      const defaultCurrency = this.DEFAULT_CURRENCIES.find(c => c.code === code);
      if (defaultCurrency) {
        return {
          ...defaultCurrency,
          id: `default_${code}`,
          updatedAt: new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching currency by code:', error);
      return null;
    }
  }

  /**
   * Get default currency for workspace
   */
  static async getDefaultCurrency(workspaceId: string): Promise<Currency> {
    try {
      const q = query(
        collection(db, `workspaces/${workspaceId}/currencies`),
        where('isDefault', '==', true),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Currency;
      }
      
      // Fallback to GHS
      return {
        id: 'default_ghs',
        code: 'GHS',
        name: 'Ghana Cedi',
        symbol: '₵',
        exchangeRate: 1,
        isActive: true,
        isDefault: true,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching default currency:', error);
      // Fallback to GHS
      return {
        id: 'default_ghs',
        code: 'GHS',
        name: 'Ghana Cedi',
        symbol: '₵',
        exchangeRate: 1,
        isActive: true,
        isDefault: true,
        updatedAt: new Date()
      };
    }
  }

  /**
   * Update currency
   */
  static async updateCurrency(
    workspaceId: string, 
    currencyId: string, 
    updates: Partial<Currency>
  ): Promise<void> {
    try {
      const updateData = createUpdateData({
        ...cleanFirestoreData(updates),
        updatedAt: new Date()
      });
      
      await updateDoc(doc(db, `workspaces/${workspaceId}/currencies`, currencyId), updateData);
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  }

  /**
   * Set default currency
   */
  static async setDefaultCurrency(workspaceId: string, currencyCode: string): Promise<void> {
    try {
      // First, remove default flag from all currencies
      const currencies = await this.getWorkspaceCurrencies(workspaceId);
      
      const batch = writeBatch(db);
      
      for (const currency of currencies) {
        const currencyRef = doc(db, `workspaces/${workspaceId}/currencies`, currency.id);
        const isDefault = currency.code === currencyCode;
        
        batch.update(currencyRef, {
          isDefault,
          updatedAt: new Date()
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error setting default currency:', error);
      throw error;
    }
  }

  /**
   * Add custom currency
   */
  static async addCustomCurrency(
    workspaceId: string, 
    currencyData: Omit<Currency, 'id' | 'updatedAt'>
  ): Promise<string> {
    try {
      const currencyRef = doc(collection(db, `workspaces/${workspaceId}/currencies`));
      const currency: Currency = {
        ...currencyData,
        id: currencyRef.id,
        updatedAt: new Date()
      };
      
      await setDoc(currencyRef, cleanFirestoreData(currency));
      return currency.id;
    } catch (error) {
      console.error('Error adding custom currency:', error);
      throw error;
    }
  }

  // ===== CURRENCY SETTINGS =====

  /**
   * Get workspace currency settings
   */
  static async getCurrencySettings(workspaceId: string): Promise<CurrencySettings> {
    try {
      const docSnap = await getDoc(doc(db, `workspaces/${workspaceId}/settings/currency`));
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CurrencySettings;
      }
      
      // Return default settings
      return {
        id: 'currency_settings',
        workspaceId,
        defaultCurrency: 'GHS',
        allowedCurrencies: ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'ZAR'],
        autoConversion: true,
        exchangeRateProvider: 'api',
        updateFrequency: 'hourly',
        rateTolerance: 5,
        enableRateAlerts: true,
        roundingPrecision: 4,
        enableAutomaticSync: true,
        fallbackProvider: 'cached',
        lastUpdated: new Date(),
        nextUpdateAt: new Date(Date.now() + 60 * 60 * 1000), // Next hour
        rateLimits: {
          maxDailyRequests: 1000,
          currentDailyRequests: 0,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      throw error;
    }
  }

  /**
   * Update currency settings
   */
  static async updateCurrencySettings(
    workspaceId: string, 
    settings: Partial<CurrencySettings>
  ): Promise<void> {
    try {
      const updateData = createUpdateData({
        ...cleanFirestoreData(settings),
        updatedAt: new Date()
      });
      
      await setDoc(doc(db, `workspaces/${workspaceId}/settings/currency`), {
        workspaceId,
        ...updateData
      }, { merge: true });
    } catch (error) {
      console.error('Error updating currency settings:', error);
      throw error;
    }
  }

  // ===== EXCHANGE RATE OPERATIONS =====

  /**
   * Convert amount between currencies
   */
  static async convertAmount(
    workspaceId: string,
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      if (fromCurrency === toCurrency) return amount;
      
      const fromCurrencyData = await this.getCurrencyByCode(workspaceId, fromCurrency);
      const toCurrencyData = await this.getCurrencyByCode(workspaceId, toCurrency);
      
      if (!fromCurrencyData || !toCurrencyData) {
        console.warn(`Currency not found: ${fromCurrency} or ${toCurrency}`);
        return amount;
      }
      
      // Convert to base currency (GHS) first, then to target currency
      const amountInGHS = amount / fromCurrencyData.exchangeRate;
      const convertedAmount = amountInGHS * toCurrencyData.exchangeRate;
      
      return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error converting amount:', error);
      return amount;
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  static async getExchangeRate(
    workspaceId: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      if (fromCurrency === toCurrency) return 1;
      
      const fromCurrencyData = await this.getCurrencyByCode(workspaceId, fromCurrency);
      const toCurrencyData = await this.getCurrencyByCode(workspaceId, toCurrency);
      
      if (!fromCurrencyData || !toCurrencyData) {
        console.warn(`Currency not found: ${fromCurrency} or ${toCurrency}`);
        return 1;
      }
      
      // Calculate cross rate via base currency (GHS)
      const rate = toCurrencyData.exchangeRate / fromCurrencyData.exchangeRate;
      return Math.round(rate * 1000000) / 1000000; // Round to 6 decimal places
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return 1;
    }
  }

  /**
   * Update exchange rates (manual or API)
   */
  static async updateExchangeRates(
    workspaceId: string,
    rates: { [currencyCode: string]: number }
  ): Promise<void> {
    try {
      const currencies = await this.getWorkspaceCurrencies(workspaceId);
      
      const batch = writeBatch(db);
      
      for (const currency of currencies) {
        if (rates[currency.code] && currency.code !== 'GHS') { // Don't update base currency
          const currencyRef = doc(db, `workspaces/${workspaceId}/currencies`, currency.id);
          
          batch.update(currencyRef, {
            exchangeRate: rates[currency.code],
            updatedAt: new Date()
          });
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Format amount with currency symbol
   */
  static formatAmount(amount: number, currency: Currency): string {
    return `${currency.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Get available currencies for selection
   */
  static getAvailableCurrencies(): Omit<Currency, 'id' | 'updatedAt' | 'isDefault'>[] {
    return [
      { code: 'GHS', name: 'Ghana Cedi', symbol: '₵', exchangeRate: 1, isActive: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.085, isActive: true },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.078, isActive: true },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.067, isActive: true },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', exchangeRate: 69.5, isActive: true },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', exchangeRate: 1.55, isActive: true },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 0.115, isActive: true },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 0.128, isActive: true },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 12.5, isActive: true },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 0.62, isActive: true }
    ];
  }

  /**
   * Get default currencies as objects (fallback)
   */
  private static getDefaultCurrenciesAsObjects(): Currency[] {
    return this.DEFAULT_CURRENCIES.map((currency, index) => ({
      ...currency,
      id: `default_${currency.code}_${index}`,
      updatedAt: new Date()
    }));
  }
}
