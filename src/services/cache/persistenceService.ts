import * as fs from 'fs/promises';
import * as path from 'path';
import { CacheEntry, PersistenceOptions } from '../../types/cache.js';

// Define a default path for storing cache files
const DEFAULT_CACHE_DIR = path.join(process.cwd(), '.cache_data');

export class PersistenceService {
  private storagePath: string;

  constructor(options?: PersistenceOptions) {
    this.storagePath = options?.filePath || DEFAULT_CACHE_DIR;
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create persistence storage directory:', error);
      // Depending on requirements, might throw error or handle differently
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to be a valid filename. Replace non-alphanumeric chars.
    // This is a basic sanitization. More robust handling might be needed.
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.storagePath, `${safeKey}.json`);
  }

  async save<T>(key: string, data: CacheEntry<T>): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to save data for key "${key}" to ${filePath}:`, error);
      // Optionally re-throw or handle as per error strategy
    }
  }

  async load<T>(key: string): Promise<CacheEntry<T> | null> { // Return CacheEntry<T>
    const filePath = this.getFilePath(key);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const entry = JSON.parse(fileContent) as CacheEntry<T>; // Already parses to CacheEntry

      // TTL check should ideally be in CacheService, Persistence just loads raw entry
      // if (entry && (Date.now() < entry.timestamp + entry.ttl)) {
      //   return entry; // Return the full entry
      // } else if (entry) {
      //   await this.remove(key); // Data found but expired
      //   return null;
      // }
      // return null;
      return entry; // Return entry, let CacheService decide on expiration
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error(`Failed to load data for key "${key}" from ${filePath}:`, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found, nothing to remove. Consider this a success or log if needed.
        return;
      }
      console.error(`Failed to remove data for key "${key}" from ${filePath}:`, error);
      // Optionally re-throw
    }
  }

  async clearAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.storagePath);
      for (const file of files) {
        await fs.unlink(path.join(this.storagePath, file));
      }
    } catch (error) {
      console.error('Failed to clear all persisted data:', error);
      // Optionally re-throw
    }
  }
}
