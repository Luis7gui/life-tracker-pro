/**
 * Life Tracker Pro - Streak Tracker
 * Advanced streak tracking system with multiple streak types and recovery
 */

export interface Streak {
  id: string;
  userId: string;
  type: StreakType;
  category?: string;
  currentCount: number;
  maxCount: number;
  lastActiveDate: Date;
  startDate: Date;
  isActive: boolean;
  freezeUsed: number;
  maxFreezes: number;
}

export interface StreakSnapshot {
  streakId: string;
  date: Date;
  count: number;
  wasActive: boolean;
  notes?: string;
}

export interface StreakMilestone {
  count: number;
  name: string;
  reward: number; // XP reward
  badge?: string;
  description: string;
}

export type StreakType = 
  | 'daily_general'      // Any activity per day
  | 'daily_category'     // Specific category per day
  | 'productivity'       // High productivity per day
  | 'goals'             // Daily goals completion
  | 'consistency'       // Regular intervals
  | 'weekend'           // Weekend activity
  | 'early_bird'        // Early morning sessions
  | 'night_owl';        // Late evening sessions

export interface StreakCondition {
  type: StreakType;
  minimumDuration?: number;
  minimumProductivity?: number;
  timeWindow?: { start: number; end: number }; // Hours
  category?: string;
  customCondition?: (sessionData: any) => boolean;
}

export class StreakTracker {
  
  // Streak Milestones Configuration
  private static readonly STREAK_MILESTONES: StreakMilestone[] = [
    { count: 3, name: 'Iniciante Consistente', reward: 25, description: '3 dias consecutivos' },
    { count: 7, name: 'Semana Forte', reward: 75, badge: 'week_warrior', description: 'Uma semana completa' },
    { count: 14, name: 'Fortemente Dedicado', reward: 150, description: 'Duas semanas consecutivas' },
    { count: 21, name: 'Hábito Formado', reward: 250, badge: 'habit_master', description: 'Três semanas - hábito consolidado' },
    { count: 30, name: 'Mestre do Mês', reward: 400, badge: 'month_master', description: 'Um mês inteiro' },
    { count: 50, name: 'Dedicação Exemplar', reward: 600, description: 'Cinquenta dias consecutivos' },
    { count: 75, name: 'Lenda da Consistência', reward: 900, badge: 'consistency_legend', description: 'Mais de dois meses' },
    { count: 100, name: 'Centurião', reward: 1500, badge: 'centurion', description: 'Cem dias épicos' },
    { count: 200, name: 'Imortal', reward: 3000, badge: 'immortal', description: 'Duzentos dias lendários' },
    { count: 365, name: 'Lenda Anual', reward: 10000, badge: 'year_legend', description: 'Um ano completo!' }
  ];

  // Streak Type Configurations
  private static readonly STREAK_CONFIGS: { [key in StreakType]: StreakCondition } = {
    daily_general: {
      type: 'daily_general',
      minimumDuration: 300 // 5 minutes minimum
    },
    
    daily_category: {
      type: 'daily_category',
      minimumDuration: 600 // 10 minutes minimum in specific category
    },
    
    productivity: {
      type: 'productivity',
      minimumProductivity: 70,
      minimumDuration: 900 // 15 minutes with 70%+ productivity
    },
    
    goals: {
      type: 'goals',
      customCondition: (data) => data.dailyGoalsCompleted >= data.dailyGoalsTotal
    },
    
    consistency: {
      type: 'consistency',
      minimumDuration: 1800 // 30 minutes minimum
    },
    
    weekend: {
      type: 'weekend',
      minimumDuration: 600,
      customCondition: (data) => [0, 6].includes(new Date(data.date).getDay())
    },
    
    early_bird: {
      type: 'early_bird',
      timeWindow: { start: 4, end: 8 }, // 4 AM to 8 AM
      minimumDuration: 600
    },
    
    night_owl: {
      type: 'night_owl',
      timeWindow: { start: 20, end: 2 }, // 8 PM to 2 AM (next day)
      minimumDuration: 600
    }
  };

  /**
   * Create a new streak
   */
  static createStreak(
    userId: string, 
    type: StreakType, 
    category?: string
  ): Streak {
    return {
      id: this.generateStreakId(),
      userId,
      type,
      category,
      currentCount: 0,
      maxCount: 0,
      lastActiveDate: new Date(),
      startDate: new Date(),
      isActive: true,
      freezeUsed: 0,
      maxFreezes: this.getMaxFreezes(type)
    };
  }

  /**
   * Update streak based on daily activity
   */
  static updateStreak(
    streak: Streak, 
    dailyData: any, 
    date: Date = new Date()
  ): { 
    updatedStreak: Streak; 
    milestoneReached?: StreakMilestone; 
    streakBroken: boolean;
    canUseFreeze: boolean;
  } {
    const config = this.STREAK_CONFIGS[streak.type];
    const meetsCondition = this.evaluateStreakCondition(config, dailyData, date);
    
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const daysSinceLastActive = Math.floor(
      (date.getTime() - streak.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let updatedStreak = { ...streak };
    let milestoneReached: StreakMilestone | undefined;
    let streakBroken = false;
    let canUseFreeze = false;

    if (meetsCondition) {
      // Streak continues or starts
      if (daysSinceLastActive <= 1) {
        // Continue streak
        updatedStreak.currentCount += 1;
        updatedStreak.lastActiveDate = date;
        
        // Update max if necessary
        if (updatedStreak.currentCount > updatedStreak.maxCount) {
          updatedStreak.maxCount = updatedStreak.currentCount;
        }
        
        // Check for milestones
        milestoneReached = this.checkMilestone(updatedStreak.currentCount);
        
      } else if (daysSinceLastActive === 2 && updatedStreak.freezeUsed < updatedStreak.maxFreezes) {
        // Can use freeze to maintain streak
        canUseFreeze = true;
      } else {
        // Restart streak
        updatedStreak.currentCount = 1;
        updatedStreak.startDate = date;
        updatedStreak.lastActiveDate = date;
        streakBroken = true;
      }
    } else {
      // Condition not met
      if (daysSinceLastActive >= 1) {
        if (updatedStreak.freezeUsed < updatedStreak.maxFreezes && daysSinceLastActive === 1) {
          // Can use freeze
          canUseFreeze = true;
        } else {
          // Streak broken
          updatedStreak.currentCount = 0;
          updatedStreak.isActive = false;
          streakBroken = true;
        }
      }
    }

    return {
      updatedStreak,
      milestoneReached,
      streakBroken,
      canUseFreeze
    };
  }

  /**
   * Use streak freeze to maintain streak
   */
  static useStreakFreeze(streak: Streak): Streak {
    if (streak.freezeUsed >= streak.maxFreezes) {
      throw new Error('No streak freezes remaining');
    }

    return {
      ...streak,
      freezeUsed: streak.freezeUsed + 1,
      lastActiveDate: new Date() // Extend last active date
    };
  }

  /**
   * Evaluate if streak condition is met for a given day
   */
  private static evaluateStreakCondition(
    config: StreakCondition, 
    dailyData: any, 
    date: Date
  ): boolean {
    // Check custom condition first
    if (config.customCondition) {
      return config.customCondition(dailyData);
    }

    // Check minimum duration
    if (config.minimumDuration && dailyData.totalDuration < config.minimumDuration) {
      return false;
    }

    // Check minimum productivity
    if (config.minimumProductivity && dailyData.averageProductivity < config.minimumProductivity) {
      return false;
    }

    // Check time window
    if (config.timeWindow) {
      const hasSessionInWindow = dailyData.sessions?.some((session: any) => {
        const sessionHour = new Date(session.startTime).getHours();
        const { start, end } = config.timeWindow!;
        
        if (start > end) {
          // Crosses midnight (e.g., 20-2)
          return sessionHour >= start || sessionHour < end;
        } else {
          // Normal range (e.g., 4-8)
          return sessionHour >= start && sessionHour < end;
        }
      });
      
      if (!hasSessionInWindow) return false;
    }

    // Check category-specific condition
    if (config.category) {
      const categoryTime = dailyData.categoryBreakdown?.[config.category] || 0;
      return categoryTime >= (config.minimumDuration || 0);
    }

    return true;
  }

  /**
   * Get all user streaks
   */
  static getUserStreaks(userId: string, streaks: Streak[]): Streak[] {
    return streaks.filter(streak => streak.userId === userId);
  }

  /**
   * Get active streaks for user
   */
  static getActiveStreaks(userId: string, streaks: Streak[]): Streak[] {
    return streaks.filter(streak => streak.userId === userId && streak.isActive);
  }

  /**
   * Get streak by type and category
   */
  static getStreakByType(
    userId: string, 
    type: StreakType, 
    category: string | undefined,
    streaks: Streak[]
  ): Streak | undefined {
    return streaks.find(streak => 
      streak.userId === userId && 
      streak.type === type && 
      streak.category === category
    );
  }

  /**
   * Calculate streak statistics
   */
  static calculateStreakStats(streaks: Streak[]): {
    totalActiveStreaks: number;
    longestCurrentStreak: number;
    longestEverStreak: number;
    totalStreakDays: number;
    averageStreakLength: number;
    streakBreaksRecovered: number;
  } {
    const activeStreaks = streaks.filter(s => s.isActive);
    const longestCurrent = Math.max(...activeStreaks.map(s => s.currentCount), 0);
    const longestEver = Math.max(...streaks.map(s => s.maxCount), 0);
    const totalDays = streaks.reduce((sum, s) => sum + s.maxCount, 0);
    const averageLength = streaks.length > 0 ? totalDays / streaks.length : 0;
    
    // Count streaks that were broken and restarted
    const recovered = streaks.filter(s => s.maxCount > s.currentCount && s.currentCount > 0).length;

    return {
      totalActiveStreaks: activeStreaks.length,
      longestCurrentStreak: longestCurrent,
      longestEverStreak: longestEver,
      totalStreakDays: totalDays,
      averageStreakLength: averageLength,
      streakBreaksRecovered: recovered
    };
  }

  /**
   * Get streak multiplier for XP calculations
   */
  static getStreakMultiplier(streakCount: number): number {
    if (streakCount >= 100) return 2.0;
    if (streakCount >= 50) return 1.8;
    if (streakCount >= 30) return 1.6;
    if (streakCount >= 21) return 1.4;
    if (streakCount >= 14) return 1.3;
    if (streakCount >= 7) return 1.2;
    if (streakCount >= 3) return 1.1;
    return 1.0;
  }

  /**
   * Get streak health status
   */
  static getStreakHealth(streak: Streak): {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    daysUntilBreak: number;
    freezesRemaining: number;
    healthPercentage: number;
  } {
    const daysSinceActive = Math.floor(
      (new Date().getTime() - streak.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const freezesRemaining = streak.maxFreezes - streak.freezeUsed;
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    let daysUntilBreak: number;
    
    if (daysSinceActive === 0) {
      status = 'excellent';
      daysUntilBreak = 2;
    } else if (daysSinceActive === 1) {
      status = freezesRemaining > 0 ? 'good' : 'warning';
      daysUntilBreak = freezesRemaining > 0 ? 1 : 0;
    } else {
      status = 'critical';
      daysUntilBreak = 0;
    }
    
    const healthPercentage = status === 'excellent' ? 100 :
                           status === 'good' ? 75 :
                           status === 'warning' ? 50 : 25;

    return { status, daysUntilBreak, freezesRemaining, healthPercentage };
  }

  /**
   * Get recommended streak types for user
   */
  static getRecommendedStreakTypes(userData: any): StreakType[] {
    const recommendations: StreakType[] = [];
    
    // Always recommend daily general
    recommendations.push('daily_general');
    
    // Recommend productivity if user has good average
    if (userData.averageProductivity > 60) {
      recommendations.push('productivity');
    }
    
    // Recommend category-specific if user has dominant category
    if (userData.dominantCategory) {
      recommendations.push('daily_category');
    }
    
    // Recommend time-based streaks based on patterns
    if (userData.earlyBirdSessions > 10) {
      recommendations.push('early_bird');
    }
    
    if (userData.nightOwlSessions > 10) {
      recommendations.push('night_owl');
    }
    
    // Recommend goals if user sets them
    if (userData.dailyGoalsSet > 0) {
      recommendations.push('goals');
    }

    return recommendations;
  }

  /**
   * Check if milestone reached
   */
  private static checkMilestone(streakCount: number): StreakMilestone | undefined {
    return this.STREAK_MILESTONES.find(milestone => milestone.count === streakCount);
  }

  /**
   * Get max freezes allowed for streak type
   */
  private static getMaxFreezes(type: StreakType): number {
    const freezeConfig = {
      daily_general: 2,
      daily_category: 2,
      productivity: 1,
      goals: 1,
      consistency: 3,
      weekend: 1,
      early_bird: 2,
      night_owl: 2
    };
    
    return freezeConfig[type] || 1;
  }

  /**
   * Generate unique streak ID
   */
  private static generateStreakId(): string {
    return `streak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get streak display info
   */
  static getStreakDisplayInfo(streak: Streak): {
    title: string;
    description: string;
    icon: string;
    color: string;
  } {
    const displays = {
      daily_general: {
        title: 'Streak Diário',
        description: 'Atividade todos os dias',
        icon: '🔥',
        color: '#e74c3c'
      },
      daily_category: {
        title: `Streak ${streak.category}`,
        description: `Atividade em ${streak.category} diariamente`,
        icon: '🎯',
        color: '#3498db'
      },
      productivity: {
        title: 'Streak Produtividade',
        description: 'Alta produtividade diária',
        icon: '⚡',
        color: '#f39c12'
      },
      goals: {
        title: 'Streak Metas',
        description: 'Cumprindo metas diárias',
        icon: '🏆',
        color: '#27ae60'
      },
      consistency: {
        title: 'Streak Consistência',
        description: 'Regularidade na atividade',
        icon: '📈',
        color: '#9b59b6'
      },
      weekend: {
        title: 'Streak Fim de Semana',
        description: 'Produtivo nos fins de semana',
        icon: '🌅',
        color: '#e67e22'
      },
      early_bird: {
        title: 'Streak Madrugador',
        description: 'Atividade matinal',
        icon: '🌅',
        color: '#f1c40f'
      },
      night_owl: {
        title: 'Streak Coruja',
        description: 'Atividade noturna',
        icon: '🦉',
        color: '#34495e'
      }
    };

    return displays[streak.type];
  }

  /**
   * Get all streak milestones
   */
  static getAllMilestones(): StreakMilestone[] {
    return this.STREAK_MILESTONES;
  }

  /**
   * Get next milestone for streak count
   */
  static getNextMilestone(currentCount: number): StreakMilestone | undefined {
    return this.STREAK_MILESTONES.find(milestone => milestone.count > currentCount);
  }
}