/**
 * Life Tracker Pro - Activity Service
 * API service for activity tracking and session management
 */

import { api } from './client';
import {
  SystemStatus,
  CurrentSession,
  TodaySummary,
  TimeOfDayAnalysis,
  RecentSessionsResponse,
  CategoriesResponse,
  ProductivityStats,
  TestCategorizationRequest,
  TestCategorizationResponse,
  MonitorControlResponse,
  HealthResponse,
  ActivitySession,
  TimePeriod,
  DateRange,
} from '../../types/api';

export class ActivityService {
  // ===============================
  // MONITOR CONTROL APIs (v0.2+)
  // ===============================
  /**
   * Get system status and monitor information
   */
  static async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get<SystemStatus>('/api/status');
    return response.data;
  }

  /**
   * Get current active session
   */
  static async getCurrentSession(): Promise<CurrentSession> {
    const response = await api.get<CurrentSession>('/api/current-session');
    return response.data;
  }

  /**
   * Get today's activity summary
   */
  static async getTodaySummary(): Promise<TodaySummary> {
    const response = await api.get<TodaySummary>('/api/today-summary');
    return response.data;
  }

  /**
   * Get time of day productivity analysis
   */
  static async getTimeOfDayAnalysis(): Promise<TimeOfDayAnalysis> {
    const response = await api.get<TimeOfDayAnalysis>('/api/time-of-day-analysis');
    return response.data;
  }

  /**
   * Get recent activity sessions
   */
  static async getRecentSessions(limit: number = 20): Promise<RecentSessionsResponse> {
    const response = await api.get<RecentSessionsResponse>('/api/recent-sessions', {
      limit,
    });
    return response.data;
  }

  /**
   * Get available categories and their configuration
   */
  static async getCategories(): Promise<CategoriesResponse> {
    const response = await api.get<CategoriesResponse>('/api/categories');
    return response.data;
  }

  /**
   * Get productivity statistics for a date range
   */
  static async getProductivityStats(
    period: TimePeriod = 'today',
    dateRange?: DateRange
  ): Promise<ProductivityStats> {
    const params: any = { period };
    
    if (dateRange) {
      params.startDate = dateRange.start;
      params.endDate = dateRange.end;
    }

    const response = await api.get<ProductivityStats>('/api/productivity-stats', params);
    return response.data;
  }

  /**
   * Test categorization for an application
   */
  static async testCategorization(
    request: TestCategorizationRequest
  ): Promise<TestCategorizationResponse> {
    const response = await api.post<TestCategorizationResponse>('/api/categories/test', request);
    return response.data;
  }

  /**
   * Get detailed monitor status
   */
  static async getMonitorStatus(): Promise<any> {
    const response = await api.get('/api/monitor/status');
    return response.data;
  }

  /**
   * Start the activity monitor
   */
  static async startMonitor(): Promise<MonitorControlResponse> {
    const response = await api.post<MonitorControlResponse>('/api/monitor/start');
    return response.data;
  }

  /**
   * Stop the activity monitor
   */
  static async stopMonitor(): Promise<MonitorControlResponse> {
    const response = await api.post<MonitorControlResponse>('/api/monitor/stop');
    return response.data;
  }

  /**
   * Force end current session
   */
  static async forceEndCurrentSession(): Promise<any> {
    const response = await api.post('/api/monitor/force-end-session');
    return response.data;
  }

  /**
   * Update monitor configuration
   */
  static async updateMonitorConfig(config: {
    sampleInterval?: number;
    idleThreshold?: number;
    trackWindowTitles?: boolean;
    excludeApplications?: string[];
  }): Promise<any> {
    const response = await api.put('/api/monitor/config', config);
    return response.data;
  }

  /**
   * Get today's monitor sessions
   */
  static async getTodayMonitorSessions(): Promise<any> {
    const response = await api.get('/api/monitor/sessions/today');
    return response.data;
  }

  /**
   * Get recent monitor sessions
   */
  static async getRecentMonitorSessions(limit: number = 20): Promise<any> {
    const response = await api.get('/api/monitor/sessions/recent', { limit });
    return response.data;
  }

  /**
   * Get monitor productivity stats
   */
  static async getMonitorProductivityStats(startDate: string, endDate: string): Promise<any> {
    const response = await api.get('/api/monitor/stats/productivity', {
      startDate,
      endDate
    });
    return response.data;
  }

  // ===============================
  // CATEGORIES APIs (v0.3)
  // ===============================

  /**
   * Get all categorization rules
   */
  static async getCategoryRules(includeDisabled: boolean = false): Promise<any> {
    const response = await api.get('/api/categories/rules', { includeDisabled });
    return response.data;
  }

  /**
   * Get a specific rule by ID
   */
  static async getCategoryRule(ruleId: string): Promise<any> {
    const response = await api.get(`/api/categories/rules/${ruleId}`);
    return response.data;
  }

  /**
   * Create a new categorization rule
   */
  static async createCategoryRule(rule: {
    description: string;
    category: string;
    appPatterns: string[];
    titlePatterns?: string[];
    regexPatterns?: string[];
    domainPatterns?: string[];
    productivityScore?: number;
    priority?: number;
    tags?: string[];
  }): Promise<any> {
    const response = await api.post('/api/categories/rules', rule);
    return response.data;
  }

  /**
   * Update a categorization rule
   */
  static async updateCategoryRule(ruleId: string, updates: any): Promise<any> {
    const response = await api.put(`/api/categories/rules/${ruleId}`, updates);
    return response.data;
  }

  /**
   * Delete a categorization rule
   */
  static async deleteCategoryRule(ruleId: string): Promise<any> {
    const response = await api.delete(`/api/categories/rules/${ruleId}`);
    return response.data;
  }

  /**
   * Toggle rule enabled/disabled status
   */
  static async toggleCategoryRule(ruleId: string): Promise<any> {
    const response = await api.patch(`/api/categories/rules/${ruleId}/toggle`);
    return response.data;
  }

  /**
   * Test categorization for given app and window title (alternative method)
   */
  static async testCategorizationSimple(appName: string, windowTitle?: string): Promise<any> {
    const response = await api.post('/api/categories/test', { appName, windowTitle });
    return response.data;
  }

  /**
   * Provide feedback on categorization accuracy
   */
  static async provideCategoryFeedback(
    appName: string,
    expectedCategory: string,
    isCorrect: boolean,
    windowTitle?: string
  ): Promise<any> {
    const response = await api.post('/api/categories/feedback', {
      appName,
      windowTitle,
      expectedCategory,
      isCorrect
    });
    return response.data;
  }

  /**
   * Get categorization statistics
   */
  static async getCategoryStats(): Promise<any> {
    const response = await api.get('/api/categories/stats');
    return response.data;
  }

  /**
   * Search rules by query
   */
  static async searchCategoryRules(query: string): Promise<any> {
    const response = await api.get('/api/categories/search', { q: query });
    return response.data;
  }

  /**
   * Get rules for a specific category
   */
  static async getCategoryRulesByCategory(category: string): Promise<any> {
    const response = await api.get(`/api/categories/${category}/rules`);
    return response.data;
  }

  /**
   * Export all rules and ML data
   */
  static async exportCategoryRules(): Promise<Blob> {
    const response = await api.post('/api/categories/export', {});
    return response.data;
  }

  /**
   * Import rules and ML data
   */
  static async importCategoryRules(jsonData: string): Promise<any> {
    const response = await api.post('/api/categories/import', { data: jsonData });
    return response.data;
  }

  /**
   * Get category types with metadata
   */
  static async getCategoryTypes(): Promise<any> {
    const response = await api.get('/api/categories/types');
    return response.data;
  }

  // ===============================
  // DATABASE APIs (v0.4)
  // ===============================

  /**
   * Get comprehensive database statistics
   */
  static async getDatabaseStats(): Promise<any> {
    const response = await api.get('/api/database/stats');
    return response.data;
  }

  /**
   * Database health check
   */
  static async getDatabaseHealth(): Promise<any> {
    const response = await api.get('/api/database/health');
    return response.data;
  }

  /**
   * Optimize database performance
   */
  static async optimizeDatabase(): Promise<any> {
    const response = await api.post('/api/database/optimize');
    return response.data;
  }

  /**
   * Create database backup
   */
  static async createDatabaseBackup(backupPath?: string): Promise<any> {
    const response = await api.post('/api/database/backup', { path: backupPath });
    return response.data;
  }

  /**
   * Get query performance statistics
   */
  static async getQueryPerformance(): Promise<any> {
    const response = await api.get('/api/database/queries/performance');
    return response.data;
  }

  /**
   * Clear query cache
   */
  static async clearQueryCache(pattern?: string): Promise<any> {
    const url = pattern ? `/api/database/cache?pattern=${encodeURIComponent(pattern)}` : '/api/database/cache';
    const response = await api.delete(url);
    return response.data;
  }

  /**
   * Get slow query analysis
   */
  static async getSlowQueries(threshold: number = 1000, limit: number = 50): Promise<any> {
    const response = await api.get('/api/database/queries/slow', { threshold, limit });
    return response.data;
  }

  /**
   * Get detailed table information
   */
  static async getTableInfo(): Promise<any> {
    const response = await api.get('/api/database/tables/info');
    return response.data;
  }

  /**
   * Get database analytics summary
   */
  static async getDatabaseAnalytics(days: number = 30): Promise<any> {
    const response = await api.get('/api/database/analytics/summary', { days });
    return response.data;
  }

  /**
   * Check server health
   */
  static async getHealth(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>('/api/health');
    return response.data;
  }

  /**
   * Get enhanced dashboard data (v0.5 - combined multiple calls with new APIs)
   */
  static async getDashboardData(): Promise<{
    systemStatus: SystemStatus | { error: string };
    monitorStatus: any;
    currentSession: CurrentSession | { error: string };
    todaySummary: TodaySummary | { error: string };
    timeAnalysis: TimeOfDayAnalysis | { error: string };
    recentSessions: RecentSessionsResponse | { sessions: any[]; error: string };
    categories: CategoriesResponse | { error: string };
    categoryStats: any;
    databaseHealth: any;
    databaseStats: any;
    todayMonitorSessions: any;
  }> {
    try {
      // Make all API calls concurrently for better performance
      const [
        systemStatus,
        monitorStatus,
        currentSession,
        todaySummary,
        timeAnalysis,
        recentSessions,
        categories,
        categoryStats,
        databaseHealth,
        databaseStats,
        todayMonitorSessions,
      ] = await Promise.all([
        this.getSystemStatus().catch(err => ({ error: 'Failed to load system status' })),
        this.getMonitorStatus().catch(err => ({ error: 'Failed to load monitor status' })),
        this.getCurrentSession().catch(err => ({ error: 'Failed to load current session' })),
        this.getTodaySummary().catch(err => ({ error: 'Failed to load today summary' })),
        this.getTimeOfDayAnalysis().catch(err => ({ error: 'Failed to load time analysis' })),
        this.getRecentSessions(15).catch(err => ({ sessions: [], error: 'Failed to load recent sessions' })),
        this.getCategories().catch(err => ({ error: 'Failed to load categories' })),
        this.getCategoryStats().catch(err => ({ error: 'Failed to load category stats' })),
        this.getDatabaseHealth().catch(err => ({ status: 'unknown', error: 'Failed to check database health' })),
        this.getDatabaseStats().catch(err => ({ error: 'Failed to load database stats' })),
        this.getTodayMonitorSessions().catch(err => ({ data: [], error: 'Failed to load today sessions' })),
      ]);

      return {
        systemStatus,
        monitorStatus,
        currentSession,
        todaySummary,
        timeAnalysis,
        recentSessions,
        categories,
        categoryStats,
        databaseHealth,
        databaseStats,
        todayMonitorSessions,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive system overview (new method for v0.5)
   */
  static async getSystemOverview(): Promise<{
    health: any;
    monitor: any;
    database: any;
    categories: any;
    performance: any;
  }> {
    try {
      const [health, monitorStatus, databaseHealth, categoryStats, queryPerformance] = await Promise.all([
        this.getHealth().catch(err => ({ status: 'unknown', error: err.message })),
        this.getMonitorStatus().catch(err => ({ isRunning: false, error: err.message })),
        this.getDatabaseHealth().catch(err => ({ status: 'unknown', error: err.message })),
        this.getCategoryStats().catch(err => ({ error: err.message })),
        this.getQueryPerformance().catch(err => ({ error: err.message })),
      ]);

      return {
        health,
        monitor: monitorStatus,
        database: databaseHealth,
        categories: categoryStats,
        performance: queryPerformance,
      };
    } catch (error) {
      console.error('Error fetching system overview:', error);
      throw error;
    }
  }

  /**
   * Get sessions by date range
   */
  static async getSessionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ActivitySession[]> {
    // const stats = await this.getProductivityStats('custom', {
    //   start: startDate,
    //   end: endDate,
    // }); // Unused variable

    // The backend doesn't have a direct endpoint for sessions by date range,
    // so we'll use the recent sessions endpoint as a fallback
    // In a future version, we could add a specific endpoint for this
    const recent = await this.getRecentSessions(100);
    
    // Filter sessions by date range with validation
    const filteredSessions = recent.sessions.filter(session => {
      if (!session.startTime) return false;
      
      const sessionDate = new Date(session.startTime);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(sessionDate.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
      }
      
      return sessionDate >= start && sessionDate <= end;
    });

    return filteredSessions;
  }

  /**
   * Get weekly summary
   */
  static async getWeeklySummary(): Promise<{
    currentWeek: ProductivityStats;
    previousWeek: ProductivityStats;
    comparison: {
      timeDifference: number;
      productivityDifference: number;
      sessionsDifference: number;
    };
  }> {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    const previousWeekEnd = new Date(currentWeekEnd);
    previousWeekEnd.setDate(currentWeekEnd.getDate() - 7);

    const [currentWeek, previousWeek] = await Promise.all([
      this.getProductivityStats('custom', {
        start: currentWeekStart.toISOString(),
        end: currentWeekEnd.toISOString(),
      }),
      this.getProductivityStats('custom', {
        start: previousWeekStart.toISOString(),
        end: previousWeekEnd.toISOString(),
      }),
    ]);

    const comparison = {
      timeDifference: currentWeek.totalTimeHours - previousWeek.totalTimeHours,
      productivityDifference: currentWeek.averageProductivity - previousWeek.averageProductivity,
      sessionsDifference: currentWeek.sessionCount - previousWeek.sessionCount,
    };

    return {
      currentWeek,
      previousWeek,
      comparison,
    };
  }

  /**
   * Get productivity trends (last 7 days)
   */
  static async getProductivityTrends(): Promise<{
    dailyStats: Array<{
      date: string;
      totalHours: number;
      productivity: number;
      sessions: number;
    }>;
    weeklyAverage: {
      hours: number;
      productivity: number;
      sessions: number;
    };
  }> {
    const dailyStats = [];
    const promises = [];

    // Get data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      promises.push(
        this.getProductivityStats('custom', {
          start: date.toISOString(),
          end: endDate.toISOString(),
        }).then(stats => ({
          date: date.toISOString().split('T')[0],
          totalHours: stats.totalTimeHours,
          productivity: stats.averageProductivity,
          sessions: stats.sessionCount,
        }))
      );
    }

    const results = await Promise.all(promises);
    dailyStats.push(...results);

    // Calculate weekly averages
    const weeklyAverage = {
      hours: dailyStats.reduce((sum, day) => sum + day.totalHours, 0) / 7,
      productivity: dailyStats.reduce((sum, day) => sum + day.productivity, 0) / 7,
      sessions: Math.round(dailyStats.reduce((sum, day) => sum + day.sessions, 0) / 7),
    };

    return {
      dailyStats,
      weeklyAverage,
    };
  }
}

// Export singleton instance for convenience
export const activityService = ActivityService;

export default ActivityService;