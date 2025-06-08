export interface CacheStatus {
  hits: number;
  misses: number;
  size: number; // e.g., number of items or MB
  lastRefreshed: Date | null;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live in milliseconds
}

export interface PersistenceOptions {
  filePath: string; // For JSON file persistence
  // Add other options for SQLite if needed
}
