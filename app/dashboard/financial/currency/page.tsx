'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Star,
  Globe,
  TrendingUp,
  Check,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  Info
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { CurrencySettings } from '@/lib/types/financial-types';
import { ExchangeRateAPIService } from '@/lib/exchange-rate-api-service';
import { EnhancedCurrencyService } from '@/lib/enhanced-currency-service';

// Mock data - replace with actual service calls
const mockCurrencies = [
  { id: '1', code: 'GHS', name: 'Ghana Cedi', symbol: '₵', exchangeRate: 1, isActive: true, isDefault: true, updatedAt: new Date('2025-07-18') },
  { id: '2', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0959, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/10.43 USD
  { id: '3', code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0823, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/12.1475 EUR
  { id: '4', code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.0714, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/14.0164 GBP
  { id: '5', code: 'NGN', name: 'Nigerian Naira', symbol: '₦', exchangeRate: 146.9799, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 146.98 NGN
  { id: '6', code: 'ZAR', name: 'South African Rand', symbol: 'R', exchangeRate: 1.6949, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/0.5901 ZAR
  { id: '7', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 0.1315, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/7.6052 CAD
  { id: '8', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 0.1469, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/6.8071 AUD
  { id: '9', code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 14.2450, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/0.0702 JPY
  { id: '10', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 0.6881, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/1.4535 CNY
  { id: '11', code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', exchangeRate: 0.0767, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/13.0367 CHF
  { id: '12', code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', exchangeRate: 0.9744, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/1.0263 NOK
  { id: '13', code: 'SEK', name: 'Swedish Krona', symbol: 'kr', exchangeRate: 0.9259, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/1.0801 SEK
  { id: '14', code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', exchangeRate: 0.1604, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/6.2338 NZD
  { id: '15', code: 'DKK', name: 'Danish Krone', symbol: 'kr', exchangeRate: 0.6144, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 1/1.6275 DKK
  { id: '16', code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', exchangeRate: 53.9994, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 53.9994 XOF
  { id: '17', code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', exchangeRate: 6.9512, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 6.9512 GMD
  { id: '18', code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', exchangeRate: 2206.2537, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') }, // 1 GHS = 2206.25 SLL
  { id: '19', code: 'MRO', name: 'Mauritanian Ouguiya', symbol: 'UM', exchangeRate: 34.2762, isActive: true, isDefault: false, updatedAt: new Date('2025-07-18') } // 1 GHS = 34.28 MRO
];

const mockCurrencySettings: CurrencySettings = {
  id: 'default-settings',
  workspaceId: 'workspace-1',
  defaultCurrency: 'GHS',
  allowedCurrencies: ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'ZAR'],
  autoConversion: true,
  exchangeRateProvider: 'api',
  updateFrequency: 'hourly',
  rateTolerance: 5, // 5% change threshold
  enableRateAlerts: true,
  roundingPrecision: 4,
  enableAutomaticSync: true,
  fallbackProvider: 'cached',
  lastUpdated: new Date(),
  nextUpdateAt: new Date(Date.now() + 60 * 60 * 1000), // Next hour
  rateLimits: {
    maxDailyRequests: 1000,
    currentDailyRequests: 45,
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const availableCurrencies = [
  { code: 'GHS', name: 'Ghana Cedi', symbol: '₵' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le' },
  { code: 'MRO', name: 'Mauritanian Ouguiya', symbol: 'UM' },
  { code: 'WAU', name: 'Ecowas Unit', symbol: 'WAU' }
];

export default function CurrencySettingsPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('currencies');
  const [currencies, setCurrencies] = useState(mockCurrencies);
  const [settings, setSettings] = useState<CurrencySettings>(mockCurrencySettings);
  const [loading, setLoading] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');

  // Currency conversion calculator state
  const [fromCurrency, setFromCurrency] = useState('GHS');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState('0');
  const [apiStatus, setApiStatus] = useState<{
    isAvailable: boolean;
    lastUpdate?: string;
    nextUpdate?: string;
    error?: string;
  }>({ isAvailable: false });

  const calculateConversion = useCallback(() => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.exchangeRate || 1;
    const inputAmount = parseFloat(amount) || 0;
    
    // Convert to base currency (GHS) first, then to target currency
    const amountInGHS = inputAmount / fromRate;
    const converted = amountInGHS * toRate;
    
    // Use more precise formatting - show more decimals for small amounts
    const formattedAmount = converted < 1 
      ? converted.toFixed(4) // Show 4 decimals for amounts less than 1
      : converted.toFixed(2); // Show 2 decimals for amounts 1 or greater
    
    setConvertedAmount(formattedAmount);
  }, [currencies, fromCurrency, toCurrency, amount]);

  useEffect(() => {
    // Calculate conversion when inputs change
    calculateConversion();
  }, [calculateConversion]);

  // Check API status on component mount
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const status = await ExchangeRateAPIService.checkAPIStatus();
        setApiStatus(status);
      } catch (error) {
        console.error('Error checking API status:', error);
        setApiStatus({
          isAvailable: false,
          error: 'Failed to check API status'
        });
      }
    };

    checkAPI();
  }, []);

  // Manual sync function
  const handleManualSync = async () => {
    setLoading(true);
    try {
      if (!currentWorkspace?.id) {
        throw new Error('No workspace selected');
      }

      // Call live API to get updated rates
      const liveRates = await ExchangeRateAPIService.getGHSRates();
      
      // Update currencies with new rates
      const updatedCurrencies = currencies.map(currency => {
        if (liveRates[currency.code] !== undefined) {
          return {
            ...currency,
            exchangeRate: liveRates[currency.code],
            updatedAt: new Date()
          };
        }
        return currency;
      });
      
      setCurrencies(updatedCurrencies);
      
      // Update settings last sync time
      setSettings(prev => ({
        ...prev,
        lastUpdated: new Date(),
        nextUpdateAt: new Date(Date.now() + 60 * 60 * 1000) // Next hour
      }));

      toast({
        title: "Exchange Rates Updated",
        description: `Successfully updated rates for ${updatedCurrencies.length} currencies from ExchangeRate-API`,
      });

    } catch (error) {
      console.error('Manual sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to update exchange rates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultCurrency = async (currencyCode: string) => {
    try {
      setLoading(true);
      
      // Update currencies array
      const updatedCurrencies = currencies.map(currency => ({
        ...currency,
        isDefault: currency.code === currencyCode
      }));
      setCurrencies(updatedCurrencies);
      
      // Update settings
      setSettings(prev => ({
        ...prev,
        defaultCurrency: currencyCode
      }));
      
      // TODO: Call actual service
      // await CurrencyService.setDefaultCurrency(currentWorkspace?.id, currencyCode);
      
      toast({
        title: "Success",
        description: `${currencyCode} set as default currency`,
      });
    } catch (error) {
      console.error('Error setting default currency:', error);
      toast({
        title: "Error",
        description: "Failed to set default currency",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExchangeRate = async (currencyId: string, newRate: number) => {
    try {
      const updatedCurrencies = currencies.map(currency => 
        currency.id === currencyId 
          ? { ...currency, exchangeRate: newRate }
          : currency
      );
      setCurrencies(updatedCurrencies);
      setEditingCurrency(null);
      
      // TODO: Call actual service
      // await CurrencyService.updateCurrency(currentWorkspace?.id, currencyId, { exchangeRate: newRate });
      
      toast({
        title: "Success",
        description: "Exchange rate updated successfully",
      });
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      toast({
        title: "Error",
        description: "Failed to update exchange rate",
        variant: "destructive"
      });
    }
  };

  const handleAddCurrency = async () => {
    if (!newCurrencyCode) return;
    
    try {
      const currencyData = availableCurrencies.find(c => c.code === newCurrencyCode);
      if (!currencyData) return;
      
      const newCurrency = {
        id: Date.now().toString(),
        ...currencyData,
        exchangeRate: 1, // Default rate, should be updated
        isActive: true,
        isDefault: false,
        updatedAt: new Date()
      };
      
      setCurrencies(prev => [...prev, newCurrency]);
      setNewCurrencyCode('');
      
      // TODO: Call actual service
      // await CurrencyService.addCustomCurrency(currentWorkspace?.id, newCurrency);
      
      toast({
        title: "Success",
        description: `${currencyData.name} added successfully`,
      });
    } catch (error) {
      console.error('Error adding currency:', error);
      toast({
        title: "Error",
        description: "Failed to add currency",
        variant: "destructive"
      });
    }
  };

  const handleToggleCurrency = async (currencyId: string) => {
    try {
      const updatedCurrencies = currencies.map(currency => 
        currency.id === currencyId 
          ? { ...currency, isActive: !currency.isActive }
          : currency
      );
      setCurrencies(updatedCurrencies);
      
      // TODO: Call actual service
      
      toast({
        title: "Success",
        description: "Currency status updated",
      });
    } catch (error) {
      console.error('Error toggling currency:', error);
      toast({
        title: "Error",
        description: "Failed to update currency status",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<CurrencySettings>) => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // TODO: Call actual service
      // await CurrencyService.updateCurrencySettings(currentWorkspace?.id, newSettings);
      
      toast({
        title: "Success",
        description: "Currency settings updated",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  const refreshExchangeRates = async () => {
    try {
      setLoading(true);
      
      // TODO: Call actual exchange rate API
      toast({
        title: "Success",
        description: "Exchange rates refreshed",
      });
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast({
        title: "Error",
        description: "Failed to refresh exchange rates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Currency Settings</h1>
          <p className="text-muted-foreground">
            Manage currencies and exchange rates for your workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshExchangeRates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Rates
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Default Currency Alert */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Default Currency: Ghana Cedi (GHS)</p>
              <p className="text-sm text-muted-foreground">
                All financial calculations are based on GHS. Exchange rates updated from Bank of Ghana (July 18, 2025).
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
              <Star className="w-3 h-3 mr-1" />
              Primary
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="converter">Currency Converter</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies" className="space-y-4">
          {/* Add New Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Currency
              </CardTitle>
              <CardDescription>
                Add a new currency to your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Select value={newCurrencyCode} onValueChange={setNewCurrencyCode}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select currency to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies
                      .filter(currency => !currencies.some(c => c.code === currency.code))
                      .map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddCurrency} disabled={!newCurrencyCode}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Currency
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currencies List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Currencies</CardTitle>
              <CardDescription>
                Manage exchange rates and currency settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currencies.map((currency) => (
                  <div key={currency.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl">{currency.symbol}</div>
                          <div className="text-xs text-muted-foreground">{currency.code}</div>
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {currency.name}
                            {currency.isDefault && (
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            {!currency.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            1 {currency.code} = {currency.exchangeRate} GHS
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {editingCurrency === currency.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.000001"
                              defaultValue={currency.exchangeRate}
                              className="w-24"
                              onBlur={(e) => {
                                const newRate = parseFloat(e.target.value);
                                if (newRate > 0) {
                                  handleUpdateExchangeRate(currency.id, newRate);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newRate = parseFloat(e.currentTarget.value);
                                  if (newRate > 0) {
                                    handleUpdateExchangeRate(currency.id, newRate);
                                  }
                                }
                              }}
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setEditingCurrency(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCurrency(currency.id)}
                              disabled={currency.code === 'GHS'} // Can't edit base currency rate
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit Rate
                            </Button>
                            
                            {!currency.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetDefaultCurrency(currency.code)}
                                disabled={loading}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Set Default
                              </Button>
                            )}
                            
                            <Switch
                              checked={currency.isActive}
                              onCheckedChange={() => handleToggleCurrency(currency.id)}
                              disabled={currency.isDefault} // Can't deactivate default currency
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Currency Settings
              </CardTitle>
              <CardDescription>
                Configure how currencies are handled in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Basic Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-currency">Default Currency</Label>
                    <Select 
                      value={settings.defaultCurrency} 
                      onValueChange={(value) => handleUpdateSettings({ defaultCurrency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.filter(c => c.isActive).map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Primary currency for financial calculations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rounding-precision">Rounding Precision</Label>
                    <Select 
                      value={settings.roundingPrecision.toString()} 
                      onValueChange={(value) => handleUpdateSettings({ roundingPrecision: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 decimal places (0.00)</SelectItem>
                        <SelectItem value="3">3 decimal places (0.000)</SelectItem>
                        <SelectItem value="4">4 decimal places (0.0000)</SelectItem>
                        <SelectItem value="5">5 decimal places (0.00000)</SelectItem>
                        <SelectItem value="6">6 decimal places (0.000000)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Number of decimal places for currency calculations
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-conversion">Automatic Currency Conversion</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically convert amounts to the default currency
                    </p>
                  </div>
                  <Switch
                    id="auto-conversion"
                    checked={settings.autoConversion}
                    onCheckedChange={(checked) => 
                      handleUpdateSettings({ autoConversion: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Exchange Rate Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Exchange Rate Management
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate-provider">Exchange Rate Provider</Label>
                    <Select 
                      value={settings.exchangeRateProvider} 
                      onValueChange={(value) => {
                        if (value === 'manual' || value === 'api' || value === 'bank') {
                          handleUpdateSettings({ exchangeRateProvider: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            ExchangeRate-API (Live)
                          </div>
                        </SelectItem>
                        <SelectItem value="bank">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            Bank of Ghana (Manual)
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">
                          <div className="flex items-center gap-2">
                            <Edit className="w-3 h-3" />
                            Manual Updates
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose how exchange rates are updated
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="update-frequency">Update Frequency</Label>
                    <Select 
                      value={settings.updateFrequency} 
                      onValueChange={(value) => {
                        if (['realtime', 'hourly', 'daily', 'weekly', 'manual'].includes(value)) {
                          handleUpdateSettings({ updateFrequency: value as any });
                        }
                      }}
                      disabled={settings.exchangeRateProvider === 'manual'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often to sync exchange rates
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate-tolerance">Rate Change Alert Threshold</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="rate-tolerance"
                        type="number"
                        min="1"
                        max="50"
                        value={settings.rateTolerance}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 50) {
                            handleUpdateSettings({ rateTolerance: value });
                          }
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alert when rates change by this percentage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fallback-provider">Fallback Strategy</Label>
                    <Select 
                      value={settings.fallbackProvider} 
                      onValueChange={(value) => {
                        if (value === 'manual' || value === 'cached') {
                          handleUpdateSettings({ fallbackProvider: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cached">Use Cached Rates</SelectItem>
                        <SelectItem value="manual">Manual Override</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      What to do if primary provider fails
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="rate-alerts">Rate Change Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when exchange rates change significantly
                    </p>
                  </div>
                  <Switch
                    id="rate-alerts"
                    checked={settings.enableRateAlerts}
                    onCheckedChange={(checked) => 
                      handleUpdateSettings({ enableRateAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync">Automatic Sync with Bank of Ghana</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically synchronize with official Bank of Ghana rates
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={settings.enableAutomaticSync}
                    onCheckedChange={(checked) => 
                      handleUpdateSettings({ enableAutomaticSync: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Status Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Status & Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-sm">Update Information</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Last updated: {settings.lastUpdated.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Next update: {settings.nextUpdateAt?.toLocaleString() || 'Manual'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Update frequency: {settings.updateFrequency}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">API Usage</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Daily requests: {settings.rateLimits.currentDailyRequests} / {settings.rateLimits.maxDailyRequests}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Reset at: {settings.rateLimits.resetAt.toLocaleTimeString()}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(settings.rateLimits.currentDailyRequests / settings.rateLimits.maxDailyRequests) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${apiStatus.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-sm">ExchangeRate-API Status</span>
                    </div>
                    {apiStatus.isAvailable ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          ✅ API is available and responsive
                        </p>
                        {apiStatus.lastUpdate && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Last API update: {new Date(apiStatus.lastUpdate).toLocaleString()}
                          </p>
                        )}
                        {apiStatus.nextUpdate && (
                          <p className="text-xs text-muted-foreground">
                            Next update: {new Date(apiStatus.nextUpdate).toLocaleString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-red-500">
                        ❌ {apiStatus.error || 'API unavailable'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Manual Sync Button */}
                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <h4 className="font-medium">Manual Rate Sync</h4>
                    <p className="text-sm text-muted-foreground">
                      Force an immediate update of all exchange rates from your selected provider
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleManualSync}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="converter">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Currency Converter
              </CardTitle>
              <CardDescription>
                Convert between different currencies using current exchange rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="from-currency">From</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.filter(c => c.isActive).map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="to-currency">To</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.filter(c => c.isActive).map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg p-6 bg-primary/5 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {currencies.find(c => c.code === toCurrency)?.symbol}{convertedAmount}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {amount} {fromCurrency} = {convertedAmount} {toCurrency}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Rate: 1 {fromCurrency} = {(
                      (currencies.find(c => c.code === toCurrency)?.exchangeRate || 1) / 
                      (currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1)
                    ).toFixed(6)} {toCurrency}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currencies.filter(c => c.isActive && c.code !== fromCurrency).slice(0, 4).map(currency => {
                    const rate = currency.exchangeRate / (currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1);
                    const converted = (parseFloat(amount) || 0) * rate;
                    
                    // Use same precision logic as main converter
                    const formattedAmount = converted < 1 
                      ? converted.toFixed(4)
                      : converted.toFixed(2);
                    
                    return (
                      <div key={currency.code} className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-semibold">
                          {currency.symbol}{formattedAmount}
                        </div>
                        <div className="text-sm text-muted-foreground">{currency.code}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
