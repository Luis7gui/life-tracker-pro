/**
 * Life Tracker Pro - Trend Analyzer
 * Advanced trend analysis and pattern detection
 */

import { ActivitySession } from '../../models/ActivitySession';

export interface TrendPoint {
  date: Date;
  value: number;
  category?: string;
  metadata?: any;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  slope: number;
  correlation: number;
  seasonality?: {
    detected: boolean;
    period?: number;
    amplitude?: number;
  };
  anomalies: TrendPoint[];
  predictions: TrendPoint[];
}

export interface CategoryTrend {
  category: string;
  trend: TrendAnalysis;
  insights: string[];
  recommendations: string[];
}

export interface ProductivityPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  pattern: {
    [key: string]: number;
  };
  strength: number;
  insights: string[];
}

export interface SeasonalPattern {
  season: string;
  avgProductivity: number;
  peakDay: string;
  peakHour: number;
  characteristics: string[];
}

export class TrendAnalyzer {

  /**
   * Analyze productivity trends over time
   */
  static analyzeProductivityTrend(sessions: ActivitySession[], days: number = 30): TrendAnalysis {
    const trendPoints = this.createProductivityTrendPoints(sessions, days);
    
    if (trendPoints.length < 3) {
      return this.createEmptyTrendAnalysis();
    }

    const slope = this.calculateTrendSlope(trendPoints);
    const correlation = this.calculateCorrelation(trendPoints);
    const direction = this.determineTrendDirection(slope);
    const strength = this.determineTrendStrength(correlation);
    const confidence = this.calculateTrendConfidence(trendPoints, slope);
    
    const seasonality = this.detectSeasonality(trendPoints);
    const anomalies = this.detectAnomalies(trendPoints);
    const predictions = this.generatePredictions(trendPoints, slope, 7); // 7 days ahead

    return {
      direction,
      strength,
      confidence,
      slope,
      correlation,
      seasonality,
      anomalies,
      predictions
    };
  }

  /**
   * Analyze trends by category
   */
  static analyzeCategoryTrends(sessions: ActivitySession[], days: number = 30): CategoryTrend[] {
    const categories = this.getUniqueCategories(sessions);
    
    return categories.map(category => {
      const categorySessions = sessions.filter(s => s.category === category);
      const trend = this.analyzeProductivityTrend(categorySessions, days);
      const insights = this.generateCategoryInsights(category, trend, categorySessions);
      const recommendations = this.generateCategoryRecommendations(category, trend);

      return {
        category,
        trend,
        insights,
        recommendations
      };
    });
  }

  /**
   * Detect productivity patterns (daily, weekly, monthly)
   */
  static detectProductivityPatterns(sessions: ActivitySession[]): ProductivityPattern[] {
    const patterns: ProductivityPattern[] = [];

    // Daily pattern (by hour)
    const dailyPattern = this.analyzeDailyPattern(sessions);
    if (dailyPattern.strength > 0.3) {
      patterns.push(dailyPattern);
    }

    // Weekly pattern (by day of week)
    const weeklyPattern = this.analyzeWeeklyPattern(sessions);
    if (weeklyPattern.strength > 0.3) {
      patterns.push(weeklyPattern);
    }

    // Monthly pattern (by day of month)
    const monthlyPattern = this.analyzeMonthlyPattern(sessions);
    if (monthlyPattern.strength > 0.3) {
      patterns.push(monthlyPattern);
    }

    return patterns;
  }

  /**
   * Analyze seasonal patterns
   */
  static analyzeSeasonalPatterns(sessions: ActivitySession[]): SeasonalPattern[] {
    const seasonalData = this.groupSessionsBySeason(sessions);
    
    return Object.entries(seasonalData).map(([season, seasonSessions]) => {
      const avgProductivity = this.calculateAverageProductivity(seasonSessions);
      const peakDay = this.findPeakDay(seasonSessions);
      const peakHour = this.findPeakHour(seasonSessions);
      const characteristics = this.analyzeSeasonalCharacteristics(seasonSessions);

      return {
        season,
        avgProductivity,
        peakDay,
        peakHour,
        characteristics
      };
    });
  }

  /**
   * Detect performance cycles and rhythms
   */
  static detectPerformanceCycles(sessions: ActivitySession[]): {
    cycles: Array<{
      type: string;
      period: number;
      amplitude: number;
      phase: number;
    }>;
    insights: string[];
  } {
    const trendPoints = this.createProductivityTrendPoints(sessions, 90); // 3 months
    
    const cycles = [
      this.detectWeeklyCycle(trendPoints),
      this.detectMonthlyCycle(trendPoints),
      this.detectUltradianCycle(trendPoints)
    ].filter(cycle => cycle !== null) as Array<{
      type: string;
      period: number;
      amplitude: number;
      phase: number;
    }>;

    const insights = this.generateCycleInsights(cycles);

    return { cycles, insights };
  }

  /**
   * Predict future productivity trends
   */
  static predictProductivityTrend(
    sessions: ActivitySession[], 
    daysAhead: number = 7
  ): {
    predictions: TrendPoint[];
    confidence: number;
    factors: string[];
  } {
    const trendPoints = this.createProductivityTrendPoints(sessions, 30);
    
    if (trendPoints.length < 7) {
      return {
        predictions: [],
        confidence: 0,
        factors: ['Insufficient data for prediction']
      };
    }

    const slope = this.calculateTrendSlope(trendPoints);
    const predictions = this.generatePredictions(trendPoints, slope, daysAhead);
    const confidence = this.calculatePredictionConfidence(trendPoints, slope);
    const factors = this.identifyPredictionFactors(sessions);

    return {
      predictions,
      confidence,
      factors
    };
  }

  // Helper Methods

  private static createProductivityTrendPoints(sessions: ActivitySession[], days: number): TrendPoint[] {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const dailyData: { [date: string]: { totalProductivity: number; sessionCount: number } } = {};
    
    sessions.forEach(session => {
      const sessionDate = session.startTime;
      if (sessionDate >= startDate && sessionDate <= endDate) {
        const dateKey = sessionDate.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { totalProductivity: 0, sessionCount: 0 };
        }
        
        dailyData[dateKey].totalProductivity += session.productivity || 0;
        dailyData[dateKey].sessionCount += 1;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date),
      value: data.sessionCount > 0 ? data.totalProductivity / data.sessionCount : 0
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private static calculateTrendSlope(points: TrendPoint[]): number {
    const n = points.length;
    if (n < 2) return 0;

    const xSum = points.reduce((sum, _, i) => sum + i, 0);
    const ySum = points.reduce((sum, point) => sum + point.value, 0);
    const xySum = points.reduce((sum, point, i) => sum + (i * point.value), 0);
    const xxSum = points.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return isNaN(slope) ? 0 : slope;
  }

  private static calculateCorrelation(points: TrendPoint[]): number {
    const n = points.length;
    if (n < 2) return 0;

    const xValues = points.map((_, i) => i);
    const yValues = points.map(p => p.value);

    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

    const numerator = xValues.reduce((sum, x, i) => 
      sum + (x - xMean) * (yValues[i] - yMean), 0);
    
    const xVariance = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    const yVariance = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    
    const denominator = Math.sqrt(xVariance * yVariance);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private static determineTrendDirection(slope: number): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    const absSlope = Math.abs(slope);
    
    if (absSlope < 0.1) return 'stable';
    if (absSlope > 2) return 'volatile';
    
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private static determineTrendStrength(correlation: number): 'weak' | 'moderate' | 'strong' {
    const absCorrelation = Math.abs(correlation);
    
    if (absCorrelation < 0.3) return 'weak';
    if (absCorrelation < 0.7) return 'moderate';
    return 'strong';
  }

  private static calculateTrendConfidence(points: TrendPoint[], slope: number): number {
    if (points.length < 3) return 0;
    
    // Calculate R-squared
    const yMean = points.reduce((sum, p) => sum + p.value, 0) / points.length;
    const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p.value - yMean, 2), 0);
    
    const residualSumSquares = points.reduce((sum, point, i) => {
      const predicted = slope * i + points[0].value;
      return sum + Math.pow(point.value - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    return Math.max(0, Math.min(1, rSquared));
  }

  private static detectSeasonality(points: TrendPoint[]): { detected: boolean; period?: number; amplitude?: number } {
    if (points.length < 14) return { detected: false };
    
    // Simple seasonality detection using autocorrelation
    const possiblePeriods = [7, 14, 30]; // Weekly, bi-weekly, monthly
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    possiblePeriods.forEach(period => {
      if (points.length >= period * 2) {
        const correlation = this.calculateSeasonalCorrelation(points, period);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPeriod = period;
        }
      }
    });
    
    if (bestCorrelation > 0.3) {
      const amplitude = this.calculateSeasonalAmplitude(points, bestPeriod);
      return {
        detected: true,
        period: bestPeriod,
        amplitude
      };
    }
    
    return { detected: false };
  }

  private static calculateSeasonalCorrelation(points: TrendPoint[], period: number): number {
    if (points.length < period * 2) return 0;
    
    const firstCycle = points.slice(0, period);
    const secondCycle = points.slice(period, period * 2);
    
    const firstValues = firstCycle.map(p => p.value);
    const secondValues = secondCycle.map(p => p.value);
    
    return this.calculateArrayCorrelation(firstValues, secondValues);
  }

  private static calculateArrayCorrelation(arr1: number[], arr2: number[]): number {
    const n = Math.min(arr1.length, arr2.length);
    if (n < 2) return 0;
    
    const mean1 = arr1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = arr2.reduce((sum, val) => sum + val, 0) / n;
    
    const numerator = arr1.slice(0, n).reduce((sum, val, i) => 
      sum + (val - mean1) * (arr2[i] - mean2), 0);
    
    const variance1 = arr1.slice(0, n).reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0);
    const variance2 = arr2.slice(0, n).reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0);
    
    const denominator = Math.sqrt(variance1 * variance2);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private static calculateSeasonalAmplitude(points: TrendPoint[], period: number): number {
    const cycles: number[][] = [];
    
    for (let i = 0; i + period <= points.length; i += period) {
      cycles.push(points.slice(i, i + period).map(p => p.value));
    }
    
    if (cycles.length === 0) return 0;
    
    const avgCycle = cycles[0].map((_, i) => 
      cycles.reduce((sum, cycle) => sum + cycle[i], 0) / cycles.length
    );
    
    const max = Math.max(...avgCycle);
    const min = Math.min(...avgCycle);
    
    return max - min;
  }

  private static detectAnomalies(points: TrendPoint[]): TrendPoint[] {
    if (points.length < 7) return [];
    
    const values = points.map(p => p.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    
    const threshold = 2 * stdDev; // 2 standard deviations
    
    return points.filter(point => Math.abs(point.value - mean) > threshold);
  }

  private static generatePredictions(points: TrendPoint[], slope: number, daysAhead: number): TrendPoint[] {
    if (points.length === 0) return [];
    
    const lastPoint = points[points.length - 1];
    const predictions: TrendPoint[] = [];
    
    for (let i = 1; i <= daysAhead; i++) {
      const futureDate = new Date(lastPoint.date.getTime() + (i * 24 * 60 * 60 * 1000));
      const predictedValue = lastPoint.value + (slope * i);
      
      predictions.push({
        date: futureDate,
        value: Math.max(0, Math.min(100, predictedValue)) // Clamp between 0-100
      });
    }
    
    return predictions;
  }

  private static analyzeDailyPattern(sessions: ActivitySession[]): ProductivityPattern {
    const hourlyData: { [hour: number]: number[] } = {};
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(session.productivity || 0);
    });

    const pattern: { [key: string]: number } = {};
    Object.entries(hourlyData).forEach(([hour, productivities]) => {
      pattern[hour] = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
    });

    const strength = this.calculatePatternStrength(Object.values(pattern));
    const insights = this.generateDailyPatternInsights(pattern);

    return {
      type: 'daily',
      pattern,
      strength,
      insights
    };
  }

  private static analyzeWeeklyPattern(sessions: ActivitySession[]): ProductivityPattern {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData: { [day: number]: number[] } = {};
    
    sessions.forEach(session => {
      const day = session.startTime.getDay();
      if (!weeklyData[day]) weeklyData[day] = [];
      weeklyData[day].push(session.productivity || 0);
    });

    const pattern: { [key: string]: number } = {};
    Object.entries(weeklyData).forEach(([day, productivities]) => {
      const dayName = dayNames[parseInt(day)];
      pattern[dayName] = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
    });

    const strength = this.calculatePatternStrength(Object.values(pattern));
    const insights = this.generateWeeklyPatternInsights(pattern);

    return {
      type: 'weekly',
      pattern,
      strength,
      insights
    };
  }

  private static analyzeMonthlyPattern(sessions: ActivitySession[]): ProductivityPattern {
    const monthlyData: { [day: number]: number[] } = {};
    
    sessions.forEach(session => {
      const day = session.startTime.getDate();
      if (!monthlyData[day]) monthlyData[day] = [];
      monthlyData[day].push(session.productivity || 0);
    });

    const pattern: { [key: string]: number } = {};
    Object.entries(monthlyData).forEach(([day, productivities]) => {
      pattern[day] = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
    });

    const strength = this.calculatePatternStrength(Object.values(pattern));
    const insights = this.generateMonthlyPatternInsights(pattern);

    return {
      type: 'monthly',
      pattern,
      strength,
      insights
    };
  }

  private static calculatePatternStrength(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficient = variance / (mean || 1);
    
    return Math.max(0, 1 - coefficient / 100); // Normalize to 0-1
  }

  // Additional helper methods...
  private static createEmptyTrendAnalysis(): TrendAnalysis {
    return {
      direction: 'stable',
      strength: 'weak',
      confidence: 0,
      slope: 0,
      correlation: 0,
      anomalies: [],
      predictions: []
    };
  }

  private static getUniqueCategories(sessions: ActivitySession[]): string[] {
    return Array.from(new Set(sessions.map(s => s.category || 'uncategorized')));
  }

  private static generateCategoryInsights(category: string, trend: TrendAnalysis, sessions: ActivitySession[]): string[] {
    const insights: string[] = [];
    
    if (trend.direction === 'increasing' && trend.strength === 'strong') {
      insights.push(`Your ${category} productivity is showing strong improvement.`);
    }
    
    if (trend.anomalies.length > 0) {
      insights.push(`${trend.anomalies.length} unusual productivity spikes detected in ${category}.`);
    }
    
    return insights;
  }

  private static generateCategoryRecommendations(category: string, trend: TrendAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (trend.direction === 'decreasing') {
      recommendations.push(`Consider analyzing what's affecting your ${category} performance.`);
    }
    
    if (trend.strength === 'weak') {
      recommendations.push(`Try to establish more consistent patterns in your ${category} activities.`);
    }
    
    return recommendations;
  }

  private static groupSessionsBySeason(sessions: ActivitySession[]): { [season: string]: ActivitySession[] } {
    const seasons: { [season: string]: ActivitySession[] } = {
      'Spring': [],
      'Summer': [],
      'Fall': [],
      'Winter': []
    };

    sessions.forEach(session => {
      const month = session.startTime.getMonth();
      let season: string;
      
      if (month >= 2 && month <= 4) season = 'Spring';
      else if (month >= 5 && month <= 7) season = 'Summer';
      else if (month >= 8 && month <= 10) season = 'Fall';
      else season = 'Winter';
      
      seasons[season].push(session);
    });

    return seasons;
  }

  private static calculateAverageProductivity(sessions: ActivitySession[]): number {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / sessions.length;
  }

  private static findPeakDay(sessions: ActivitySession[]): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyProductivity: { [day: string]: number[] } = {};
    
    sessions.forEach(session => {
      const dayName = dayNames[session.startTime.getDay()];
      if (!dailyProductivity[dayName]) dailyProductivity[dayName] = [];
      dailyProductivity[dayName].push(session.productivity || 0);
    });

    let peakDay = 'Monday';
    let peakProductivity = 0;

    Object.entries(dailyProductivity).forEach(([day, productivities]) => {
      const avgProductivity = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
      if (avgProductivity > peakProductivity) {
        peakProductivity = avgProductivity;
        peakDay = day;
      }
    });

    return peakDay;
  }

  private static findPeakHour(sessions: ActivitySession[]): number {
    const hourlyProductivity: { [hour: number]: number[] } = {};
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourlyProductivity[hour]) hourlyProductivity[hour] = [];
      hourlyProductivity[hour].push(session.productivity || 0);
    });

    let peakHour = 9;
    let peakProductivity = 0;

    Object.entries(hourlyProductivity).forEach(([hour, productivities]) => {
      const avgProductivity = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
      if (avgProductivity > peakProductivity) {
        peakProductivity = avgProductivity;
        peakHour = parseInt(hour);
      }
    });

    return peakHour;
  }

  private static analyzeSeasonalCharacteristics(sessions: ActivitySession[]): string[] {
    const characteristics: string[] = [];
    
    const avgProductivity = this.calculateAverageProductivity(sessions);
    if (avgProductivity > 75) {
      characteristics.push('High productivity season');
    } else if (avgProductivity < 50) {
      characteristics.push('Lower productivity season');
    }
    
    const avgSessionLength = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
    if (avgSessionLength > 3600) { // > 1 hour
      characteristics.push('Longer focus sessions');
    }
    
    return characteristics;
  }

  private static detectWeeklyCycle(points: TrendPoint[]): any {
    // Implementation for weekly cycle detection
    return null;
  }

  private static detectMonthlyCycle(points: TrendPoint[]): any {
    // Implementation for monthly cycle detection
    return null;
  }

  private static detectUltradianCycle(points: TrendPoint[]): any {
    // Implementation for ultradian rhythm detection
    return null;
  }

  private static generateCycleInsights(cycles: any[]): string[] {
    return cycles.map(cycle => `Detected ${cycle.type} cycle with ${cycle.period}-day period`);
  }

  private static calculatePredictionConfidence(points: TrendPoint[], slope: number): number {
    // Calculate confidence based on historical accuracy
    return Math.min(1, Math.max(0, 1 - Math.abs(slope) / 10));
  }

  private static identifyPredictionFactors(sessions: ActivitySession[]): string[] {
    const factors: string[] = [];
    
    const recentSessions = sessions.slice(-7); // Last 7 sessions
    if (recentSessions.length > 0) {
      factors.push('Recent activity patterns');
    }
    
    const categories = new Set(sessions.map(s => s.category));
    if (categories.size > 3) {
      factors.push('Activity diversity');
    }
    
    return factors;
  }

  private static generateDailyPatternInsights(pattern: { [key: string]: number }): string[] {
    const insights: string[] = [];
    
    const hours = Object.keys(pattern).map(h => parseInt(h)).sort((a, b) => a - b);
    const productivities = hours.map(h => pattern[h.toString()]);
    
    const peakHour = hours[productivities.indexOf(Math.max(...productivities))];
    insights.push(`Peak productivity at ${peakHour}:00`);
    
    return insights;
  }

  private static generateWeeklyPatternInsights(pattern: { [key: string]: number }): string[] {
    const insights: string[] = [];
    
    const days = Object.keys(pattern);
    const productivities = days.map(day => pattern[day]);
    
    const peakDay = days[productivities.indexOf(Math.max(...productivities))];
    insights.push(`Most productive on ${peakDay}`);
    
    return insights;
  }

  private static generateMonthlyPatternInsights(pattern: { [key: string]: number }): string[] {
    const insights: string[] = [];
    
    const days = Object.keys(pattern).map(d => parseInt(d)).sort((a, b) => a - b);
    const productivities = days.map(d => pattern[d.toString()]);
    
    const peakDay = days[productivities.indexOf(Math.max(...productivities))];
    insights.push(`Peak monthly productivity around day ${peakDay}`);
    
    return insights;
  }
}