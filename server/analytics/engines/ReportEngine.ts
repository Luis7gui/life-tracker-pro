/**
 * Life Tracker Pro - Report Engine
 * Advanced report generation system
 */

import { ActivitySession } from '../../models/ActivitySession';
import { MetricsCalculator, ProductivityMetrics, CategoryMetrics, WeeklyMetrics, ComparisonMetrics } from './MetricsCalculator';

export interface ReportSection {
  title: string;
  type: 'summary' | 'chart' | 'table' | 'insights' | 'recommendations';
  data: any;
  priority: number;
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
  sections: ReportSection[];
  insights: string[];
  recommendations: string[];
  createdAt: Date;
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
  sections: ReportSection[];
  weeklyBreakdown: WeeklyMetrics[];
  goals: {
    achieved: number;
    total: number;
    percentage: number;
  };
  insights: string[];
  recommendations: string[];
  createdAt: Date;
}

export interface CustomReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  filters: {
    categories?: string[];
    timeRange?: string;
    metrics?: string[];
  };
  sections: ReportSection[];
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    reportType: 'custom';
  };
}

export class ReportEngine {
  
  /**
   * Generate comprehensive weekly report
   */
  static async generateWeeklyReport(
    sessions: ActivitySession[],
    weekStart: Date,
    previousWeekSessions?: ActivitySession[]
  ): Promise<WeeklyReport> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const reportId = `weekly_${weekStart.toISOString().split('T')[0]}`;
    const weekLabel = this.formatWeekLabel(weekStart, weekEnd);
    
    // Filter sessions for the week
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    // Calculate metrics
    const metrics = MetricsCalculator.calculateProductivityMetrics(weekSessions);
    const categoryMetrics = MetricsCalculator.calculateCategoryMetrics(weekSessions, previousWeekSessions);
    const timeSlotMetrics = MetricsCalculator.calculateTimeSlotMetrics(weekSessions);
    
    // Calculate summary
    const summary = this.calculateWeeklySummary(weekSessions, metrics, categoryMetrics);
    
    // Generate sections
    const sections = this.generateWeeklySections(weekSessions, metrics, categoryMetrics, timeSlotMetrics);
    
    // Generate insights and recommendations
    const insights = this.generateWeeklyInsights(weekSessions, metrics, categoryMetrics);
    const recommendations = this.generateWeeklyRecommendations(metrics, categoryMetrics, timeSlotMetrics);

    return {
      id: reportId,
      title: `Weekly Productivity Report - ${weekLabel}`,
      period: {
        start: weekStart,
        end: weekEnd,
        label: weekLabel
      },
      summary,
      sections,
      insights,
      recommendations,
      createdAt: new Date()
    };
  }

  /**
   * Generate comprehensive monthly report
   */
  static async generateMonthlyReport(
    sessions: ActivitySession[],
    monthStart: Date
  ): Promise<MonthlyReport> {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const monthLabel = this.formatMonthLabel(monthStart);
    
    const reportId = `monthly_${monthStart.toISOString().split('T')[0].substring(0, 7)}`;
    
    // Filter sessions for the month
    const monthSessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    });

    // Calculate metrics
    const weeklyMetrics = MetricsCalculator.calculateWeeklyMetrics(monthSessions);
    const categoryMetrics = MetricsCalculator.calculateCategoryMetrics(monthSessions);
    
    // Calculate summary
    const summary = this.calculateMonthlySummary(monthSessions, weeklyMetrics);
    
    // Generate sections
    const sections = this.generateMonthlySections(monthSessions, weeklyMetrics, categoryMetrics);
    
    // Mock goals data (would come from user settings)
    const goals = { achieved: 15, total: 20, percentage: 75 };
    
    // Generate insights and recommendations
    const insights = this.generateMonthlyInsights(monthSessions, weeklyMetrics, categoryMetrics);
    const recommendations = this.generateMonthlyRecommendations(weeklyMetrics, categoryMetrics);

    return {
      id: reportId,
      title: `Monthly Productivity Report - ${monthLabel}`,
      period: {
        start: monthStart,
        end: monthEnd,
        label: monthLabel
      },
      summary,
      sections,
      weeklyBreakdown: weeklyMetrics,
      goals,
      insights,
      recommendations,
      createdAt: new Date()
    };
  }

  /**
   * Generate custom report with filters
   */
  static async generateCustomReport(
    sessions: ActivitySession[],
    startDate: Date,
    endDate: Date,
    filters: {
      categories?: string[];
      timeRange?: string;
      metrics?: string[];
    } = {},
    title?: string
  ): Promise<CustomReport> {
    const reportId = `custom_${Date.now()}`;
    const periodLabel = this.formatCustomPeriodLabel(startDate, endDate);
    
    // Apply filters
    let filteredSessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    if (filters.categories && filters.categories.length > 0) {
      filteredSessions = filteredSessions.filter(s => 
        filters.categories!.includes(s.category || 'uncategorized')
      );
    }

    // Calculate metrics based on requested metrics
    const sections = this.generateCustomSections(filteredSessions, filters);

    return {
      id: reportId,
      title: title || `Custom Report - ${periodLabel}`,
      period: {
        start: startDate,
        end: endDate,
        label: periodLabel
      },
      filters,
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'system',
        reportType: 'custom'
      }
    };
  }

  /**
   * Generate performance comparison report
   */
  static async generateComparisonReport(
    currentSessions: ActivitySession[],
    previousSessions: ActivitySession[],
    currentPeriod: string,
    previousPeriod: string
  ): Promise<CustomReport> {
    const reportId = `comparison_${Date.now()}`;
    
    const comparisonMetrics = MetricsCalculator.calculateComparisonMetrics(
      currentSessions, 
      previousSessions, 
      currentPeriod, 
      previousPeriod
    );

    const sections: ReportSection[] = [
      {
        title: 'Performance Comparison Overview',
        type: 'summary',
        data: {
          current: comparisonMetrics.current,
          previous: comparisonMetrics.previous,
          changes: comparisonMetrics.changes
        },
        priority: 1
      },
      {
        title: 'Productivity Score Comparison',
        type: 'chart',
        data: {
          type: 'comparison_bar',
          current: comparisonMetrics.current.metrics.productivityScore,
          previous: comparisonMetrics.previous.metrics.productivityScore,
          change: comparisonMetrics.changes.productivityChange
        },
        priority: 2
      },
      {
        title: 'Key Performance Indicators',
        type: 'table',
        data: {
          metrics: [
            {
              name: 'Productivity Score',
              current: comparisonMetrics.current.metrics.productivityScore,
              previous: comparisonMetrics.previous.metrics.productivityScore,
              change: comparisonMetrics.changes.productivityChange
            },
            {
              name: 'Consistency Score',
              current: comparisonMetrics.current.metrics.consistencyScore,
              previous: comparisonMetrics.previous.metrics.consistencyScore,
              change: comparisonMetrics.changes.consistencyChange
            },
            {
              name: 'Efficiency Score',
              current: comparisonMetrics.current.metrics.efficiencyScore,
              previous: comparisonMetrics.previous.metrics.efficiencyScore,
              change: comparisonMetrics.changes.efficiencyChange
            },
            {
              name: 'Balance Score',
              current: comparisonMetrics.current.metrics.balanceScore,
              previous: comparisonMetrics.previous.metrics.balanceScore,
              change: comparisonMetrics.changes.balanceChange
            }
          ]
        },
        priority: 3
      }
    ];

    return {
      id: reportId,
      title: `Performance Comparison: ${currentPeriod} vs ${previousPeriod}`,
      period: {
        start: new Date(),
        end: new Date(),
        label: `${currentPeriod} vs ${previousPeriod}`
      },
      filters: {},
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'system',
        reportType: 'custom'
      }
    };
  }

  // Helper methods for summary calculations
  private static calculateWeeklySummary(
    sessions: ActivitySession[], 
    metrics: ProductivityMetrics, 
    categoryMetrics: CategoryMetrics[]
  ) {
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalSessions = sessions.length;
    const avgDailyTime = totalTime / 7; // 7 days in a week
    const topCategory = categoryMetrics.reduce((top, cat) => 
      cat.totalTime > top.totalTime ? cat : top, 
      { category: 'none', totalTime: 0 }
    );

    return {
      totalTime,
      totalSessions,
      avgDailyTime: Math.round(avgDailyTime),
      productivityScore: metrics.productivityScore,
      topCategory: topCategory.category,
      improvement: metrics.improvementRate
    };
  }

  private static calculateMonthlySummary(sessions: ActivitySession[], weeklyMetrics: WeeklyMetrics[]) {
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalSessions = sessions.length;
    const avgWeeklyTime = totalTime / 4; // Approximate 4 weeks per month
    
    // Calculate productivity trend
    const productivityTrend = this.calculateProductivityTrend(weeklyMetrics);
    const bestWeek = weeklyMetrics.reduce((best, week) => 
      week.productivityScore > best.productivityScore ? week : best,
      { weekStart: new Date(), productivityScore: 0 }
    );

    const consistency = weeklyMetrics.length > 0 
      ? weeklyMetrics.reduce((sum, week) => sum + week.sessionsCount, 0) / weeklyMetrics.length 
      : 0;

    return {
      totalTime,
      totalSessions,
      avgWeeklyTime: Math.round(avgWeeklyTime),
      productivityTrend,
      bestWeek: this.formatWeekLabel(bestWeek.weekStart, new Date(bestWeek.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
      consistency: Math.round(consistency)
    };
  }

  // Section generators
  private static generateWeeklySections(
    sessions: ActivitySession[],
    metrics: ProductivityMetrics,
    categoryMetrics: CategoryMetrics[],
    timeSlotMetrics: any[]
  ): ReportSection[] {
    return [
      {
        title: 'Productivity Overview',
        type: 'summary',
        data: {
          productivityScore: metrics.productivityScore,
          consistencyScore: metrics.consistencyScore,
          efficiencyScore: metrics.efficiencyScore,
          balanceScore: metrics.balanceScore,
          streak: metrics.streak
        },
        priority: 1
      },
      {
        title: 'Daily Activity Distribution',
        type: 'chart',
        data: {
          type: 'daily_timeline',
          sessions: sessions.map(s => ({
            date: s.startTime.toISOString().split('T')[0],
            category: s.category,
            duration: s.duration,
            productivity: s.productivity
          }))
        },
        priority: 2
      },
      {
        title: 'Category Performance',
        type: 'table',
        data: {
          categories: categoryMetrics.map(cat => ({
            category: cat.category,
            time: this.formatDuration(cat.totalTime),
            sessions: cat.sessionCount,
            productivity: `${cat.productivityScore}%`,
            trend: cat.trend,
            trendPercentage: `${cat.trendPercentage}%`
          }))
        },
        priority: 3
      },
      {
        title: 'Peak Performance Hours',
        type: 'chart',
        data: {
          type: 'hourly_heatmap',
          timeSlots: timeSlotMetrics.filter(slot => slot.activityCount > 0)
        },
        priority: 4
      }
    ];
  }

  private static generateMonthlySections(
    sessions: ActivitySession[],
    weeklyMetrics: WeeklyMetrics[],
    categoryMetrics: CategoryMetrics[]
  ): ReportSection[] {
    return [
      {
        title: 'Monthly Progress Overview',
        type: 'summary',
        data: {
          totalWeeks: weeklyMetrics.length,
          avgWeeklyScore: weeklyMetrics.reduce((sum, w) => sum + w.productivityScore, 0) / weeklyMetrics.length,
          bestWeek: weeklyMetrics.reduce((best, week) => 
            week.productivityScore > best.productivityScore ? week : best
          ),
          improvement: this.calculateMonthlyImprovement(weeklyMetrics)
        },
        priority: 1
      },
      {
        title: 'Weekly Progression',
        type: 'chart',
        data: {
          type: 'weekly_progression',
          weeks: weeklyMetrics.map(week => ({
            week: this.formatWeekLabel(week.weekStart, new Date(week.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
            productivity: week.productivityScore,
            totalTime: week.totalTime,
            sessions: week.sessionsCount
          }))
        },
        priority: 2
      },
      {
        title: 'Category Analysis',
        type: 'chart',
        data: {
          type: 'category_trends',
          categories: categoryMetrics
        },
        priority: 3
      }
    ];
  }

  private static generateCustomSections(
    sessions: ActivitySession[],
    filters: any
  ): ReportSection[] {
    const sections: ReportSection[] = [];
    
    // Always include basic metrics
    const metrics = MetricsCalculator.calculateProductivityMetrics(sessions);
    sections.push({
      title: 'Filtered Data Overview',
      type: 'summary',
      data: {
        totalSessions: sessions.length,
        totalTime: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        avgProductivity: metrics.productivityScore,
        dateRange: {
          start: sessions.length > 0 ? sessions[0].startTime : null,
          end: sessions.length > 0 ? sessions[sessions.length - 1].startTime : null
        }
      },
      priority: 1
    });

    // Add category breakdown if multiple categories
    const categories = new Set(sessions.map(s => s.category));
    if (categories.size > 1) {
      const categoryMetrics = MetricsCalculator.calculateCategoryMetrics(sessions);
      sections.push({
        title: 'Category Breakdown',
        type: 'chart',
        data: {
          type: 'category_pie',
          categories: categoryMetrics
        },
        priority: 2
      });
    }

    return sections;
  }

  // Insight and recommendation generators
  private static generateWeeklyInsights(
    sessions: ActivitySession[],
    metrics: ProductivityMetrics,
    categoryMetrics: CategoryMetrics[]
  ): string[] {
    const insights: string[] = [];

    if (metrics.productivityScore >= 80) {
      insights.push("🎉 Excellent week! Your productivity score is in the top tier.");
    } else if (metrics.productivityScore >= 60) {
      insights.push("👍 Good productivity this week with room for improvement.");
    } else {
      insights.push("💪 This week shows potential - focus on consistency for better results.");
    }

    if (metrics.streak >= 5) {
      insights.push(`🔥 Amazing! You're on a ${metrics.streak}-day productive streak.`);
    }

    const topCategory = categoryMetrics.reduce((top, cat) => 
      cat.totalTime > top.totalTime ? cat : top,
      { category: 'none', totalTime: 0, sessionCount: 0, avgSessionLength: 0, productivityScore: 0, efficiency: 0, trend: 'stable' as const, trendPercentage: 0 }
    );

    if (topCategory.category !== 'none') {
      insights.push(`📊 Your focus this week was on ${topCategory.category} activities.`);
      
      if (topCategory.trend === 'increasing') {
        insights.push(`📈 Your ${topCategory.category} productivity is trending upward.`);
      }
    }

    if (metrics.balanceScore < 50) {
      insights.push("⚖️ Consider balancing your activities across different categories for better well-being.");
    }

    return insights;
  }

  private static generateWeeklyRecommendations(
    metrics: ProductivityMetrics,
    categoryMetrics: CategoryMetrics[],
    timeSlotMetrics: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.consistencyScore < 60) {
      recommendations.push("🎯 Try to maintain more consistent daily activity patterns.");
    }

    if (metrics.efficiencyScore < 70) {
      recommendations.push("⏱️ Consider using time-blocking or the Pomodoro technique for better focus.");
    }

    // Find peak performance hours
    const peakHours = timeSlotMetrics
      .filter(slot => slot.productivity >= 80)
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 2);

    if (peakHours.length > 0) {
      const hours = peakHours.map(slot => `${slot.hour}:00`).join(' and ');
      recommendations.push(`🌟 Your peak performance hours are around ${hours}. Schedule important tasks during these times.`);
    }

    const lowPerformanceCategories = categoryMetrics
      .filter(cat => cat.productivityScore < 60)
      .sort((a, b) => a.productivityScore - b.productivityScore);

    if (lowPerformanceCategories.length > 0) {
      const category = lowPerformanceCategories[0].category;
      recommendations.push(`🎯 Focus on improving your ${category} sessions - they have the most room for growth.`);
    }

    return recommendations;
  }

  private static generateMonthlyInsights(
    sessions: ActivitySession[],
    weeklyMetrics: WeeklyMetrics[],
    categoryMetrics: CategoryMetrics[]
  ): string[] {
    const insights: string[] = [];

    const avgWeeklyProductivity = weeklyMetrics.reduce((sum, w) => sum + w.productivityScore, 0) / weeklyMetrics.length;
    
    if (avgWeeklyProductivity >= 75) {
      insights.push("🏆 Outstanding month! Your consistency is paying off.");
    } else if (avgWeeklyProductivity >= 60) {
      insights.push("✨ Solid month with good momentum building.");
    }

    const trend = this.calculateProductivityTrend(weeklyMetrics);
    if (trend === 'up') {
      insights.push("📈 Your productivity is trending upward throughout the month.");
    } else if (trend === 'down') {
      insights.push("📉 Productivity declined this month - consider what factors might be affecting your performance.");
    }

    const mostImprovedCategory = categoryMetrics
      .filter(cat => cat.trend === 'increasing')
      .sort((a, b) => b.trendPercentage - a.trendPercentage)[0];

    if (mostImprovedCategory) {
      insights.push(`🚀 Biggest improvement in ${mostImprovedCategory.category} with a ${mostImprovedCategory.trendPercentage}% increase.`);
    }

    return insights;
  }

  private static generateMonthlyRecommendations(
    weeklyMetrics: WeeklyMetrics[],
    categoryMetrics: CategoryMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    const inconsistentWeeks = weeklyMetrics.filter(w => Math.abs(w.productivityScore - 70) > 20);
    if (inconsistentWeeks.length > weeklyMetrics.length / 2) {
      recommendations.push("📊 Work on maintaining more consistent weekly performance.");
    }

    const decliningCategories = categoryMetrics.filter(cat => cat.trend === 'decreasing');
    if (decliningCategories.length > 0) {
      const category = decliningCategories[0].category;
      recommendations.push(`🎯 Pay attention to your ${category} activities - they're showing a declining trend.`);
    }

    recommendations.push("📅 Set specific goals for next month based on this month's insights.");
    recommendations.push("🔄 Review and adjust your daily routines based on your peak performance patterns.");

    return recommendations;
  }

  // Utility methods
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private static formatWeekLabel(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  private static formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private static formatCustomPeriodLabel(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  private static calculateProductivityTrend(weeklyMetrics: WeeklyMetrics[]): 'up' | 'down' | 'stable' {
    if (weeklyMetrics.length < 2) return 'stable';
    
    const firstHalf = weeklyMetrics.slice(0, Math.floor(weeklyMetrics.length / 2));
    const secondHalf = weeklyMetrics.slice(Math.floor(weeklyMetrics.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, w) => sum + w.productivityScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, w) => sum + w.productivityScore, 0) / secondHalf.length;
    
    const change = secondHalfAvg - firstHalfAvg;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private static calculateMonthlyImprovement(weeklyMetrics: WeeklyMetrics[]): number {
    if (weeklyMetrics.length < 2) return 0;
    
    const firstWeek = weeklyMetrics[0];
    const lastWeek = weeklyMetrics[weeklyMetrics.length - 1];
    
    return lastWeek.productivityScore - firstWeek.productivityScore;
  }
}