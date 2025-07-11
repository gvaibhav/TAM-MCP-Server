import { createLogger, format, transports } from "winston";
import { z } from "zod";
import { APIResponse } from "../types/index.js";

export * from "./envHelper.js"; // Add this line
export * from "./apiAvailability.js"; // Add this line

// Logger configuration - Only log to files and stderr for MCP compatibility
export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: "tam-mcp-server" },
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
    new transports.Console({
      stderrLevels: ["error", "warn", "info", "verbose", "debug", "silly"],
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

// API Response wrapper
export function createAPIResponse<T>(
  data: T,
  dataSource: string = "unknown",
  error?: any,
): APIResponse<T> {
  if (error) {
    return {
      success: false,
      error: error.message || String(error),
      metadata: {
        timestamp: new Date().toISOString(),
        source: dataSource,
        cached: false,
      },
    };
  }

  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      source: dataSource,
      cached: false,
    },
  };
}

export function createErrorResponse(
  message: string,
  details?: any,
  dataSource: string = "error-handler",
): APIResponse<any> {
  return {
    success: false,
    error: details ? `${message}: ${JSON.stringify(details)}` : message,
    metadata: {
      timestamp: new Date().toISOString(),
      source: dataSource,
      cached: false,
    },
  };
}

// Data validation utilities
export function validatePositiveNumber(value: number, fieldName: string): void {
  if (typeof value !== "number" || value <= 0 || !isFinite(value)) {
    throw new Error(`${fieldName} must be a positive finite number`);
  }
}

export function validatePercentage(value: number, fieldName: string): void {
  if (typeof value !== "number" || value < 0 || value > 1 || !isFinite(value)) {
    throw new Error(`${fieldName} must be a number between 0 and 1`);
  }
}

export function validateYear(year: number): void {
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 20) {
    throw new Error(`Year must be between 1900 and ${currentYear + 20}`);
  }
}

export function validateCurrency(currency: string): void {
  const validCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "INR",
    "CAD",
    "AUD",
  ];
  if (!validCurrencies.includes(currency.toUpperCase())) {
    throw new Error(`Currency must be one of: ${validCurrencies.join(", ")}`);
  }
}

export function validateRegion(region: string): void {
  const validRegions = [
    "global",
    "north-america",
    "europe",
    "asia-pacific",
    "latin-america",
    "middle-east-africa",
    "us",
    "eu",
    "china",
    "japan",
    "india",
    "uk",
    "canada",
  ];
  if (!validRegions.includes(region.toLowerCase())) {
    throw new Error(`Region must be one of: ${validRegions.join(", ")}`);
  }
}

// Number formatting utilities
export function formatCurrency(
  value: number,
  currency: string = "USD",
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (value >= 1e12) {
    return formatter.format(value / 1e12) + "T";
  } else if (value >= 1e9) {
    return formatter.format(value / 1e9) + "B";
  } else if (value >= 1e6) {
    return formatter.format(value / 1e6) + "M";
  } else if (value >= 1e3) {
    return formatter.format(value / 1e3) + "K";
  }
  return formatter.format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Data calculation utilities
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number,
): number {
  validatePositiveNumber(startValue, "Start value");
  validatePositiveNumber(endValue, "End value");
  validatePositiveNumber(years, "Years");

  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function calculateCompoundGrowth(
  initialValue: number,
  growthRate: number,
  years: number,
): number {
  validatePositiveNumber(initialValue, "Initial value");
  validatePositiveNumber(years, "Years");

  return initialValue * Math.pow(1 + growthRate, years);
}

export function calculateConfidenceScore(factors: {
  dataRecency: number; // 0-1, how recent the data is
  sourceReliability: number; // 0-1, reliability of data source
  dataCompleteness: number; // 0-1, how complete the dataset is
  methodologyRobustness: number; // 0-1, robustness of calculation method
}): number {
  const weights = {
    dataRecency: 0.25,
    sourceReliability: 0.35,
    dataCompleteness: 0.25,
    methodologyRobustness: 0.15,
  };

  return Object.entries(factors).reduce((score, [key, value]) => {
    return score + value * weights[key as keyof typeof weights];
  }, 0);
}

// Error handling utilities
export class TAMServerError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "TAMServerError";
  }
}

export function handleToolError(
  error: unknown,
  toolName: string,
): APIResponse<any> {
  logger.error(`Error in ${toolName}:`, error);

  // Handle Zod validation errors specifically
  if (error instanceof z.ZodError) {
    const validationErrors = error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
    return createErrorResponse(`Validation error: ${validationErrors}`);
  }

  if (error instanceof TAMServerError) {
    return createErrorResponse(`${toolName}: ${error.message}`);
  }

  if (error instanceof Error) {
    return createErrorResponse(`${toolName}: ${error.message}`);
  }

  return createErrorResponse(`${toolName}: An unexpected error occurred`);
}

// Rate limiting (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  });

  const current = rateLimitStore.get(identifier);

  if (!current || current.resetTime < windowStart) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}
