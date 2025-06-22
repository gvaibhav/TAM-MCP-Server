import * as process from "process";
import { logger } from "./index.js";

/**
 * Retrieves an environment variable and parses it as a number.
 * @param key The environment variable key.
 * @param defaultValue The default value to return if the key is not found or parsing fails.
 * @returns The parsed number or the default value.
 */
export function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value !== undefined) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
    logger.warn(
      `Environment variable "${key}" is not a valid number. Using default value: ${defaultValue}.`,
    );
  }
  return defaultValue;
}
