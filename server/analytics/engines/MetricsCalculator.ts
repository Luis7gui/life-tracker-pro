/**
 * Life Tracker Pro - Metrics Calculator
 * Advanced analytics and metrics calculation engine
 */

import { ActivitySession } from '../../models/ActivitySession';

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
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendPercentage: number;
}

export interface TimeSlotMetrics {
  hour: number;
  productivity: number;
  activityCount: number;
  dominantCategory: string;
  efficiency: number;
}

export interface WeeklyMetrics {
  weekStart: Date;
  totalTime: number;
  productivityScore: number;
  sessionsCount: number;
  categoriesUsed: number;
  bestDay: string;
  worstDay: string;
  improvement: number;
}

export interface ComparisonMetrics {
  current: {
    period: string;
    metrics: ProductivityMetrics;
  };
  previous: {
    period: string;
    metrics: ProductivityMetrics;
  };
  changes: {
    productivityChange: number;
    consistencyChange: number;
    efficiencyChange: number;
    balanceChange: number;
  };
}

export class MetricsCalculator {
  
  /**
   * Calculate comprehensive productivity metrics
   */
  static calculateProductivityMetrics(sessions: ActivitySession[]): ProductivityMetrics {
    if (sessions.length === 0) {
      return {
        productivityScore: 0,
        consistencyScore: 0,
        efficiencyScore: 0,
        balanceScore: 0,
        improvementRate: 0,
        streak: 0
      };
    }

    const productivityScore = this.calculateProductivityScore(sessions);
    const consistencyScore = this.calculateConsistencyScore(sessions);
    const efficiencyScore = this.calculateEfficiencyScore(sessions);
    const balanceScore = this.calculateBalanceScore(sessions);
    const improvementRate = this.calculateImprovementRate(sessions);
    const streak = this.calculateCurrentStreak(sessions);

    return {
      productivityScore,
      consistencyScore,
      efficiencyScore,
      balanceScore,
      improvementRate,
      streak
    };
  }

  /**
   * Calculate productivity score (0-100)
   */
  private static calculateProductivityScore(sessions: ActivitySession[]): number {
    const productiveSessions = sessions.filter(s => s.productivity && s.productivity >= 70);
    const avgProductivity = sessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / sessions.length;
    
    const productivityRate = productiveSessions.length / sessions.length;
    const score = (avgProductivity * 0.7) + (productivityRate * 100 * 0.3);
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate consistency score based on daily activity patterns
   */
  private static calculateConsistencyScore(sessions: ActivitySession[]): number {
    const dailyActivity = this.groupSessionsByDay(sessions);
    const days = Object.keys(dailyActivity);
    
    if (days.length === 0) return 0;
    
    const dailyTimes = days.map(day => {
      return dailyActivity[day].reduce((sum, s) => sum + (s.duration || 0), 0);
    });

    const avgDailyTime = dailyTimes.reduce((sum, time) => sum + time, 0) / dailyTimes.length;
    const variance = dailyTimes.reduce((sum, time) => sum + Math.pow(time - avgDailyTime, 2), 0) / dailyTimes.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - (stdDev / avgDailyTime * 100));
    
    return Math.round(consistencyScore);
  }

  /**
   * Calculate efficiency score based on session length and focus
   */
  private static calculateEfficiencyScore(sessions: ActivitySession[]): number {
    if (sessions.length === 0) return 0;
    
    const efficiencyScores = sessions.map(session => {
      const duration = session.duration || 0;
      const productivity = session.productivity || 0;
      
      // Optimal session length is 25-90 minutes (Pomodoro + deep work)
      const optimalLength = duration >= 1500 && duration <= 5400 ? 1 : 0.8;
      
      // Efficiency = productivity * optimal length factor
      return productivity * optimalLength;
    });

    const avgEfficiency = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;
    
    return Math.round(avgEfficiency);
  }

  /**
   * Calculate work-life balance score
   */
  private static calculateBalanceScore(sessions: ActivitySession[]): number {
    const categoryTimes = this.getCategoryTotals(sessions);
    const totalTime = Object.values(categoryTimes).reduce((sum, time) => sum + time, 0);
    
    if (totalTime === 0) return 0;
    
    // Ideal distribution (can be customized)
    const idealDistribution = {
      work: 0.4,      // 40%
      study: 0.2,     // 20%
      exercise: 0.15, // 15%
      personal: 0.15, // 15%
      creative: 0.1   // 10%
    };

    let balanceScore = 0;
    const categories = Object.keys(idealDistribution);
    
    categories.forEach(category => {
      const actualPercentage = (categoryTimes[category] || 0) / totalTime;
      const idealPercentage = idealDistribution[category as keyof typeof idealDistribution];
      const deviation = Math.abs(actualPercentage - idealPercentage);
      
      // Score decreases with larger deviations from ideal
      const categoryScore = Math.max(0, 100 - (deviation * 200));
      balanceScore += categoryScore / categories.length;
    });

    return Math.round(balanceScore);
  }

  /**
   * Calculate improvement rate over time
   */
  private static calculateImprovementRate(sessions: ActivitySession[]): number {
    if (sessions.length < 7) return 0; // Need at least a week of data
    
    const sortedSessions = sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const firstWeek = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const lastWeek = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
    
    const firstWeekAvg = firstWeek.reduce((sum, s) => sum + (s.productivity || 0), 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, s) => sum + (s.productivity || 0), 0) / lastWeek.length;
    
    const improvement = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
    
    return Math.round(improvement);
  }

  /**
   * Calculate current streak of productive days
   */
  private static calculateCurrentStreak(sessions: ActivitySession[]): number {
    const dailyActivity = this.groupSessionsByDay(sessions);
    const sortedDays = Object.keys(dailyActivity).sort().reverse();
    
    let streak = 0;
    
    for (const day of sortedDays) {
      const dayProductivity = this.getDayProductivity(dailyActivity[day]);
      
      if (dayProductivity >= 70) { // Consider 70%+ as productive day
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calculate metrics by category
   */
  static calculateCategoryMetrics(sessions: ActivitySession[], previousSessions?: ActivitySession[]): CategoryMetrics[] {
    const categoryGroups = this.groupSessionsByCategory(sessions);
    const previousCategoryGroups = previousSessions ? this.groupSessionsByCategory(previousSessions) : {};
    
    return Object.entries(categoryGroups).map(([category, categorySessions]) => {
      const totalTime = categorySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const sessionCount = categorySessions.length;
      const avgSessionLength = totalTime / sessionCount;
      const productivityScore = categorySessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / sessionCount;
      const efficiency = this.calculateCategoryEfficiency(categorySessions);
      
      // Calculate trend
      const previousCategorySessions = previousCategoryGroups[category] || [];
      const trend = this.calculateCategoryTrend(categorySessions, previousCategorySessions);
      
      return {
        category,
        totalTime,
        sessionCount,
        avgSessionLength: Math.round(avgSessionLength),
        productivityScore: Math.round(productivityScore),
        efficiency: Math.round(efficiency),
        trend: trend.direction,
        trendPercentage: trend.percentage
      };
    });
  }

  /**
   * Calculate time slot metrics (hourly analysis)
   */
  static calculateTimeSlotMetrics(sessions: ActivitySession[]): TimeSlotMetrics[] {
    const hourlyData: { [hour: number]: ActivitySession[] } = {};
    
    // Group sessions by hour
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(session);
    });

    return Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = hourlyData[hour] || [];
      
      if (hourSessions.length === 0) {
        return {
          hour,
          productivity: 0,
          activityCount: 0,
          dominantCategory: 'none',
          efficiency: 0
        };
      }

      const productivity = hourSessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / hourSessions.length;
      const activityCount = hourSessions.length;
      const dominantCategory = this.getDominantCategory(hourSessions);
      const efficiency = this.calculateEfficiencyScore(hourSessions);

      return {
        hour,
        productivity: Math.round(productivity),
        activityCount,
        dominantCategory,
        efficiency: Math.round(efficiency)
      };
    });
  }

  /**
   * Calculate weekly metrics
   */
  static calculateWeeklyMetrics(sessions: ActivitySession[]): WeeklyMetrics[] {
    const weeklyGroups = this.groupSessionsByWeek(sessions);
    
    return Object.entries(weeklyGroups).map(([weekKey, weekSessions]) => {
      const weekStart = new Date(weekKey);
      const totalTime = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const productivityScore = weekSessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / weekSessions.length;
      const sessionsCount = weekSessions.length;
      const categoriesUsed = new Set(weekSessions.map(s => s.category)).size;
      
      const dailyProductivity = this.getDailyProductivityForWeek(weekSessions);
      const bestDay = this.getBestDay(dailyProductivity);
      const worstDay = this.getWorstDay(dailyProductivity);
      
      // Calculate improvement vs previous week (if available)
      const improvement = 0; // TODO: Implement week-to-week comparison

      return {
        weekStart,
        totalTime,
        productivityScore: Math.round(productivityScore),
        sessionsCount,
        categoriesUsed,
        bestDay,
        worstDay,
        improvement
      };
    });
  }

  /**
   * Calculate comparison metrics between periods
   */
  static calculateComparisonMetrics(
    currentSessions: ActivitySession[], 
    previousSessions: ActivitySession[],
    currentPeriod: string,
    previousPeriod: string
  ): ComparisonMetrics {
    const currentMetrics = this.calculateProductivityMetrics(currentSessions);
    const previousMetrics = this.calculateProductivityMetrics(previousSessions);

    const changes = {
      productivityChange: currentMetrics.productivityScore - previousMetrics.productivityScore,
      consistencyChange: currentMetrics.consistencyScore - previousMetrics.consistencyScore,
      efficiencyChange: currentMetrics.efficiencyScore - previousMetrics.efficiencyScore,
      balanceChange: currentMetrics.balanceScore - previousMetrics.balanceScore
    };

    return {
      current: { period: currentPeriod, metrics: currentMetrics },
      previous: { period: previousPeriod, metrics: previousMetrics },
      changes
    };
  }

  // Helper methods
  private static groupSessionsByDay(sessions: ActivitySession[]): { [day: string]: ActivitySession[] } {
    return sessions.reduce((groups, session) => {
      const day = session.startTime.toISOString().split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(session);
      return groups;
    }, {} as { [day: string]: ActivitySession[] });
  }

  private static groupSessionsByCategory(sessions: ActivitySession[]): { [category: string]: ActivitySession[] } {
    return sessions.reduce((groups, session) => {
      const category = session.category || 'uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(session);
      return groups;
    }, {} as { [category: string]: ActivitySession[] });
  }

  private static groupSessionsByWeek(sessions: ActivitySession[]): { [week: string]: ActivitySession[] } {
    return sessions.reduce((groups, session) => {
      const weekStart = this.getWeekStart(session.startTime);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!groups[weekKey]) groups[weekKey] = [];
      groups[weekKey].push(session);
      return groups;
    }, {} as { [week: string]: ActivitySession[] });
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  private static getCategoryTotals(sessions: ActivitySession[]): { [category: string]: number } {
    return sessions.reduce((totals, session) => {
      const category = session.category || 'uncategorized';
      totals[category] = (totals[category] || 0) + (session.duration || 0);
      return totals;
    }, {} as { [category: string]: number });
  }

  private static getDayProductivity(sessions: ActivitySession[]): number {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / sessions.length;
  }

  private static calculateCategoryEfficiency(sessions: ActivitySession[]): number {
    if (sessions.length === 0) return 0;
    
    const totalProductiveTime = sessions.reduce((sum, session) => {
      const productivity = (session.productivity || 0) / 100;
      const duration = session.duration || 0;
      return sum + (duration * productivity);
    }, 0);
    
    const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    
    return totalTime > 0 ? (totalProductiveTime / totalTime) * 100 : 0;
  }

  private static calculateCategoryTrend(
    current: ActivitySession[], 
    previous: ActivitySession[]
  ): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    const currentAvg = current.length > 0 
      ? current.reduce((sum, s) => sum + (s.productivity || 0), 0) / current.length 
      : 0;
    
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, s) => sum + (s.productivity || 0), 0) / previous.length 
      : 0;

    if (previousAvg === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    const change = ((currentAvg - previousAvg) / previousAvg) * 100;
    
    if (Math.abs(change) < 5) {
      return { direction: 'stable', percentage: Math.round(Math.abs(change)) };
    }
    
    return {
      direction: change > 0 ? 'increasing' : 'decreasing',
      percentage: Math.round(Math.abs(change))
    };
  }

  private static getDominantCategory(sessions: ActivitySession[]): string {
    const categoryTimes = this.getCategoryTotals(sessions);
    const dominantCategory = Object.entries(categoryTimes).reduce((max, [category, time]) => 
      time > max.time ? { category, time } : max, 
      { category: 'none', time: 0 }
    );
    
    return dominantCategory.category;
  }

  private static getDailyProductivityForWeek(sessions: ActivitySession[]): { [day: string]: number } {
    const dailyGroups = this.groupSessionsByDay(sessions);
    const dailyProductivity: { [day: string]: number } = {};
    
    Object.entries(dailyGroups).forEach(([day, daySessions]) => {
      dailyProductivity[day] = this.getDayProductivity(daySessions);
    });
    
    return dailyProductivity;
  }

  private static getBestDay(dailyProductivity: { [day: string]: number }): string {
    return Object.entries(dailyProductivity).reduce((best, [day, productivity]) => 
      productivity > best.productivity ? { day, productivity } : best,
      { day: 'none', productivity: 0 }
    ).day;
  }

  private static getWorstDay(dailyProductivity: { [day: string]: number }): string {
    return Object.entries(dailyProductivity).reduce((worst, [day, productivity]) => 
      productivity < worst.productivity ? { day, productivity } : worst,
      { day: 'none', productivity: 100 }
    ).day;
  }
}