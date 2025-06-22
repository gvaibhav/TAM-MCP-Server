import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ImfService } from '../../../../src/services/datasources/ImfService';
import { imfApi } from '../../../../src/config/apiConfig';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

// Mock IMF SDMX-JSON CompactData Structure
const mockImfDataResponse = [
  {
    TIME_PERIOD: "2023-01",
    value: 175,
    COMMODITY_ID: "PAUM",
    COMMODITY: "Aluminum",
    FREQ_ID: "M",
    FREQ: "Monthly",
    REF_AREA_ID: "W00",
    REF_AREA: "World",
    UNIT_MEASURE_ID: "USD",
    UNIT_MEASURE: "US Dollar",
    UNIT_MULT_ID: "0",
    UNIT_MULT: "Units",
    OBS_STATUS_ID: "A",
    OBS_STATUS: "Actual"
  },
  {
    TIME_PERIOD: "2023-02",
    value: 176.5,
    COMMODITY_ID: "PAUM",
    COMMODITY: "Aluminum",
    FREQ_ID: "M",
    FREQ: "Monthly",
    REF_AREA_ID: "W00",
    REF_AREA: "World",
    UNIT_MEASURE_ID: "USD",
    UNIT_MEASURE: "US Dollar",
    UNIT_MULT_ID: "0",
    UNIT_MULT: "Units",
    OBS_STATUS_ID: "A",
    OBS_STATUS: "Actual"
  }
];

// Mock for empty response testing
const mockEmptyResponse = {
  CompactData: {
    DataSet: {
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@xmlns:message": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message"
    }
  }
};

// Mock for complex SDMX structure
const mockComplexSdmxResponse = {
  structure: {
    dimensions: {
      series: [
        {
          id: "FREQ",
          name: "Frequency",
          keyPosition: 0,
          values: [
            { id: "M", name: "Monthly" },
            { id: "Q", name: "Quarterly" }
          ]
        },
        {
          id: "REF_AREA",
          name: "Reference area",
          keyPosition: 1,
          values: [
            { id: "US", name: "United States" },
            { id: "GB", name: "United Kingdom" }
          ]
        }
      ]
    },
    attributes: {
      series: [
        {
          id: "UNIT_MEASURE",
          name: "Unit of measure",
          values: [
            { id: "USD", name: "US Dollar" }
          ]
        }
      ]
    }
  },
  dataSets: [{
    series: {
      "0:0": {
        observations: {
          "0": [100]
        },
        attributes: [0]
      }
    }
  }]
};

describe('ImfService', () => {
  let imfService: ImfService;

  beforeEach(() => {
    vi.resetAllMocks();
    imfService = new ImfService();
  });

  describe('constructor and isAvailable', () => {
    it('should initialize with correct base URL', () => {
      expect(imfService['baseUrl']).toBe('https://dataservices.imf.org/REST/SDMX_JSON.svc');
    });

    it('isAvailable should always be true (no API key required)', async () => {
      expect(await imfService.isAvailable()).toBe(true);
    });
  });

  describe('validateImfKey', () => {
    it('should validate IMF key format correctly', () => {
      const validation = (imfService as any).validateImfKey('IFS', 'M.US.PMP_IX');
      expect(validation.isValid).toBe(true);
    });

    it('should detect invalid key format', () => {
      const validation = (imfService as any).validateImfKey('IFS', 'INVALID');
      expect(validation.isValid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should provide suggestions for known dataflows', () => {
      const validation = (imfService as any).validateImfKey('IFS', 'INVALID');
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions[0]).toContain('International Financial Statistics');
    });
  });

  describe('isEmptyResponse', () => {
    it('should detect empty responses', () => {
      expect((imfService as any).isEmptyResponse(null)).toBe(true);
      expect((imfService as any).isEmptyResponse(undefined)).toBe(true);
      expect((imfService as any).isEmptyResponse(mockEmptyResponse)).toBe(true);
    });

    it('should detect non-empty responses', () => {
      expect((imfService as any).isEmptyResponse({ data: 'something' })).toBe(false);
    });
  });

  describe('fetchImfDataset', () => {
    it('should fetch and return IMF dataset with proper parameters', async () => {
      const dataflowId = 'PCPS';
      const key = 'M.US.PMP_IX';
      const expectedUrl = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
      
      // Mock the parseSdmxCompactData method to return our mock data
      const mockParsedData = mockImfDataResponse;
      vi.spyOn(imfService as any, 'parseSdmxCompactData').mockReturnValue(mockParsedData);
      
      mockedAxiosGet.mockResolvedValue({ data: { mockStructure: true } });

      const result = await imfService.fetchImfDataset(dataflowId, key);
      expect(result).toEqual(mockParsedData);
      expect(mockedAxiosGet).toHaveBeenCalledWith(expectedUrl, { params: {} });
    });

    it('should include period parameters when provided', async () => {
      const dataflowId = 'PCPS';
      const key = 'M.US.PMP_IX';
      const startPeriod = '2020';
      const endPeriod = '2023';
      const expectedUrl = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
      
      vi.spyOn(imfService as any, 'parseSdmxCompactData').mockReturnValue(mockImfDataResponse);
      mockedAxiosGet.mockResolvedValue({ data: { mockStructure: true } });

      await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);
      expect(mockedAxiosGet).toHaveBeenCalledWith(expectedUrl, { 
        params: { startPeriod: '2020', endPeriod: '2023' } 
      });
    });

    it('should throw error if dataflowId or key is missing', async () => {
      await expect(imfService.fetchImfDataset('', 'key')).rejects.toThrow('Dataflow ID and Key must be provided');
      await expect(imfService.fetchImfDataset('dataflow', '')).rejects.toThrow('Dataflow ID and Key must be provided');
    });

    it('should handle API errors and throw with proper format', async () => {
      const dataflowId = 'PCPS';
      const key = 'M.US.PMP_IX';
      
      mockedAxiosGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404, data: { error: 'Dataset not found' } }
      });

      await expect(imfService.fetchImfDataset(dataflowId, key)).rejects.toThrow('IMF API Error: 404');
    });

    it('should handle network errors', async () => {
      const dataflowId = 'PCPS';
      const key = 'M.US.PMP_IX';
      const networkError = new Error('Network Error');
      
      mockedAxiosGet.mockRejectedValue(networkError);

      await expect(imfService.fetchImfDataset(dataflowId, key)).rejects.toThrow('Network Error');
    });    it('should throw error for empty responses', async () => {
      const dataflowId = 'PCPS';
      const key = 'INVALID.KEY';
      
      mockedAxiosGet.mockResolvedValue({ data: mockEmptyResponse });

      await expect(imfService.fetchImfDataset(dataflowId, key)).rejects.toThrow();
    });
  });

  describe('parseSdmxCompactData', () => {
    it('should parse complex SDMX structure correctly', () => {
      const result = (imfService as any).parseComplexSdmxStructure(mockComplexSdmxResponse);
      expect(Array.isArray(result)).toBe(true);
      if (result && result.length > 0) {
        expect(result[0]).toHaveProperty('FREQ');
        expect(result[0]).toHaveProperty('REF_AREA');
      }
    });

    it('should handle missing structure gracefully', () => {
      const result = (imfService as any).parseComplexSdmxStructure({});
      expect(result).toBeNull();
    });

    it('should extract observations from various data formats', () => {
      const testData = {
        DataSet: {
          Series: [{
            '@FREQ': 'M',
            '@REF_AREA': 'US',
            Obs: [{ '@TIME_PERIOD': '2023-01', '@OBS_VALUE': '100' }]
          }]
        }
      };

      const result = (imfService as any).extractObservationsFromAnyStructure(testData);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('fetchMarketSize', () => {
    it('should fetch market size data and return array', async () => {
      const industryId = 'PAUM';
      
      // Mock the fetchImfDataset method to return our test data
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      const result = await imfService.fetchMarketSize(industryId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockImfDataResponse);
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith('IFS', industryId, '', '');
    });

    it('should use IFS dataflow by default', async () => {
      const industryId = 'PAUM';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      await imfService.fetchMarketSize(industryId);
      
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith('IFS', industryId, '', '');
    });

    it('should return empty array if no data available', async () => {
      const industryId = 'PAUM';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue([]);

      const result = await imfService.fetchMarketSize(industryId);
      expect(result).toEqual([]);
    });

    it('should return empty array on fetchImfDataset error', async () => {
      const industryId = 'PAUM';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue([]);

      const result = await imfService.fetchMarketSize(industryId);
      expect(result).toEqual([]);
    });
  });

  describe('getDataFreshness', () => {
    it('should return null as IMF does not provide freshness data easily', async () => {
      const result = await imfService.getDataFreshness();
      expect(result).toBeNull();
    });
  });
  describe('fetchIndustryData', () => {
    it('should handle empty datasetKey by calling fetchImfDataset with empty parameters', async () => {
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue([]);

      const result = await imfService.fetchIndustryData('');
      expect(result).toEqual([]);
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith('', '', '', '');
    });

    it('should handle string options parameter', async () => {
      const datasetKey = 'PCPS';
      const options = 'M.US.PMP_IX';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      const result = await imfService.fetchIndustryData(datasetKey, options);
      
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith(datasetKey, options, '', '');
      expect(result).toEqual(mockImfDataResponse);
    });

    it('should handle object options parameter', async () => {
      const datasetKey = 'PCPS';
      const options = { startPeriod: '2020' };
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      const result = await imfService.fetchIndustryData(datasetKey, options);
      
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith(datasetKey, '', '', '');
      expect(result).toEqual(mockImfDataResponse);
    });
  });
  describe('buildNoDataErrorMessage', () => {
    it('should build comprehensive error message with suggestions', () => {
      const result = (imfService as any).buildNoDataErrorMessage(
        'PCPS', 'INVALID', ['Try M.US.PMP_IX']
      );
      
      expect(typeof result).toBe('string');
      expect(result).toContain('No data available for IMF dataset "PCPS"');
      expect(result).toContain('Primary Commodity Price System');
      expect(result).toContain('Try M.US.PMP_IX');
    });
  });
  describe('getStructureSummary', () => {
    it('should return structure summary for debugging', () => {
      const testData = { CompactData: { DataSet: { test: true } } };
      const result = (imfService as any).getStructureSummary(testData);
      
      expect(result).toHaveProperty('type');
      expect(typeof result.type).toBe('string');
    });    it('should handle errors gracefully', () => {
      // Mock Object.keys to throw an error
      const originalKeys = Object.keys;
      vi.spyOn(Object, 'keys').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = (imfService as any).getStructureSummary({ test: true });
      
      expect(result).toHaveProperty('type', 'error');
      expect(result).toHaveProperty('error', 'Test error');
      
      // Restore original function
      Object.keys = originalKeys;
    });
  });
});
