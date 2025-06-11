import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';

// Mock PersistenceService using Vitest
vi.mock('../../../../src/services/cache/persistenceService');

const MockedPersistenceService = PersistenceService as unknown as ReturnType<typeof vi.fn>; // Get the mocked constructor

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockPersistenceServiceInstance: InstanceType<typeof PersistenceService>; // Instance type from the original class

  beforeEach(() => {
    vi.useFakeTimers(); // Use fake timers for Date control
    vi.setSystemTime(10000); // Set a fixed point in time for Date.now() and new Date()

    // Reset the mock constructor and its instances before each test
    vi.mocked(MockedPersistenceService).mockClear();

    // Create a new mock instance for each test
    // Since PersistenceService is vi.mocked, new PersistenceService() returns a mocked instance.
    // Its methods will be vi.fn() by default.
    mockPersistenceServiceInstance = new MockedPersistenceService() as InstanceType<typeof PersistenceService>;

    cacheService = new CacheService(mockPersistenceServiceInstance);
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers
    vi.resetAllMocks(); // Good practice to reset all mocks including spies
  });

  describe('get', () => {
    it('should return data from in-memory cache if valid', async () => {
      // Date.now() is 10000
      await cacheService.set('key1', 'data1', 1000); // Set with timestamp 10000, expires at 11000
      const data = await cacheService.get<string>('key1');
      expect(data).toBe('data1');
      expect(mockPersistenceServiceInstance.load).not.toHaveBeenCalled();
      expect(cacheService.getStats().hits).toBe(1);
    });

    it('should return null, remove from memory and persistence if in-memory data is expired, and not in persistence for reload', async () => {
      // Date.now() is 10000
      await cacheService.set('key1', 'data1', 500); // Expires at 10500

      vi.setSystemTime(11000); // Advance time so item is expired

      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
      vi.mocked(mockPersistenceServiceInstance.remove).mockResolvedValue(undefined);

      const data = await cacheService.get<string>('key1');

      expect(data).toBeNull();
      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('key1');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('key1');
      expect(cacheService.getStats().misses).toBe(1);

      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
      const entryAfterExpiry = await cacheService.getEntry('key1');
      expect(entryAfterExpiry).toBeNull();
    });

    it('should load from persistence if not in memory and persistence has valid data', async () => {
      // Date.now() is 10000
      const persistedEntry: CacheEntry<string> = { data: 'persistedData', timestamp: 9000, ttl: 2000 }; // Valid until 11000
      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(persistedEntry);

      const data = await cacheService.get<string>('keyNonMemory');
      expect(data).toBe('persistedData');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyNonMemory');
      expect(cacheService.getStats().hits).toBe(1);

      const memoryData = await cacheService.get<string>('keyNonMemory');
      expect(memoryData).toBe('persistedData');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledTimes(1);
    });

    it('should return null and remove from persistence if loaded persistence data is expired', async () => {
      // Date.now() is 10000
      const persistedEntry: CacheEntry<string> = { data: 'persistedData', timestamp: 8000, ttl: 1000 }; // Expired at 9000
      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(persistedEntry);
      vi.mocked(mockPersistenceServiceInstance.remove).mockResolvedValue(undefined);

      const data = await cacheService.get<string>('keyExpiredPersistence');
      expect(data).toBeNull();
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyExpiredPersistence');
      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('keyExpiredPersistence');
      expect(cacheService.getStats().misses).toBe(1);
    });

    it('should return null if not in memory and not in persistence', async () => {
        vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
        const data = await cacheService.get<string>('keyNotFound');
        expect(data).toBeNull();
        expect(cacheService.getStats().misses).toBe(1);
    });
  });


  describe('get (with focus on internal map cleaning)', () => {
    it('should remove expired item from in-memory map and persistence when accessed via get()', async () => {
      const key = 'expiredKeyInternal';
      const originalData = 'expiredData';

      // Date.now() is 10000
      await cacheService.set(key, originalData, 100); // Expires at 10100
      expect(mockPersistenceServiceInstance.save).toHaveBeenCalledTimes(1);

      let entry = await cacheService.getEntry(key);
      expect(entry?.data).toBe(originalData);

      vi.setSystemTime(10200); // Now > 10100

      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
      vi.mocked(mockPersistenceServiceInstance.remove).mockResolvedValue(undefined);

      const data = await cacheService.get<string>(key);
      expect(data).toBeNull();

      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith(key);
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith(key);

      entry = await cacheService.getEntry(key);
      expect(entry).toBeNull();

      expect(cacheService.getStats().misses).toBe(1);
    });

    it('should remove from persistence if loaded entry is expired', async () => {
        const key = 'persistedExpiredKey';
        // Date.now() is 10000
        const expiredPersistedEntry: CacheEntry<string> = { data: 'oldData', timestamp: 8000, ttl: 1000 }; // Expired at 9000

        vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(expiredPersistedEntry);
        vi.mocked(mockPersistenceServiceInstance.remove).mockResolvedValue(undefined);

        const data = await cacheService.get<string>(key);
        expect(data).toBeNull();
        expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith(key);
        expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith(key);
        expect(cacheService.getStats().misses).toBe(1);

        vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
        const entry = await cacheService.getEntry(key);
        expect(entry).toBeNull();
    });
  });

  describe('set', () => {
    it('should store data in memory and call persistenceService.save', async () => {
      // Date.now() is 10000
      await cacheService.set('key2', 'data2', 2000);
      const expectedEntry: CacheEntry<string> = { data: 'data2', timestamp: 10000, ttl: 2000 };

      const data = await cacheService.get<string>('key2');
      expect(data).toBe('data2');
      expect(mockPersistenceServiceInstance.save).toHaveBeenCalledWith('key2', expectedEntry);
      expect(cacheService.getStats().size).toBe(1);
      expect(cacheService.getStats().lastRefreshed).toEqual(new Date(10000));
    });
  });

  describe('clear', () => {
    it('should remove data from memory and call persistenceService.remove', async () => {
      await cacheService.set('key3', 'data3', 1000);
      expect(cacheService.getStats().size).toBe(1);
      await cacheService.clear('key3');

      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
      const entry = await cacheService.getEntry('key3');
      expect(entry).toBeNull();

      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('key3');
      expect(cacheService.getStats().size).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all in-memory cache and call persistenceService.clearAll', async () => {
        await cacheService.set('key1', 'data1', 100);
        await cacheService.set('key2', 'data2', 100);
        expect(cacheService.getStats().size).toBe(2);

        await cacheService.clearAll();
        expect(cacheService.getStats().size).toBe(0);
        expect(mockPersistenceServiceInstance.clearAll).toHaveBeenCalled();
        expect(cacheService.getStats().lastRefreshed).toEqual(new Date(10000));
    });
  });

  describe('getEntry', () => {
    it('should return full entry from memory if present, regardless of TTL', async () => {
      // Date.now() is 10000
      await cacheService.set('keyEntry', 'dataEntry', 100); // Expires 10100

      vi.setSystemTime(10200); // Advance time past expiry for memory check
      const entry = await cacheService.getEntry<string>('keyEntry');
      expect(entry).toEqual({ data: 'dataEntry', timestamp: 10000, ttl: 100 });
    });

    it('should return full entry from persistence if not in memory, regardless of TTL', async () => {
      // Date.now() is 10000
      const persistedEntry: CacheEntry<string> = { data: 'persistedEntryData', timestamp: 9000, ttl: 500 }; // Expired at 9500
      vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(persistedEntry);

      const entry = await cacheService.getEntry<string>('keyPersistedEntry');
      expect(entry).toEqual(persistedEntry);
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyPersistedEntry');
    });

    it('should return null if entry not found anywhere', async () => {
        vi.mocked(mockPersistenceServiceInstance.load).mockResolvedValue(null);
        const entry = await cacheService.getEntry<string>('keyNotFoundEntry');
        expect(entry).toBeNull();
    });
  });

  describe('constructor loadCacheFromPersistence', () => {
    it('should log attempt to load from persistence on init', () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        // The CacheService instance is created in beforeEach, which calls loadCacheFromPersistence
        // So, the spy should have been called by the time this test runs.
        // To be more precise, we could re-instantiate or check the call count from beforeEach.
        // For this specific test, let's ensure it's called at least once by the main beforeEach.
        expect(consoleLogSpy).toHaveBeenCalledWith("CacheService: Initial load from persistence (if any) would occur here.");
        consoleLogSpy.mockRestore();
    });
  });
});
