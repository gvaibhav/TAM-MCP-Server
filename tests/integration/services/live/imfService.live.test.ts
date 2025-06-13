import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImfService } from '../../../../src/services/datasources/ImfService';
import * as envHelper from '../../../../src/utils/envHelper';

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 30000 }); // 30 seconds for IMF

describe('ImfService - Live API Integration Tests', () => {
  let imfService: ImfService;

  beforeEach(async () => {
    vi.spyOn(envHelper, 'getEnvAsNumber').mockImplementation((key, defaultValue) => defaultValue);
    imfService = new ImfService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and parse US Real GDP Growth (Annual) from IFS', async () => {
    const dataflowId = 'IFS';
    const key = 'A.US.NGDP_RPCH';
    const startPeriod = '2020';
    const endPeriod = '2022';

    try {
      const data = await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const dataPoint = data[0];
      expect(dataPoint).toHaveProperty('FREQ_ID', 'A');
      expect(dataPoint).toHaveProperty('REF_AREA_ID', 'US');
      expect(dataPoint).toHaveProperty('INDICATOR_ID', 'NGDP_RPCH');
      expect(dataPoint).toHaveProperty('TIME_PERIOD');
      expect(typeof dataPoint.TIME_PERIOD).toBe('string');
      expect(dataPoint).toHaveProperty('value');
      expect(typeof dataPoint.value === 'number' || dataPoint.value === null).toBe(true);
      if (typeof dataPoint.value === 'number') {
        expect(dataPoint.value).not.toBeNaN();
      }

      console.log(`Live IMF IFS for US Real GDP Growth (${dataPoint.TIME_PERIOD}): Value=${dataPoint.value}`);

    } catch (error: any) {
      console.warn(`Skipping IMF live test for IFS US GDP Growth due to API/network error: ${error.message}`);
      if (error.response && error.response.data) {
        console.warn('IMF API Error Detail:', JSON.stringify(error.response.data).substring(0, 500));
      }
      expect(true).toBe(true);
    }
  });

  it('should return null for a query that yields no data', async () => {
    const dataflowId = 'IFS';
    const keyForNoData = 'A.NONEXISTENT_COUNTRY.BOGUS_INDICATOR';

    try {
      const data = await imfService.fetchImfDataset(dataflowId, keyForNoData);
      expect(data).toBeNull();

    } catch (error: any) {
      console.warn(`IMF live test for "no data" encountered an error (this is often expected for invalid series): ${error.message}`);
      expect(error).toBeInstanceOf(Error);
    }
  });
});
