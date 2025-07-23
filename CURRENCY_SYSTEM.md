# Currency System Documentation

## Overview

The SPT Teams Currency System provides comprehensive multi-currency support with Ghana Cedis (GHS) as the default currency. The system includes real-time exchange rates, automatic conversion, and advanced configuration options.

## Features

### 🏦 Core Features
- **Multi-Currency Support**: Support for 150+ global currencies
- **Default Currency**: Ghana Cedis (GHS) as the workspace default
- **Real-Time Rates**: Live exchange rates from ExchangeRate-API
- **Automatic Conversion**: Optional automatic currency conversion
- **Manual Conversion**: On-demand currency conversion tools

### ⚙️ Advanced Features
- **Rate Tolerance**: Configurable rate change alerts (default: 5%)
- **Update Frequency**: Customizable sync intervals (default: 60 minutes)
- **Fallback Provider**: Mock data fallback for API failures
- **Usage Tracking**: Monitor API usage and conversion statistics
- **Admin Dashboard**: Comprehensive system status monitoring

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Currency System                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend Components                                       │
│  ├── Currency Settings Page                               │
│  ├── Currency Status Dashboard                            │
│  ├── Currency Selector Component                          │
│  └── Currency Converter Widget                            │
├─────────────────────────────────────────────────────────────┤
│  Backend Services                                          │
│  ├── Enhanced Currency Service                            │
│  ├── Exchange Rate API Service                            │
│  ├── Currency Service (CRUD)                              │
│  └── Firestore Integration                                │
├─────────────────────────────────────────────────────────────┤
│  External APIs                                             │
│  ├── ExchangeRate-API (Primary)                           │
│  └── Mock Data (Fallback)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key_here
```

### Default Settings

```typescript
const defaultSettings: CurrencySettings = {
  defaultCurrency: 'GHS',
  allowedCurrencies: ['GHS', 'USD', 'EUR', 'GBP', 'NGN'],
  autoConversion: true,
  rateProvider: 'exchangerate-api',
  updateFrequency: 60, // minutes
  rateTolerance: 5, // percentage
  rateAlerts: true,
  roundingPrecision: 2,
  fallbackProvider: 'mock',
  trackUsage: true,
  lastSyncTime: null
};
```

## API Usage

### Testing the API

```bash
npm run test:exchange-api
```

### Manual Rate Sync

```typescript
import { EnhancedCurrencyService } from '@/lib/enhanced-currency-service';

// Sync rates for workspace
await EnhancedCurrencyService.syncExchangeRates('workspace-id');
```

### Currency Conversion

```typescript
import { EnhancedCurrencyService } from '@/lib/enhanced-currency-service';

// Convert 100 GHS to USD
const result = await EnhancedCurrencyService.convertCurrency(
  'workspace-id',
  100,
  'GHS',
  'USD'
);
```

## Exchange Rate Logic

### Conversion Formulas

The system uses Bank of Ghana standards:

1. **For GHSXXX pairs** (GHS is base):
   - 1 GHS = X foreign currency
   - Example: GHSUSD = 0.0625 means 1 GHS = 0.0625 USD

2. **For XXXGHS pairs** (GHS is quote):
   - 1 GHS = 1/Y foreign currency  
   - Example: USDGHS = 16.0 means 1 GHS = 1/16.0 = 0.0625 USD

### Supported Currencies

Primary African currencies:
- **GHS** - Ghana Cedis (default)
- **NGN** - Nigerian Naira
- **KES** - Kenyan Shilling
- **ZAR** - South African Rand
- **EGP** - Egyptian Pound

Major international currencies:
- **USD** - US Dollar
- **EUR** - Euro
- **GBP** - British Pound
- **JPY** - Japanese Yen
- **CAD** - Canadian Dollar

## File Structure

```
app/dashboard/financial/currency/
├── page.tsx                    # Main currency settings page
└── status/
    └── page.tsx               # System status dashboard

components/financial/
├── CurrencySelector.tsx       # Currency picker component
└── CurrencyConverter.tsx      # Conversion widget

lib/
├── currency-service.ts        # Basic CRUD operations
├── enhanced-currency-service.ts # Advanced features
├── exchange-rate-api-service.ts # API integration
├── test-exchange-rate-api.ts   # API testing
└── types.ts                   # Type definitions
```

## Navigation

The currency system is accessible through the Financial Management section:

```
Dashboard → Financial Management → Currency Settings
Dashboard → Financial Management → Currency Status
```

## Permissions

- **Workspace Admins**: Full access to all currency settings
- **Regular Users**: View-only access to conversion tools
- **Guests**: No access to currency settings

## Error Handling

### API Failures
- Automatic fallback to mock data
- Rate staleness warnings
- Manual sync options

### Data Validation
- Currency code validation
- Rate boundary checks
- Precision limits

### User Feedback
- Loading states
- Success notifications
- Error alerts with recovery options

## Testing

### Unit Tests
```bash
npm test -- currency-service
```

### API Integration Tests
```bash
npm run test:exchange-api
```

### Manual Testing Checklist
- [ ] Currency conversion accuracy
- [ ] Rate sync functionality
- [ ] API status monitoring
- [ ] Fallback behavior
- [ ] Permission controls

## Monitoring

### Health Checks
- API status monitoring
- Data freshness alerts
- Usage tracking
- Error logging

### Metrics
- Total conversions
- API request count
- Sync frequency
- Error rates

## Troubleshooting

### Common Issues

1. **Rates not updating**
   - Check API key validity
   - Verify internet connection
   - Review sync frequency settings

2. **Conversion errors**
   - Validate currency codes
   - Check rate availability
   - Review precision settings

3. **Performance issues**
   - Monitor API usage limits
   - Optimize sync frequency
   - Enable caching

## Support

For technical support or feature requests:
- Check system status dashboard
- Review activity logs
- Contact workspace administrators

## Version History

- **v1.0.0**: Initial implementation with GHS default
- **v1.1.0**: Added ExchangeRate-API integration
- **v1.2.0**: Enhanced status dashboard and monitoring
- **v1.3.0**: Advanced configuration options
