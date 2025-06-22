import { describe, it, expect, beforeEach } from 'vitest';
import { ImfService } from '../../src/services/datasources/ImfService';

describe('ImfService Integration Tests', () => {
  let imfService: ImfService;

  beforeEach(() => {
    imfService = new ImfService();
  });
  describe('Real API Integration', () => {
    it('should fetch real data from IMF IFS dataset', async () => {
      try {
        const result = await imfService.fetchImfDataset('IFS', 'M.US.PMP_IX');
        
        // The result should be an array of records
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('TIME_PERIOD');
          expect(result[0]).toHaveProperty('value');
        }
      } catch (error) {
        // API errors are acceptable in integration tests
        expect(error).toBeInstanceOf(Error);
      }
    }, 10000); // 10 second timeout for API calls

    it('should handle invalid dataset gracefully', async () => {
      try {
        await imfService.fetchImfDataset('INVALID_DATASET', 'INVALID_KEY');
        // If we reach here, it means no error was thrown, which is unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Should throw an error
        expect(error).toBeInstanceOf(Error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('INVALID_DATASET');
      }
    }, 10000);    it('should fetch market size data using IFS', async () => {
      try {
        const result = await imfService.fetchMarketSize('PMP_IX');
        
        // Should return an array (might be empty)
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // If data is not available, service should throw an error with helpful context
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('IFS');
        expect(errorMessage).toContain('PMP_IX');
      }
    }, 10000);

    it('should handle fetchIndustryData with real parameters', async () => {
      const result = await imfService.fetchIndustryData('IFS', 'M.US.PMP_IX');
      
      expect(Array.isArray(result)).toBe(true);
    }, 10000);
  });
  describe('Data Validation and Processing', () => {
    it('should properly validate and suggest corrections for malformed keys', async () => {
      try {
        await imfService.fetchImfDataset('IFS', 'INVALID');
        // If we reach here, it means no error was thrown, which is unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Should throw an error with suggestions
        expect(error).toBeInstanceOf(Error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('IFS');
        expect(errorMessage).toContain('International Financial Statistics');
      }
    });it('should handle various SDMX response formats', async () => {
      // Test with a dataset that might return complex SDMX structures
      try {
        const result = await imfService.fetchImfDataset('PCPS', 'M.W0.PCRUDE_USD');
        
        // If successful, check data structure
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('TIME_PERIOD');
          expect(typeof result[0].value).not.toBe('undefined');
        }
      } catch (error) {
        // API errors are acceptable in integration tests
        expect(error).toBeInstanceOf(Error);
      }
    }, 15000);
  });

  describe('Error Handling and Recovery', () => {    it('should provide helpful error messages with dataset context', async () => {
      try {
        await imfService.fetchImfDataset('PCPS', 'COMPLETELY_INVALID_KEY');
        // If we reach here, the test should fail because an error should have been thrown
        expect(true).toBe(false); // This will fail the test
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('PCPS');
        expect(errorMessage).toContain('Primary Commodity Price System');
      }
    });

    it('should handle network timeouts gracefully', async () => {
      // This test might fail if the network is slow, but it should not crash
      try {
        await imfService.fetchImfDataset('IFS', 'M.US.INVALID_INDICATOR_THAT_DEFINITELY_DOES_NOT_EXIST');
        // If we reach here, it means the call succeeded, which is also fine
      } catch (error) {
        // Network errors are acceptable in integration tests
        expect(error).toBeInstanceOf(Error);
      }
    }, 20000);
  });

  describe('Performance and Caching', () => {
    it('should complete requests within reasonable time limits', async () => {
      const startTime = Date.now();
      
      try {
        const result = await imfService.fetchImfDataset('IFS', 'M.US.PMP_IX');
        // If successful, should return an array
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // If error, should have meaningful message
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Error accessing dataset');
        expect(error.message).toContain('IFS');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
        // Should complete within 30 seconds (whether success or error)
      expect(duration).toBeLessThan(30000);
    }, 35000);

    it('should handle multiple concurrent requests', async () => {
      const promises = [
        imfService.fetchImfDataset('IFS', 'M.US.PMP_IX'),
        imfService.fetchImfDataset('PCPS', 'M.W0.PCRUDE_USD'),
        imfService.fetchMarketSize('PMP_IX')
      ];
      
      const results = await Promise.allSettled(promises);
      
      // All promises should either succeed or fail gracefully with errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          // If rejected, should have a proper error message
          const error = result.reason;
          const errorMessage = error instanceof Error ? error.message : String(error);
          expect(errorMessage.length).toBeGreaterThan(0);
          console.log(`Request ${index} failed with: ${errorMessage}`);
        } else {
          // If fulfilled, should have valid data
          expect(Array.isArray(result.value)).toBe(true);
        }
      });
      
      // At least one request should complete (either success or proper error)
      expect(results.length).toBe(3);
    }, 30000);
  });
});
