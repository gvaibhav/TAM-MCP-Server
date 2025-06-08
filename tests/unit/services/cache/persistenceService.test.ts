import { PersistenceService } from '../../../../src/services/cache/persistenceService';
import { CacheEntry } from '../../../../src/types/cache';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises'); // Mock the entire fs/promises module

const mockFs = fs as jest.Mocked<typeof fs>;
const TEST_CACHE_DIR = path.join(process.cwd(), '.cache_data_test');

describe('PersistenceService', () => {
  let persistenceService: PersistenceService;

  beforeEach(() => {
    // Ensure each test starts with a fresh service and mocks
    jest.resetAllMocks();
    // Configure the service to use a specific test directory
    persistenceService = new PersistenceService({ filePath: TEST_CACHE_DIR });
    // Mock mkdir to simulate directory creation/existence
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Optional: clean up the test cache directory if files were actually written (not typical with mocks)
  });

  describe('constructor', () => {
    it('should create the storage directory if it does not exist', async () => {
      new PersistenceService({ filePath: TEST_CACHE_DIR });
      expect(mockFs.mkdir).toHaveBeenCalledWith(TEST_CACHE_DIR, { recursive: true });
    });
  });

  describe('save', () => {
    it('should save data to a file', async () => {
      const key = 'testKey';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const expectedPath = path.join(TEST_CACHE_DIR, `${key}.json`);

      mockFs.writeFile.mockResolvedValue(undefined);

      await persistenceService.save(key, data);

      expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(data, null, 2), 'utf8');
    });

    it('should sanitize the key for the filename', async () => {
      const key = 'test/Key::Invalid';
      const safeKey = 'test_Key__Invalid';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const expectedPath = path.join(TEST_CACHE_DIR, `${safeKey}.json`);

      mockFs.writeFile.mockResolvedValue(undefined);
      await persistenceService.save(key, data);
      expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(data, null, 2), 'utf8');
    });

    it('should handle errors during writeFile', async () => {
      const key = 'testKey';
      const data: CacheEntry<string> = { data: 'testData', timestamp: Date.now(), ttl: 1000 };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
      const expectedPath = path.join(TEST_CACHE_DIR, `${key}.json`);
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
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await persistenceService.load<string>(key);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return null if JSON parsing fails', async () => {
        const key = 'corruptedKey';
        const expectedPath = path.join(TEST_CACHE_DIR, `${key}.json`);
        mockFs.readFile.mockResolvedValue("this is not json");
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
      const expectedPath = path.join(TEST_CACHE_DIR, `${key}.json`);
      mockFs.unlink.mockResolvedValue(undefined);

      await persistenceService.remove(key);
      expect(mockFs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle ENOENT error gracefully when removing non-existent file', async () => {
        const key = 'nonExistentKey';
        const enoentError: any = new Error('File not found');
        enoentError.code = 'ENOENT';
        mockFs.unlink.mockRejectedValue(enoentError);
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.remove(key);
        expect(consoleErrorSpy).not.toHaveBeenCalled(); // Should not log error for ENOENT
        consoleErrorSpy.mockRestore();
    });

    it('should log other errors during remove', async () => {
        const key = 'errorKey';
        mockFs.unlink.mockRejectedValue(new Error('Delete error'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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

      await persistenceService.clearAll();

      expect(mockFs.readdir).toHaveBeenCalledWith(TEST_CACHE_DIR);
      expect(mockFs.unlink).toHaveBeenCalledTimes(files.length);
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(TEST_CACHE_DIR, 'file1.json'));
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(TEST_CACHE_DIR, 'file2.json'));
    });

    it('should handle errors during clearAll', async () => {
        mockFs.readdir.mockRejectedValue(new Error('Cannot read dir'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await persistenceService.clearAll();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
  });
});
