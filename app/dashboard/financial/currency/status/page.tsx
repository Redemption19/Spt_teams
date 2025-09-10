/**
 * Currency System Status Dashboard
 * Shows comprehensive status of the currency system for workspace admins
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Zap, 
  TrendingUp,
  RefreshCw,
  Globe,
  Wallet,
  Settings,
  Activity,
  Target
} from 'lucide-react';
import { EnhancedCurrencyService } from '@/lib/enhanced-currency-service';
import { CurrencyService } from '@/lib/currency-service';
import { ExchangeRateAPIService } from '@/lib/exchange-rate-api-service';
import { CurrencySettings, Currency } from '@/lib/types/financial-types';

interface APIStatus {
  isOnline: boolean;
  lastCheck: Date;
  responseTime?: number;
  requestsToday: number;
  requestsLimit: number;
}

interface SystemHealth {
  apiStatus: APIStatus;
  dataFreshness: 'fresh' | 'stale' | 'outdated';
  lastSync: Date | null;
  nextSync: Date | null;
  errorCount: number;
  totalConversions: number;
}

export default function CurrencySystemStatus() {
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to convert update frequency to minutes
  const getUpdateFrequencyInMinutes = useCallback((frequency: string): number => {
    switch (frequency) {
      case 'realtime': return 1;
      case 'hourly': return 60;
      case 'daily': return 1440;
      case 'weekly': return 10080;
      case 'manual': return 0;
      default: return 60;
    }
  }, []);

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        // Check API status
        const apiStatus = await ExchangeRateAPIService.checkAPIStatus();
        
        // Get sync status from settings
        const workspaceId = 'demo-workspace';
        const settings = await CurrencyService.getCurrencySettings(workspaceId);
        
        const now = new Date();
        const lastSync = settings.lastUpdated ? new Date(settings.lastUpdated) : null;
        const nextSync = settings.nextUpdateAt ? new Date(settings.nextUpdateAt) : null;
        
        // Determine data freshness based on update frequency
        let dataFreshness: 'fresh' | 'stale' | 'outdated' = 'fresh';
        if (lastSync) {
          const timeSinceSync = now.getTime() - lastSync.getTime();
          const maxFreshTime = getUpdateFrequencyInMinutes(settings.updateFrequency) * 60 * 1000; // Convert to milliseconds
          
          if (timeSinceSync > maxFreshTime * 2) {
            dataFreshness = 'outdated';
          } else if (timeSinceSync > maxFreshTime) {
            dataFreshness = 'stale';
          }
        }

        const health: SystemHealth = {
          apiStatus: {
            isOnline: apiStatus.isAvailable,
            lastCheck: now,
            requestsToday: 45, // Mock data - replace with actual tracking
            requestsLimit: 1500
          },
          dataFreshness,
          lastSync,
          nextSync,
          errorCount: 0, // Mock data - replace with actual error tracking
          totalConversions: 1247 // Mock data - replace with actual tracking
        };

        setSystemHealth(health);
      } catch (error) {
        console.error('Failed to check system health:', error);
      }
    };

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load settings
        const workspaceId = 'demo-workspace'; // Replace with actual workspace ID
        const currencySettings = await CurrencyService.getCurrencySettings(workspaceId);
        setSettings(currencySettings);

        // Load currencies
        const currencyList = await CurrencyService.getWorkspaceCurrencies(workspaceId);
        setCurrencies(currencyList);

        // Check system health
        await checkSystemHealth();

      } catch (error) {
        console.error('Failed to load system data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getUpdateFrequencyInMinutes]);

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      
      // Load settings
      const workspaceId = 'demo-workspace'; // Replace with actual workspace ID
      const currencySettings = await CurrencyService.getCurrencySettings(workspaceId);
      setSettings(currencySettings);

      // Load currencies
      const currencyList = await CurrencyService.getWorkspaceCurrencies(workspaceId);
      setCurrencies(currencyList);

      // Check system health
      const checkSystemHealth = async () => {
        try {
          // Check API status
          const apiStatus = await ExchangeRateAPIService.checkAPIStatus();
          
          // Get sync status from settings
          const workspaceId = 'demo-workspace';
          const settings = await CurrencyService.getCurrencySettings(workspaceId);
          
          const now = new Date();
          const lastSync = settings.lastUpdated ? new Date(settings.lastUpdated) : null;
          const nextSync = settings.nextUpdateAt ? new Date(settings.nextUpdateAt) : null;
          
          // Determine data freshness based on update frequency
          let dataFreshness: 'fresh' | 'stale' | 'outdated' = 'fresh';
          if (lastSync) {
            const timeSinceSync = now.getTime() - lastSync.getTime();
            const maxFreshTime = getUpdateFrequencyInMinutes(settings.updateFrequency) * 60 * 1000; // Convert to milliseconds
            
            if (timeSinceSync > maxFreshTime * 2) {
              dataFreshness = 'outdated';
            } else if (timeSinceSync > maxFreshTime) {
              dataFreshness = 'stale';
            }
          }

          const health: SystemHealth = {
            apiStatus: {
              isOnline: apiStatus.isAvailable,
              lastCheck: now,
              requestsToday: 45, // Mock data - replace with actual tracking
              requestsLimit: 1500
            },
            dataFreshness,
            lastSync,
            nextSync,
            errorCount: 0, // Mock data - replace with actual error tracking
            totalConversions: 1247 // Mock data - replace with actual tracking
          };

          setSystemHealth(health);
        } catch (error) {
          console.error('Failed to check system health:', error);
        }
      };

      await checkSystemHealth();

    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsRefreshing(true);
      const workspaceId = 'demo-workspace';
      await EnhancedCurrencyService.syncWithExchangeRateAPI(workspaceId);
      await loadSystemData();
    } catch (error) {
      console.error('Failed to sync rates:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'fresh':
        return 'text-green-600 dark:text-green-400';
      case 'stale':
        return 'text-amber-600 dark:text-amber-400';
      case 'offline':
      case 'outdated':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'fresh':
        return <CheckCircle className="h-4 w-4" />;
      case 'stale':
        return <Clock className="h-4 w-4" />;
      case 'offline':
      case 'outdated':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-background min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/50 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-card/50 border border-border/30 rounded-lg backdrop-blur-sm"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Currency System Status</h1>
          <p className="text-muted-foreground">Monitor and manage your currency system health</p>
        </div>
        <Button 
          onClick={handleManualSync} 
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sync Rates
        </Button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-enhanced border-border/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">API Status</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className={getStatusColor(systemHealth?.apiStatus.isOnline ? 'online' : 'offline')}>
                {getStatusIcon(systemHealth?.apiStatus.isOnline ? 'online' : 'offline')}
              </span>
              <span className="text-2xl font-bold text-foreground">
                {systemHealth?.apiStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: {systemHealth?.apiStatus.lastCheck.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border-border/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Data Freshness</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className={getStatusColor(systemHealth?.dataFreshness || 'fresh')}>
                {getStatusIcon(systemHealth?.dataFreshness || 'fresh')}
              </span>
              <span className="text-2xl font-bold capitalize text-foreground">
                {systemHealth?.dataFreshness || 'Fresh'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last sync: {systemHealth?.lastSync?.toLocaleTimeString() || 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border-border/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">API Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {systemHealth?.apiStatus.requestsToday || 0}
            </div>
            <Progress 
              value={(systemHealth?.apiStatus.requestsToday || 0) / (systemHealth?.apiStatus.requestsLimit || 1500) * 100} 
              className="mt-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
            />
            <p className="text-xs text-muted-foreground">
              of {systemHealth?.apiStatus.requestsLimit || 1500} daily limit
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border-border/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Conversions</CardTitle>
            <Wallet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {systemHealth?.totalConversions?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card/50 border border-border/30 backdrop-blur-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="currencies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Currencies</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Settings</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-enhanced border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">System Configuration</CardTitle>
                <CardDescription className="text-muted-foreground">Current currency system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                  <span className="text-sm font-medium text-foreground">Default Currency:</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{settings?.defaultCurrency || 'GHS'}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                  <span className="text-sm font-medium text-foreground">Auto Conversion:</span>
                  <Badge variant={settings?.autoConversion ? 'default' : 'secondary'} 
                         className={settings?.autoConversion ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                    {settings?.autoConversion ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                  <span className="text-sm font-medium text-foreground">Update Frequency:</span>
                  <span className="text-sm text-muted-foreground">{settings?.updateFrequency || 'hourly'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                  <span className="text-sm font-medium text-foreground">Rate Provider:</span>
                  <span className="text-sm text-muted-foreground">{settings?.exchangeRateProvider || 'api'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Next Scheduled Actions</CardTitle>
                <CardDescription className="text-muted-foreground">Upcoming system activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Next Rate Sync</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {systemHealth?.nextSync?.toLocaleTimeString() || 'Manual only'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Cache Cleanup</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Daily at 2:00 AM</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Usage Report</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Weekly on Sunday</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {systemHealth?.errorCount && systemHealth.errorCount > 0 && (
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-foreground">
                {systemHealth.errorCount} errors detected in the last 24 hours. 
                Check the activity logs for details.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="currencies" className="space-y-4">
          <Card className="card-enhanced border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Supported Currencies</CardTitle>
              <CardDescription className="text-muted-foreground">
                Currencies currently available in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currencies.map((currency) => (
                  <div 
                    key={currency.code} 
                    className="p-4 bg-card/50 hover:bg-card/70 border border-border/30 rounded-lg space-y-3 transition-all duration-200 hover:shadow-md backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{currency.code}</span>
                      </div>
                      <Badge 
                        variant={currency.code === settings?.defaultCurrency ? 'default' : 'secondary'}
                        className={currency.code === settings?.defaultCurrency 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }
                      >
                        {currency.code === settings?.defaultCurrency ? 'Default' : 'Secondary'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{currency.name}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Exchange Rate:</span>
                        <span className="text-foreground font-mono">
                          1 GHS = {currency.exchangeRate.toFixed(4)} {currency.code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span className="text-muted-foreground">
                          {new Date(currency.updatedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="card-enhanced border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Advanced Settings</CardTitle>
              <CardDescription className="text-muted-foreground">
                Detailed configuration of your currency system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Target className="h-3 w-3 text-primary" />
                    </div>
                    <span>Rate Management</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                      <span className="text-sm text-foreground">Rate Tolerance:</span>
                      <span className="text-sm font-medium text-muted-foreground">{settings?.rateTolerance || 5}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                      <span className="text-sm text-foreground">Rate Alerts:</span>
                      <Badge 
                        variant={settings?.enableRateAlerts ? 'default' : 'secondary'}
                        className={settings?.enableRateAlerts ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      >
                        {settings?.enableRateAlerts ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                      <span className="text-sm text-foreground">Rounding Precision:</span>
                      <span className="text-sm font-medium text-muted-foreground">{settings?.roundingPrecision || 2} decimal places</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground flex items-center space-x-2">
                    <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                      <Settings className="h-3 w-3 text-accent" />
                    </div>
                    <span>API Configuration</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                      <span className="text-sm text-foreground">Primary Provider:</span>
                      <span className="text-sm font-medium text-muted-foreground">{settings?.exchangeRateProvider || 'api'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                      <span className="text-sm text-foreground">Fallback Provider:</span>
                      <span className="text-sm font-medium text-muted-foreground">{settings?.fallbackProvider || 'cached'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/20">
                      <span className="text-sm text-foreground">Auto Sync:</span>
                      <Badge 
                        variant={settings?.enableAutomaticSync ? 'default' : 'secondary'}
                        className={settings?.enableAutomaticSync ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      >
                        {settings?.enableAutomaticSync ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                System events and currency operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock activity logs - replace with actual data */}
                <div className="flex items-center space-x-3 p-4 bg-card/50 hover:bg-card/70 border border-border/30 rounded-lg transition-all duration-200 hover:shadow-md backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Exchange rates synced successfully</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card/50 hover:bg-card/70 border border-border/30 rounded-lg transition-all duration-200 hover:shadow-md backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Currency conversion: 100 GHS → USD</p>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card/50 hover:bg-card/70 border border-border/30 rounded-lg transition-all duration-200 hover:shadow-md backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center">
                    <Settings className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Settings updated by admin</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
