import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises'; // fs will be auto-mocked by vi.mock below
import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import { CacheEntry } from '../../../../src/types/cache';
import * as path from 'path';

vi.mock('fs/promises'); // Auto-mocks fs.promises, all its functions become vi.fn()

const mockFs = fs as { // Type assertion for mocked fs module
  mkdir: ReturnType<typeof vi.fn>;
  writeFile: ReturnType<typeof vi.fn>;
  readFile: ReturnType<typeof vi.fn>;
  unlink: ReturnType<typeof vi.fn>;
  readdir: ReturnType<typeof vi.fn>;
};

// const TEST_CACHE_DIR = path.join(process.cwd(), '.cache_data_test'); // Used in original, path constructed in tests now

describe('PersistenceService', () => {
  let persistenceService: PersistenceService;
  const TEST_CACHE_DIR_BASE = process.cwd();

  beforeEach(() => {
    vi.resetAllMocks();
    // Default behavior for mkdir for most tests, can be overridden locally if a failure is tested.
    vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
    persistenceService = new PersistenceService({ filePath: path.join(TEST_CACHE_DIR_BASE, '.cache_data_test_default') });
  });

  // afterEach can remain empty if no specific cleanup beyond vi.resetAllMocks() is needed for each test.

  describe('constructor', () => {
    it('should create the storage directory if it does not exist', async () => {
      const specificTestDir = path.join(TEST_CACHE_DIR_BASE, '.cache_data_test_constructor_success');
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      new PersistenceService({ filePath: specificTestDir });
      expect(fs.mkdir).toHaveBeenCalledWith(specificTestDir, { recursive: true });
    });

    it('should log an error if creating storage directory fails', async () => {
      const specificTestDirFail = path.join(TEST_CACHE_DIR_BASE, '.cache_data_test_constructor_fail');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('MKDIR failed');
      vi.mocked(fs.mkdir).mockRejectedValue(testError);

      new PersistenceService({ filePath: specificTestDirFail });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fs.mkdir).toHaveBeenCalledWith(specificTestDirFail, { recursive: true });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create persistence storage directory:', testError);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('save', () => {
    it('should save data to a file', async () => {
      const key = 'testKey';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${key}.json`);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await persistenceService.save(key, data);

      expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(data, null, 2), 'utf8');
    });

    it('should sanitize the key for the filename', async () => {
      const key = 'test/Key::Invalid';
      const safeKey = 'test_Key__Invalid';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${safeKey}.json`);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      await persistenceService.save(key, data);
      expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(data, null, 2), 'utf8');
    });

    it('should handle errors during writeFile', async () => {
      const key = 'testKey';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await persistenceService.save(key, data);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('load', () => {
    it('should load data from a file if it exists and is valid', async () => {
      const key = 'testKey';
      const now = Date.now();
      const entry: CacheEntry<string> = { data: 'testData', timestamp: now - 500, ttl: 1000 };
      const currentTestCacheDir = (persistenceService as any).storagePath;
      const expectedPath = path.join(currentTestCacheDir, `${key}.json`);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(entry));

      const result = await persistenceService.load<string>(key);
      expect(fs.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
      expect(result).toEqual(entry);
    });

    it('should return null if file does not exist (ENOENT)', async () => {
      const key = 'nonExistentKey';
      const enoentError: any = new Error('File not found');
      enoentError.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(enoentError);

      const result = await persistenceService.load<string>(key);
      expect(result).toBeNull();
    });

    it('should return null and log error for other read errors', async () => {
      const key = 'errorKey';
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'));
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
        vi.mocked(fs.readFile).mockResolvedValue("this is not json");
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await persistenceService.load<string>(key);
        expect(fs.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
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
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await persistenceService.remove(key);
      expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle ENOENT error gracefully when removing non-existent file', async () => {
        const key = 'nonExistentKey';
        const enoentError: any = new Error('File not found');
        enoentError.code = 'ENOENT';
        vi.mocked(fs.unlink).mockRejectedValue(enoentError);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.remove(key);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('should log other errors during remove', async () => {
        const key = 'errorKey';
        vi.mocked(fs.unlink).mockRejectedValue(new Error('Delete error'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.remove(key);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAll', () => {
    it('should remove all files in the storage directory', async () => {
      const files = ['file1.json', 'file2.json'];
      vi.mocked(fs.readdir).mockResolvedValue(files as any);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      const currentTestCacheDir = (persistenceService as any).storagePath;

      await persistenceService.clearAll();

      expect(fs.readdir).toHaveBeenCalledWith(currentTestCacheDir);
      expect(fs.unlink).toHaveBeenCalledTimes(files.length);
      expect(fs.unlink).toHaveBeenCalledWith(path.join(currentTestCacheDir, 'file1.json'));
      expect(fs.unlink).toHaveBeenCalledWith(path.join(currentTestCacheDir, 'file2.json'));
    });

    it('should handle errors during clearAll', async () => {
        vi.mocked(fs.readdir).mockRejectedValue(new Error('Cannot read dir'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.clearAll();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
  });
});
