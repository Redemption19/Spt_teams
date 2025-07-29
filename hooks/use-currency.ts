import { useState, useEffect, useCallback } from 'react';
import { CurrencyService } from '@/lib/currency-service';
import { Currency } from '@/lib/types/financial-types';
import { useWorkspace } from '@/lib/workspace-context';

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  precision?: number;
}

export function useCurrency() {
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();

  const fetchDefaultCurrency = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setDefaultCurrency(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currency = await CurrencyService.getDefaultCurrency(currentWorkspace.id);
      setDefaultCurrency(currency);
    } catch (err) {
      console.error('Error fetching default currency:', err);
      setError('Failed to load currency settings');
      // Fallback to GHS
      setDefaultCurrency({
        id: 'fallback_ghs',
        code: 'GHS',
        name: 'Ghana Cedi',
        symbol: '₵',
        exchangeRate: 1,
        isActive: true,
        isDefault: true,
        updatedAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchDefaultCurrency();
  }, [fetchDefaultCurrency]);

  /**
   * Format amount with currency symbol/code
   */
  const formatAmount = useCallback((
    amount: number | null | undefined, 
    options: CurrencyFormatOptions = {}
  ): string => {
    // Handle null/undefined amount
    const safeAmount = amount ?? 0;
    
    if (!defaultCurrency) return safeAmount.toFixed(2);

    const {
      showSymbol = true,
      showCode = false,
      precision = 2
    } = options;

    const formattedAmount = safeAmount.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    if (showCode) {
      return `${defaultCurrency.code} ${formattedAmount}`;
    }

    if (showSymbol && defaultCurrency.symbol) {
      return `${defaultCurrency.symbol}${formattedAmount}`;
    }

    return formattedAmount;
  }, [defaultCurrency]);

  /**
   * Get currency symbol
   */
  const getCurrencySymbol = useCallback((): string => {
    return defaultCurrency?.symbol || '₵';
  }, [defaultCurrency]);

  /**
   * Get currency code
   */
  const getCurrencyCode = useCallback((): string => {
    return defaultCurrency?.code || 'GHS';
  }, [defaultCurrency]);

  /**
   * Get currency name
   */
  const getCurrencyName = useCallback((): string => {
    return defaultCurrency?.name || 'Ghana Cedi';
  }, [defaultCurrency]);

  /**
   * Convert amount from base currency to display currency
   */
  const convertFromBaseCurrency = useCallback((amount: number): number => {
    if (!defaultCurrency || defaultCurrency.exchangeRate === 0) return amount;
    return amount / defaultCurrency.exchangeRate;
  }, [defaultCurrency]);

  /**
   * Convert amount to base currency from display currency
   */
  const convertToBaseCurrency = useCallback((amount: number): number => {
    if (!defaultCurrency) return amount;
    return amount * defaultCurrency.exchangeRate;
  }, [defaultCurrency]);

  /**
   * Refresh currency data
   */
  const refreshCurrency = useCallback(() => {
    fetchDefaultCurrency();
  }, [fetchDefaultCurrency]);

  return {
    defaultCurrency,
    loading,
    error,
    formatAmount,
    getCurrencySymbol,
    getCurrencyCode,
    getCurrencyName,
    convertFromBaseCurrency,
    convertToBaseCurrency,
    refreshCurrency
  };
}
