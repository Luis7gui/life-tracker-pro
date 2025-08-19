/**
 * Life Tracker Pro - Error Handling Utilities
 * Centralized error handling and retry logic
 */

import { toast } from 'sonner';

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof ApiError && error.status < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with optional exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay;
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Network errors
  if (!error.response) {
    return 'Network error - please check your connection';
  }
  
  // Server errors
  const status = error.response?.status;
  const message = error.response?.data?.error || error.response?.data?.message || error.message;
  
  switch (status) {
    case 400:
      return `Invalid request: ${message}`;
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests - please wait';
    case 500:
      return 'Server error - please try again later';
    case 503:
      return 'Service temporarily unavailable';
    default:
      return message || `Request failed with status ${status}`;
  }
}

/**
 * Show error toast with appropriate styling
 */
export function showErrorToast(title: string, message?: string) {
  toast.error(title, {
    description: message,
    style: {
      background: '#1a1612',
      color: '#d4c4a0',
      border: '1px solid rgba(205, 92, 92, 0.3)',
    },
  });
}

/**
 * Show success toast with earthen styling
 */
export function showSuccessToast(title: string, message?: string) {
  toast.success(title, {
    description: message,
    style: {
      background: '#1a1612',
      color: '#d4c4a0',
      border: '1px solid rgba(204, 136, 68, 0.3)',
    },
  });
}

/**
 * Centralized error logger
 */
export function logError(error: Error, context?: string) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  console.error('Application Error:', errorInfo);
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // errorReportingService.captureError(errorInfo);
  }
}

/**
 * React error boundary helper
 */
export class ErrorBoundaryError extends Error {
  constructor(
    message: string,
    public originalError: Error,
    public errorInfo: any
  ) {
    super(message);
    this.name = 'ErrorBoundaryError';
  }
}