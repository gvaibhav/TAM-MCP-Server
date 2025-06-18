// Environment Test Helper
// Provides proper environment variable mocking for Vitest tests
// Fixes the "Cannot redefine property: env" error by using Vitest's built-in environment stubbing

import { vi } from 'vitest';

export interface EnvMockConfig {
  [key: string]: string | undefined;
}

export class EnvTestHelper {
  private static originalEnv: NodeJS.ProcessEnv;
  private static activeStubs: string[] = [];

  /**
   * Setup environment mocking at the start of a test
   */
  static setupEnvMocking(): void {
    // Store original environment
    this.originalEnv = { ...process.env };
    this.activeStubs = [];
  }

  /**
   * Mock specific environment variables
   */
  static mockEnvVars(config: EnvMockConfig): void {
    Object.entries(config).forEach(([key, value]) => {
      if (value === undefined) {
        vi.stubEnv(key, '');
        delete process.env[key];
      } else {
        vi.stubEnv(key, value);
        process.env[key] = value;
      }
      this.activeStubs.push(key);
    });
  }

  /**
   * Clear all environment variable mocks
   */
  static clearEnvMocks(): void {
    // Restore all stubbed environment variables
    vi.unstubAllEnvs();
    
    // Reset to original environment
    process.env = { ...this.originalEnv };
    this.activeStubs = [];
  }

  /**
   * Create a test environment with specific API keys missing/present
   */
  static createTestEnv(options: {
    hasAlphaVantageKey?: boolean;
    hasCensusKey?: boolean;
    hasFredKey?: boolean;
    hasWorldBankKey?: boolean;
    hasBlsKey?: boolean;
    hasNasdaqKey?: boolean;
    hasOecdKey?: boolean;
    hasImfKey?: boolean;
    customVars?: EnvMockConfig;
  } = {}): void {
    const {
      hasAlphaVantageKey = false,
      hasCensusKey = false,
      hasFredKey = false,
      hasWorldBankKey = false,
      hasBlsKey = false,
      hasNasdaqKey = false,
      hasOecdKey = false,
      hasImfKey = false,
      customVars = {}
    } = options;

    const envConfig: EnvMockConfig = {
      // API Keys
      ALPHA_VANTAGE_API_KEY: hasAlphaVantageKey ? 'test-alpha-vantage-key' : undefined,
      CENSUS_API_KEY: hasCensusKey ? 'test-census-key' : undefined,
      FRED_API_KEY: hasFredKey ? 'test-fred-key' : undefined,
      WORLD_BANK_API_KEY: hasWorldBankKey ? 'test-world-bank-key' : undefined,
      BLS_API_KEY: hasBlsKey ? 'test-bls-key' : undefined,
      NASDAQ_API_KEY: hasNasdaqKey ? 'test-nasdaq-key' : undefined,
      OECD_API_KEY: hasOecdKey ? 'test-oecd-key' : undefined,
      IMF_API_KEY: hasImfKey ? 'test-imf-key' : undefined,
      
      // Common test environment variables
      NODE_ENV: 'test',
      
      // Custom variables
      ...customVars
    };

    this.mockEnvVars(envConfig);
  }

  /**
   * Create environment with all API keys present (for positive test cases)
   */
  static createFullTestEnv(customVars: EnvMockConfig = {}): void {
    this.createTestEnv({
      hasAlphaVantageKey: true,
      hasCensusKey: true,
      hasFredKey: true,
      hasWorldBankKey: true,
      hasBlsKey: true,
      hasNasdaqKey: true,
      hasOecdKey: true,
      hasImfKey: true,
      customVars
    });
  }

  /**
   * Create environment with no API keys (for negative test cases)
   */
  static createEmptyTestEnv(customVars: EnvMockConfig = {}): void {
    this.createTestEnv({
      hasAlphaVantageKey: false,
      hasCensusKey: false,
      hasFredKey: false,
      hasWorldBankKey: false,
      hasBlsKey: false,
      hasNasdaqKey: false,
      hasOecdKey: false,
      hasImfKey: false,
      customVars
    });
  }
}

/**
 * Convenient test utilities for common environment setups
 */
export const envTestUtils = {
  setup: EnvTestHelper.setupEnvMocking.bind(EnvTestHelper),
  cleanup: EnvTestHelper.clearEnvMocks.bind(EnvTestHelper),
  mockWith: EnvTestHelper.mockEnvVars.bind(EnvTestHelper),
  createEnv: EnvTestHelper.createTestEnv.bind(EnvTestHelper),
  withAllKeys: EnvTestHelper.createFullTestEnv.bind(EnvTestHelper),
  withNoKeys: EnvTestHelper.createEmptyTestEnv.bind(EnvTestHelper)
};
