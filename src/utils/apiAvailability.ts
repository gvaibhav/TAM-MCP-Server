import { logger } from "../utils/index.js";

/**
 * Check which API keys are available in the environment
 */
export interface ApiAvailability {
  name: string;
  available: boolean;
  keyName: string;
  required: boolean;
}

export function checkApiAvailability(): Map<string, ApiAvailability> {
  const apis = new Map<string, ApiAvailability>();

  // Define all APIs and their requirements
  const apiConfigs = [
    { name: "AlphaVantage", keyName: "ALPHA_VANTAGE_API_KEY", required: true },
    { name: "FRED", keyName: "FRED_API_KEY", required: true },
    { name: "BLS", keyName: "BLS_API_KEY", required: false },
    { name: "Census", keyName: "CENSUS_API_KEY", required: false },
    { name: "Nasdaq", keyName: "NASDAQ_DATA_LINK_API_KEY", required: false },
    // These don't require API keys
    { name: "WorldBank", keyName: "", required: false },
    { name: "OECD", keyName: "", required: false },
    { name: "IMF", keyName: "", required: false },
  ];

  for (const config of apiConfigs) {
    const available = config.keyName === "" || !!process.env[config.keyName];
    apis.set(config.name, {
      name: config.name,
      available,
      keyName: config.keyName,
      required: config.required,
    });
  }

  return apis;
}

/**
 * Get tool availability status based on its dependencies
 */
export function getToolAvailabilityStatus(toolName: string): {
  available: boolean;
  warnings: string[];
  missingKeys: string[];
} {
  const apiAvailability = checkApiAvailability();
  const warnings: string[] = [];
  const missingKeys: string[] = [];
  let available = true;

  // Define tool dependencies
  const toolDependencies: Record<string, string[]> = {
    // Market analysis tools - use multiple sources
    industry_data: ["AlphaVantage", "FRED", "BLS", "Census"],
    market_size: ["AlphaVantage", "FRED", "WorldBank", "BLS"],
    tam_analysis: ["AlphaVantage", "FRED", "WorldBank", "OECD"],
    sam_calculator: ["AlphaVantage", "FRED", "BLS"],
    market_segments: ["AlphaVantage", "FRED", "Census"],
    market_forecasting: ["AlphaVantage", "FRED", "WorldBank", "OECD"],
    market_comparison: ["AlphaVantage", "FRED", "WorldBank"],
    data_validation: ["AlphaVantage", "FRED"],
    market_opportunities: ["AlphaVantage", "FRED", "WorldBank", "OECD"],

    // Direct API access tools
    alphaVantage_getCompanyOverview: ["AlphaVantage"],
    alphaVantage_searchSymbols: ["AlphaVantage"],
    fred_getSeriesObservations: ["FRED"],
    bls_getSeriesData: ["BLS"],
    census_fetchIndustryData: ["Census"],
    census_fetchMarketSize: ["Census"],
    nasdaq_getDatasetTimeSeries: ["Nasdaq"],
    nasdaq_getLatestDatasetValue: ["Nasdaq"],
    imf_getDataset: ["IMF"],
    imf_getLatestObservation: ["IMF"],
    oecd_getDataset: ["OECD"],
    oecd_getLatestObservation: ["OECD"],
    worldBank_getIndicatorData: ["WorldBank"],

    // Utility tools
    industry_search: ["AlphaVantage", "FRED", "BLS"],
    tam_calculator: [], // Calculator tool, no external APIs needed
    market_size_calculator: ["AlphaVantage", "FRED", "WorldBank", "BLS"],
    company_financials_retriever: ["AlphaVantage"],

    // Generic tools
    generic_data_query: [
      "AlphaVantage",
      "FRED",
      "WorldBank",
      "OECD",
      "IMF",
      "BLS",
      "Census",
    ],

    // Tools that don't require API keys
    resource_discovery: [],
    market_terminology: [],
  };

  const dependencies = toolDependencies[toolName] || [];

  // Check if tool has any dependencies
  if (dependencies.length === 0) {
    return { available: true, warnings: [], missingKeys: [] };
  }

  // Count available vs required dependencies
  let availableCount = 0;
  let requiredMissing = 0;

  for (const dep of dependencies) {
    const api = apiAvailability.get(dep);
    if (api) {
      if (api.available) {
        availableCount++;
      } else if (api.required) {
        requiredMissing++;
        missingKeys.push(api.keyName);
      } else if (api.keyName) {
        // Optional API key missing
        warnings.push(
          `${api.name} API key not configured (${api.keyName}) - limited functionality`,
        );
      }
    }
  }

  // Tool is unavailable if required APIs are missing
  if (requiredMissing > 0) {
    available = false;
  }

  // Add general warnings
  if (availableCount < dependencies.length && availableCount > 0) {
    warnings.push(
      `${availableCount}/${dependencies.length} data sources available - some features may be limited`,
    );
  }

  return { available, warnings, missingKeys };
}

/**
 * Log API availability status at server startup
 */
export function logApiAvailabilityStatus(): void {
  const apiAvailability = checkApiAvailability();

  logger.info("🔍 API Availability Check:");

  let availableCount = 0;
  let requiredMissingCount = 0;

  for (const [name, status] of apiAvailability) {
    if (status.keyName === "") {
      logger.info(`  ✅ ${name}: Public access (no key required)`);
      availableCount++;
    } else if (status.available) {
      logger.info(`  ✅ ${name}: API key configured`);
      availableCount++;
    } else if (status.required) {
      logger.warn(`  ❌ ${name}: Missing REQUIRED API key (${status.keyName})`);
      requiredMissingCount++;
    } else {
      logger.info(
        `  ⚠️  ${name}: API key not configured (${status.keyName}) - optional`,
      );
    }
  }

  logger.info(
    `📊 Summary: ${availableCount}/${apiAvailability.size} APIs available, ${requiredMissingCount} required APIs missing`,
  );

  if (requiredMissingCount > 0) {
    logger.warn(
      "⚠️  Some tools may have limited functionality due to missing required API keys",
    );
  }
}
