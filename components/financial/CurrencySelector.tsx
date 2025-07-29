'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRightLeft, Star, TrendingUp } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { Currency } from '@/lib/types/financial-types';
// import { CurrencyService } from '@/lib/currency-service'; // Uncomment when service is ready

interface CurrencySelectorProps {
  value?: string;
  onChange: (currency: string) => void;
  label?: string;
  placeholder?: string;
  showConverter?: boolean;
  showDefaultBadge?: boolean;
  disabled?: boolean;
  className?: string;
}

// Mock data - replace with actual service calls
const mockCurrencies: Currency[] = [
  { id: '1', code: 'GHS', name: 'Ghana Cedi', symbol: '₵', exchangeRate: 1, isActive: true, isDefault: true, updatedAt: new Date('2025-07-18') },
  { id: '2', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0959, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 0.0959 USD
  { id: '3', code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0823, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 0.0823 EUR
  { id: '4', code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.0714, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 0.0714 GBP
  { id: '5', code: 'NGN', name: 'Nigerian Naira', symbol: '₦', exchangeRate: 146.9799, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 146.98 NGN
  { id: '6', code: 'ZAR', name: 'South African Rand', symbol: 'R', exchangeRate: 1.6949, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1.6949 ZAR
  { id: '7', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 0.1315, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 0.1315 CAD
  { id: '8', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 0.1469, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 0.1469 AUD
  { id: '9', code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 14.2450, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 14.245 JPY
  { id: '10', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 0.6881, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') } // 1 GHS = 0.6881 CNY
];

export function CurrencySelector({
  value,
  onChange,
  label = 'Currency',
  placeholder = 'Select currency',
  showConverter = false,
  showDefaultBadge = true,
  disabled = false,
  className = ''
}: CurrencySelectorProps) {
  const [currencies] = useState<Currency[]>(mockCurrencies);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  
  // Converter state
  const [converterAmount, setConverterAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');
  const [showConverterCard, setShowConverterCard] = useState(false);

  useEffect(() => {
    if (value) {
      const currency = currencies.find(c => c.code === value);
      setSelectedCurrency(currency || null);
    }
  }, [value, currencies]);

  useEffect(() => {
    if (showConverter && selectedCurrency && converterAmount) {
      const defaultCurrency = currencies.find(c => c.isDefault);
      if (defaultCurrency && selectedCurrency.code !== defaultCurrency.code) {
        const amount = parseFloat(converterAmount);
        if (!isNaN(amount)) {
          // Convert to default currency (GHS)
          const amountInGHS = amount / selectedCurrency.exchangeRate;
          setConvertedAmount(amountInGHS.toFixed(2));
        }
      } else {
        setConvertedAmount(converterAmount);
      }
    }
  }, [converterAmount, selectedCurrency, currencies, showConverter]);

  const handleCurrencyChange = (currencyCode: string) => {
    onChange(currencyCode);
    const currency = currencies.find(c => c.code === currencyCode);
    setSelectedCurrency(currency || null);
  };

  const defaultCurrency = currencies.find(c => c.isDefault);
  const activeCurrencies = currencies.filter(c => c.isActive);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="space-y-2">
        {label && <Label htmlFor="currency-select">{label}</Label>}
        <Select 
          value={value} 
          onValueChange={handleCurrencyChange}
          disabled={disabled}
        >
          <SelectTrigger id="currency-select">
            <SelectValue placeholder={placeholder}>
              {selectedCurrency && (
                <div className="flex items-center gap-2">
                  <span>{selectedCurrency.symbol}</span>
                  <span>{selectedCurrency.code}</span>
                  {showDefaultBadge && selectedCurrency.isDefault && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      <Star className="w-2 h-2 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activeCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currency.symbol}</span>
                    <div>
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-muted-foreground">{currency.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currency.isDefault ? (
                      <Badge variant="default" className="text-xs">
                        <Star className="w-2 h-2 mr-1" />
                        Default
                      </Badge>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        1 {currency.code} = {currency.exchangeRate.toFixed(4)} GHS
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Currency Converter */}
      {showConverter && selectedCurrency && !selectedCurrency.isDefault && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowConverterCard(!showConverterCard)}
            className="text-xs"
          >
            <ArrowRightLeft className="w-3 h-3 mr-1" />
            Convert to {defaultCurrency?.code}
          </Button>
          
          {showConverterCard && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={converterAmount}
                      onChange={(e) => setConverterAmount(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground min-w-[3rem]">
                      {selectedCurrency.code}
                    </span>
                  </div>
                  
                  {converterAmount && convertedAmount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Equivalent:</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="font-medium">
                          {defaultCurrency?.symbol}{convertedAmount} {defaultCurrency?.code}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground text-center">
                    Rate: 1 {selectedCurrency.code} = {selectedCurrency.exchangeRate} {defaultCurrency?.code}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Alternative simple selector for inline use
export function SimpleCurrencySelector({
  value,
  onChange,
  disabled = false,
  className = ''
}: Pick<CurrencySelectorProps, 'value' | 'onChange' | 'disabled' | 'className'>) {
  const [currencies] = useState<Currency[]>(mockCurrencies);
  const activeCurrencies = currencies.filter(c => c.isActive);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`w-20 ${className}`}>
        <SelectValue>
          {value && (
            <span className="text-sm">
              {currencies.find(c => c.code === value)?.symbol}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {activeCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span>{currency.symbol}</span>
              <span className="text-xs">{currency.code}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Currency display component for read-only values
export function CurrencyDisplay({
  amount,
  currency,
  showCode = true,
  className = ''
}: {
  amount: number | null | undefined;
  currency: string;
  showCode?: boolean;
  className?: string;
}) {
  const [currencies] = useState<Currency[]>(mockCurrencies);
  const currencyData = currencies.find(c => c.code === currency);

  // Handle null/undefined amount
  const safeAmount = amount ?? 0;
  const displayAmount = typeof safeAmount === 'number' ? safeAmount.toLocaleString() : '0';

  if (!currencyData) {
    return <span className={className}>{displayAmount} {currency}</span>;
  }

  return (
    <span className={`${className} ${currencyData.isDefault ? 'font-medium' : ''}`}>
      {currencyData.symbol}{displayAmount}
      {showCode && (
        <span className="text-muted-foreground ml-1 text-sm">
          {currencyData.code}
        </span>
      )}
      {currencyData.isDefault && (
        <Badge variant="secondary" className="ml-2 text-xs px-1 py-0">
          <Star className="w-2 h-2 mr-1" />
        </Badge>
      )}
    </span>
  );
}
