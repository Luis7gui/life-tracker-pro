/**
 * Life Tracker Pro - AI Service
 * Main service that orchestrates all AI functionality
 */

import { CategoryClassifier, CategoryPrediction, TrainingData } from '../models/CategoryClassifier';
import { ProductivityPredictor, ProductivityData, ProductivityPrediction } from '../models/ProductivityPredictor';
import { ActivitySession } from '../../models/ActivitySession';
import { EventEmitter } from 'events';

export interface AIInsight {
  type: 'productivity' | 'pattern' | 'recommendation' | 'alert';
  title: string;
  message: string;
  confidence: number;
  data?: any;
  timestamp: Date;
}

export interface SmartSuggestion {
  id: string;
  type: 'category' | 'timing' | 'duration' | 'break';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata?: any;
}

export class AIService extends EventEmitter {
  private categoryClassifier: CategoryClassifier;
  private productivityPredictor: ProductivityPredictor;
  private insights: AIInsight[] = [];
  private isInitialized = false;
  private lastTrainingDate: Date | null = null;

  constructor() {
    super();
    this.categoryClassifier = new CategoryClassifier();
    this.productivityPredictor = new ProductivityPredictor();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Category Classifier events
    this.categoryClassifier.on('trainingStarted', (data) => {
      this.emit('trainingStarted', { model: 'CategoryClassifier', ...data });
    });

    this.categoryClassifier.on('trainingProgress', (data) => {
      this.emit('trainingProgress', { model: 'CategoryClassifier', ...data });
    });

    this.categoryClassifier.on('trainingCompleted', (data) => {
      this.emit('trainingCompleted', { model: 'CategoryClassifier', ...data });
      this.generateInsight({
        type: 'pattern',
        title: 'Category Model Updated',
        message: `Learned from ${data.samplesCount} activities across ${data.categoriesCount} categories`,
        confidence: 0.9
      });
    });

    // Productivity Predictor events
    this.productivityPredictor.on('dataAdded', (data) => {
      this.emit('productivityDataAdded', data);
    });

    this.productivityPredictor.on('analysisCompleted', (insights) => {
      this.emit('productivityAnalysisCompleted', insights);
      this.generateProductivityInsights(insights);
    });
  }

  async initialize(existingSessions: ActivitySession[]): Promise<void> {
    try {
      this.emit('initializationStarted');

      // Prepare training data from existing sessions
      const trainingData = this.prepareTrainingData(existingSessions);
      const productivityData = this.prepareProductivityData(existingSessions);

      // Train models if we have enough data
      if (trainingData.length > 0) {
        await this.categoryClassifier.trainModel(trainingData);
      }

      if (productivityData.length > 0) {
        for (const data of productivityData) {
          await this.productivityPredictor.addProductivityData(data);
        }
      }

      this.isInitialized = true;
      this.lastTrainingDate = new Date();

      this.emit('initializationCompleted', {
        categoryTrainingSamples: trainingData.length,
        productivitySamples: productivityData.length
      });

      // Generate initial insights
      await this.generateInitialInsights();

    } catch (error) {
      this.emit('initializationError', { error });
      throw error;
    }
  }

  private prepareTrainingData(sessions: ActivitySession[]): TrainingData[] {
    return sessions
      .filter(session => session.activity && session.category)
      .map(session => ({
        activity: session.activity,
        category: session.category as string,
        timestamp: session.startTime,
        timeOfDay: session.startTime.getHours(),
        dayOfWeek: session.startTime.getDay()
      }));
  }

  private prepareProductivityData(sessions: ActivitySession[]): ProductivityData[] {
    return sessions
      .filter(session => session.productivity !== undefined && session.productivity !== null && session.duration !== undefined && session.category)
      .map(session => ({
        timeOfDay: session.startTime.getHours(),
        dayOfWeek: session.startTime.getDay(),
        category: session.category as string,
        duration: session.duration as number,
        productivity: (session.productivity as number) / 100, // Normalize to 0-1
        timestamp: session.startTime
      }));
  }

  async predictCategory(activity: string): Promise<CategoryPrediction> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    const prediction = await this.categoryClassifier.predictCategory(
      activity,
      timeOfDay,
      dayOfWeek
    );

    // Generate insight if confidence is low
    if (prediction.confidence < 0.7) {
      this.generateInsight({
        type: 'alert',
        title: 'Uncertain Category Prediction',
        message: `Only ${Math.round(prediction.confidence * 100)}% confident about "${activity}" → ${prediction.category}`,
        confidence: prediction.confidence
      });
    }

    return prediction;
  }

  async predictProductivity(category: string): Promise<ProductivityPrediction> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    const prediction = await this.productivityPredictor.predictProductivity(
      timeOfDay,
      dayOfWeek,
      category
    );

    // Generate recommendation insight
    if (prediction.expectedProductivity < 0.6) {
      this.generateInsight({
        type: 'recommendation',
        title: 'Productivity Alert',
        message: prediction.recommendation,
        confidence: prediction.confidence
      });
    }

    return prediction;
  }

  async getSmartSuggestions(currentActivity?: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    try {
      // Category suggestions
      if (currentActivity) {
        const categoryPrediction = await this.predictCategory(currentActivity);
        if (categoryPrediction.confidence > 0.7) {
          suggestions.push({
            id: `category-${Date.now()}`,
            type: 'category',
            title: 'Smart Category Suggestion',
            description: `This looks like ${categoryPrediction.category} (${Math.round(categoryPrediction.confidence * 100)}% confident)`,
            confidence: categoryPrediction.confidence,
            actionable: true,
            metadata: { suggestedCategory: categoryPrediction.category }
          });
        }
      }

      // Timing suggestions
      const categories = ['work', 'study', 'exercise', 'personal', 'creative'];
      for (const category of categories) {
        const productivityPrediction = await this.productivityPredictor.predictProductivity(
          timeOfDay,
          dayOfWeek,
          category
        );

        if (productivityPrediction.expectedProductivity > 0.8) {
          suggestions.push({
            id: `timing-${category}-${Date.now()}`,
            type: 'timing',
            title: `Perfect Time for ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            description: `You're typically ${Math.round(productivityPrediction.expectedProductivity * 100)}% productive with ${category} right now`,
            confidence: productivityPrediction.confidence,
            actionable: true,
            metadata: { category, expectedProductivity: productivityPrediction.expectedProductivity }
          });
        }
      }

      // Break suggestions based on time patterns
      if (timeOfDay >= 14 && timeOfDay <= 16) {
        suggestions.push({
          id: `break-afternoon-${Date.now()}`,
          type: 'break',
          title: 'Afternoon Break Recommended',
          description: 'Most people experience a productivity dip around this time. Consider a 10-15 minute break.',
          confidence: 0.7,
          actionable: true,
          metadata: { breakDuration: 15 }
        });
      }

      // Duration suggestions based on category
      const optimalTimes = await Promise.all(
        categories.map(async (category) => {
          const optimal = this.productivityPredictor.findOptimalTime(category);
          return { category, optimal };
        })
      );

      optimalTimes
        .filter(({ optimal }) => optimal.confidence > 0.5)
        .forEach(({ category, optimal }) => {
          if (Math.abs(timeOfDay - optimal.startHour) <= 1) {
            suggestions.push({
              id: `duration-${category}-${Date.now()}`,
              type: 'duration',
              title: `Optimal ${category.charAt(0).toUpperCase() + category.slice(1)} Window`,
              description: `You perform best with ${category} between ${optimal.startHour}:00-${optimal.endHour}:00`,
              confidence: optimal.confidence,
              actionable: false,
              metadata: { category, optimalWindow: optimal }
            });
          }
        });

    } catch (error) {
      console.error('Error generating smart suggestions:', error);
    }

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private generateInsight(insight: Omit<AIInsight, 'timestamp'>): void {
    const fullInsight: AIInsight = {
      ...insight,
      timestamp: new Date()
    };

    this.insights.unshift(fullInsight);
    
    // Keep only last 50 insights
    if (this.insights.length > 50) {
      this.insights = this.insights.slice(0, 50);
    }

    this.emit('insightGenerated', fullInsight);
  }

  private generateProductivityInsights(analysisResults: any): void {
    const { avgProductivity, bestTimeOfDay, categoryBreakdown } = analysisResults;

    // Overall productivity insight
    if (avgProductivity > 0.8) {
      this.generateInsight({
        type: 'productivity',
        title: 'High Productivity Pattern',
        message: `Your average productivity is ${Math.round(avgProductivity * 100)}% - excellent work!`,
        confidence: 0.9
      });
    } else if (avgProductivity < 0.5) {
      this.generateInsight({
        type: 'recommendation',
        title: 'Productivity Improvement Opportunity',
        message: `Your average productivity is ${Math.round(avgProductivity * 100)}%. Consider optimizing your schedule.`,
        confidence: 0.8
      });
    }

    // Best time insight
    if (bestTimeOfDay.productivity > 0.7) {
      this.generateInsight({
        type: 'pattern',
        title: 'Peak Performance Time Identified',
        message: `You're most productive around ${bestTimeOfDay.hour}:00 (${Math.round(bestTimeOfDay.productivity * 100)}% avg productivity)`,
        confidence: 0.8
      });
    }

    // Category-specific insights
    Object.entries(categoryBreakdown).forEach(([category, data]: [string, any]) => {
      if (data.avgProductivity > 0.8) {
        this.generateInsight({
          type: 'productivity',
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Excellence`,
          message: `You excel at ${category} with ${Math.round(data.avgProductivity * 100)}% average productivity`,
          confidence: 0.7
        });
      }
    });
  }

  private async generateInitialInsights(): Promise<void> {
    try {
      const modelStats = this.categoryClassifier.getModelStats();
      const productivityInsights = this.productivityPredictor.getProductivityInsights();

      this.generateInsight({
        type: 'pattern',
        title: 'AI Models Initialized',
        message: `Ready to learn from your habits! Trained on ${modelStats.totalSamples} activities across ${modelStats.categoriesCount} categories.`,
        confidence: 0.9,
        data: { modelStats, productivityInsights }
      });

      if (productivityInsights.totalSessions > 10) {
        await this.productivityPredictor.analyzePatterns();
      }

    } catch (error) {
      console.error('Error generating initial insights:', error);
    }
  }

  async learnFromSession(session: ActivitySession): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Add to productivity data if we have productivity info
      if (session.productivity !== undefined && session.productivity !== null && session.category && session.duration !== undefined) {
        const productivityData: ProductivityData = {
          timeOfDay: session.startTime.getHours(),
          dayOfWeek: session.startTime.getDay(),
          category: session.category as string,
          duration: session.duration as number,
          productivity: (session.productivity as number) / 100,
          timestamp: session.startTime
        };

        await this.productivityPredictor.addProductivityData(productivityData);
      }

      // Retrain category model periodically
      const daysSinceLastTraining = this.lastTrainingDate 
        ? (Date.now() - this.lastTrainingDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastTraining > 7) {
        // Retrain with recent data (implement this based on your data storage)
        this.emit('retrainingNeeded');
      }

    } catch (error) {
      console.error('Error learning from session:', error);
    }
  }

  getInsights(): AIInsight[] {
    return [...this.insights];
  }

  getModelStatistics(): any {
    return {
      categoryClassifier: this.categoryClassifier.getModelStats(),
      productivityPredictor: this.productivityPredictor.getProductivityInsights(),
      isInitialized: this.isInitialized,
      lastTrainingDate: this.lastTrainingDate,
      insightsCount: this.insights.length
    };
  }

  async exportAIData(): Promise<any> {
    return {
      categoryModel: this.categoryClassifier.exportModel(),
      productivityData: this.productivityPredictor.exportData(),
      insights: this.insights,
      metadata: {
        lastTrainingDate: this.lastTrainingDate,
        isInitialized: this.isInitialized
      }
    };
  }

  async importAIData(data: any): Promise<void> {
    try {
      if (data.categoryModel) {
        this.categoryClassifier.importModel(data.categoryModel);
      }
      
      if (data.productivityData) {
        this.productivityPredictor.importData(data.productivityData);
      }
      
      if (data.insights) {
        this.insights = data.insights;
      }
      
      if (data.metadata) {
        this.lastTrainingDate = data.metadata.lastTrainingDate ? new Date(data.metadata.lastTrainingDate) : null;
        this.isInitialized = data.metadata.isInitialized || false;
      }

      this.emit('dataImported');
    } catch (error) {
      this.emit('importError', { error });
      throw error;
    }
  }
}