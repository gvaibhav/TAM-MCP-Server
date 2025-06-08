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
    MockPersistenceService.mockClear(); // Clears all instances and calls to constructor and all methods.
    mockPersistenceServiceInstance = new MockPersistenceService() as jest.Mocked<PersistenceService>;
    cacheService = new CacheService(mockPersistenceServiceInstance);

    // Mock Date.now() for consistent TTL checks for all tests in this describe block
    global.Date.now = jest.fn(() => 10000); // A fixed point in time
    // Mock `new Date()` constructor to return a fixed date if it's used for `lastRefreshed`
    global.Date = class extends RealDate {
      constructor() {
        super();
        return new RealDate(RealDate.now()); // Use the mocked Date.now()
      }
      static now() {
        return RealDate.now(); // Ensure static now() also uses the mocked one
      }
    } as any;

  });

  afterEach(() => {
    global.Date = RealDate; // Restore Date to its original real implementation
     // This ensures that if any other test suite uses Date, it's not affected.
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

    // This test was already quite good, minor refinement for clarity on internal state check.
    it('should return null, remove from memory and persistence if in-memory data is expired, and not in persistence for reload', async () => {
      // Date.now() is 10000
      await cacheService.set('key1', 'data1', 500); // Expires at 10500

      // Advance time so item is expired
      global.Date.now = jest.fn(() => 11000); // Current time is 11000, after expiry

      mockPersistenceServiceInstance.load.mockResolvedValue(null); // Simulate not in persistence for the reload attempt
      mockPersistenceServiceInstance.remove.mockResolvedValue(undefined); // Mock remove op

      const data = await cacheService.get<string>('key1');

      expect(data).toBeNull(); // Expired and not reloaded from persistence
      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('key1'); // Called due to in-memory expiry
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('key1'); // Attempted reload
      expect(cacheService.getStats().misses).toBe(1);

      // Verify it's no longer in the in-memory map
      // getEntry will try persistence again. Ensure load returns null for this check.
      mockPersistenceServiceInstance.load.mockResolvedValue(null);
      const entryAfterExpiry = await cacheService.getEntry('key1');
      expect(entryAfterExpiry).toBeNull();
    });

    it('should load from persistence if not in memory and persistence has valid data', async () => {
      // Date.now() is 10000
      const persistedEntry: CacheEntry<string> = { data: 'persistedData', timestamp: 9000, ttl: 2000 }; // Valid until 11000
      mockPersistenceServiceInstance.load.mockResolvedValue(persistedEntry);

      const data = await cacheService.get<string>('keyNonMemory');
      expect(data).toBe('persistedData');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyNonMemory');
      expect(cacheService.getStats().hits).toBe(1);

      // Ensure it's now in memory by calling get again (should not call persistence.load)
      const memoryData = await cacheService.get<string>('keyNonMemory');
      expect(memoryData).toBe('persistedData');
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledTimes(1);
    });

    it('should return null and remove from persistence if loaded persistence data is expired', async () => {
      // Date.now() is 10000
      const persistedEntry: CacheEntry<string> = { data: 'persistedData', timestamp: 8000, ttl: 1000 }; // Expired at 9000
      mockPersistenceServiceInstance.load.mockResolvedValue(persistedEntry);
      mockPersistenceServiceInstance.remove.mockResolvedValue(undefined);

      const data = await cacheService.get<string>('keyExpiredPersistence');
      expect(data).toBeNull();
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith('keyExpiredPersistence');
      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith('keyExpiredPersistence');
      expect(cacheService.getStats().misses).toBe(1);
    });

    it('should return null if not in memory and not in persistence', async () => {
        mockPersistenceServiceInstance.load.mockResolvedValue(null);
        const data = await cacheService.get<string>('keyNotFound');
        expect(data).toBeNull();
        expect(cacheService.getStats().misses).toBe(1);
    });
  });


  describe('get (with focus on internal map cleaning)', () => {
    it('should remove expired item from in-memory map and persistence when accessed via get()', async () => {
      // mockPersistenceServiceInstance and cacheService are fresh due to top-level beforeEach
      const key = 'expiredKeyInternal';
      const originalData = 'expiredData';

      // Date.now() is 10000
      await cacheService.set(key, originalData, 100); // Expires at 10100
      expect(mockPersistenceServiceInstance.save).toHaveBeenCalledTimes(1);

      // Verify it's in cache initially by checking getEntry (which reads from memory first)
      let entry = await cacheService.getEntry(key);
      expect(entry?.data).toBe(originalData);

      // Advance time so item is expired
      global.Date.now = jest.fn(() => 10200); // Now > 10100

      // Mock persistence interactions for the 'get' call
      mockPersistenceServiceInstance.load.mockResolvedValue(null);
      mockPersistenceServiceInstance.remove.mockResolvedValue(undefined);

      const data = await cacheService.get<string>(key); // This should trigger expiry
      expect(data).toBeNull();

      expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith(key); // Removed from persistence
      expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith(key); // Attempted to load after in-memory expiry

      // Verify it's no longer in the in-memory map.
      // getEntry first checks memory, then persistence.
      // Since persistenceService.load is already mocked to return null for this key,
      // if the item is also gone from memory, getEntry will return null.
      entry = await cacheService.getEntry(key);
      expect(entry).toBeNull();

      expect(cacheService.getStats().misses).toBe(1); // The get() call was a miss
    });

    it('should remove from persistence if loaded entry is expired', async () => {
        // mockPersistenceServiceInstance and cacheService are fresh
        const key = 'persistedExpiredKey';
        // Date.now() is 10000
        const expiredPersistedEntry: CacheEntry<string> = { data: 'oldData', timestamp: 8000, ttl: 1000 }; // Expired at 9000

        mockPersistenceServiceInstance.load.mockResolvedValue(expiredPersistedEntry);
        mockPersistenceServiceInstance.remove.mockResolvedValue(undefined);

        const data = await cacheService.get<string>(key);
        expect(data).toBeNull();
        expect(mockPersistenceServiceInstance.load).toHaveBeenCalledWith(key);
        expect(mockPersistenceServiceInstance.remove).toHaveBeenCalledWith(key);
        expect(cacheService.getStats().misses).toBe(1);

        // Verify it's not in memory either and won't be loaded again if load now returns null
        mockPersistenceServiceInstance.load.mockResolvedValue(null);
        const entry = await cacheService.getEntry(key);
        expect(entry).toBeNull();
    });
  });

  describe('set', () => {
    it('should store data in memory and call persistenceService.save', async () => {
      // Date.now() is 10000
      await cacheService.set('key2', 'data2', 2000);
      const expectedEntry: CacheEntry<string> = { data: 'data2', timestamp: 10000, ttl: 2000 };

      // Verify in-memory presence (indirectly via get, which will hit memory if valid)
      const data = await cacheService.get<string>('key2');
      expect(data).toBe('data2');
      expect(mockPersistenceServiceInstance.save).toHaveBeenCalledWith('key2', expectedEntry);
      expect(cacheService.getStats().size).toBe(1);
      expect(cacheService.getStats().lastRefreshed).toEqual(new Date(10000)); // new Date(10000) due to mock
    });
  });

  describe('clear', () => {
    it('should remove data from memory and call persistenceService.remove', async () => {
      await cacheService.set('key3', 'data3', 1000);
      expect(cacheService.getStats().size).toBe(1);
      await cacheService.clear('key3');

      // Verify removed from memory (getEntry checks memory first)
      mockPersistenceServiceInstance.load.mockResolvedValue(null); // Ensure persistence also appears empty
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

      global.Date.now = jest.fn(() => 10200); // Advance time past expiry for memory check
      const entry = await cacheService.getEntry<string>('keyEntry'); // getEntry does not check TTL itself
      expect(entry).toEqual({ data: 'dataEntry', timestamp: 10000, ttl: 100 });
    });

    it('should return full entry from persistence if not in memory, regardless of TTL', async () => {
      // Date.now() is 10000
      const persistedEntry: CacheEntry<string> = { data: 'persistedEntryData', timestamp: 9000, ttl: 500 }; // Expired at 9500
      mockPersistenceServiceInstance.load.mockResolvedValue(persistedEntry);

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
