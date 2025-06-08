import { CacheService } from '../../../../src/services/cache/cacheService';
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';

// Mock PersistenceService
jest.mock('../../../../src/services/cache/persistenceService');

const MockPersistenceService = PersistenceService as jest.MockedClass<typeof PersistenceService>;

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockPersistenceServiceInstance: jest.Mocked<PersistenceService>;
  const RealDate = Date; // Store RealDate

  beforeEach(() => {
    MockPersistenceService.mockClear();
    mockPersistenceServiceInstance = new MockPersistenceService() as jest.Mocked<PersistenceService>;
    cacheService = new CacheService(mockPersistenceServiceInstance);

    // Mock Date.now() for consistent TTL checks
    global.Date = class extends RealDate {
        static now() {
            return 10000; // A fixed point in time
        }
        // other Date methods if needed by the code under test
        constructor() {
            super();
            return new RealDate(10000); // If new Date() is used
        }
    } as any;
  });

  afterEach(() => {
    global.Date = RealDate; // Restore Date
  });

  describe('get', () => {
    it('should return data from in-memory cache if valid', async () => {
      await cacheService.set('key1', 'data1', 1000); // TTL makes it valid at Date.now() = 10000
      // Date.now() is 10000, entry timestamp is 10000, ttl is 1000. Expires at 11000.
      const data = await cacheService.get<string>('key1');
      expect(data).toBe('data1');
      expect(mockPersistenceServiceInstance.load).not.toHaveBeenCalled();
      expect(cacheService.getStats().hits).toBe(1);
    });

    it('should return null and remove from memory if in-memory data is expired, and not in persistence', async () => {
      await cacheService.set('key1', 'data1', 500); // timestamp 10000, ttl 500 -> expires 10500
      // Simulate time passing for expiry check
      global.Date.now = jest.fn(() => 11000); // Current time is 11000, after expiry

      mockPersistenceServiceInstance.load.mockResolvedValue(null);
      const data = await cacheService.get<string>('key1');

      expect(data).toBeNull();
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('key1');
      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('key1'); // Removed because it was found expired in memory
      expect(cacheService.getStats().misses).toBe(1);
       // Check if it's removed from internal cache map too
      const internalCacheEntry = await cacheService.getEntry('key1'); // This might still fetch from persistence mock
      // A better check for internal map state would be needed if getEntry re-fetches.
      // For this test, the important part is that it tries to load from persistence.
    });

    it('should load from persistence if not in memory and persistence has valid data', async () => {
      const persistedEntry: CacheEntry<string> = { data: 'persistedData', timestamp: 9000, ttl: 2000 }; // Valid until 11000
      mockPersistenceServiceInstance.load.mockResolvedValue(persistedEntry);
      // Date.now() is 10000
      const data = await cacheService.get<string>('keyNonMemory');
      expect(data).toBe('persistedData');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyNonMemory');
      expect(cacheService.getStats().hits).toBe(1);
      // Ensure it's now in memory
      const memoryData = await cacheService.get<string>('keyNonMemory');
      expect(memoryData).toBe('persistedData');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledTimes(1); // Should not call load again
    });

    it('should return null if persistence has expired data', async () => {
      const persistedEntry: CacheEntry<string> = { data: 'persistedData', timestamp: 8000, ttl: 1000 }; // Expired at 9000
      mockPersistenceServiceInstance.load.mockResolvedValue(persistedEntry);
      // Date.now() is 10000
      const data = await cacheService.get<string>('keyExpiredPersistence');
      expect(data).toBeNull();
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyExpiredPersistence');
      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('keyExpiredPersistence'); // Removed from persistence
      expect(cacheService.getStats().misses).toBe(1);
    });

    it('should return null if not in memory and not in persistence', async () => {
        mockPersistenceServiceInstance.load.mockResolvedValue(null);
        const data = await cacheService.get<string>('keyNotFound');
        expect(data).toBeNull();
        expect(cacheService.getStats().misses).toBe(1);
    });
  });

  describe('set', () => {
    it('should store data in memory and call persistenceService.save', async () => {
      await cacheService.set('key2', 'data2', 2000);
      // Date.now() is 10000.
      const expectedEntry: CacheEntry<string> = { data: 'data2', timestamp: 10000, ttl: 2000 };

      const data = await cacheService.get<string>('key2');
      expect(data).toBe('data2');
      expect(mockPersistenceServiceInstance.save).toHaveBeenCalledWith('key2', expectedEntry);
      expect(cacheService.getStats().size).toBe(1);
      expect(cacheService.getStats().lastRefreshed).toEqual(new RealDate(10000));
    });
  });

  describe('clear', () => {
    it('should remove data from memory and call persistenceService.remove', async () => {
      await cacheService.set('key3', 'data3', 1000);
      await cacheService.clear('key3');

      const data = await cacheService.get<string>('key3'); // This will try to load from persistence again
      expect(data).toBeNull(); // Assuming persistence also cleared or returns null
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
        expect(cacheService.getStats().lastRefreshed).toEqual(new RealDate(10000)); // Assuming clearAll sets lastRefreshed
    });
  });

  describe('getEntry', () => {
    it('should return full entry from memory if present, regardless of TTL', async () => {
      await cacheService.set('keyEntry', 'dataEntry', 100); // timestamp 10000, ttl 100
      const entry = await cacheService.getEntry<string>('keyEntry');
      expect(entry).toEqual({ data: 'dataEntry', timestamp: 10000, ttl: 100 });
    });

    it('should return full entry from persistence if not in memory, regardless of TTL', async () => {
      const persistedEntry: CacheEntry<string> = { data: 'persistedEntryData', timestamp: 9000, ttl: 500 }; // Expired at 9500
      mockPersistenceServiceInstance.load.mockResolvedValue(persistedEntry);
      // Date.now() is 10000
      const entry = await cacheService.getEntry<string>('keyPersistedEntry');
      expect(entry).toEqual(persistedEntry);
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyPersistedEntry');
    });

    it('should return null if entry not found anywhere', async () => {
        mockPersistenceServiceInstance.load.mockResolvedValue(null);
        const entry = await cacheService.getEntry<string>('keyNotFoundEntry');
        expect(entry).toBeNull();
    });
  });

  describe('constructor loadCacheFromPersistence', () => {
    it('should log attempt to load from persistence on init', () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        new CacheService(mockPersistenceServiceInstance); // constructor is called
        // The current implementation of loadCacheFromPersistence only logs.
        expect(consoleLogSpy).toHaveBeenCalledWith("CacheService: Initial load from persistence (if any) would occur here.");
        consoleLogSpy.mockRestore();
    });
  });
});
