/**
 * Life Tracker Pro - AI Service Frontend
 * Frontend service for AI functionality
 */

import apiClient from './client';

export interface CategoryPrediction {
  category: string;
  confidence: number;
  reasons: string[];
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

export interface SmartSuggestion {
  id: string;
  type: 'category' | 'timing' | 'duration' | 'break';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata?: any;
}

export interface AIInsight {
  type: 'productivity' | 'pattern' | 'recommendation' | 'alert';
  title: string;
  message: string;
  confidence: number;
  data?: any;
  timestamp: string;
}

export interface OptimalTimeSlot {
  startHour: number;
  endHour: number;
  category: string;
  avgProductivity: number;
  confidence: number;
}

export interface AIStatus {
  status: string;
  statistics: {
    categoryClassifier: any;
    productivityPredictor: any;
    isInitialized: boolean;
    lastTrainingDate: string | null;
    insightsCount: number;
  };
  capabilities: string[];
}

export class AIService {
  private static instance: AIService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
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

  async getStatus(): Promise<AIStatus> {
    const cacheKey = 'ai-status';
    const cached = this.getCachedData<AIStatus>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/ai/status');
      const data = response.data.data;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get AI status:', error);
      throw new Error('Failed to connect to AI service');
    }
  }

  async predictCategory(activity: string): Promise<CategoryPrediction> {
    try {
      const response = await apiClient.post('/api/ai/predict-category', {
        activity
      });
      return response.data.data.prediction;
    } catch (error) {
      console.error('Failed to predict category:', error);
      throw new Error('Failed to predict category');
    }
  }

  async predictProductivity(category: string): Promise<ProductivityPrediction> {
    try {
      const response = await apiClient.post('/api/ai/predict-productivity', {
        category
      });
      return response.data.data.prediction;
    } catch (error) {
      console.error('Failed to predict productivity:', error);
      throw new Error('Failed to predict productivity');
    }
  }

  async getSmartSuggestions(activity?: string): Promise<SmartSuggestion[]> {
    const cacheKey = `suggestions-${activity || 'general'}`;
    const cached = this.getCachedData<SmartSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const params = activity ? { activity } : {};
      const response = await apiClient.get('/api/ai/suggestions', { params });
      const suggestions = response.data.data.suggestions;
      this.setCachedData(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('Failed to get smart suggestions:', error);
      return [];
    }
  }

  async getInsights(): Promise<AIInsight[]> {
    const cacheKey = 'ai-insights';
    const cached = this.getCachedData<AIInsight[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/ai/insights');
      const insights = response.data.data.insights;
      this.setCachedData(cacheKey, insights);
      return insights;
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      return [];
    }
  }

  async getOptimalTimes(): Promise<{ [category: string]: OptimalTimeSlot }> {
    const cacheKey = 'optimal-times';
    const cached = this.getCachedData<{ [category: string]: OptimalTimeSlot }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get('/api/ai/optimal-times');
      const optimalTimes = response.data.data.optimalTimes;
      this.setCachedData(cacheKey, optimalTimes);
      return optimalTimes;
    } catch (error) {
      console.error('Failed to get optimal times:', error);
      return {};
    }
  }

  async learnFromSession(sessionData: any): Promise<void> {
    try {
      await apiClient.post('/api/ai/learn-session', sessionData);
      // Clear relevant caches after learning
      this.cache.delete('ai-insights');
      this.cache.delete('ai-status');
    } catch (error) {
      console.error('Failed to learn from session:', error);
      // Don't throw error as this is not critical
    }
  }

  async retrain(): Promise<void> {
    try {
      await apiClient.post('/api/ai/retrain');
      // Clear all caches after retraining
      this.cache.clear();
    } catch (error) {
      console.error('Failed to retrain AI models:', error);
      throw new Error('Failed to retrain AI models');
    }
  }

  async exportData(): Promise<any> {
    try {
      const response = await apiClient.post('/api/ai/export');
      return response.data.data;
    } catch (error) {
      console.error('Failed to export AI data:', error);
      throw new Error('Failed to export AI data');
    }
  }

  async importData(aiData: any): Promise<void> {
    try {
      await apiClient.post('/api/ai/import', { aiData });
      // Clear all caches after import
      this.cache.clear();
    } catch (error) {
      console.error('Failed to import AI data:', error);
      throw new Error('Failed to import AI data');
    }
  }

  // Utility methods
  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  }

  formatProductivity(productivity: number): string {
    return `${Math.round(productivity * 100)}%`;
  }

  getSuggestionIcon(type: SmartSuggestion['type']): string {
    switch (type) {
      case 'category': return '🎯';
      case 'timing': return '⏰';
      case 'duration': return '⏱️';
      case 'break': return '☕';
      default: return '💡';
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const aiService = AIService.getInstance();