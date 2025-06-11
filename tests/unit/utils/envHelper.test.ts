// tests/unit/utils/envHelper.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnvAsNumber } from '../../../src/utils/envHelper';
import * as process from 'process';

const OLD_ENV = { ...process.env };

describe('getEnvAsNumber', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV }; // Reset env before each test
    vi.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn during these tests
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.restoreAllMocks(); // Restore console.warn spy
  });

  it('should return the default value if env var is not set', () => {
    expect(getEnvAsNumber('MY_UNDEFINED_VAR', 123)).toBe(123);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should return the parsed number if env var is a valid number string', () => {
    process.env.MY_NUMERIC_VAR = '456';
    expect(getEnvAsNumber('MY_NUMERIC_VAR', 123)).toBe(456);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should return the default value and log a warning if env var is not a valid number string', () => {
    process.env.MY_INVALID_VAR = 'not-a-number';
    expect(getEnvAsNumber('MY_INVALID_VAR', 789)).toBe(789);
    expect(console.warn).toHaveBeenCalledWith('Environment variable "MY_INVALID_VAR" is not a valid number. Using default value: 789.');
  });

  it('should return the default value if env var is an empty string', () => {
    process.env.MY_EMPTY_VAR = '';
    expect(getEnvAsNumber('MY_EMPTY_VAR', 123)).toBe(123);
    // parseInt('') is NaN, so current logic should warn.
    expect(console.warn).toHaveBeenCalledWith('Environment variable "MY_EMPTY_VAR" is not a valid number. Using default value: 123.');
  });
});
