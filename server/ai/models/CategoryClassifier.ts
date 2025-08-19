/**
 * Life Tracker Pro - AI Category Classifier
 * Machine Learning model for automatic activity categorization
 */

import { EventEmitter } from 'events';

export interface CategoryPrediction {
  category: string;
  confidence: number;
  reasons: string[];
}

export interface TrainingData {
  activity: string;
  category: string;
  timestamp: Date;
  windowTitle?: string;
  appName?: string;
  timeOfDay: number;
  dayOfWeek: number;
}

export interface FeatureVector {
  keywords: { [key: string]: number };
  timeOfDay: number;
  dayOfWeek: number;
  textLength: number;
  hasNumbers: boolean;
  hasCode: boolean;
  hasUrls: boolean;
}

export class CategoryClassifier extends EventEmitter {
  private model: Map<string, FeatureVector[]> = new Map();
  private keywordWeights: Map<string, Map<string, number>> = new Map();
  private minConfidenceThreshold = 0.6;
  private isTraining = false;
  private trainingProgress = 0;

  constructor() {
    super();
    this.initializeBaseModel();
  }

  private initializeBaseModel(): void {
    // Base keywords for each category
    const baseKeywords = {
      work: [
        'meeting', 'project', 'task', 'deadline', 'client', 'email', 'report',
        'work', 'office', 'business', 'development', 'coding', 'programming',
        'bug', 'feature', 'api', 'database', 'server', 'deploy', 'production'
      ],
      study: [
        'learn', 'study', 'course', 'tutorial', 'book', 'research', 'reading',
        'education', 'university', 'college', 'exam', 'homework', 'assignment',
        'documentation', 'docs', 'guide', 'manual', 'article', 'paper'
      ],
      exercise: [
        'workout', 'gym', 'run', 'fitness', 'exercise', 'training', 'sport',
        'health', 'cardio', 'strength', 'yoga', 'swim', 'bike', 'walk',
        'calories', 'muscle', 'diet', 'nutrition', 'wellness'
      ],
      personal: [
        'personal', 'family', 'friends', 'social', 'hobby', 'entertainment',
        'movie', 'music', 'game', 'relax', 'rest', 'break', 'vacation',
        'shopping', 'cooking', 'cleaning', 'home', 'chores', 'errands'
      ],
      creative: [
        'design', 'art', 'creative', 'draw', 'paint', 'write', 'blog',
        'photography', 'video', 'music', 'compose', 'create', 'craft',
        'sketch', 'illustration', 'graphic', 'ui', 'ux', 'prototype'
      ]
    };

    // Initialize keyword weights
    for (const [category, keywords] of Object.entries(baseKeywords)) {
      const weights = new Map<string, number>();
      keywords.forEach(keyword => weights.set(keyword.toLowerCase(), 1.0));
      this.keywordWeights.set(category, weights);
    }
  }

  async trainModel(trainingData: TrainingData[]): Promise<void> {
    this.isTraining = true;
    this.trainingProgress = 0;
    this.emit('trainingStarted', { total: trainingData.length });

    try {
      // Clear existing model
      this.model.clear();

      // Process training data
      for (let i = 0; i < trainingData.length; i++) {
        const data = trainingData[i];
        const features = this.extractFeatures(data);
        
        if (!this.model.has(data.category)) {
          this.model.set(data.category, []);
        }
        
        this.model.get(data.category)!.push(features);
        
        // Update keyword weights based on successful categorizations
        this.updateKeywordWeights(data.activity, data.category);
        
        this.trainingProgress = ((i + 1) / trainingData.length) * 100;
        
        if (i % 10 === 0) {
          this.emit('trainingProgress', { 
            progress: this.trainingProgress,
            processed: i + 1,
            total: trainingData.length
          });
        }
      }

      this.emit('trainingCompleted', { 
        categoriesCount: this.model.size,
        samplesCount: trainingData.length
      });

    } catch (error) {
      this.emit('trainingError', { error });
      throw error;
    } finally {
      this.isTraining = false;
      this.trainingProgress = 100;
    }
  }

  private extractFeatures(data: TrainingData): FeatureVector {
    const text = data.activity.toLowerCase();
    const words = text.split(/\s+/);
    
    // Extract keywords
    const keywords: { [key: string]: number } = {};
    words.forEach(word => {
      // Clean word (remove punctuation)
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        keywords[cleanWord] = (keywords[cleanWord] || 0) + 1;
      }
    });

    return {
      keywords,
      timeOfDay: data.timeOfDay,
      dayOfWeek: data.dayOfWeek,
      textLength: text.length,
      hasNumbers: /\d/.test(text),
      hasCode: /[\{\}\[\]<>]/.test(text) || text.includes('function') || text.includes('class'),
      hasUrls: /https?:\/\//.test(text)
    };
  }

  private updateKeywordWeights(activity: string, category: string): void {
    const words = activity.toLowerCase().split(/\s+/);
    const categoryWeights = this.keywordWeights.get(category) || new Map();
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        const currentWeight = categoryWeights.get(cleanWord) || 0;
        categoryWeights.set(cleanWord, currentWeight + 0.1);
      }
    });
    
    this.keywordWeights.set(category, categoryWeights);
  }

  async predictCategory(activity: string, timeOfDay: number, dayOfWeek: number): Promise<CategoryPrediction> {
    if (this.isTraining) {
      throw new Error('Model is currently training');
    }

    const features = this.extractFeatures({
      activity,
      category: '',
      timestamp: new Date(),
      timeOfDay,
      dayOfWeek
    });

    const scores = new Map<string, number>();
    const reasons = new Map<string, string[]>();

    // Calculate similarity scores for each category
    for (const [category, samples] of this.model.entries()) {
      let totalScore = 0;
      let sampleCount = 0;
      const categoryReasons: string[] = [];

      // Compare with training samples
      for (const sample of samples) {
        const similarity = this.calculateSimilarity(features, sample);
        totalScore += similarity;
        sampleCount++;
      }

      // Keyword matching bonus
      const keywordScore = this.calculateKeywordScore(features.keywords, category);
      totalScore += keywordScore * 2; // Weight keyword matching higher
      
      if (keywordScore > 0) {
        categoryReasons.push(`Keyword matching (${keywordScore.toFixed(2)})`);
      }

      // Time-based bonus
      const timeScore = this.calculateTimeScore(features, samples);
      totalScore += timeScore;
      
      if (timeScore > 0) {
        categoryReasons.push(`Time pattern (${timeScore.toFixed(2)})`);
      }

      const avgScore = sampleCount > 0 ? totalScore / (sampleCount + 2) : keywordScore;
      scores.set(category, avgScore);
      reasons.set(category, categoryReasons);
    }

    // Find best prediction
    let bestCategory = 'personal'; // Default fallback
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const [category, score] of scores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
        bestReasons = reasons.get(category) || [];
      }
    }

    const confidence = Math.min(bestScore, 1.0);

    return {
      category: bestCategory,
      confidence,
      reasons: bestReasons
    };
  }

  private calculateSimilarity(features1: FeatureVector, features2: FeatureVector): number {
    let similarity = 0;

    // Keyword similarity (cosine similarity)
    const keywordSim = this.cosineSimilarity(features1.keywords, features2.keywords);
    similarity += keywordSim * 0.6;

    // Time similarity
    const timeDiff = Math.abs(features1.timeOfDay - features2.timeOfDay);
    const timeSim = 1 - (timeDiff / 24);
    similarity += timeSim * 0.2;

    // Day of week similarity
    const daySim = features1.dayOfWeek === features2.dayOfWeek ? 1 : 0;
    similarity += daySim * 0.1;

    // Text length similarity
    const lengthDiff = Math.abs(features1.textLength - features2.textLength);
    const lengthSim = 1 - Math.min(lengthDiff / 100, 1);
    similarity += lengthSim * 0.1;

    return similarity;
  }

  private cosineSimilarity(vec1: { [key: string]: number }, vec2: { [key: string]: number }): number {
    const keys1 = Object.keys(vec1);
    const keys2 = Object.keys(vec2);
    const allKeys = new Set([...keys1, ...keys2]);

    if (allKeys.size === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const key of allKeys) {
      const val1 = vec1[key] || 0;
      const val2 = vec2[key] || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private calculateKeywordScore(keywords: { [key: string]: number }, category: string): number {
    const categoryWeights = this.keywordWeights.get(category);
    if (!categoryWeights) return 0;

    let score = 0;
    let totalWords = 0;

    for (const [word, count] of Object.entries(keywords)) {
      const weight = categoryWeights.get(word) || 0;
      score += weight * count;
      totalWords += count;
    }

    return totalWords > 0 ? score / totalWords : 0;
  }

  private calculateTimeScore(features: FeatureVector, samples: FeatureVector[]): number {
    if (samples.length === 0) return 0;

    // Find samples with similar time patterns
    const similarTimeSamples = samples.filter(sample => {
      const timeDiff = Math.abs(features.timeOfDay - sample.timeOfDay);
      const dayMatch = features.dayOfWeek === sample.dayOfWeek;
      return timeDiff < 2 || dayMatch;
    });

    return similarTimeSamples.length / samples.length;
  }

  getModelStats(): any {
    const stats = {
      isTraining: this.isTraining,
      trainingProgress: this.trainingProgress,
      categoriesCount: this.model.size,
      totalSamples: 0,
      categoryBreakdown: {} as { [key: string]: number },
      keywordCount: 0
    };

    for (const [category, samples] of this.model.entries()) {
      stats.categoryBreakdown[category] = samples.length;
      stats.totalSamples += samples.length;
    }

    for (const weights of this.keywordWeights.values()) {
      stats.keywordCount += weights.size;
    }

    return stats;
  }

  setMinConfidenceThreshold(threshold: number): void {
    this.minConfidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  getMinConfidenceThreshold(): number {
    return this.minConfidenceThreshold;
  }

  exportModel(): any {
    return {
      model: Array.from(this.model.entries()),
      keywordWeights: Array.from(this.keywordWeights.entries()).map(([key, value]) => [
        key,
        Array.from(value.entries())
      ]),
      minConfidenceThreshold: this.minConfidenceThreshold
    };
  }

  importModel(exportedModel: any): void {
    this.model = new Map(exportedModel.model);
    this.keywordWeights = new Map(
      exportedModel.keywordWeights.map(([key, value]: [string, [string, number][]]) => [
        key,
        new Map(value)
      ])
    );
    this.minConfidenceThreshold = exportedModel.minConfidenceThreshold || 0.6;
  }
}