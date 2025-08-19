/**
 * Life Tracker Pro - Error Handling Tests
 * Tests for error handling utilities
 */

import { handleApiError, NetworkError, ApiError, withRetry } from './errorHandling';

describe('Error Handling Utilities', () => {
  describe('handleApiError', () => {
    it('handles network errors correctly', () => {
      const error = { message: 'Network Error' };
      const result = handleApiError(error);
      expect(result).toBe('Network error - please check your connection');
    });

    it('handles 400 status errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Invalid request data' }
        }
      };
      const result = handleApiError(error);
      expect(result).toBe('Invalid request: Invalid request data');
    });

    it('handles 401 status errors', () => {
      const error = { response: { status: 401 } };
      const result = handleApiError(error);
      expect(result).toBe('Authentication required');
    });

    it('handles 500 status errors', () => {
      const error = { response: { status: 500 } };
      const result = handleApiError(error);
      expect(result).toBe('Server error - please try again later');
    });

    it('handles unknown errors', () => {
      const result = handleApiError(null);
      expect(result).toBe('Unknown error occurred');
    });
  });

  describe('NetworkError', () => {
    it('creates NetworkError with message and status', () => {
      const error = new NetworkError('Connection failed', 0);
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Connection failed');
      expect(error.status).toBe(0);
    });
  });

  describe('ApiError', () => {
    it('creates ApiError with message, status, and code', () => {
      const error = new ApiError('Bad Request', 400, 'INVALID_INPUT');
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Bad Request');
      expect(error.status).toBe(400);
      expect(error.code).toBe('INVALID_INPUT');
    });
  });

  describe('withRetry', () => {
    it('succeeds on first try', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(successFn);
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const retryFn = jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(retryFn, { maxRetries: 3, delay: 1 });
      expect(result).toBe('success');
      expect(retryFn).toHaveBeenCalledTimes(3);
    });

    it('fails after max retries', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('persistent failure'));
      
      await expect(withRetry(failFn, { maxRetries: 2, delay: 1 }))
        .rejects.toThrow('persistent failure');
      expect(failFn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('does not retry on ApiError with status < 500', async () => {
      const apiError = new ApiError('Bad Request', 400);
      const failFn = jest.fn().mockRejectedValue(apiError);
      
      await expect(withRetry(failFn, { maxRetries: 3 }))
        .rejects.toThrow('Bad Request');
      expect(failFn).toHaveBeenCalledTimes(1); // no retries
    });
  });
});