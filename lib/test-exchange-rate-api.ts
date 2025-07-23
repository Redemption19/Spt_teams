/**
 * Test script for ExchangeRate-API integration
 * Run this to verify the API is working correctly
 */

import { ExchangeRateAPIService } from './exchange-rate-api-service';

async function testExchangeRateAPI() {
  console.log('🧪 Testing ExchangeRate-API Integration...\n');

  try {
    // Test 1: Check API Status
    console.log('1️⃣ Checking API Status...');
    const status = await ExchangeRateAPIService.checkAPIStatus();
    console.log('Status:', status);
    console.log('');

    // Test 2: Get GHS Rates
    console.log('2️⃣ Getting GHS exchange rates...');
    const ghsRates = await ExchangeRateAPIService.getGHSRates();
    console.log('Sample GHS rates:', {
      USD: ghsRates.USD,
      EUR: ghsRates.EUR,
      GBP: ghsRates.GBP,
      NGN: ghsRates.NGN
    });
    console.log('');

    // Test 3: Currency Conversion
    console.log('3️⃣ Testing currency conversion (1 GHS to USD)...');
    const conversion = await ExchangeRateAPIService.convertCurrency('GHS', 'USD', 1);
    console.log('Conversion result:', conversion);
    console.log('');

    // Test 4: Get Supported Currencies
    console.log('4️⃣ Getting supported currencies...');
    const supported = await ExchangeRateAPIService.getSupportedCurrencies();
    if (supported.supported_codes) {
      console.log(`Found ${supported.supported_codes.length} supported currencies`);
      console.log('Sample currencies:', supported.supported_codes.slice(0, 5));
    }
    console.log('');

    // Test 5: Update Workspace Currencies
    console.log('5️⃣ Testing workspace currency update...');
    const workspaceUpdate = await ExchangeRateAPIService.updateWorkspaceCurrencies(
      'test-workspace', 
      ['GHS', 'USD', 'EUR', 'GBP', 'NGN']
    );
    console.log('Workspace update result:', workspaceUpdate);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other files
export { testExchangeRateAPI };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testExchangeRateAPI();
}
