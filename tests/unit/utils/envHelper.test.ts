// tests/unit/utils/envHelper.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnvAsNumber } from '../../../src/utils/envHelper';
import { envTestUtils } from '../../utils/envTestHelper';

describe('getEnvAsNumber', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn during these tests
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks(); // Restore console.warn spy
  });

  it('should return the default value if env var is not set', () => {
    expect(getEnvAsNumber('MY_UNDEFINED_VAR', 123)).toBe(123);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should return the parsed number if env var is a valid number string', () => {
    vi.stubEnv('MY_NUMERIC_VAR', '456');
    expect(getEnvAsNumber('MY_NUMERIC_VAR', 123)).toBe(456);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should return the default value and log a warning if env var is not a valid number string', () => {
    vi.stubEnv('MY_INVALID_VAR', 'not-a-number');
    expect(getEnvAsNumber('MY_INVALID_VAR', 789)).toBe(789);
    expect(console.warn).toHaveBeenCalledWith('Environment variable "MY_INVALID_VAR" is not a valid number. Using default value: 789.');
  });

  it('should return the default value if env var is an empty string', () => {
    vi.stubEnv('MY_EMPTY_VAR', '');
    expect(getEnvAsNumber('MY_EMPTY_VAR', 123)).toBe(123);
    // parseInt('') is NaN, so current logic should warn.
    expect(console.warn).toHaveBeenCalledWith('Environment variable "MY_EMPTY_VAR" is not a valid number. Using default value: 123.');
  });
});
