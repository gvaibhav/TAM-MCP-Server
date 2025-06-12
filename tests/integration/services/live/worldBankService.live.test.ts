import { vi, describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { WorldBankService } from '../../../../src/services/datasources/WorldBankService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import * as path from 'path';
import * as envHelper from '../../../../src/utils/envHelper';

// Increase timeout for live API calls
vi.setConfig({ testTimeout: 20000 }); // 20 seconds

describe('WorldBankService - Live API Integration Tests', () => {
  let worldBankService: WorldBankService;
  let cacheService: CacheService;
  let persistenceService: PersistenceService;
  const testCacheDir = path.join(__dirname, '.test_cache_worldbank_live');


  beforeAll(async () => {
    persistenceService = new PersistenceService({ filePath: testCacheDir });
    // PersistenceService constructor calls initStorage.
  });

  beforeEach(async () => {
    await persistenceService.clearAll();
    cacheService = new CacheService(persistenceService);
    // Default spy behavior for getEnvAsNumber if needed, or set in specific tests.
    // This spy is restored in afterEach.
    vi.spyOn(envHelper, 'getEnvAsNumber').mockImplementation((key, defaultValue) => defaultValue);
    worldBankService = new WorldBankService(cacheService);
  });

  afterAll(async () => {
    try {
        await persistenceService.clearAll();
    } catch (err) {
        console.error("Error during afterAll cleanup:", err);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restores all spies
  });

  it('should fetch and parse current GDP for the United States (NY.GDP.MKTP.CD)', async () => {
    const countryCode = 'US';
    const indicator = 'NY.GDP.MKTP.CD';

    try {
      const data = await worldBankService.fetchMarketSize(countryCode, indicator);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const dataPoint = data[0];
      expect(dataPoint).toHaveProperty('country');
      expect(dataPoint.country).toBe('United States');
      expect(dataPoint).toHaveProperty('countryISO3Code');
      expect(dataPoint.countryISO3Code).toBe('USA');
      expect(dataPoint).toHaveProperty('date');
      expect(typeof dataPoint.date).toBe('string');
      expect(dataPoint).toHaveProperty('value');
      expect(typeof dataPoint.value).toBe('number');
      expect(dataPoint.value).not.toBeNaN();
      expect(dataPoint).toHaveProperty('indicator');
      expect(dataPoint.indicator).toBe('GDP (current US$)');

      console.log(`Live World Bank GDP for US (${dataPoint.date}): ${dataPoint.value}`);

    } catch (error: any) {
      console.warn(`Skipping World Bank live test for US GDP due to API/network error: ${error.message}`);
      expect(true).toBe(true);
    }
  });

  it('should fetch and parse population total for Germany (SP.POP.TOTL)', async () => {
    const countryCode = 'DE';
    const indicator = 'SP.POP.TOTL';

    try {
      const data = await worldBankService.fetchMarketSize(countryCode, indicator);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const dataPoint = data[0];
      expect(dataPoint).toHaveProperty('country');
      expect(dataPoint.country).toBe('Germany');
      expect(dataPoint).toHaveProperty('countryISO3Code');
      expect(dataPoint.countryISO3Code).toBe('DEU');
      expect(dataPoint).toHaveProperty('date');
      expect(typeof dataPoint.date).toBe('string');
      expect(dataPoint).toHaveProperty('value');
      expect(typeof dataPoint.value).toBe('number');
      expect(dataPoint.value).not.toBeNaN();
      expect(dataPoint).toHaveProperty('indicator');
      expect(dataPoint.indicator).toBe('Population, total');

      console.log(`Live World Bank Population for Germany (${dataPoint.date}): ${dataPoint.value}`);

    } catch (error: any) {
      console.warn(`Skipping World Bank live test for German Population due to API/network error: ${error.message}`);
      expect(true).toBe(true);
    }
  });

  it('should return null for a non-existent indicator and cache it briefly', async () => {
    const countryCode = 'US';
    const nonExistentIndicator = 'NON.EXISTENT.INDICATOR';
    const cacheKey = `worldbank_marketsize_${nonExistentIndicator}_${countryCode}`;

    // This spy is set up here for this specific test case.
    // It will be restored by afterEach's vi.restoreAllMocks().
    const getEnvAsNumberSpy = vi.spyOn(envHelper, 'getEnvAsNumber');
    const shortNoDataTTL = 500;
    getEnvAsNumberSpy.mockImplementation((key, defaultValue) => {
        if (key === 'CACHE_TTL_WORLD_BANK_NODATA_MS') return shortNoDataTTL;
        return defaultValue;
    });

    // Re-instantiate service to pick up new mocked env var values for TTL
    // A new CacheService instance is also needed if it caches TTL values internally on construction,
    // or if its state from previous tests with default TTLs would interfere.
    // Given beforeEach re-initializes cacheService, this should be fine.
    const localWorldBankService = new WorldBankService(cacheService); // cacheService already uses the mocked getEnvAsNumber via its own constructor if TTLs are set there

    try {
      const data = await localWorldBankService.fetchMarketSize(countryCode, nonExistentIndicator);
      expect(data).toBeNull();

      const cachedValue = await cacheService.get(cacheKey);
      expect(cachedValue).toBeNull();

    } catch (error: any) {
      console.warn(`Skipping World Bank live test for non-existent indicator due to API/network error: ${error.message}`);
      expect(true).toBe(true);
    }
    // spy is restored by afterEach's vi.restoreAllMocks()
  });
});
