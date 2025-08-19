/**
 * Life Tracker Pro - Analytics Service Frontend
 * Frontend service for advanced analytics functionality
 */

import apiClient from './client';

export interface ProductivityMetrics {
  productivityScore: number;
  consistencyScore: number;
  efficiencyScore: number;
  balanceScore: number;
  improvementRate: number;
  streak: number;
}

export interface CategoryMetrics {
  category: string;
  totalTime: number;
  sessionCount: number;
  avgSessionLength: number;
  productivityScore: number;
  efficiency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

export interface TimeSlotMetrics {
  hour: number;
  productivity: number;
  activityCount: number;
  dominantCategory: string;
  efficiency: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  slope: number;
  correlation: number;
  anomalies: Array<{ date: Date; value: number }>;
  predictions: Array<{ date: Date; value: number }>;
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  metadata?: any;
}

export interface WeeklyReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalTime: number;
    totalSessions: number;
    avgDailyTime: number;
    productivityScore: number;
    topCategory: string;
    improvement: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface MonthlyReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalTime: number;
    totalSessions: number;
    avgWeeklyTime: number;
    productivityTrend: 'up' | 'down' | 'stable';
    bestWeek: string;
    consistency: number;
  };
  goals: {
    achieved: number;
    total: number;
    percentage: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface ProductivityDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface SessionLengthDistribution {
  range: string;
  count: number;
  percentage: number;
  avgProductivity: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get comprehensive productivity metrics
   */
  async getMetrics(filters?: {
    startDate?: string;
    endDate?: string;
    categories?: string[];
  }): Promise<{
    overall: ProductivityMetrics;
    categories: CategoryMetrics[];
    timeSlots: TimeSlotMetrics[];
  }> {
    const cacheKey = `metrics-${JSON.stringify(filters)}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const params: any = {};
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.categories) params.categories = filters.categories.join(',');

      const response = await apiClient.get('/api/analytics/metrics', { params });
      const data = response.data.data;
      
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw new Error('Failed to load productivity metrics');
    }
  }

  /**
   * Get trend analysis
   */
  async getTrends(days: number = 30, category?: string): Promise<{
    productivityTrend: TrendAnalysis;
    categoryTrends: Array<{ category: string; trend: TrendAnalysis }>;
    patterns: any[];
    cycles: any;
  }> {
    const cacheKey = `trends-${days}-${category || 'all'}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const params: any = { days };
      if (category) params.category = category;

      const response = await apiClient.get('/api/analytics/trends', { params });
      const data = response.data.data;
      
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get trends:', error);
      throw new Error('Failed to load trend analysis');
    }
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(
    metric: 'productivity' | 'time' | 'sessions' = 'productivity',
    interval: 'hour' | 'day' | 'week' | 'month' = 'day',
    filters?: {
      startDate?: string;
      endDate?: string;
      categories?: string[];
    }
  ): Promise<TimeSeriesData[]> {
    const cacheKey = `timeseries-${metric}-${interval}-${JSON.stringify(filters)}`;
    const cached = this.getCachedData<TimeSeriesData[]>(cacheKey);
    if (cached) return cached;

    try {
      const params: any = { metric, interval };
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.categories) params.categories = filters.categories.join(',');

      const response = await apiClient.get('/api/analytics/time-series', { params });
      const timeSeries = response.data.data.timeSeries.map((point: any) => ({
        ...point,
        date: new Date(point.date)
      }));
      
      this.setCachedData(cacheKey, timeSeries);
      return timeSeries;
    } catch (error) {
      console.error('Failed to get time series:', error);
      throw new Error('Failed to load time series data');
    }
  }

  /**
   * Get data distributions
   */
  async getDistributions(type: 'all' | 'productivity' | 'sessionLength' | 'daily' | 'category' = 'all'): Promise<{
    productivity?: ProductivityDistribution[];
    sessionLength?: SessionLengthDistribution[];
    daily?: any;
    category?: CategoryMetrics[];
  }> {
    const cacheKey = `distributions-${type}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/analytics/distributions', { 
        params: { type } 
      });
      const data = response.data.data;
      
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get distributions:', error);
      throw new Error('Failed to load data distributions');
    }
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(weekStart: Date): Promise<WeeklyReport> {
    try {
      const response = await apiClient.post('/api/analytics/reports/weekly', {
        weekStart: weekStart.toISOString()
      });
      
      const report = response.data.data;
      
      // Convert date strings back to Date objects
      report.period.start = new Date(report.period.start);
      report.period.end = new Date(report.period.end);
      
      return report;
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw new Error('Failed to generate weekly report');
    }
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(monthStart: Date): Promise<MonthlyReport> {
    try {
      const response = await apiClient.post('/api/analytics/reports/monthly', {
        monthStart: monthStart.toISOString()
      });
      
      const report = response.data.data;
      
      // Convert date strings back to Date objects
      report.period.start = new Date(report.period.start);
      report.period.end = new Date(report.period.end);
      
      return report;
    } catch (error) {
      console.error('Failed to generate monthly report:', error);
      throw new Error('Failed to generate monthly report');
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
    title?: string
  ): Promise<any> {
    try {
      const response = await apiClient.post('/api/analytics/reports/custom', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filters,
        title
      });
      
      const report = response.data.data;
      
      // Convert date strings back to Date objects
      report.period.start = new Date(report.period.start);
      report.period.end = new Date(report.period.end);
      
      return report;
    } catch (error) {
      console.error('Failed to generate custom report:', error);
      throw new Error('Failed to generate custom report');
    }
  }

  /**
   * Get productivity predictions
   */
  async getPredictions(daysAhead: number = 7): Promise<{
    predictions: Array<{ date: Date; value: number }>;
    confidence: number;
    factors: string[];
  }> {
    const cacheKey = `predictions-${daysAhead}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/analytics/predictions', {
        params: { daysAhead }
      });
      
      const data = response.data.data.prediction;
      
      // Convert date strings to Date objects
      data.predictions = data.predictions.map((pred: any) => ({
        ...pred,
        date: new Date(pred.date)
      }));
      
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get predictions:', error);
      throw new Error('Failed to load productivity predictions');
    }
  }

  /**
   * Get analytics summary
   */
  async getSummary(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    metrics: ProductivityMetrics;
    categoryMetrics: CategoryMetrics[];
    trends: TrendAnalysis;
    sessionCount: number;
  }> {
    const cacheKey = `summary-${period}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/analytics/summary', {
        params: { period }
      });
      
      const data = response.data.data;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      throw new Error('Failed to load analytics summary');
    }
  }

  /**
   * Get seasonal patterns
   */
  async getSeasonalPatterns(): Promise<any> {
    const cacheKey = 'seasonal-patterns';
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/analytics/seasonality');
      const data = response.data.data;
      
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get seasonal patterns:', error);
      throw new Error('Failed to load seasonal patterns');
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Utility methods
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable'): string {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      work: '💼',
      study: '📚',
      exercise: '💪',
      personal: '👤',
      creative: '🎨',
      uncategorized: '📁'
    };
    
    return icons[category] || '📊';
  }
}

export const analyticsService = AnalyticsService.getInstance();