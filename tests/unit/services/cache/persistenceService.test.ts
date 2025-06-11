import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import { CacheEntry } from '../../../../src/types/cache';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('fs/promises'); // Mock the entire fs/promises module

const mockFs = fs as any;
const TEST_CACHE_DIR = path.join(process.cwd(), '.cache_data_test');

describe('PersistenceService', () => {
  let persistenceService: PersistenceService;
  const TEST_CACHE_DIR_BASE = process.cwd(); // Define base path for clarity

  beforeEach(() => {
    // Ensure each test starts with a fresh service and mocks
    vi.clearAllMocks();
    // Configure the service to use a specific test directory for most tests
    // Individual tests (like constructor) might use a different path if needed
    persistenceService = new PersistenceService({ filePath: path.join(TEST_CACHE_DIR_BASE, '.cache_data_test_default') });
    // Mock mkdir to simulate directory creation/existence for the default path
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Optional: clean up the test cache directory if files were actually written (not typical with mocks)
  });

  describe('constructor', () => {
    it('should create the storage directory if it does not exist', async () => {
      const specificTestDir = path.join(TEST_CACHE_DIR_BASE, '.cache_data_test_constructor_success');
      // mockFs.mkdir is global, so this mock will apply.
      // If it were instance-specific, we'd mock before new PersistenceService.
      mockFs.mkdir.mockResolvedValue(undefined);
      new PersistenceService({ filePath: specificTestDir });
      expect(mockFs.mkdir).toHaveBeenCalledWith(specificTestDir, { recursive: true });
    });

    it('should log an error if creating storage directory fails', async () => {
      const specificTestDirFail = path.join(TEST_CACHE_DIR_BASE, '.cache_data_test_constructor_fail');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('MKDIR failed');
      mockFs.mkdir.mockRejectedValue(testError); // Mock this before instantiation

      new PersistenceService({ filePath: specificTestDirFail });

      // The constructor calls initStorage, which is async but not awaited in constructor.
      // We need to wait a bit for the async mkdir to potentially call console.error
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow microtask queue to process

      expect(mockFs.mkdir).toHaveBeenCalledWith(specificTestDirFail, { recursive: true });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create persistence storage directory:', testError);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('save', () => {
    it('should save data to a file', async () => {
      const key = 'testKey';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      // Uses the default path from beforeEach's persistenceService instance
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${key}.json`);

      mockFs.writeFile.mockResolvedValue(undefined);

      await persistenceService.save(key, data);

      expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(data, null, 2), 'utf8');
    });

    it('should sanitize the key for the filename', async () => {
      const key = 'test/Key::Invalid';
      const safeKey = 'test_Key__Invalid';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${safeKey}.json`);

      mockFs.writeFile.mockResolvedValue(undefined);
      await persistenceService.save(key, data);
      expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(data, null, 2), 'utf8');
    });

    it('should handle errors during writeFile', async () => {
      const key = 'testKey';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      await persistenceService.save(key, data);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('load', () => {
    it('should load data from a file if it exists and is valid', async () => {
      const key = 'testKey';
      const now = Date.now();
      // Persisted entry should be returned as is by load, CacheService will check TTL
      const entry: CacheEntry<string> = { data: 'testData', timestamp: now - 500, ttl: 1000 };
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${key}.json`);
      mockFs.readFile.mockResolvedValue(JSON.stringify(entry));

      const result = await persistenceService.load<string>(key);
      expect(mockFs.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
      expect(result).toEqual(entry);
    });

    it('should return null if file does not exist (ENOENT)', async () => {
      const key = 'nonExistentKey';
      const enoentError: any = new Error('File not found');
      enoentError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(enoentError);

      const result = await persistenceService.load<string>(key);
      expect(result).toBeNull();
    });

    it('should return null and log error for other read errors', async () => {
      const key = 'errorKey';
      mockFs.readFile.mockRejectedValue(new Error('Read error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await persistenceService.load<string>(key);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return null if JSON parsing fails', async () => {
        const key = 'corruptedKey';
        const currentTestCacheDir = (persistenceService as any).storagePath;
        const expectedPath = path.join(currentTestCacheDir, `${key}.json`);
        mockFs.readFile.mockResolvedValue("this is not json");
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await persistenceService.load<string>(key);
        expect(mockFs.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove a file', async () => {
      const key = 'testKey';
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${key}.json`);
      mockFs.unlink.mockResolvedValue(undefined);

      await persistenceService.remove(key);
      expect(mockFs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle ENOENT error gracefully when removing non-existent file', async () => {
        const key = 'nonExistentKey';
        const enoentError: any = new Error('File not found');
        enoentError.code = 'ENOENT';
        mockFs.unlink.mockRejectedValue(enoentError);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.remove(key);
        expect(consoleErrorSpy).not.toHaveBeenCalled(); // Should not log error for ENOENT
        consoleErrorSpy.mockRestore();
    });

    it('should log other errors during remove', async () => {
        const key = 'errorKey';
        mockFs.unlink.mockRejectedValue(new Error('Delete error'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.remove(key);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAll', () => {
    it('should remove all files in the storage directory', async () => {
      const files = ['file1.json', 'file2.json'];
      mockFs.readdir.mockResolvedValue(files as any); // Type assertion for simplicity
      mockFs.unlink.mockResolvedValue(undefined);
      const currentTestCacheDir = (persistenceService as any).storagePath;

      await persistenceService.clearAll();

      expect(mockFs.readdir).toHaveBeenCalledWith(currentTestCacheDir);
      expect(mockFs.unlink).toHaveBeenCalledTimes(files.length);
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(currentTestCacheDir, 'file1.json'));
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(currentTestCacheDir, 'file2.json'));
    });

    it('should handle errors during clearAll', async () => {
        mockFs.readdir.mockRejectedValue(new Error('Cannot read dir'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.clearAll();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
  });
});
