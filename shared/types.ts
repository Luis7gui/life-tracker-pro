/**
 * Life Tracker Pro - Shared Types
 * Common interfaces used by both client and server
 */

// Common Enums
export enum CategoryType {
  DEVELOPMENT = 'Development',
  WORK = 'Work',
  LEARNING = 'Learning', 
  ENTERTAINMENT = 'Entertainment',
  UNCATEGORIZED = 'Uncategorized',
}

// Base Activity Session (what we store in DB)
export interface ActivitySessionDB {
  id?: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  applicationName: string;
  applicationPath?: string;
  windowTitle?: string;
  windowTitleHash?: string;
  category?: CategoryType;
  productivityScore?: number;
  isIdle: boolean;
  isActive: boolean;
  hostname?: string;
  osName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Activity Session (what we send over the wire)
export interface ActivitySessionAPI {
  id?: number;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  duration?: number;
  applicationName: string;
  applicationPath?: string;
  windowTitle?: string;
  category?: CategoryType;
  productivityScore?: number;
  isIdle: boolean;
  isActive: boolean;
  hostname?: string;
  osName?: string;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

// Converter utilities
export const convertDbToApi = (dbSession: ActivitySessionDB): ActivitySessionAPI => ({
  ...dbSession,
  startTime: dbSession.startTime.toISOString(),
  endTime: dbSession.endTime?.toISOString(),
  createdAt: dbSession.createdAt?.toISOString(),
  updatedAt: dbSession.updatedAt?.toISOString(),
});

export const convertApiToDb = (apiSession: ActivitySessionAPI): ActivitySessionDB => ({
  ...apiSession,
  startTime: new Date(apiSession.startTime),
  endTime: apiSession.endTime ? new Date(apiSession.endTime) : undefined,
  createdAt: apiSession.createdAt ? new Date(apiSession.createdAt) : undefined,
  updatedAt: apiSession.updatedAt ? new Date(apiSession.updatedAt) : undefined,
});

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

// Common error type
export interface ApiError {
  error: string;
  message?: string;
  timestamp?: string;
}