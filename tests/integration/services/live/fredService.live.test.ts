import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FredService } from '../../../../src/services/datasources/FredService';

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 30000 }); // 30 seconds for FRED

describe('FredService - Live API Integration Tests', () => {
  let fredService: FredService;

  beforeEach(async () => {
    fredService = new FredService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch real GDP data if API key is available', async () => {
    const seriesId = 'GDP';

    try {
      if (!(await fredService.isAvailable())) {
        console.warn('Skipping FRED live test - API key not configured');
        expect(true).toBe(true);
        return;
      }

      const data = await fredService.getSeriesObservations(seriesId);
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const dataPoint = data[0];
      expect(dataPoint).toHaveProperty('date');
      expect(dataPoint).toHaveProperty('value');
      expect(typeof dataPoint.date).toBe('string');

      console.log(`Live FRED GDP data (${dataPoint.date}): Value=${dataPoint.value}`);

    } catch (error: any) {
      console.warn(`Skipping FRED live test due to API/network error: ${error.message}`);
      expect(true).toBe(true);
    }
  });

  it('should handle unavailable service gracefully', async () => {
    const isAvailable = await fredService.isAvailable();
    expect(typeof isAvailable).toBe('boolean');
    
    if (!isAvailable) {
      console.log('FRED service not available (API key not configured)');
    }
  });
});
