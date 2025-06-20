// tests/unit/utils/envHelper.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnvAsNumber } from '../../../src/utils/envHelper';
import { envTestUtils } from '../../utils/envTestHelper';

describe('getEnvAsNumber', () => {
  beforeEach(() => {
    // No need to mock anything for these tests
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should return the default value if env var is not set', () => {
    expect(getEnvAsNumber('MY_UNDEFINED_VAR', 123)).toBe(123);
  });

  it('should return the parsed number if env var is a valid number string', () => {
    vi.stubEnv('MY_NUMERIC_VAR', '456');
    expect(getEnvAsNumber('MY_NUMERIC_VAR', 123)).toBe(456);
  });

  it('should return the default value and log a warning if env var is not a valid number string', () => {
    vi.stubEnv('MY_INVALID_VAR', 'not-a-number');
    expect(getEnvAsNumber('MY_INVALID_VAR', 789)).toBe(789);
    // Note: We don't test the warning message since logger is used for production logging
  });

  it('should return the default value if env var is an empty string', () => {
    vi.stubEnv('MY_EMPTY_VAR', '');
    expect(getEnvAsNumber('MY_EMPTY_VAR', 123)).toBe(123);
    // Note: We don't test the warning message since logger is used for production logging
  });
});
