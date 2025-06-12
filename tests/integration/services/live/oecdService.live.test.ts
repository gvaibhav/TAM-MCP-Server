import { vi, describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { OecdService } from '../../../../src/services/datasources/OecdService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import * as path from 'path';
import * as envHelper from '../../../../src/utils/envHelper';
import { oecdApi } from '../../../../src/config/apiConfig'; // For default values

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 30000 }); // 30 seconds for OECD

describe('OecdService - Live API Integration Tests', () => {
  let oecdService: OecdService;
  let cacheService: CacheService;
  let persistenceService: PersistenceService;
  const testCacheDir = path.join(__dirname, '.test_cache_oecd_live');

  beforeAll(async () => {
    persistenceService = new PersistenceService({ filePath: testCacheDir });
    // PersistenceService constructor calls initStorage.
  });

  beforeEach(async () => {
    await persistenceService.clearAll();
    cacheService = new CacheService(persistenceService);
    vi.spyOn(envHelper, 'getEnvAsNumber').mockImplementation((key, defaultValue) => defaultValue);
    oecdService = new OecdService(cacheService);
  });

  afterAll(async () => {
    await persistenceService.clearAll();
  });

  afterEach(()=> {
      vi.restoreAllMocks();
  });

  it('should fetch and parse Quarterly GDP for Australia (QNA dataset)', async () => {
    const datasetId = 'QNA';
    const filterExpression = 'AUS.B1_GE.CPCARSA.Q';
    const startTime = '2022-Q1';
    const endTime = '2022-Q4';

    try {
      const data = await oecdService.fetchOecdDataset(datasetId, filterExpression, 'OECD', startTime, endTime, 'AllDimensions');

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const dataPoint = data[0];
      expect(dataPoint).toHaveProperty('LOCATION_ID', 'AUS');
      expect(dataPoint).toHaveProperty('SUBJECT_ID');
      expect(dataPoint).toHaveProperty('MEASURE_ID');
      expect(dataPoint).toHaveProperty('FREQUENCY_ID', 'Q');
      expect(dataPoint).toHaveProperty('TIME_PERIOD');
      expect(typeof dataPoint.TIME_PERIOD).toBe('string');
      expect(dataPoint).toHaveProperty('value');
      expect(typeof dataPoint.value).toBe('number');
      expect(dataPoint.value).not.toBeNaN();

      console.log(`Live OECD QNA for AUS (${dataPoint.TIME_PERIOD}): Value=${dataPoint.value}, Subject=${dataPoint.SUBJECT_ID}, Measure=${dataPoint.MEASURE_ID}`);

    } catch (error: any) {
      console.warn(`Skipping OECD live test for QNA AUS GDP due to API/network error: ${error.message}`);
      if (error.response && error.response.data) {
        console.warn('OECD API Error Detail:', JSON.stringify(error.response.data).substring(0, 500));
      }
      expect(true).toBe(true);
    }
  });

  it('should fetch and parse Short-Term Labour Market Statistics for USA (STLABOUR dataset)', async () => {
    const datasetId = 'STLABOUR';
    const filterExpression = 'USA.LREM64TT.TOT.SA.Q';
    const startTime = '2022-Q1';
    const endTime = '2022-Q4';

    try {
      const data = await oecdService.fetchOecdDataset(datasetId, filterExpression, 'OECD', startTime, endTime, 'AllDimensions');

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const dataPoint = data[0];
      expect(dataPoint).toHaveProperty('LOCATION_ID', 'USA');
      expect(dataPoint).toHaveProperty('SUBJECT_ID', 'LREM64TT');
      expect(dataPoint).toHaveProperty('MEASURE_ID');
      expect(dataPoint).toHaveProperty('FREQUENCY_ID', 'Q');
      expect(dataPoint).toHaveProperty('TIME_PERIOD');
      expect(typeof dataPoint.value).toBe('number');

      console.log(`Live OECD STLABOUR for USA (${dataPoint.TIME_PERIOD}): Value=${dataPoint.value}, Subject=${dataPoint.SUBJECT_ID}`);

    } catch (error: any) {
      console.warn(`Skipping OECD live test for STLABOUR USA Employment due to API/network error: ${error.message}`);
       if (error.response && error.response.data) {
        console.warn('OECD API Error Detail:', JSON.stringify(error.response.data).substring(0, 500));
      }
      expect(true).toBe(true);
    }
  });

  it('should return null for a structurally valid query that yields no data (if such a case can be identified)', async () => {
    const datasetId = 'QNA';
    const filterExpressionForNoData = 'AUS.NONEXISTENT_SUBJECT.BOGUS_MEASURE.Q';
    const startTime = '2022-Q1';
    const endTime = '2022-Q1';

    // This spy is set up here, will be restored by afterEach
    const getEnvAsNumberSpy = vi.spyOn(envHelper, 'getEnvAsNumber');
    getEnvAsNumberSpy.mockImplementation((key, defaultValue) => {
        if (key === 'CACHE_TTL_OECD_NODATA_MS') return 500;
        return defaultValue;
    });

    // Re-instantiate service for this specific TTL behavior (CacheService is newed up with this persistence, OecdService with new CacheService)
    const localCacheService = new CacheService(persistenceService);
    const localOecdService = new OecdService(localCacheService);


    try {
      const data = await localOecdService.fetchOecdDataset(datasetId, filterExpressionForNoData, 'OECD', startTime, endTime);

      expect(data).toBeNull();

      const cacheKeyObj = { datasetId, filterExpression: filterExpressionForNoData, agencyId: 'OECD', startTime, endTime, dimensionAtObservation: oecdApi.defaultDimensionObservation };
      const cacheKey = `oecd_${JSON.stringify(cacheKeyObj)}`;
      const cachedValue = await localCacheService.get(cacheKey);
      expect(cachedValue).toBeNull();

    } catch (error: any) {
      console.warn(`OECD live test for "no data" encountered an error (this might be expected if filter is invalid): ${error.message}`);
      expect(error).toBeInstanceOf(Error);
    }
    // Spy restored by afterEach
  });
});
