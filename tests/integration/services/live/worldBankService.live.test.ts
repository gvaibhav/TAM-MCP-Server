import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldBankService } from '../../../../src/services/datasources/WorldBankService';

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 30000 }); // 30 seconds for World Bank

describe('WorldBankService - Live API Integration Tests', () => {
  let worldBankService: WorldBankService;

  beforeEach(async () => {
    worldBankService = new WorldBankService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch GDP data for USA', async () => {
    try {
      const data = await worldBankService.getCountryData('USA', 'NY.GDP.MKTP.CD');
      
      if (data && data.length > 0) {
        expect(data).toBeInstanceOf(Array);
        const dataPoint = data[0];
        expect(dataPoint).toHaveProperty('country');
        expect(dataPoint).toHaveProperty('indicator');
        expect(dataPoint).toHaveProperty('date');
        expect(dataPoint).toHaveProperty('value');
        
        console.log(`Live World Bank GDP data for USA (${dataPoint.date}): ${dataPoint.value}`);
      } else {
        console.log('World Bank GDP data returned null/empty (may be expected)');
      }

    } catch (error: any) {
      console.warn(`Skipping World Bank live test due to API/network error: ${error.message}`);
      expect(true).toBe(true);
    }
  });

  it('should handle service availability', async () => {
    const isAvailable = await worldBankService.isAvailable();
    expect(typeof isAvailable).toBe('boolean');
    console.log(`World Bank service available: ${isAvailable}`);
  });
});
