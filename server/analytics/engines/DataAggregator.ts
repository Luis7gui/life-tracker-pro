/**
 * Life Tracker Pro - Data Aggregator
 * Powerful data aggregation and processing engine
 */

import { ActivitySession } from '../../models/ActivitySession';

export interface TimeSeriesData {
  date: Date;
  value: number;
  metadata?: any;
}

export interface AggregatedMetrics {
  totalTime: number;
  sessionCount: number;
  avgSessionLength: number;
  avgProductivity: number;
  categories: CategoryAggregation[];
  timeSlots: TimeSlotAggregation[];
  trends: {
    productivity: number;
    consistency: number;
    activity: number;
  };
}

export interface CategoryAggregation {
  category: string;
  totalTime: number;
  sessionCount: number;
  avgProductivity: number;
  percentage: number;
  trend: number;
}

export interface TimeSlotAggregation {
  hour: number;
  totalTime: number;
  sessionCount: number;
  avgProductivity: number;
  dominantCategory: string;
}

export interface PeriodComparison {
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
  changes: {
    totalTime: number;
    sessionCount: number;
    avgProductivity: number;
    consistency: number;
  };
  insights: string[];
}

export interface CustomAggregation {
  filters: {
    categories?: string[];
    dateRange?: { start: Date; end: Date };
    timeRange?: { startHour: number; endHour: number };
    minDuration?: number;
    minProductivity?: number;
  };
  groupBy: 'day' | 'week' | 'month' | 'category' | 'hour';
  metrics: AggregatedMetrics;
  timeSeries: TimeSeriesData[];
}

export class DataAggregator {

  /**
   * Aggregate sessions by time period
   */
  static aggregateByPeriod(
    sessions: ActivitySession[],
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date
  ): { [key: string]: AggregatedMetrics } {
    const filteredSessions = this.filterSessionsByDateRange(sessions, startDate, endDate);
    const groupedSessions = this.groupSessionsByPeriod(filteredSessions, period);
    
    const result: { [key: string]: AggregatedMetrics } = {};
    
    Object.entries(groupedSessions).forEach(([periodKey, periodSessions]) => {
      result[periodKey] = this.calculateAggregatedMetrics(periodSessions);
    });
    
    return result;
  }

  /**
   * Aggregate sessions by category
   */
  static aggregateByCategory(
    sessions: ActivitySession[],
    includeSubcategories: boolean = false
  ): CategoryAggregation[] {
    const categoryGroups = this.groupSessionsByCategory(sessions, includeSubcategories);
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    return Object.entries(categoryGroups).map(([category, categorySessions]) => {
      const categoryTime = categorySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const avgProductivity = this.calculateAverageProductivity(categorySessions);
      const trend = this.calculateCategoryTrend(categorySessions);
      
      return {
        category,
        totalTime: categoryTime,
        sessionCount: categorySessions.length,
        avgProductivity,
        percentage: totalTime > 0 ? (categoryTime / totalTime) * 100 : 0,
        trend
      };
    }).sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Aggregate sessions by time slots (hourly)
   */
  static aggregateByTimeSlots(sessions: ActivitySession[]): TimeSlotAggregation[] {
    const hourlyGroups = this.groupSessionsByHour(sessions);
    
    return Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = hourlyGroups[hour] || [];
      const totalTime = hourSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const avgProductivity = this.calculateAverageProductivity(hourSessions);
      const dominantCategory = this.findDominantCategory(hourSessions);
      
      return {
        hour,
        totalTime,
        sessionCount: hourSessions.length,
        avgProductivity,
        dominantCategory
      };
    });
  }

  /**
   * Create time series data for visualization
   */
  static createTimeSeries(
    sessions: ActivitySession[],
    metric: 'productivity' | 'time' | 'sessions',
    interval: 'hour' | 'day' | 'week' | 'month',
    startDate?: Date,
    endDate?: Date
  ): TimeSeriesData[] {
    const filteredSessions = this.filterSessionsByDateRange(sessions, startDate, endDate);
    const groupedData = this.groupSessionsByInterval(filteredSessions, interval);
    
    return Object.entries(groupedData).map(([dateKey, intervalSessions]) => {
      let value: number;
      
      switch (metric) {
        case 'productivity':
          value = this.calculateAverageProductivity(intervalSessions);
          break;
        case 'time':
          value = intervalSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
          break;
        case 'sessions':
          value = intervalSessions.length;
          break;
        default:
          value = 0;
      }
      
      return {
        date: new Date(dateKey),
        value,
        metadata: {
          sessionCount: intervalSessions.length,
          categories: this.getUniqueCategories(intervalSessions)
        }
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Compare two time periods
   */
  static comparePeriods(
    currentSessions: ActivitySession[],
    previousSessions: ActivitySession[]
  ): PeriodComparison {
    const current = this.calculateAggregatedMetrics(currentSessions);
    const previous = this.calculateAggregatedMetrics(previousSessions);
    
    const changes = {
      totalTime: current.totalTime - previous.totalTime,
      sessionCount: current.sessionCount - previous.sessionCount,
      avgProductivity: current.avgProductivity - previous.avgProductivity,
      consistency: current.trends.consistency - previous.trends.consistency
    };
    
    const insights = this.generateComparisonInsights(changes, current, previous);
    
    return {
      current,
      previous,
      changes,
      insights
    };
  }

  /**
   * Create custom aggregation with filters
   */
  static createCustomAggregation(
    sessions: ActivitySession[],
    filters: CustomAggregation['filters'],
    groupBy: CustomAggregation['groupBy']
  ): CustomAggregation {
    const filteredSessions = this.applyFilters(sessions, filters);
    const metrics = this.calculateAggregatedMetrics(filteredSessions);
    
    let timeSeries: TimeSeriesData[] = [];
    
    switch (groupBy) {
      case 'day':
        timeSeries = this.createTimeSeries(filteredSessions, 'productivity', 'day');
        break;
      case 'week':
        timeSeries = this.createTimeSeries(filteredSessions, 'productivity', 'week');
        break;
      case 'month':
        timeSeries = this.createTimeSeries(filteredSessions, 'productivity', 'month');
        break;
      case 'hour':
        timeSeries = this.createTimeSeries(filteredSessions, 'productivity', 'hour');
        break;
      case 'category':
        // Create category-based time series
        timeSeries = this.createCategoryTimeSeries(filteredSessions);
        break;
    }
    
    return {
      filters,
      groupBy,
      metrics,
      timeSeries
    };
  }

  /**
   * Calculate productivity distribution
   */
  static calculateProductivityDistribution(
    sessions: ActivitySession[],
    buckets: number = 10
  ): { range: string; count: number; percentage: number }[] {
    const productivityValues = sessions
      .filter(s => s.productivity !== undefined && s.productivity !== null)
      .map(s => s.productivity!);
    
    if (productivityValues.length === 0) return [];
    
    const bucketSize = 100 / buckets;
    const distribution = Array.from({ length: buckets }, (_, i) => {
      const rangeStart = i * bucketSize;
      const rangeEnd = (i + 1) * bucketSize;
      const range = `${rangeStart}-${rangeEnd}%`;
      
      const count = productivityValues.filter(p => 
        p >= rangeStart && (i === buckets - 1 ? p <= rangeEnd : p < rangeEnd)
      ).length;
      
      const percentage = (count / productivityValues.length) * 100;
      
      return { range, count, percentage };
    });
    
    return distribution;
  }

  /**
   * Calculate session length distribution
   */
  static calculateSessionLengthDistribution(
    sessions: ActivitySession[]
  ): { range: string; count: number; percentage: number; avgProductivity: number }[] {
    const ranges = [
      { min: 0, max: 900, label: '0-15min' },      // Short sessions
      { min: 900, max: 1800, label: '15-30min' },  // Pomodoro-like
      { min: 1800, max: 3600, label: '30-60min' }, // Medium sessions
      { min: 3600, max: 7200, label: '1-2h' },     // Long sessions
      { min: 7200, max: Infinity, label: '2h+' }   // Extended sessions
    ];
    
    return ranges.map(range => {
      const rangeSessions = sessions.filter(s => {
        const duration = s.duration || 0;
        return duration >= range.min && duration < range.max;
      });
      
      const count = rangeSessions.length;
      const percentage = sessions.length > 0 ? (count / sessions.length) * 100 : 0;
      const avgProductivity = this.calculateAverageProductivity(rangeSessions);
      
      return {
        range: range.label,
        count,
        percentage,
        avgProductivity
      };
    });
  }

  /**
   * Calculate daily patterns
   */
  static calculateDailyPatterns(sessions: ActivitySession[]): {
    hourlyDistribution: { hour: number; count: number; avgProductivity: number }[];
    dayOfWeekDistribution: { day: string; count: number; avgProductivity: number }[];
    peakHours: number[];
    optimalWorkingHours: { start: number; end: number; productivity: number };
  } {
    const hourlyDistribution = this.aggregateByTimeSlots(sessions).map(slot => ({
      hour: slot.hour,
      count: slot.sessionCount,
      avgProductivity: slot.avgProductivity
    }));
    
    const dayOfWeekDistribution = this.calculateDayOfWeekDistribution(sessions);
    const peakHours = this.findPeakProductivityHours(sessions);
    const optimalWorkingHours = this.findOptimalWorkingHours(sessions);
    
    return {
      hourlyDistribution,
      dayOfWeekDistribution,
      peakHours,
      optimalWorkingHours
    };
  }

  // Helper Methods

  private static filterSessionsByDateRange(
    sessions: ActivitySession[],
    startDate?: Date,
    endDate?: Date
  ): ActivitySession[] {
    return sessions.filter(session => {
      const sessionDate = session.startTime;
      
      if (startDate && sessionDate < startDate) return false;
      if (endDate && sessionDate > endDate) return false;
      
      return true;
    });
  }

  private static groupSessionsByPeriod(
    sessions: ActivitySession[],
    period: 'day' | 'week' | 'month' | 'year'
  ): { [key: string]: ActivitySession[] } {
    const groups: { [key: string]: ActivitySession[] } = {};
    
    sessions.forEach(session => {
      let key: string;
      const date = session.startTime;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          key = this.getWeekKey(date);
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    
    return groups;
  }

  private static groupSessionsByCategory(
    sessions: ActivitySession[],
    includeSubcategories: boolean
  ): { [category: string]: ActivitySession[] } {
    const groups: { [category: string]: ActivitySession[] } = {};
    
    sessions.forEach(session => {
      let category = session.category || 'uncategorized';
      
      if (!includeSubcategories && category.includes(':')) {
        category = category.split(':')[0];
      }
      
      if (!groups[category]) groups[category] = [];
      groups[category].push(session);
    });
    
    return groups;
  }

  private static groupSessionsByHour(sessions: ActivitySession[]): { [hour: number]: ActivitySession[] } {
    const groups: { [hour: number]: ActivitySession[] } = {};
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(session);
    });
    
    return groups;
  }

  private static groupSessionsByInterval(
    sessions: ActivitySession[],
    interval: 'hour' | 'day' | 'week' | 'month'
  ): { [key: string]: ActivitySession[] } {
    const groups: { [key: string]: ActivitySession[] } = {};
    
    sessions.forEach(session => {
      let key: string;
      const date = session.startTime;
      
      switch (interval) {
        case 'hour':
          key = `${date.toISOString().split('T')[0]}-${String(date.getHours()).padStart(2, '0')}`;
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          key = this.getWeekKey(date);
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    
    return groups;
  }

  private static calculateAggregatedMetrics(sessions: ActivitySession[]): AggregatedMetrics {
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const sessionCount = sessions.length;
    const avgSessionLength = sessionCount > 0 ? totalTime / sessionCount : 0;
    const avgProductivity = this.calculateAverageProductivity(sessions);
    
    const categories = this.aggregateByCategory(sessions);
    const timeSlots = this.aggregateByTimeSlots(sessions);
    
    const trends = {
      productivity: this.calculateProductivityTrend(sessions),
      consistency: this.calculateConsistencyTrend(sessions),
      activity: this.calculateActivityTrend(sessions)
    };
    
    return {
      totalTime,
      sessionCount,
      avgSessionLength,
      avgProductivity,
      categories,
      timeSlots,
      trends
    };
  }

  private static calculateAverageProductivity(sessions: ActivitySession[]): number {
    const validSessions = sessions.filter(s => s.productivity !== undefined && s.productivity !== null);
    if (validSessions.length === 0) return 0;
    
    return validSessions.reduce((sum, s) => sum + s.productivity!, 0) / validSessions.length;
  }

  private static calculateCategoryTrend(sessions: ActivitySession[]): number {
    // Simple trend calculation - could be enhanced with time-based weighting
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));
    
    const firstHalfProductivity = this.calculateAverageProductivity(firstHalf);
    const secondHalfProductivity = this.calculateAverageProductivity(secondHalf);
    
    return secondHalfProductivity - firstHalfProductivity;
  }

  private static findDominantCategory(sessions: ActivitySession[]): string {
    if (sessions.length === 0) return 'none';
    
    const categoryTimes: { [category: string]: number } = {};
    
    sessions.forEach(session => {
      const category = session.category || 'uncategorized';
      categoryTimes[category] = (categoryTimes[category] || 0) + (session.duration || 0);
    });
    
    return Object.entries(categoryTimes).reduce((dominant, [category, time]) => 
      time > dominant.time ? { category, time } : dominant,
      { category: 'none', time: 0 }
    ).category;
  }

  private static getUniqueCategories(sessions: ActivitySession[]): string[] {
    return Array.from(new Set(sessions.map(s => s.category || 'uncategorized')));
  }

  private static applyFilters(
    sessions: ActivitySession[],
    filters: CustomAggregation['filters']
  ): ActivitySession[] {
    return sessions.filter(session => {
      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(session.category || 'uncategorized')) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const sessionDate = session.startTime;
        if (sessionDate < filters.dateRange.start || sessionDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Time range filter
      if (filters.timeRange) {
        const hour = session.startTime.getHours();
        if (hour < filters.timeRange.startHour || hour > filters.timeRange.endHour) {
          return false;
        }
      }
      
      // Duration filter
      if (filters.minDuration && (session.duration || 0) < filters.minDuration) {
        return false;
      }
      
      // Productivity filter
      if (filters.minProductivity && (session.productivity || 0) < filters.minProductivity) {
        return false;
      }
      
      return true;
    });
  }

  private static createCategoryTimeSeries(sessions: ActivitySession[]): TimeSeriesData[] {
    const categories = this.getUniqueCategories(sessions);
    
    return categories.map(category => {
      const categorySessions = sessions.filter(s => (s.category || 'uncategorized') === category);
      const avgProductivity = this.calculateAverageProductivity(categorySessions);
      
      return {
        date: new Date(), // Placeholder date
        value: avgProductivity,
        metadata: { category, sessionCount: categorySessions.length }
      };
    });
  }

  private static generateComparisonInsights(
    changes: PeriodComparison['changes'],
    current: AggregatedMetrics,
    previous: AggregatedMetrics
  ): string[] {
    const insights: string[] = [];
    
    if (changes.avgProductivity > 5) {
      insights.push(`Productivity improved by ${changes.avgProductivity.toFixed(1)}% this period.`);
    } else if (changes.avgProductivity < -5) {
      insights.push(`Productivity decreased by ${Math.abs(changes.avgProductivity).toFixed(1)}% this period.`);
    }
    
    if (changes.totalTime > 3600) { // More than 1 hour
      insights.push(`You spent ${Math.round(changes.totalTime / 3600)} more hours on activities this period.`);
    }
    
    if (changes.sessionCount > 0) {
      insights.push(`You had ${changes.sessionCount} more sessions this period.`);
    }
    
    return insights;
  }

  private static calculateDayOfWeekDistribution(sessions: ActivitySession[]): 
    { day: string; count: number; avgProductivity: number }[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayGroups = this.groupSessionsByDayOfWeek(sessions);
    
    return dayNames.map((dayName, index) => {
      const daySessions = dayGroups[index] || [];
      return {
        day: dayName,
        count: daySessions.length,
        avgProductivity: this.calculateAverageProductivity(daySessions)
      };
    });
  }

  private static groupSessionsByDayOfWeek(sessions: ActivitySession[]): { [day: number]: ActivitySession[] } {
    const groups: { [day: number]: ActivitySession[] } = {};
    
    sessions.forEach(session => {
      const day = session.startTime.getDay();
      if (!groups[day]) groups[day] = [];
      groups[day].push(session);
    });
    
    return groups;
  }

  private static findPeakProductivityHours(sessions: ActivitySession[]): number[] {
    const hourlyData = this.aggregateByTimeSlots(sessions);
    const sortedHours = hourlyData
      .filter(slot => slot.sessionCount > 0)
      .sort((a, b) => b.avgProductivity - a.avgProductivity);
    
    return sortedHours.slice(0, 3).map(slot => slot.hour);
  }

  private static findOptimalWorkingHours(sessions: ActivitySession[]): 
    { start: number; end: number; productivity: number } {
    const hourlyData = this.aggregateByTimeSlots(sessions);
    const workingHours = hourlyData.filter(slot => slot.sessionCount > 0 && slot.hour >= 6 && slot.hour <= 22);
    
    if (workingHours.length === 0) {
      return { start: 9, end: 17, productivity: 0 };
    }
    
    // Find the consecutive 4-hour block with highest average productivity
    let bestStart = 9;
    let bestProductivity = 0;
    
    for (let start = 6; start <= 18; start++) {
      const block = workingHours.filter(slot => slot.hour >= start && slot.hour < start + 4);
      if (block.length === 4) {
        const avgProductivity = block.reduce((sum, slot) => sum + slot.avgProductivity, 0) / 4;
        if (avgProductivity > bestProductivity) {
          bestProductivity = avgProductivity;
          bestStart = start;
        }
      }
    }
    
    return {
      start: bestStart,
      end: bestStart + 4,
      productivity: bestProductivity
    };
  }

  private static getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    return startOfWeek.toISOString().split('T')[0];
  }

  private static calculateProductivityTrend(sessions: ActivitySession[]): number {
    if (sessions.length < 2) return 0;
    
    // Simple linear trend calculation
    const productivities = sessions.map(s => s.productivity || 0);
    const n = productivities.length;
    const xSum = n * (n - 1) / 2;
    const ySum = productivities.reduce((sum, p) => sum + p, 0);
    const xySum = productivities.reduce((sum, p, i) => sum + (p * i), 0);
    const xxSum = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return isNaN(slope) ? 0 : slope;
  }

  private static calculateConsistencyTrend(sessions: ActivitySession[]): number {
    if (sessions.length < 7) return 0;
    
    // Calculate consistency as inverse of productivity variance
    const productivities = sessions.map(s => s.productivity || 0);
    const mean = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
    const variance = productivities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / productivities.length;
    
    return Math.max(0, 100 - variance);
  }

  private static calculateActivityTrend(sessions: ActivitySession[]): number {
    if (sessions.length < 7) return 0;
    
    // Calculate activity trend based on session frequency
    const dailyGroups = this.groupSessionsByPeriod(sessions, 'day');
    const dailyCounts = Object.values(dailyGroups).map(daySessions => daySessions.length);
    
    const firstHalf = dailyCounts.slice(0, Math.floor(dailyCounts.length / 2));
    const secondHalf = dailyCounts.slice(Math.floor(dailyCounts.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, count) => sum + count, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, count) => sum + count, 0) / secondHalf.length;
    
    return secondHalfAvg - firstHalfAvg;
  }
}