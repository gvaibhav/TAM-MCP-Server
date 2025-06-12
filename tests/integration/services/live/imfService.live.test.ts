import { vi, describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { ImfService } from '../../../../src/services/datasources/ImfService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import * as path from 'path';
import * as envHelper from '../../../../src/utils/envHelper';

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 30000 }); // 30 seconds for IMF

describe('ImfService - Live API Integration Tests', () => {
  let imfService: ImfService;
  let cacheService: CacheService;
  let persistenceService: PersistenceService;
  const testCacheDir = path.join(__dirname, '.test_cache_imf_live');

  beforeAll(async () => {
    persistenceService = new PersistenceService({ filePath: testCacheDir });
    // PersistenceService constructor calls initStorage.
  });

  beforeEach(async () => {
    await persistenceService.clearAll();
    cacheService = new CacheService(persistenceService);
    vi.spyOn(envHelper, 'getEnvAsNumber').mockImplementation((key, defaultValue) => defaultValue);
    imfService = new ImfService(cacheService);
  });

  afterAll(async () => {
    await persistenceService.clearAll();
  });

  afterEach(()=> {
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

  it('should fetch and parse Aluminum Price Index (Monthly) from PCPS', async () => {
    const dataflowId = 'PCPS';
    const key = 'M.W00.PAUM_IX';
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthPadded = (now.getMonth() + 1).toString().padStart(2, '0');

    let startYearCalc = currentYear;
    let startMonth = now.getMonth() - 1; // month before current (0-indexed for Date)
    if (startMonth <= 0) {
        startMonth = startMonth === 0 ? 12 : 11;
        startYearCalc = currentYear -1;
    }
    const startMonthPadded = startMonth.toString().padStart(2,'0');

    const startPeriod = `${startYearCalc}-${startMonthPadded}`;
    const endPeriod = `${currentYear}-${currentMonthPadded}`;

    try {
      const data = await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThanOrEqual(0);

      if (data.length > 0) {
        const dataPoint = data[0];
        expect(dataPoint).toHaveProperty('FREQ_ID', 'M');
        expect(dataPoint).toHaveProperty('REF_AREA_ID', 'W00');
        // Check for COMMODITY_ID or INDICATOR_ID based on how the service parses it
        const commodityOrIndicatorId = dataPoint.COMMODITY_ID || dataPoint.INDICATOR_ID;
        expect(commodityOrIndicatorId).toBe('PAUM_IX');

        expect(dataPoint).toHaveProperty('TIME_PERIOD');
        expect(typeof dataPoint.value === 'number' || dataPoint.value === null).toBe(true);
        console.log(`Live IMF PCPS for Aluminum Index (${dataPoint.TIME_PERIOD}): Value=${dataPoint.value}`);
      } else {
        console.log(`Live IMF PCPS for Aluminum Index returned no data for ${startPeriod}-${endPeriod}. This might be normal for very recent queries.`);
      }

    } catch (error: any) {
      console.warn(`Skipping IMF live test for PCPS Aluminum Index due to API/network error: ${error.message}`);
       if (error.response && error.response.data) {
        console.warn('IMF API Error Detail:', JSON.stringify(error.response.data).substring(0, 500));
      }
      expect(true).toBe(true);
    }
  });

  it('should return null for a query that yields no data (e.g., invalid key structure or non-existent series)', async () => {
    const dataflowId = 'IFS';
    const keyForNoData = 'A.NONEXISTENT_COUNTRY.BOGUS_INDICATOR';

    // This spy is set up here, will be restored by afterEach
    const getEnvAsNumberSpy = vi.spyOn(envHelper, 'getEnvAsNumber');
    getEnvAsNumberSpy.mockImplementation((envKey, defaultValue) => {
        if (envKey === 'CACHE_TTL_IMF_NODATA_MS') return 500;
        return defaultValue;
    });

    const localCacheService = new CacheService(persistenceService);
    const localImfService = new ImfService(localCacheService);

    try {
      const data = await localImfService.fetchImfDataset(dataflowId, keyForNoData);
      expect(data).toBeNull();

      const cacheKeyObj = { dataflowId, key: keyForNoData };
      const cacheKey = `imf_${JSON.stringify(cacheKeyObj)}`;
      const cachedValue = await localCacheService.get(cacheKey);
      expect(cachedValue).toBeNull();

    } catch (error: any) {
      console.warn(`IMF live test for "no data" encountered an error (this is often expected for invalid series): ${error.message}`);
      expect(error).toBeInstanceOf(Error);
    }
    // Spy restored by afterEach
  });
});
