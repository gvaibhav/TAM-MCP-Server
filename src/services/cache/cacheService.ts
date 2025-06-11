import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { PersistenceService } from './persistenceService.js';

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private status: CacheStatus = { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  private persistenceService: PersistenceService;

  constructor(persistenceService: PersistenceService) {
    this.persistenceService = persistenceService;
    // Optionally, load persisted data on initialization
    this.loadCacheFromPersistence();
  }

  async get<T>(key: string): Promise<T | null> {
    let entry = this.cache.get(key);

    if (entry && (Date.now() < entry.timestamp + entry.ttl)) {
      this.status.hits++;
      return entry.data as T;
    } else if (entry) { // In-memory but expired
      this.cache.delete(key);
      await this.persistenceService.remove(key);
      entry = undefined; // Clear to proceed to persistence check
    }

    // Try loading from persistence layer if not in memory or expired in memory
    const persistedEntry = await this.persistenceService.load<T>(key);
    if (persistedEntry) {
      if (Date.now() < persistedEntry.timestamp + persistedEntry.ttl) {
        this.status.hits++;
        // Re-add to in-memory cache
        this.cache.set(key, persistedEntry);
        this.status.size = this.cache.size;
        return persistedEntry.data as T;
      } else {
        // Persisted but expired
        await this.persistenceService.remove(key);
      }
    }

    this.status.misses++;
    return null;
  }

  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (entry) {
      return entry as CacheEntry<T>;
    }
    // If not in memory, try to get from persistence without TTL check for inspection
    const persistedEntry = await this.persistenceService.load<T>(key); // This already returns CacheEntry<T> or null
    return persistedEntry;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = { data: value, timestamp: Date.now(), ttl };
    this.cache.set(key, entry);
    this.status.size = this.cache.size;
    await this.persistenceService.save(key, entry); // Persist the new entry
    this.status.lastRefreshed = new Date();
  }

  async clear(key: string): Promise<void> {
    this.cache.delete(key);
    await this.persistenceService.remove(key);
    this.status.size = this.cache.size;
  }

  async clearAll(): Promise<void> {
    this.cache.clear();
    await this.persistenceService.clearAll(); // Assuming persistence service has a clearAll
    this.status = { hits: 0, misses: 0, size: 0, lastRefreshed: new Date() };
  }

  getStats(): CacheStatus {
    return { ...this.status, size: this.cache.size };
  }

  private async loadCacheFromPersistence(): Promise<void> {
    // This method would iterate over keys known to be persisted or a manifest file
    // For simplicity, let's assume PersistenceService can provide all cached items
    // This is a complex part, highly dependent on PersistenceService's design
    // For now, we'll keep it simple and not auto-load all into memory to avoid memory bloat
    // Individual items are loaded on demand in get() if not in memory.
    // Use stderr for initialization logs to avoid contaminating stdout in STDIO transport
    console.error("💾 Cache: Persistence layer ready");
  }
}
