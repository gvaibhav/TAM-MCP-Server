import { describe, it, expect, vi } from 'vitest';
import { MarketAnalysisTools } from '../../src/tools/market-tools.js';
import { logger } from '../setup';

describe('MarketAnalysisTools - Simple Tests', () => {
  it('should get tool definitions', () => {
    const tools = MarketAnalysisTools.getToolDefinitions();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0].name).toBeDefined();
  });
  
  it('should validate currency in data validation', async () => {
    // Mock DataProvider methods
    vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue({
      id: 'tech-software',
      name: 'Software'
    });
    
    // Test the data validation with invalid currency
    const result = await MarketAnalysisTools.dataValidation({
      customData: {
        marketSize: 1000000,
        currency: 'INVALID'
      }
    });
    
    // Should still succeed but have validation warnings
    expect(result.success).toBe(true);
    const currencyValidation = result.data.validations.find(
      v => v.name === 'Currency Validity'
    );
    expect(currencyValidation.result).toBe('fail');
  });
});
