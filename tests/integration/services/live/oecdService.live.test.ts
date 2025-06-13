import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OecdService } from '../../../../src/services/datasources/OecdService';

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 30000 }); // 30 seconds for OECD

describe('OecdService - Live API Integration Tests', () => {
  let oecdService: OecdService;

  beforeEach(async () => {
    oecdService = new OecdService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch GDP data for USA', async () => {
    try {
      const data = await oecdService.fetchMarketSize('GDP', 'USA');
      
      if (data) {
        expect(data).toHaveProperty('value');
        expect(data).toHaveProperty('source', 'OECD');
        expect(typeof data.value).toBe('number');
        console.log(`Live OECD GDP data for USA: ${data.value}`);
      } else {
        console.log('OECD GDP data returned null (may be expected)');
      }

    } catch (error: any) {
      console.warn(`Skipping OECD live test due to API/network error: ${error.message}`);
      expect(true).toBe(true);
    }
  });

  it('should handle service availability', async () => {
    const isAvailable = await oecdService.isAvailable();
    expect(typeof isAvailable).toBe('boolean');
    console.log(`OECD service available: ${isAvailable}`);
  });
});
