
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { logger } from '../utils/index.js';

export interface ProgressNotification {
  progressToken?: string | number;
  progress: number;
  total: number;
  message?: string;
}

export interface MarketAnalysisNotification {
  type: 'market_analysis' | 'calculation' | 'data_fetch' | 'validation' | 'error';
  message: string;
  data?: any;
  timestamp: string;
}

export interface ErrorNotification {
  error: string;
  tool: string;
  timestamp: string;
  details?: any;
}

export class NotificationService {
  private server: Server;
  private isEnabled: boolean = true;

  constructor(server: Server) {
    this.server = server;
  }

  /**
   * Enable or disable notifications
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    logger.info(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Send a progress notification
   */
  async sendProgress(notification: ProgressNotification): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/progress",
        params: {
          progress: notification.progress,
          total: notification.total,
          progressToken: notification.progressToken,
          message: notification.message,
        },
      });

      logger.debug('Progress notification sent', notification);
    } catch (error) {
      logger.error('Failed to send progress notification', error);
    }
  }

  /**
   * Send a market analysis update notification
   */
  async sendMarketAnalysisUpdate(notification: MarketAnalysisNotification): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/market_analysis",
        params: {
          type: notification.type,
          message: notification.message,
          data: notification.data,
          timestamp: notification.timestamp,
        },
      });

      logger.debug('Market analysis notification sent', notification);
    } catch (error) {
      logger.error('Failed to send market analysis notification', error);
    }
  }

  /**
   * Send an error notification
   */
  async sendError(notification: ErrorNotification): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/error",
        params: {
          error: notification.error,
          tool: notification.tool,
          timestamp: notification.timestamp,
          details: notification.details,
        },
      });

      logger.debug('Error notification sent', notification);
    } catch (error) {
      logger.error('Failed to send error notification', error);
    }
  }

  /**
   * Send a general message notification
   */
  async sendMessage(level: 'info' | 'warning' | 'error', message: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/message",
        params: {
          level,
          logger: "tam-mcp-server",
          data: message,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug('Message notification sent', { level, message });
    } catch (error) {
      logger.error('Failed to send message notification', error);
    }
  }

  /**
   * Send a calculation status notification
   */
  async sendCalculationStatus(
    calculationType: string,
    status: 'started' | 'completed' | 'failed',
    details?: any
  ): Promise<void> {
    if (!this.isEnabled) return;

    const notification: MarketAnalysisNotification = {
      type: 'calculation',
      message: `${calculationType} calculation ${status}`,
      data: details,
      timestamp: new Date().toISOString(),
    };

    await this.sendMarketAnalysisUpdate(notification);
  }

  /**
   * Send a data fetch status notification
   */
  async sendDataFetchStatus(
    source: string,
    status: 'started' | 'completed' | 'failed',
    details?: any
  ): Promise<void> {
    if (!this.isEnabled) return;

    const notification: MarketAnalysisNotification = {
      type: 'data_fetch',
      message: `Data fetch from ${source} ${status}`,
      data: details,
      timestamp: new Date().toISOString(),
    };

    await this.sendMarketAnalysisUpdate(notification);
  }

  /**
   * Send a validation status notification
   */
  async sendValidationStatus(
    validationType: string,
    status: 'started' | 'completed' | 'failed',
    results?: any
  ): Promise<void> {
    if (!this.isEnabled) return;

    const notification: MarketAnalysisNotification = {
      type: 'validation',
      message: `${validationType} validation ${status}`,
      data: results,
      timestamp: new Date().toISOString(),
    };

    await this.sendMarketAnalysisUpdate(notification);
  }
}
