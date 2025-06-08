// Additional error handling tests for Notification Service
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../src/notifications/notification-service.js';
import { logger } from '../setup.js';

describe('NotificationService Error Handling', () => {
  let notificationService;
  let mockServer;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock server that throws errors
    mockServer = {
      notification: vi.fn().mockImplementation(() => {
        throw new Error('Mock server error');
      })
    };
    notificationService = new NotificationService(mockServer);
    notificationService.setEnabled(true);
  });

  describe('Error Handling', () => {
    it('should handle errors when sending market analysis notification', async () => {
      await notificationService.sendMarketAnalysisUpdate({
        type: 'market_analysis',
        message: 'Test notification',
        timestamp: '2025-06-06T12:00:00Z'
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send market analysis notification',
        expect.any(Error)
      );
    });

    it('should handle errors when sending error notification', async () => {
      await notificationService.sendError({
        error: 'Test error',
        tool: 'test_tool',
        timestamp: '2025-06-06T12:00:00Z'
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send error notification',
        expect.any(Error)
      );
    });

    it('should handle errors when sending message notification', async () => {
      await notificationService.sendMessage('info', 'Test message');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send message notification',
        expect.any(Error)
      );
    });
  });
});
