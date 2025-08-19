import { CategoryType } from './ActivitySession';

export interface CategoryResult {
  category: CategoryType;
  productivityScore: number;
  matchType: 'app' | 'title' | 'regex' | 'ml' | 'default';
  matchedRule?: CategoryRule;
  confidence: number;
  suggestions?: string[];
}

export interface CategoryRule {
  id: string;
  description: string;
  priority: number;
  category: CategoryType;
  appPatterns: string[];
  titlePatterns: string[];
  regexPatterns: string[];
  timeBasedRules?: TimeBasedRule[];
  domainPatterns?: string[];
  processPatterns?: string[];
  productivityScore: number;
  enabled: boolean;
  customScore?: number;
  tags?: string[];
}

export interface TimeBasedRule {
  startHour: number;
  endHour: number;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  productivityModifier: number;
}

export interface MachineLearningData {
  appName: string;
  windowTitle?: string;
  category: CategoryType;
  userFeedback?: 'correct' | 'incorrect';
  timestamp: Date;
}

export class CategoryManager {
  private rules: CategoryRule[] = [];
  private mlData: MachineLearningData[] = [];
  private userPreferences: Map<string, CategoryType> = new Map();

  constructor() {
    this.initializeAdvancedRules();
    this.loadUserPreferences();
  }

  private initializeAdvancedRules(): void {
    this.rules = [
      // Development Rules
      {
        id: 'development-ide',
        description: 'IDEs and Development Environments',
        priority: 1,
        category: CategoryType.DEVELOPMENT,
        appPatterns: ['vscode', 'code', 'webstorm', 'intellij', 'pycharm', 'android studio', 'xcode', 'vim', 'neovim', 'sublime'],
        titlePatterns: ['debugging', 'compiler', 'build', 'deploy'],
        regexPatterns: ['\\.js$', '\\.ts$', '\\.py$', '\\.java$', '\\.cpp$'],
        productivityScore: 0.95,
        enabled: true,
        tags: ['coding', 'programming', 'ide']
      },
      {
        id: 'development-terminal',
        description: 'Terminal and Command Line',
        priority: 1,
        category: CategoryType.DEVELOPMENT,
        appPatterns: ['terminal', 'cmd', 'powershell', 'bash', 'git bash', 'windows terminal'],
        titlePatterns: ['git', 'npm', 'docker', 'kubectl', 'ssh'],
        regexPatterns: [],
        productivityScore: 0.90,
        enabled: true,
        tags: ['terminal', 'cli', 'devops']
      },
      {
        id: 'development-browser-dev',
        description: 'Development in Browser',
        priority: 2,
        category: CategoryType.DEVELOPMENT,
        appPatterns: ['chrome', 'firefox', 'edge', 'safari'],
        titlePatterns: ['github', 'stackoverflow', 'developer tools', 'devtools', 'localhost:', '127.0.0.1'],
        regexPatterns: ['github\\.com', 'stackoverflow\\.com', 'codepen\\.io', 'jsfiddle\\.net'],
        domainPatterns: ['github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com', 'codepen.io'],
        productivityScore: 0.85,
        enabled: true,
        tags: ['web-dev', 'coding', 'research']
      },

      // Work Rules
      {
        id: 'work-communication',
        description: 'Work Communication Tools',
        priority: 1,
        category: CategoryType.WORK,
        appPatterns: ['slack', 'teams', 'discord', 'zoom', 'skype', 'whatsapp'],
        titlePatterns: ['meeting', 'call', 'conference'],
        regexPatterns: [],
        timeBasedRules: [{
          startHour: 9,
          endHour: 17,
          daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
          productivityModifier: 1.2
        }],
        productivityScore: 0.75,
        enabled: true,
        tags: ['communication', 'meetings', 'collaboration']
      },
      {
        id: 'work-email',
        description: 'Email and Productivity',
        priority: 1,
        category: CategoryType.WORK,
        appPatterns: ['outlook', 'thunderbird', 'mail', 'gmail'],
        titlePatterns: ['inbox', 'compose', 'email'],
        regexPatterns: [],
        productivityScore: 0.70,
        enabled: true,
        tags: ['email', 'productivity', 'communication']
      },
      {
        id: 'work-office',
        description: 'Office Applications',
        priority: 2,
        category: CategoryType.WORK,
        appPatterns: ['word', 'excel', 'powerpoint', 'libreoffice', 'google docs', 'notion', 'obsidian'],
        titlePatterns: ['document', 'presentation', 'spreadsheet'],
        regexPatterns: [],
        productivityScore: 0.80,
        enabled: true,
        tags: ['documents', 'office', 'productivity']
      },

      // Learning Rules
      {
        id: 'learning-documentation',
        description: 'Technical Documentation',
        priority: 1,
        category: CategoryType.LEARNING,
        appPatterns: ['chrome', 'firefox', 'edge', 'safari'],
        titlePatterns: ['documentation', 'docs', 'api reference', 'tutorial', 'guide', 'manual'],
        regexPatterns: ['docs\\..+', 'documentation', 'tutorial', 'learn'],
        domainPatterns: ['developer.mozilla.org', 'docs.python.org', 'reactjs.org', 'nodejs.org'],
        productivityScore: 0.85,
        enabled: true,
        tags: ['learning', 'documentation', 'research']
      },
      {
        id: 'learning-courses',
        description: 'Online Learning Platforms',
        priority: 1,
        category: CategoryType.LEARNING,
        appPatterns: ['chrome', 'firefox', 'edge', 'safari'],
        titlePatterns: ['coursera', 'udemy', 'pluralsight', 'codecademy', 'freecodecamp'],
        regexPatterns: [],
        domainPatterns: ['coursera.org', 'udemy.com', 'pluralsight.com', 'codecademy.com', 'freecodecamp.org'],
        productivityScore: 0.90,
        enabled: true,
        tags: ['learning', 'courses', 'education']
      },

      // Entertainment Rules
      {
        id: 'entertainment-video',
        description: 'Video Streaming',
        priority: 4,
        category: CategoryType.ENTERTAINMENT,
        appPatterns: ['youtube', 'netflix', 'prime video', 'disney+', 'twitch'],
        titlePatterns: ['watch', 'stream', 'video'],
        regexPatterns: [],
        domainPatterns: ['youtube.com', 'netflix.com', 'twitch.tv', 'primevideo.com'],
        productivityScore: 0.15,
        enabled: true,
        tags: ['entertainment', 'video', 'streaming']
      },
      {
        id: 'entertainment-music',
        description: 'Music and Audio',
        priority: 4,
        category: CategoryType.ENTERTAINMENT,
        appPatterns: ['spotify', 'apple music', 'youtube music', 'soundcloud', 'podcast'],
        titlePatterns: ['music', 'playlist', 'podcast'],
        regexPatterns: [],
        productivityScore: 0.30, // Music can be background while working
        enabled: true,
        tags: ['entertainment', 'music', 'audio']
      },
      {
        id: 'entertainment-games',
        description: 'Gaming',
        priority: 4,
        category: CategoryType.ENTERTAINMENT,
        appPatterns: ['steam', 'epic games', 'battle.net', 'origin', 'uplay', 'game'],
        titlePatterns: ['game', 'gaming', 'play'],
        regexPatterns: [],
        productivityScore: 0.10,
        enabled: true,
        tags: ['entertainment', 'gaming', 'games']
      },
      {
        id: 'entertainment-social',
        description: 'Social Media',
        priority: 4,
        category: CategoryType.ENTERTAINMENT,
        appPatterns: ['chrome', 'firefox', 'edge', 'safari'],
        titlePatterns: ['facebook', 'twitter', 'instagram', 'tiktok', 'reddit', 'linkedin'],
        regexPatterns: [],
        domainPatterns: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com', 'linkedin.com'],
        productivityScore: 0.20,
        enabled: true,
        tags: ['entertainment', 'social', 'networking']
      }
    ];
  }

  private loadUserPreferences(): void {
    // Load user preferences from storage (placeholder)
    // In a real implementation, this would load from a database
  }

  categorize(appName: string, windowTitle?: string): CategoryResult {
    // Try multiple categorization methods in order of preference
    const results = [
      this.tryUserPreference(appName, windowTitle),
      this.tryAdvancedRuleMatching(appName, windowTitle),
      this.tryMachineLearning(appName, windowTitle),
      this.tryFuzzyMatching(appName, windowTitle)
    ].filter(result => result !== null) as CategoryResult[];

    if (results.length > 0) {
      // Return the result with highest confidence
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return {
        ...bestResult,
        suggestions: this.generateSuggestions(appName, windowTitle)
      };
    }

    return {
      category: CategoryType.UNCATEGORIZED,
      productivityScore: 0.5,
      matchType: 'default',
      confidence: 0.3,
      suggestions: this.generateSuggestions(appName, windowTitle)
    };
  }

  private tryUserPreference(appName: string, windowTitle?: string): CategoryResult | null {
    const key = `${appName}:${windowTitle || ''}`;
    const preferredCategory = this.userPreferences.get(key);
    
    if (preferredCategory) {
      return {
        category: preferredCategory,
        productivityScore: this.getScoreForCategory(preferredCategory),
        matchType: 'app',
        confidence: 0.95
      };
    }
    
    return null;
  }

  private tryAdvancedRuleMatching(appName: string, windowTitle?: string): CategoryResult | null {
    const enabledRules = this.rules.filter(rule => rule.enabled);
    const sortedRules = enabledRules.sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      const matchResult = this.evaluateRule(rule, appName, windowTitle);
      if (matchResult.matches) {
        let score = rule.customScore || rule.productivityScore;
        
        // Apply time-based modifiers
        if (rule.timeBasedRules) {
          const timeModifier = this.getTimeBasedModifier(rule.timeBasedRules);
          score *= timeModifier;
        }
        
        return {
          category: rule.category,
          productivityScore: Math.max(0, Math.min(1, score)),
          matchType: matchResult.matchType,
          matchedRule: rule,
          confidence: matchResult.confidence
        };
      }
    }
    
    return null;
  }

  private evaluateRule(rule: CategoryRule, appName: string, windowTitle?: string): { matches: boolean; matchType: 'app' | 'title' | 'regex'; confidence: number } {
    const appLower = appName.toLowerCase();
    const titleLower = windowTitle?.toLowerCase() || '';
    
    // Check app patterns
    for (const pattern of rule.appPatterns) {
      if (appLower.includes(pattern.toLowerCase())) {
        return { matches: true, matchType: 'app', confidence: 0.9 };
      }
    }
    
    // Check title patterns
    if (windowTitle && rule.titlePatterns.length > 0) {
      for (const pattern of rule.titlePatterns) {
        if (titleLower.includes(pattern.toLowerCase())) {
          return { matches: true, matchType: 'title', confidence: 0.8 };
        }
      }
    }
    
    // Check regex patterns
    if (rule.regexPatterns.length > 0) {
      const textToMatch = `${appName} ${windowTitle || ''}`;
      for (const regexStr of rule.regexPatterns) {
        try {
          const regex = new RegExp(regexStr, 'i');
          if (regex.test(textToMatch)) {
            return { matches: true, matchType: 'regex', confidence: 0.85 };
          }
        } catch (e) {
          console.warn(`Invalid regex pattern: ${regexStr}`);
        }
      }
    }
    
    // Check domain patterns (for browser windows)
    if (rule.domainPatterns && windowTitle) {
      for (const domain of rule.domainPatterns) {
        if (titleLower.includes(domain.toLowerCase())) {
          return { matches: true, matchType: 'title', confidence: 0.9 };
        }
      }
    }
    
    return { matches: false, matchType: 'app', confidence: 0 };
  }

  private getTimeBasedModifier(timeRules: TimeBasedRule[]): number {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    for (const rule of timeRules) {
      if (rule.daysOfWeek.includes(currentDay) &&
          currentHour >= rule.startHour &&
          currentHour <= rule.endHour) {
        return rule.productivityModifier;
      }
    }
    
    return 1.0; // No modifier
  }

  private tryMachineLearning(appName: string, windowTitle?: string): CategoryResult | null {
    // Simple ML based on historical data
    const historicalData = this.mlData.filter(data => 
      data.appName.toLowerCase() === appName.toLowerCase() ||
      (windowTitle && data.windowTitle && data.windowTitle.toLowerCase().includes(windowTitle.toLowerCase()))
    );
    
    if (historicalData.length < 3) return null;
    
    // Calculate category probabilities
    const categoryScores: { [key: string]: number } = {};
    historicalData.forEach(data => {
      const category = data.category;
      const weight = data.userFeedback === 'correct' ? 1.5 : (data.userFeedback === 'incorrect' ? 0.5 : 1.0);
      categoryScores[category] = (categoryScores[category] || 0) + weight;
    });
    
    const bestCategory = Object.keys(categoryScores).reduce((a, b) => 
      categoryScores[a] > categoryScores[b] ? a : b
    );
    
    const confidence = categoryScores[bestCategory] / historicalData.length;
    
    if (confidence > 0.6) {
      return {
        category: bestCategory as CategoryType,
        productivityScore: this.getScoreForCategory(bestCategory as CategoryType),
        matchType: 'ml',
        confidence: Math.min(0.9, confidence)
      };
    }
    
    return null;
  }

  private tryFuzzyMatching(appName: string, windowTitle?: string): CategoryResult | null {
    // Implement fuzzy string matching for similar app names
    let bestMatch: { rule: CategoryRule; score: number } | null = null;
    
    for (const rule of this.rules.filter(r => r.enabled)) {
      for (const pattern of rule.appPatterns) {
        const similarity = this.calculateStringSimilarity(appName.toLowerCase(), pattern.toLowerCase());
        if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.score)) {
          bestMatch = { rule, score: similarity };
        }
      }
      
      if (windowTitle) {
        for (const pattern of rule.titlePatterns) {
          const similarity = this.calculateStringSimilarity(windowTitle.toLowerCase(), pattern.toLowerCase());
          if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.score)) {
            bestMatch = { rule, score: similarity };
          }
        }
      }
    }
    
    if (bestMatch && bestMatch.score > 0.7) {
      return {
        category: bestMatch.rule.category,
        productivityScore: bestMatch.rule.productivityScore,
        matchType: 'app',
        matchedRule: bestMatch.rule,
        confidence: bestMatch.score * 0.7 // Reduce confidence for fuzzy matches
      };
    }
    
    return null;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance implementation
    const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
    matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i);
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2[i - 1] === str1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (matrix[str2.length][str1.length] / maxLength);
  }

  private generateSuggestions(appName: string, windowTitle?: string): string[] {
    const suggestions = [];
    
    // Find rules with similar patterns
    const appLower = appName.toLowerCase();
    const titleLower = windowTitle?.toLowerCase() || '';
    
    for (const rule of this.rules.filter(r => r.enabled)) {
      let relevance = 0;
      
      // Check partial matches in app patterns
      for (const pattern of rule.appPatterns) {
        if (appLower.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(appLower)) {
          relevance += 0.3;
        }
      }
      
      // Check partial matches in title patterns
      for (const pattern of rule.titlePatterns) {
        if (titleLower.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(titleLower)) {
          relevance += 0.2;
        }
      }
      
      if (relevance > 0.2) {
        suggestions.push(`Consider ${rule.category} (${rule.description})`);
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private getScoreForCategory(category: CategoryType): number {
    const categoryScores = {
      [CategoryType.DEVELOPMENT]: 0.90,
      [CategoryType.WORK]: 0.75,
      [CategoryType.LEARNING]: 0.85,
      [CategoryType.ENTERTAINMENT]: 0.25,
      [CategoryType.UNCATEGORIZED]: 0.50
    };
    return categoryScores[category] || 0.50;
  }

  // Advanced Rule Management Methods
  
  addUserFeedback(appName: string, windowTitle: string | undefined, expectedCategory: CategoryType, isCorrect: boolean): void {
    const mlData: MachineLearningData = {
      appName,
      windowTitle,
      category: expectedCategory,
      userFeedback: isCorrect ? 'correct' : 'incorrect',
      timestamp: new Date()
    };
    
    this.mlData.push(mlData);
    
    // Limit ML data to last 1000 entries
    if (this.mlData.length > 1000) {
      this.mlData = this.mlData.slice(-1000);
    }
    
    // Update user preferences if feedback is positive
    if (isCorrect) {
      const key = `${appName}:${windowTitle || ''}`;
      this.userPreferences.set(key, expectedCategory);
    }
  }

  createCustomRule(rule: Omit<CategoryRule, 'id'>): CategoryRule {
    const newRule: CategoryRule = {
      ...rule,
      id: `custom_${Date.now()}`,
      enabled: true
    };
    
    this.rules.push(newRule);
    this.sortRulesByPriority();
    
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<CategoryRule>): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;
    
    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    this.sortRulesByPriority();
    
    return true;
  }

  deleteRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    return this.rules.length < initialLength;
  }

  toggleRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return false;
    
    rule.enabled = !rule.enabled;
    return true;
  }

  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  testCategorization(appName: string, windowTitle?: string) {
    const result = this.categorize(appName, windowTitle);
    
    // Get all potential matches for analysis
    const allMatches = this.rules
      .filter(rule => rule.enabled)
      .map(rule => ({
        rule,
        evaluation: this.evaluateRule(rule, appName, windowTitle)
      }))
      .filter(match => match.evaluation.matches);
    
    return {
      appName,
      windowTitle,
      result,
      allMatches,
      mlDataCount: this.mlData.filter(data => 
        data.appName === appName || (windowTitle && data.windowTitle?.includes(windowTitle))
      ).length
    };
  }

  getActiveRules(): CategoryRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  getAllRules(): CategoryRule[] {
    return [...this.rules];
  }

  getRulesByCategory(category: CategoryType): CategoryRule[] {
    return this.rules.filter(rule => rule.category === category);
  }

  searchRules(query: string): CategoryRule[] {
    const queryLower = query.toLowerCase();
    return this.rules.filter(rule => 
      rule.description.toLowerCase().includes(queryLower) ||
      rule.appPatterns.some(pattern => pattern.toLowerCase().includes(queryLower)) ||
      rule.titlePatterns.some(pattern => pattern.toLowerCase().includes(queryLower)) ||
      rule.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  getCategoryStats() {
    const stats: { [key: string]: any } = {};
    
    this.rules.forEach(rule => {
      const categoryName = rule.category;
      if (!stats[categoryName]) {
        stats[categoryName] = {
          rulesCount: 0,
          activeRulesCount: 0,
          avgProductivity: 0,
          appPatternsCount: 0,
          titlePatternsCount: 0,
          regexPatternsCount: 0,
          customRulesCount: 0
        };
      }
      
      stats[categoryName].rulesCount += 1;
      if (rule.enabled) stats[categoryName].activeRulesCount += 1;
      if (rule.id.startsWith('custom_')) stats[categoryName].customRulesCount += 1;
      
      stats[categoryName].avgProductivity += rule.productivityScore;
      stats[categoryName].appPatternsCount += rule.appPatterns.length;
      stats[categoryName].titlePatternsCount += rule.titlePatterns.length;
      stats[categoryName].regexPatternsCount += rule.regexPatterns.length;
    });
    
    // Calculate averages
    Object.keys(stats).forEach(category => {
      if (stats[category].rulesCount > 0) {
        stats[category].avgProductivity /= stats[category].rulesCount;
      }
    });
    
    return stats;
  }

  getMLStats() {
    const totalData = this.mlData.length;
    const correctFeedback = this.mlData.filter(data => data.userFeedback === 'correct').length;
    const incorrectFeedback = this.mlData.filter(data => data.userFeedback === 'incorrect').length;
    
    const categoryDistribution: { [key: string]: number } = {};
    this.mlData.forEach(data => {
      categoryDistribution[data.category] = (categoryDistribution[data.category] || 0) + 1;
    });
    
    return {
      totalDataPoints: totalData,
      correctFeedback,
      incorrectFeedback,
      accuracy: totalData > 0 ? correctFeedback / (correctFeedback + incorrectFeedback) : 0,
      categoryDistribution,
      userPreferencesCount: this.userPreferences.size
    };
  }

  exportRules(): string {
    return JSON.stringify({
      rules: this.rules,
      userPreferences: Array.from(this.userPreferences.entries()),
      mlData: this.mlData.slice(-100), // Export only recent ML data
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  importRules(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.rules && Array.isArray(parsed.rules)) {
        this.rules = parsed.rules;
        this.sortRulesByPriority();
      }
      
      if (parsed.userPreferences && Array.isArray(parsed.userPreferences)) {
        this.userPreferences = new Map(parsed.userPreferences);
      }
      
      if (parsed.mlData && Array.isArray(parsed.mlData)) {
        this.mlData = parsed.mlData.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import rules:', error);
      return false;
    }
  }

  static getCategoryColor(category: CategoryType): string {
    const colors = {
      [CategoryType.DEVELOPMENT]: '#4CAF50',
      [CategoryType.WORK]: '#2196F3', 
      [CategoryType.LEARNING]: '#FF9800',
      [CategoryType.ENTERTAINMENT]: '#E91E63',
      [CategoryType.UNCATEGORIZED]: '#9E9E9E'
    };
    return colors[category] || '#9E9E9E';
  }

  static getCategoryIcon(category: CategoryType): string {
    const icons = {
      [CategoryType.DEVELOPMENT]: '💻',
      [CategoryType.WORK]: '💼',
      [CategoryType.LEARNING]: '📚',
      [CategoryType.ENTERTAINMENT]: '🎮',
      [CategoryType.UNCATEGORIZED]: '❓'
    };
    return icons[category] || '❓';
  }

  static getCategoryDescription(category: CategoryType): string {
    const descriptions = {
      [CategoryType.DEVELOPMENT]: 'Programming, coding, and software development',
      [CategoryType.WORK]: 'Professional tasks, meetings, and business applications',
      [CategoryType.LEARNING]: 'Educational content, tutorials, and skill development',
      [CategoryType.ENTERTAINMENT]: 'Games, videos, music, and leisure activities',
      [CategoryType.UNCATEGORIZED]: 'Activities that do not fit into other categories'
    };
    return descriptions[category] || 'Unknown category';
  }
}

export const categoryManager = new CategoryManager();
export default CategoryManager;