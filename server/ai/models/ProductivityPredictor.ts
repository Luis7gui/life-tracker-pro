/**
 * Life Tracker Pro - Productivity Predictor
 * Predicts user productivity patterns and optimal work times
 */

import { EventEmitter } from 'events';

export interface ProductivityData {
  timeOfDay: number;
  dayOfWeek: number;
  category: string;
  duration: number;
  productivity: number;
  timestamp: Date;
}

export interface ProductivityPrediction {
  expectedProductivity: number;
  confidence: number;
  recommendation: string;
  factors: {
    timeOfDay: number;
    dayOfWeek: number;
    category: number;
    historical: number;
  };
}

export interface OptimalTimeSlot {
  startHour: number;
  endHour: number;
  category: string;
  avgProductivity: number;
  confidence: number;
}

export class ProductivityPredictor extends EventEmitter {
  private productivityData: ProductivityData[] = [];
  private timePatterns: Map<string, Map<number, number[]>> = new Map();
  private dayPatterns: Map<string, Map<number, number[]>> = new Map();
  private categoryPatterns: Map<string, number[]> = new Map();
  private isAnalyzing = false;

  constructor() {
    super();
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Initialize pattern maps
    const categories = ['work', 'study', 'exercise', 'personal', 'creative'];
    
    categories.forEach(category => {
      this.timePatterns.set(category, new Map());
      this.dayPatterns.set(category, new Map());
      this.categoryPatterns.set(category, []);
      
      // Initialize hourly patterns (0-23)
      for (let hour = 0; hour < 24; hour++) {
        this.timePatterns.get(category)!.set(hour, []);
      }
      
      // Initialize daily patterns (0-6, Sunday-Saturday)
      for (let day = 0; day < 7; day++) {
        this.dayPatterns.get(category)!.set(day, []);
      }
    });
  }

  async addProductivityData(data: ProductivityData): Promise<void> {
    this.productivityData.push(data);
    
    // Update patterns
    this.updateTimePattern(data);
    this.updateDayPattern(data);
    this.updateCategoryPattern(data);
    
    // Emit update event
    this.emit('dataAdded', {
      totalSamples: this.productivityData.length,
      category: data.category,
      productivity: data.productivity
    });
  }

  private updateTimePattern(data: ProductivityData): void {
    const categoryTimePatterns = this.timePatterns.get(data.category);
    if (categoryTimePatterns) {
      const hourlyData = categoryTimePatterns.get(data.timeOfDay) || [];
      hourlyData.push(data.productivity);
      categoryTimePatterns.set(data.timeOfDay, hourlyData);
    }
  }

  private updateDayPattern(data: ProductivityData): void {
    const categoryDayPatterns = this.dayPatterns.get(data.category);
    if (categoryDayPatterns) {
      const dailyData = categoryDayPatterns.get(data.dayOfWeek) || [];
      dailyData.push(data.productivity);
      categoryDayPatterns.set(data.dayOfWeek, dailyData);
    }
  }

  private updateCategoryPattern(data: ProductivityData): void {
    const categoryData = this.categoryPatterns.get(data.category) || [];
    categoryData.push(data.productivity);
    this.categoryPatterns.set(data.category, categoryData);
  }

  async predictProductivity(
    timeOfDay: number, 
    dayOfWeek: number, 
    category: string
  ): Promise<ProductivityPrediction> {
    
    if (this.isAnalyzing) {
      throw new Error('Predictor is currently analyzing data');
    }

    const factors = {
      timeOfDay: this.calculateTimeFactor(timeOfDay, category),
      dayOfWeek: this.calculateDayFactor(dayOfWeek, category),
      category: this.calculateCategoryFactor(category),
      historical: this.calculateHistoricalFactor(timeOfDay, dayOfWeek, category)
    };

    // Weighted average of factors
    const weights = { timeOfDay: 0.3, dayOfWeek: 0.2, category: 0.2, historical: 0.3 };
    
    const expectedProductivity = 
      factors.timeOfDay * weights.timeOfDay +
      factors.dayOfWeek * weights.dayOfWeek +
      factors.category * weights.category +
      factors.historical * weights.historical;

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(timeOfDay, dayOfWeek, category);

    const recommendation = this.generateRecommendation(
      expectedProductivity,
      factors,
      timeOfDay,
      category
    );

    return {
      expectedProductivity: Math.round(expectedProductivity * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      recommendation,
      factors
    };
  }

  private calculateTimeFactor(timeOfDay: number, category: string): number {
    const categoryTimePatterns = this.timePatterns.get(category);
    if (!categoryTimePatterns) return 0.5; // Default neutral

    const hourlyData = categoryTimePatterns.get(timeOfDay) || [];
    if (hourlyData.length === 0) {
      // Check adjacent hours
      const adjacentHours = [timeOfDay - 1, timeOfDay + 1].filter(h => h >= 0 && h < 24);
      const adjacentData: number[] = [];
      
      adjacentHours.forEach(hour => {
        const data = categoryTimePatterns.get(hour) || [];
        adjacentData.push(...data);
      });
      
      if (adjacentData.length === 0) return 0.5;
      return this.calculateAverage(adjacentData);
    }

    return this.calculateAverage(hourlyData);
  }

  private calculateDayFactor(dayOfWeek: number, category: string): number {
    const categoryDayPatterns = this.dayPatterns.get(category);
    if (!categoryDayPatterns) return 0.5;

    const dailyData = categoryDayPatterns.get(dayOfWeek) || [];
    if (dailyData.length === 0) return 0.5;

    return this.calculateAverage(dailyData);
  }

  private calculateCategoryFactor(category: string): number {
    const categoryData = this.categoryPatterns.get(category) || [];
    if (categoryData.length === 0) return 0.5;

    return this.calculateAverage(categoryData);
  }

  private calculateHistoricalFactor(
    timeOfDay: number, 
    dayOfWeek: number, 
    category: string
  ): number {
    // Find similar historical sessions
    const similarSessions = this.productivityData.filter(data => {
      const timeDiff = Math.abs(data.timeOfDay - timeOfDay);
      const dayMatch = data.dayOfWeek === dayOfWeek;
      const categoryMatch = data.category === category;
      
      return categoryMatch && (dayMatch || timeDiff <= 1);
    });

    if (similarSessions.length === 0) return 0.5;

    const productivityValues = similarSessions.map(session => session.productivity);
    return this.calculateAverage(productivityValues);
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  private calculateConfidence(timeOfDay: number, dayOfWeek: number, category: string): number {
    let dataPoints = 0;
    
    // Count relevant data points
    const categoryTimePatterns = this.timePatterns.get(category);
    if (categoryTimePatterns) {
      dataPoints += (categoryTimePatterns.get(timeOfDay) || []).length;
    }
    
    const categoryDayPatterns = this.dayPatterns.get(category);
    if (categoryDayPatterns) {
      dataPoints += (categoryDayPatterns.get(dayOfWeek) || []).length;
    }

    // Convert to confidence score (0-1)
    return Math.min(dataPoints / 10, 1.0);
  }

  private generateRecommendation(
    expectedProductivity: number,
    factors: any,
    timeOfDay: number,
    category: string
  ): string {
    if (expectedProductivity >= 0.8) {
      return `Excellent time for ${category}! You're typically ${Math.round(expectedProductivity * 100)}% productive now.`;
    } else if (expectedProductivity >= 0.6) {
      return `Good time for ${category}. Expected productivity: ${Math.round(expectedProductivity * 100)}%.`;
    } else if (expectedProductivity >= 0.4) {
      const bestTime = this.findOptimalTime(category);
      return `Moderate productivity expected. Consider ${category} around ${bestTime.startHour}:00-${bestTime.endHour}:00 instead.`;
    } else {
      const bestTime = this.findOptimalTime(category);
      return `Low productivity predicted. Try ${category} during your peak hours: ${bestTime.startHour}:00-${bestTime.endHour}:00.`;
    }
  }

  findOptimalTime(category: string): OptimalTimeSlot {
    const categoryTimePatterns = this.timePatterns.get(category);
    if (!categoryTimePatterns) {
      return { startHour: 9, endHour: 11, category, avgProductivity: 0.5, confidence: 0 };
    }

    let bestHour = 9;
    let bestProductivity = 0;
    let bestConfidence = 0;

    for (let hour = 0; hour < 24; hour++) {
      const hourlyData = categoryTimePatterns.get(hour) || [];
      if (hourlyData.length > 0) {
        const avgProductivity = this.calculateAverage(hourlyData);
        const confidence = Math.min(hourlyData.length / 5, 1.0);
        
        if (avgProductivity > bestProductivity && confidence > 0.3) {
          bestHour = hour;
          bestProductivity = avgProductivity;
          bestConfidence = confidence;
        }
      }
    }

    return {
      startHour: bestHour,
      endHour: Math.min(bestHour + 2, 23),
      category,
      avgProductivity: bestProductivity,
      confidence: bestConfidence
    };
  }

  getProductivityInsights(category?: string): any {
    const insights = {
      totalSessions: this.productivityData.length,
      avgProductivity: 0,
      bestTimeOfDay: { hour: 9, productivity: 0 },
      bestDayOfWeek: { day: 1, productivity: 0 },
      categoryBreakdown: {} as { [key: string]: any },
      trends: {
        improving: false,
        weeklyPattern: [] as number[],
        hourlyPattern: [] as number[]
      }
    };

    const filteredData = category 
      ? this.productivityData.filter(d => d.category === category)
      : this.productivityData;

    if (filteredData.length === 0) return insights;

    // Calculate average productivity
    insights.avgProductivity = this.calculateAverage(
      filteredData.map(d => d.productivity)
    );

    // Find best time of day
    const hourlyAvg = new Map<number, number>();
    for (let hour = 0; hour < 24; hour++) {
      const hourData = filteredData.filter(d => d.timeOfDay === hour);
      if (hourData.length > 0) {
        hourlyAvg.set(hour, this.calculateAverage(hourData.map(d => d.productivity)));
      }
    }

    let bestHour = 9;
    let bestHourProductivity = 0;
    for (const [hour, productivity] of hourlyAvg.entries()) {
      if (productivity > bestHourProductivity) {
        bestHour = hour;
        bestHourProductivity = productivity;
      }
    }

    insights.bestTimeOfDay = { hour: bestHour, productivity: bestHourProductivity };

    // Category breakdown
    if (!category) {
      const categories = ['work', 'study', 'exercise', 'personal', 'creative'];
      categories.forEach(cat => {
        const catData = this.productivityData.filter(d => d.category === cat);
        if (catData.length > 0) {
          insights.categoryBreakdown[cat] = {
            sessions: catData.length,
            avgProductivity: this.calculateAverage(catData.map(d => d.productivity)),
            optimalTime: this.findOptimalTime(cat)
          };
        }
      });
    }

    return insights;
  }

  async analyzePatterns(): Promise<void> {
    this.isAnalyzing = true;
    this.emit('analysisStarted');

    try {
      // Analyze trends and patterns
      const insights = this.getProductivityInsights();
      
      this.emit('analysisCompleted', insights);
    } catch (error) {
      this.emit('analysisError', { error });
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  exportData(): any {
    return {
      productivityData: this.productivityData,
      timePatterns: Array.from(this.timePatterns.entries()).map(([key, value]) => [
        key,
        Array.from(value.entries())
      ]),
      dayPatterns: Array.from(this.dayPatterns.entries()).map(([key, value]) => [
        key,
        Array.from(value.entries())
      ]),
      categoryPatterns: Array.from(this.categoryPatterns.entries())
    };
  }

  importData(exportedData: any): void {
    this.productivityData = exportedData.productivityData || [];
    
    this.timePatterns = new Map(
      exportedData.timePatterns?.map(([key, value]: [string, [number, number[]][]]) => [
        key,
        new Map(value)
      ]) || []
    );
    
    this.dayPatterns = new Map(
      exportedData.dayPatterns?.map(([key, value]: [string, [number, number[]][]]) => [
        key,
        new Map(value)
      ]) || []
    );
    
    this.categoryPatterns = new Map(exportedData.categoryPatterns || []);
  }
}