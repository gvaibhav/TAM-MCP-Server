import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";
import { imfApi } from "../../config/apiConfig.js";
import { APIService } from "../APIService.js";

// Type definitions for IMF service
interface ImfDataRecord {
  [key: string]: string | number | null | undefined;
}

interface ImfDataset {
  series?: Record<string, ImfSeries>;
  observations?: Record<string, ObservationData>;
  structure?: SdmxStructure;
  dataSets?: SdmxDataSet[];
  DataSet?: Record<string, unknown> | SdmxDataSet | SdmxDataSet[]; // Legacy property name
  CompactData?: SdmxCompactData;
}

interface ImfSeries {
  observations?: Record<string, ObservationData>;
  attributes?: number[];
  [key: string]: unknown;
}

interface ObservationData {
  value?: string | number;
  [key: string]: unknown;
}

interface SdmxStructure {
  dimensions?: {
    series?: SdmxDimension[];
    observation?: SdmxDimension[];
  };
  attributes?: {
    series?: SdmxAttribute[];
    observation?: SdmxAttribute[];
  };
}

interface SdmxDimension {
  keyPosition?: number;
  id?: string;
  name?: string;
  values?: SdmxValue[];
}

interface SdmxAttribute {
  id?: string;
  name?: string;
  values?: SdmxValue[];
}

interface SdmxValue {
  id?: string;
  name?: string;
}

interface SdmxDataSet {
  series?: Record<string, SdmxSeriesData>;
  observations?: Record<string, ObservationData>;
}

interface SdmxSeriesData {
  observations?: Record<string, number[] | ObservationData>;
  attributes?: number[];
}

interface SdmxCompactData {
  DataSet?: SdmxDataSet[] | SdmxDataSet;
  structure?: SdmxStructure;
}

// Common IMF dataset patterns and working examples
const IMF_KEY_PATTERNS = {
  IFS: {
    description: "International Financial Statistics",
    commonFormats: [
      "M.{COUNTRY}.{INDICATOR}",
      "A.{COUNTRY}.{INDICATOR}",
      "Q.{COUNTRY}.{INDICATOR}",
    ],
    workingExamples: [
      {
        key: "M.US.PMP_IX",
        description: "US Import Price Index (Monthly)",
      },
      {
        key: "A.US.NGDP_R",
        description: "US Real GDP (Annual)",
      },
      {
        key: "Q.US.NGDP_SA",
        description: "US GDP Seasonally Adjusted (Quarterly)",
      },
      {
        key: "M.GB.PCPIEC_IX",
        description: "UK Consumer Price Index (Monthly)",
      },
      {
        key: "A.FR.BCA_BP6_USD",
        description: "France Current Account (Annual)",
      },
    ],
  },
  PCPS: {
    description: "Primary Commodity Price System",
    commonFormats: ["M.{COUNTRY}.{COMMODITY}_USD"],
    workingExamples: [
      {
        key: "M.W0.PCRUDE_USD",
        description: "Crude Oil Prices (Monthly)",
      },
      {
        key: "M.W0.PGOLD_USD",
        description: "Gold Prices (Monthly)",
      },
    ],
  },
};

// Common country and indicator codes
const COMMON_CODES = {
  countries: {
    US: "United States",
    GB: "United Kingdom",
    FR: "France",
    DE: "Germany",
    JP: "Japan",
    CA: "Canada",
    AU: "Australia",
    CN: "China",
  },
  frequencies: {
    M: "Monthly",
    Q: "Quarterly",
    A: "Annual",
  },
};

export class ImfService extends APIService implements DataSourceService {
  constructor(_apiKey?: string) {
    super("https://dataservices.imf.org/REST/SDMX_JSON.svc");
    logger.info("ImfService: Constructor - API Configuration:", {
      available: true,
    });
  }

  /**
   * Validates IMF key format and provides suggestions if invalid
   */
  private validateImfKey(
    dataflowId: string,
    key: string,
  ): {
    isValid: boolean;
    suggestions: string[];
    warnings: string[];
  } {
    const suggestions: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    // Basic format validation
    const keyParts = key.split(".");
    if (keyParts.length < 2) {
      isValid = false;
      warnings.push(
        `Key "${key}" appears to be incomplete. IMF keys typically have format like "M.US.INDICATOR"`,
      );
    }

    // Check if dataflow has known patterns
    const dataflowInfo =
      IMF_KEY_PATTERNS[dataflowId as keyof typeof IMF_KEY_PATTERNS];
    if (dataflowInfo) {
      suggestions.push(
        `For ${dataflowId} (${dataflowInfo.description}), try these working examples:`,
      );
      dataflowInfo.workingExamples.forEach((example) => {
        suggestions.push(`  ${example.key} - ${example.description}`);
      });
    }

    // Check frequency indicator
    if (keyParts.length > 0) {
      const frequency = keyParts[0];
      if (
        !COMMON_CODES.frequencies[
          frequency as keyof typeof COMMON_CODES.frequencies
        ]
      ) {
        warnings.push(
          `Frequency "${frequency}" may not be valid. Common frequencies: ${Object.keys(COMMON_CODES.frequencies).join(", ")}`,
        );
      }
    }

    // Check country code
    if (keyParts.length > 1) {
      const country = keyParts[1];
      if (
        COMMON_CODES.countries[country as keyof typeof COMMON_CODES.countries]
      ) {
        logger.info(
          `Country "${country}" recognized as ${COMMON_CODES.countries[country as keyof typeof COMMON_CODES.countries]}`,
        );
      } else {
        warnings.push(
          `Country code "${country}" not in common list. Verify it's a valid ISO country code.`,
        );
      }
    }

    return { isValid, suggestions, warnings };
  }

  /**
   * Enhanced fetchImfDataset with better error handling and suggestions
   */
  async fetchImfDataset(
    dataflowId: string,
    key: string,
    startPeriod?: string,
    endPeriod?: string,
  ): Promise<ImfDataRecord[]> {
    // Parameter validation
    if (!dataflowId || !key) {
      throw new Error("Dataflow ID and Key must be provided");
    }

    // Validate key format and provide suggestions
    const validation = this.validateImfKey(dataflowId, key);
    if (validation.warnings.length > 0) {
      logger.warn("IMF Key validation warnings:", validation.warnings);
    }

    logger.info("ImfService.fetchImfDataset called", {
      dataflowId,
      key,
      startPeriod,
      endPeriod,
      validation: validation.warnings,
    });

    try {
      // Build URL and query parameters
      const url = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
      const params: Record<string, string> = {};
      if (startPeriod) params.startPeriod = startPeriod;
      if (endPeriod) params.endPeriod = endPeriod;

      const response = await axios.get(url, { params });
      const data = response.data;

      // Log the full response to understand the structure
      logger.info("ImfService: Full API response received", {
        url,
        params,
        responseKeys: Object.keys(data || {}),
        dataSize: JSON.stringify(data).length,
      });

      // Check if response indicates no data available
      if (this.isEmptyResponse(data)) {
        const errorMessage = this.buildNoDataErrorMessage(
          dataflowId,
          key,
          validation.suggestions,
        );
        logger.warn("IMF API returned empty dataset", {
          dataflowId,
          key,
          startPeriod,
          endPeriod,
          errorMessage,
        });

        // Throw error with dataset context included
        throw new Error(errorMessage);
      }

      // Log a sample of the response to understand structure
      if (data && typeof data === "object") {
        const sample = JSON.stringify(data, null, 2);
        const truncatedSample =
          sample.length > 2000 ? sample.substring(0, 2000) + "..." : sample;
        logger.info("ImfService: Response structure sample", {
          sample: truncatedSample,
        });
      }

      // Parse SDMX JSON format
      const parsedData = this.parseSdmxCompactData(data);

      // If parsing returned null/empty, provide helpful error
      if (!parsedData || parsedData.length === 0) {
        const errorMessage = this.buildNoDataErrorMessage(
          dataflowId,
          key,
          validation.suggestions,
        );
        throw new Error(errorMessage);
      }

      logger.info("ImfService: Successfully extracted data", {
        recordCount: parsedData.length,
        firstRecord: parsedData[0],
      });

      return parsedData;
    } catch (error: unknown) {
      logger.error("ImfService: API call failed", {
        error: error instanceof Error ? error.message : String(error),
        dataflowId,
        key,
        startPeriod,
        endPeriod,
      });

      // Enhanced error handling with suggestions - throw errors with dataset context
      if (
        error &&
        typeof error === "object" &&
        "isAxiosError" in error &&
        error.isAxiosError &&
        "response" in error &&
        error.response
      ) {
        const axiosError = error as { response: { status: number } };
        const status = axiosError.response.status;

        // Get dataset description for better error context
        const datasetDescription = this.getDatasetDescription(dataflowId);

        let enhancedMessage = `IMF API Error: ${status}`;
        if (status === 404) {
          enhancedMessage += ` - Dataset '${dataflowId}' (${datasetDescription}) not found. Please check your dataflow ID and key format.`;
        } else if (status === 400) {
          enhancedMessage += ` - Bad request for dataset '${dataflowId}' (${datasetDescription}). The key format may be invalid.`;
        }

        // Throw error with enhanced message
        throw new Error(enhancedMessage);
      }

      // For non-HTTP errors, also throw with dataset context
      const datasetDescription = this.getDatasetDescription(dataflowId);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(
        `Error accessing dataset '${dataflowId}' (${datasetDescription}): ${errorMessage}`,
      );
    }
  }

  /**
   * Check if API response indicates empty/no data
   */
  private isEmptyResponse(data: unknown): boolean {
    if (!data) return true;

    const dataObj = data as Record<string, unknown>;

    // Handle CompactData wrapper (common in IMF SDMX JSON responses)
    let actualData = dataObj;
    if (dataObj.CompactData) {
      actualData = dataObj.CompactData as Record<string, unknown>;
    }

    // Check for empty DataSet
    if (actualData.DataSet && Object.keys(actualData.DataSet).length <= 2) {
      // DataSet with only XML namespace attributes indicates no data
      const dataSetKeys = Object.keys(actualData.DataSet);
      const hasOnlyNamespaces = dataSetKeys.every(
        (key) => key.startsWith("@xmlns") || key.startsWith("xmlns"),
      );
      if (hasOnlyNamespaces) return true;
    }

    // Check for empty dataSets array
    if (actualData.dataSets && Array.isArray(actualData.dataSets)) {
      if (actualData.dataSets.length === 0) return true;

      // Check if all dataSets are empty
      const hasData = actualData.dataSets.some(
        (ds: SdmxDataSet) => ds.series && Object.keys(ds.series).length > 0,
      );
      if (!hasData) return true;
    }

    return false;
  }

  /**
   * Build helpful error message for no data scenarios
   */
  private buildNoDataErrorMessage(
    dataflowId: string,
    key: string,
    suggestions: string[],
  ): string {
    let message = `No data available for IMF dataset "${dataflowId}" with key "${key}".`;

    // Add dataset-specific context
    const dataflowInfo =
      IMF_KEY_PATTERNS[dataflowId as keyof typeof IMF_KEY_PATTERNS];
    if (dataflowInfo) {
      message += `\n\nDataset: ${dataflowInfo.description}`;
    }

    message += `\n\nPossible reasons:`;
    message += `\n• The indicator code may not exist in the ${dataflowId} dataset`;
    message += `\n• The country code might be invalid or not covered`;
    message += `\n• Data for this combination may not be available for the requested time period`;
    message += `\n• The key format may be incorrect for this dataset`;

    // Add specific suggestions for the dataset
    if (dataflowInfo) {
      message += `\n\nRecommended alternatives for ${dataflowId}:`;
      const topExamples = dataflowInfo.workingExamples.slice(0, 3);
      topExamples.forEach((example) => {
        message += `\n  ${example.key} - ${example.description}`;
      });
    }

    // Add alternative dataset suggestions
    message += `\n\nConsider trying these alternative IMF datasets:`;
    if (dataflowId !== "IFS") {
      message += `\n  IFS - International Financial Statistics (broader economic indicators)`;
    }
    if (dataflowId !== "PCPS") {
      message += `\n  PCPS - Primary Commodity Price System (commodity prices)`;
    }

    // Add general troubleshooting tips
    message += `\n\nTroubleshooting tips:`;
    message += `\n• Check if the country code follows ISO 2-letter format (US, GB, FR, etc.)`;
    message += `\n• Verify the indicator code exists in the IMF documentation`;
    message += `\n• Try different time frequencies (M=Monthly, Q=Quarterly, A=Annual)`;
    message += `\n• Consider using a broader time range if data is sparse`;

    if (suggestions.length > 0) {
      message += `\n\nValidation suggestions:\n${suggestions.join("\n")}`;
    }

    return message;
  }

  private parseSdmxCompactData(data: ImfDataset): ImfDataRecord[] | null {
    try {
      logger.info("ImfService: Parsing SDMX data", {
        hasStructure: !!data.structure,
        hasDataSets: !!data.dataSets,
        dataSetCount: data.dataSets?.length ?? 0,
        topLevelKeys: Object.keys(data || {}),
      });

      // Handle IMF CompactData wrapper
      let actualData = data;
      if (data.CompactData && !data.structure && !data.dataSets) {
        logger.info(
          "ImfService: Found CompactData wrapper, extracting nested data",
        );
        actualData = data.CompactData as ImfDataset;
      }

      // Try multiple parsing strategies for different SDMX response formats

      // Strategy 1: Try the original complex SDMX structure
      if (
        actualData.structure?.dimensions?.series &&
        actualData.dataSets &&
        actualData.dataSets.length > 0
      ) {
        const result = this.parseComplexSdmxStructure(actualData);
        if (result && result.length > 0) {
          logger.info(
            "ImfService: Successfully parsed complex SDMX structure",
            { recordCount: result.length },
          );
          return result;
        }
      }

      // Strategy 2: Try simplified structure parsing
      if (actualData.dataSets && actualData.dataSets.length > 0) {
        const result = this.parseSimplifiedSdmxStructure(actualData);
        if (result && result.length > 0) {
          logger.info(
            "ImfService: Successfully parsed simplified SDMX structure",
            { recordCount: result.length },
          );
          return result;
        }
      }

      // Strategy 3: Try flat structure parsing (in case data is already flattened)
      if (Array.isArray(actualData)) {
        logger.info("ImfService: Data appears to be already in array format", {
          recordCount: actualData.length,
        });
        return actualData.length > 0 ? actualData : null;
      }

      // Strategy 4: Try to extract any observations from any nested structure
      const result = this.extractObservationsFromAnyStructure(actualData);
      if (result && result.length > 0) {
        logger.info(
          "ImfService: Successfully extracted observations from nested structure",
          { recordCount: result.length },
        );
        return result;
      }

      logger.warn(
        "ImfService: Unable to parse any recognizable SDMX structure",
        {
          dataStructure: this.getStructureSummary(actualData),
          originalDataStructure: this.getStructureSummary(data),
        },
      );
      return null;
    } catch (error) {
      logger.error("ImfService: Error parsing SDMX data", {
        error: error instanceof Error ? error.message : String(error),
        dataStructure: this.getStructureSummary(data),
      });
      return null;
    }
  }

  private parseComplexSdmxStructure(data: ImfDataset): ImfDataRecord[] | null {
    try {
      if (!data.structure?.dimensions?.series || !data.dataSets?.[0]) {
        return null;
      }

      const dataset = data.dataSets[0];
      if (!dataset.series || Object.keys(dataset.series).length === 0) {
        return null;
      }

      const structure = data.structure;
      const seriesDimensions = structure.dimensions?.series;
      if (!seriesDimensions) {
        return null;
      }
      const observationAttributes = structure.attributes?.observation ?? [];
      const seriesAttributes = structure.attributes?.series ?? [];

      const result: ImfDataRecord[] = [];

      // Process each series
      for (const [seriesKey, seriesData] of Object.entries(dataset.series)) {
        const series = seriesData as ImfSeries;

        // Parse series key (e.g., "1:0:0:0" -> [1,0,0,0])
        const keyParts = seriesKey.split(":").map(Number);

        // Build series dimension values
        const seriesDimensionValues: Record<string, string> = {};
        seriesDimensions.forEach((dim: SdmxDimension, index: number) => {
          const valueIndex = keyParts[index];
          if (dim.values?.[valueIndex]) {
            const value = dim.values[valueIndex];
            if (dim.id && value.name) {
              seriesDimensionValues[dim.id] = value.name;
              seriesDimensionValues[`${dim.id}_ID`] = value.id ?? "";
            }
          }
        });

        // Get series attributes
        const seriesAttributeValues: Record<string, string> = {};
        if (series.attributes && seriesAttributes.length > 0) {
          series.attributes.forEach((attrIndex: number, index: number) => {
            const attr = seriesAttributes[index];
            if (attr?.values) {
              const value = attr.values[attrIndex];
              if (value && attr.id) {
                seriesAttributeValues[attr.id] = value.name ?? "";
                seriesAttributeValues[`${attr.id}_ID`] = value.id ?? "";
              }
            }
          });
        }

        // Process observations
        if (series.observations) {
          for (const [timePeriod, obsData] of Object.entries(
            series.observations,
          )) {
            const observation = obsData as unknown as number[];
            const obsValue = observation[0];

            // Build observation record
            const record: ImfDataRecord = {
              ...seriesDimensionValues,
              ...seriesAttributeValues,
              TIME_PERIOD: timePeriod,
              value: obsValue,
            };

            // Add observation attributes
            if (observation.length > 1 && observationAttributes.length > 0) {
              observation
                .slice(1)
                .forEach((attrIndex: number, index: number) => {
                  const attr = observationAttributes[index];
                  if (attr?.values) {
                    const value = attr.values[attrIndex];
                    if (value && attr.id) {
                      record[attr.id] = value.name ?? "";
                      record[`${attr.id}_ID`] = value.id ?? "";
                    }
                  }
                });
            }

            result.push(record);
          }
        }
      }

      return result.length > 0 ? result : null;
    } catch (error) {
      logger.error("ImfService: Error parsing SDMX data", {
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  private parseSimplifiedSdmxStructure(
    data: ImfDataset,
  ): ImfDataRecord[] | null {
    try {
      const dataset = data.dataSets?.[0];
      if (!dataset) return null;

      // Check if series data is in a simpler format
      if (dataset.series) {
        const result: ImfDataRecord[] = [];

        for (const [seriesKey, seriesData] of Object.entries(dataset.series)) {
          const series = seriesData as SdmxSeriesData;

          if (series.observations) {
            for (const [timePeriod, obsData] of Object.entries(
              series.observations,
            )) {
              const observation = Array.isArray(obsData) ? obsData[0] : obsData;

              result.push({
                TIME_PERIOD: timePeriod,
                value:
                  typeof observation === "object" &&
                  observation &&
                  "value" in observation
                    ? observation.value
                    : (observation as string | number),
                series_key: seriesKey,
              });
            }
          }
        }

        return result.length > 0 ? result : null;
      }

      // Check if data is in a flat structure
      if (dataset.observations) {
        const result: ImfDataRecord[] = [];

        for (const [timePeriod, obsData] of Object.entries(
          dataset.observations,
        )) {
          const observation = Array.isArray(obsData) ? obsData[0] : obsData;

          result.push({
            TIME_PERIOD: timePeriod,
            value: observation,
          });
        }

        return result.length > 0 ? result : null;
      }

      return null;
    } catch (error) {
      logger.error("ImfService: Error in simplified SDMX parsing", { error });
      return null;
    }
  }

  private extractObservationsFromAnyStructure(
    data: ImfDataset,
  ): ImfDataRecord[] | null {
    try {
      const result: ImfDataRecord[] = [];

      logger.info("ImfService: Extracting observations from structure", {
        hasDataSet: !!data.DataSet,
        dataKeys: Object.keys(data || {}),
      });

      // Check specifically for IMF DataSet first
      if (data.DataSet) {
        logger.info("ImfService: Found DataSet, attempting to extract", {
          dataSetKeys: Object.keys(data.DataSet || {}),
        });
        this.extractFromImfDataSet(
          data.DataSet as Record<string, unknown>,
          result,
          "root.DataSet",
        );
        if (result.length > 0) {
          logger.info("ImfService: Successfully extracted from DataSet", {
            recordCount: result.length,
          });
          return result;
        }
      }

      // Recursive function to find observations in any nested structure
      const extractFromObject = (
        obj: Record<string, unknown>,
        prefix = "",
      ): void => {
        if (!obj || typeof obj !== "object") return;

        // Look for observation patterns
        if (obj.observations && typeof obj.observations === "object") {
          for (const [timePeriod, obsData] of Object.entries(
            obj.observations,
          )) {
            const observation = Array.isArray(obsData) ? obsData[0] : obsData;

            result.push({
              TIME_PERIOD: timePeriod,
              value: observation,
              source_path: prefix,
            });
          }
        }

        // Look for time-value patterns
        if (obj.TIME_PERIOD && obj.value !== undefined) {
          result.push({
            TIME_PERIOD: obj.TIME_PERIOD as string | number,
            value: obj.value as string | number,
            source_path: prefix,
          });
        }

        // Handle IMF specific XML-to-JSON structure
        if (obj.DataSet && typeof obj.DataSet === "object") {
          this.extractFromImfDataSet(
            obj.DataSet as Record<string, unknown>,
            result,
            prefix + ".DataSet",
          );
        }

        // Recursively check nested objects
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "object" && value !== null) {
            extractFromObject(
              value as Record<string, unknown>,
              prefix ? `${prefix}.${key}` : key,
            );
          }
        }
      };

      extractFromObject(data as Record<string, unknown>);

      return result.length > 0 ? result : null;
    } catch (error) {
      logger.error("ImfService: Error extracting observations from structure", {
        error,
      });
      return null;
    }
  }

  private extractFromImfDataSet(
    dataSet: Record<string, unknown>,
    result: ImfDataRecord[],
    prefix: string,
  ): void {
    try {
      logger.info("ImfService: Processing DataSet", {
        prefix,
        hasSeriesProperty: !!dataSet.Series,
        hasObsProperty: !!dataSet.Obs,
        dataSetKeys: Object.keys(dataSet || {}),
      });

      // Handle Series within DataSet
      if (dataSet.Series) {
        logger.info("ImfService: Found Series in DataSet");
        const series = Array.isArray(dataSet.Series)
          ? dataSet.Series
          : [dataSet.Series];

        for (const seriesItem of series) {
          logger.info("ImfService: Processing series item", {
            hasObs: !!(seriesItem as Record<string, unknown>).Obs,
            seriesKeys: Object.keys(seriesItem || {}),
          });

          const seriesData = seriesItem as Record<string, unknown>;
          if (seriesData.Obs) {
            const observations = Array.isArray(seriesData.Obs)
              ? seriesData.Obs
              : [seriesData.Obs];

            for (const obs of observations) {
              const obsRecord = obs as Record<string, unknown>;
              logger.info("ImfService: Processing observation", {
                obsKeys: Object.keys(obsRecord || {}),
                hasTimePeriod: !!obsRecord["@TIME_PERIOD"],
                hasObsValue: !!obsRecord["@OBS_VALUE"],
              });

              if (obsRecord["@TIME_PERIOD"] && obsRecord["@OBS_VALUE"]) {
                const record: ImfDataRecord = {
                  TIME_PERIOD: obsRecord["@TIME_PERIOD"] as string,
                  value:
                    parseFloat(obsRecord["@OBS_VALUE"] as string) ||
                    (obsRecord["@OBS_VALUE"] as string | number),
                  source_path: prefix + ".Series.Obs",
                };

                // Add series-level attributes
                if (seriesData["@FREQ"])
                  record.FREQ_ID = seriesData["@FREQ"] as string;
                if (seriesData["@REF_AREA"])
                  record.REF_AREA_ID = seriesData["@REF_AREA"] as string;
                if (seriesData["@INDICATOR"])
                  record.INDICATOR_ID = seriesData["@INDICATOR"] as string;

                // Add observation-level attributes
                if (obsRecord["@OBS_STATUS"])
                  record.OBS_STATUS_ID = obsRecord["@OBS_STATUS"] as string;

                logger.info("ImfService: Adding observation record", {
                  record,
                });
                result.push(record);
              }
            }
          }
        }
      }

      // Handle direct observations in DataSet
      if (dataSet.Obs) {
        logger.info("ImfService: Found direct Obs in DataSet");
        const observations = Array.isArray(dataSet.Obs)
          ? dataSet.Obs
          : [dataSet.Obs];

        for (const obs of observations) {
          const obsRecord = obs as Record<string, unknown>;
          if (obsRecord["@TIME_PERIOD"] && obsRecord["@OBS_VALUE"]) {
            const record: ImfDataRecord = {
              TIME_PERIOD: obsRecord["@TIME_PERIOD"] as string,
              value:
                parseFloat(obsRecord["@OBS_VALUE"] as string) ||
                (obsRecord["@OBS_VALUE"] as string | number),
              source_path: prefix + ".Obs",
            };
            logger.info("ImfService: Adding direct observation record", {
              record,
            });
            result.push(record);
          }
        }
      }

      logger.info("ImfService: DataSet processing complete", {
        recordsAdded: result.length,
        prefix,
      });
    } catch (error) {
      logger.error("ImfService: Error extracting from IMF DataSet", {
        error,
        prefix,
      });
    }
  }

  private getStructureSummary(data: unknown): Record<string, unknown> {
    try {
      if (!data) return { type: "null" };

      if (Array.isArray(data)) {
        return {
          type: "array",
          length: data.length,
          firstElementKeys: data.length > 0 ? Object.keys(data[0] || {}) : [],
        };
      }

      if (typeof data === "object") {
        const summary: Record<string, unknown> = {
          type: "object",
          topLevelKeys: Object.keys(data as Record<string, unknown>),
        };

        const dataObj = data as Record<string, unknown>;
        // Add specific IMF/SDMX structure info
        if (dataObj.structure) {
          summary.hasStructure = true;
          summary.structureKeys = Object.keys(
            dataObj.structure as Record<string, unknown>,
          );
        }

        if (dataObj.dataSets) {
          summary.hasDataSets = true;
          summary.dataSetCount = Array.isArray(dataObj.dataSets)
            ? dataObj.dataSets.length
            : 1;
        }

        return summary;
      }

      return { type: typeof data };
    } catch (error) {
      return { type: "error", error: (error as Error).message };
    }
  }

  /**
   * Get a human-readable description for common IMF dataset IDs
   */
  private getDatasetDescription(dataflowId: string): string {
    const descriptions: Record<string, string> = {
      IFS: "International Financial Statistics",
      PCPS: "Primary Commodity Price System",
      DOT: "Direction of Trade Statistics",
      GFS: "Government Finance Statistics",
      BOP: "Balance of Payments",
      COFOG: "Classification of Functions of Government",
      FSI: "Financial Soundness Indicators",
      HPDD: "Highly Indebted Poor Countries Database",
      WEO: "World Economic Outlook",
      PGI: "Principal Global Indicators",
      GFSR: "Global Financial Stability Report",
      CPI: "Consumer Price Index",
      PPI: "Producer Price Index",
    };

    return descriptions[dataflowId] || "Unknown Dataset";
  }

  // DataSourceService interface implementation
  async fetchIndustryData(
    datasetKey: string,
    options?: string | Record<string, unknown>,
  ): Promise<ImfDataRecord[]> {
    if (typeof options === "string") {
      const result = await this.fetchImfDataset(datasetKey, options, "", "");
      return Array.isArray(result) ? result : [];
    }
    const result = await this.fetchImfDataset(datasetKey, "", "", "");
    return Array.isArray(result) ? result : [];
  }

  async fetchMarketSize(
    industryId: string,
    _region?: string,
  ): Promise<ImfDataRecord[]> {
    // Default implementation using industry ID as IMF key
    const result = await this.fetchImfDataset("IFS", industryId, "", "");
    return Array.isArray(result) ? result : [];
  }

  async getDataFreshness(): Promise<Date | null> {
    // IMF doesn't provide last-updated metadata easily, return null
    return null;
  }
}
