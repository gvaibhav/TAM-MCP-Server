// Unit tests for Notification Service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from '../../src/notifications/notification-service.js';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Mock the MCP Server
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  const MockServer = vi.fn().mockImplementation(() => ({
    notification: vi.fn().mockImplementation(() => Promise.resolve()),
    connect: vi.fn().mockImplementation(() => Promise.resolve()),
    close: vi.fn().mockImplementation(() => Promise.resolve()),
    onclose: null
  }));
  
  return {
    Server: MockServer
  };
});

// Import the shared logger mock from setup
import { logger } from '../setup';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = new Server();
    notificationService = new NotificationService(mockServer);
  });

  describe('setEnabled', () => {
    it('should enable notifications', () => {
      notificationService.setEnabled(true);
      expect(logger.info).toHaveBeenCalledWith('Notifications enabled');
    });

    it('should disable notifications', () => {
      notificationService.setEnabled(false);
      expect(logger.info).toHaveBeenCalledWith('Notifications disabled');
    });
  });

  describe('sendProgress', () => {
    it('should send progress notification when enabled', async () => {
      notificationService.setEnabled(true);
      
      await notificationService.sendProgress({
        progressToken: '123',
        progress: 50,
        total: 100,
        message: 'Processing data'
      });
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/progress',
        params: {
          progressToken: '123',
          progress: 50,
          total: 100,
          message: 'Processing data'
        }
      });
    });

    it('should not send progress notification when disabled', async () => {
      notificationService.setEnabled(false);
      
      await notificationService.sendProgress({
        progress: 50,
        total: 100
      });
      
      expect(mockServer.notification).not.toHaveBeenCalled();
    });
    
    it('should handle errors when sending progress notification', async () => {
      notificationService.setEnabled(true);
      
      mockServer.notification.mockRejectedValueOnce(new Error('Network error'));
      
      await notificationService.sendProgress({
        progress: 50,
        total: 100
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send progress notification',
        expect.any(Error)
      );
    });
  });

  describe('sendMarketAnalysisUpdate', () => {
    it('should send market analysis notification when enabled', async () => {
      notificationService.setEnabled(true);
      
      const notification = {
        type: 'market_analysis' as const,
        message: 'New market analysis available',
        data: { marketSize: 500000000 },
        timestamp: '2025-06-06T12:00:00Z'
      };
      
      await notificationService.sendMarketAnalysisUpdate(notification);
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/market_analysis',
        params: notification
      });
    });

    it('should not send market analysis notification when disabled', async () => {
      notificationService.setEnabled(false);
      
      await notificationService.sendMarketAnalysisUpdate({
        type: 'market_analysis',
        message: 'New market analysis available',
        timestamp: '2025-06-06T12:00:00Z'
      });
      
      expect(mockServer.notification).not.toHaveBeenCalled();
    });
  });

  describe('sendError', () => {
    it('should send error notification when enabled', async () => {
      notificationService.setEnabled(true);
      
      const notification = {
        error: 'Failed to calculate TAM',
        tool: 'tam_calculator',
        timestamp: '2025-06-06T12:00:00Z',
        details: { reason: 'Invalid input' }
      };
      
      await notificationService.sendError(notification);
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/error',
        params: notification
      });
    });

    it('should not send error notification when disabled', async () => {
      notificationService.setEnabled(false);
      
      await notificationService.sendError({
        error: 'Failed to calculate TAM',
        tool: 'tam_calculator',
        timestamp: '2025-06-06T12:00:00Z'
      });
      
      expect(mockServer.notification).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message notification when enabled', async () => {
      notificationService.setEnabled(true);
      
      await notificationService.sendMessage('info', 'Server started successfully');
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/message',
        params: {
          level: 'info',
          logger: 'tam-mcp-server',
          data: 'Server started successfully',
          timestamp: expect.any(String)
        }
      });
    });

    it('should not send message notification when disabled', async () => {
      notificationService.setEnabled(false);
      
      await notificationService.sendMessage('warning', 'Low memory warning');
      
      expect(mockServer.notification).not.toHaveBeenCalled();
    });
  });

  describe('sendCalculationStatus', () => {
    it('should send calculation status notification', async () => {
      notificationService.setEnabled(true);
      
      await notificationService.sendCalculationStatus(
        'TAM', 
        'completed', 
        { result: 500000000 }
      );
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/market_analysis',
        params: {
          type: 'calculation',
          message: 'TAM calculation completed',
          data: { result: 500000000 },
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('sendDataFetchStatus', () => {
    it('should send data fetch status notification', async () => {
      notificationService.setEnabled(true);
      
      await notificationService.sendDataFetchStatus(
        'industry database', 
        'started'
      );
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/market_analysis',
        params: {
          type: 'data_fetch',
          message: 'Data fetch from industry database started',
          data: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('sendValidationStatus', () => {
    it('should send validation status notification', async () => {
      notificationService.setEnabled(true);
      
      await notificationService.sendValidationStatus(
        'market data', 
        'completed',
        { valid: true, issues: [] }
      );
      
      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/market_analysis',
        params: {
          type: 'validation',
          message: 'market data validation completed',
          data: { valid: true, issues: [] },
          timestamp: expect.any(String)
        }
      });
    });
  });
});
