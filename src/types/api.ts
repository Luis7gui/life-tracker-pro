/**
 * Life Tracker Pro - API Types
 * TypeScript interfaces for API responses and data structures
 */

// Enums
export enum CategoryType {
  DEVELOPMENT = 'Development',
  WORK = 'Work',
  LEARNING = 'Learning',
  ENTERTAINMENT = 'Entertainment',
  UNCATEGORIZED = 'Uncategorized',
}

// Activity Session Types
export interface ActivitySession {
  id: number;
  applicationName: string;
  applicationPath?: string;
  windowTitle?: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationSeconds?: number;
  durationMinutes?: number;
  category?: CategoryType;
  productivityScore?: number; // 0.0 to 1.0
  categoryColor?: string;
  isIdle: boolean;
  isActive: boolean;
  hostname?: string;
  osName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Current Session Info
export interface CurrentSession {
  active: boolean;
  session?: {
    id?: number;
    application: string;
    startTime: string;
    duration: number;
    category?: string;
    productivityScore?: number;
    categoryColor?: string;
  };
}

// Today Summary
export interface TodaySummary {
  date: string;
  totalTimeSeconds: number;
  totalTimeHours: number;
  sessionCount: number;
  categories: {
    [categoryName: string]: {
      totalTime: number;
      totalHours: number;
      sessionCount: number;
      percentage: number;
      avgProductivity: number;
      color: string;
    };
  };
}

// Time of Day Analysis
export interface TimeOfDayAnalysis {
  date: string;
  periods: {
    [periodName: string]: {
      totalTimeSeconds: number;
      totalTimeHours: number;
      sessionCount: number;
      avgProductivity: number;
      timeRange: string;
    };
  };
}

// Recent Sessions Response
export interface RecentSessionsResponse {
  sessions: ActivitySession[];
  count: number;
}

// Category Info
export interface Category {
  name: string;
  color: string;
  rulesCount: number;
  avgProductivity: number;
  appPatternsCount: number;
  titlePatternsCount: number;
}

export interface CategoriesResponse {
  categories: Category[];
  totalRules: number;
}

// Monitor Status
export interface MonitorStatus {
  isRunning: boolean;
  isIdle: boolean;
  hasActiveSession: boolean;
  currentSession?: {
    id?: number;
    application: string;
    startTime: string;
    duration: number;
    category?: string;
    productivityScore?: number;
  };
  lastActivityTime: number;
  timeSinceActivity: number;
  hostname: string;
  osName: string;
  config: {
    sampleInterval: number;
    idleThreshold: number;
    trackWindowTitles: boolean;
  };
}

// System Status
export interface SystemStatus {
  timestamp: string;
  monitor: MonitorStatus;
  database_connected: boolean;
  categories_loaded: number;
  version: string;
}

// Health Check Response
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment?: string;
  database?: string;
  monitor?: string;
}

// Productivity Stats
export interface ProductivityStats {
  period: {
    start: string;
    end: string;
  };
  totalTimeSeconds: number;
  totalTimeHours: number;
  averageProductivity: number;
  sessionCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface CategoryBreakdownItem {
  category: string;
  timeSeconds: number;
  timeHours: number;
  percentage: number;
  color: string;
}

// Test Categorization
export interface TestCategorizationRequest {
  appName: string;
  windowTitle?: string;
}

export interface TestCategorizationResponse {
  appName: string;
  windowTitle?: string;
  category: CategoryType;
  productivityScore: number;
  matchType?: 'app' | 'title' | 'none';
  matchedRule?: {
    id: string;
    description: string;
    priority: number;
  };
  allMatches: Array<{
    ruleId: string;
    description: string;
    matchType: 'app' | 'title';
    category: CategoryType;
  }>;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

// Monitor Control
export interface MonitorControlResponse {
  message: string;
  status: MonitorStatus;
}

// Connection Status
export interface ConnectionStatus {
  connected: boolean;
  status: 'online' | 'offline';
  serverInfo?: HealthResponse;
  error?: string;
}

// Error Response
export interface ApiError {
  error: string;
  message?: string;
  timestamp?: string;
}

// Chart Data Types (for Dashboard components)
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  time: string;
  value: number;
  category?: string;
}

// Dashboard State Types
export interface DashboardData {
  currentSession: CurrentSession | null;
  todaySummary: TodaySummary | null;
  timeAnalysis: TimeOfDayAnalysis | null;
  recentSessions: ActivitySession[];
  systemStatus: SystemStatus | null;
  categories: Category[];
  connectionStatus: ConnectionStatus;
  lastUpdated: string | null;
}

// Redux Action Types
export interface AsyncActionState {
  loading: boolean;
  error: string | null;
  lastFetch: string | null;
}

// Utility Types
export type DateRange = {
  start: string;
  end: string;
};

export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

// Component Props Types
export interface DashboardComponentProps {
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export interface ChartComponentProps extends DashboardComponentProps {
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
}

export interface SessionListProps extends DashboardComponentProps {
  sessions: ActivitySession[];
  maxItems?: number;
  showCategory?: boolean;
  showDuration?: boolean;
}