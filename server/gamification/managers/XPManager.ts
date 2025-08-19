/**
 * Life Tracker Pro - XP Manager
 * Core experience points calculation and level progression system
 */

export interface XPSource {
  type: string;
  baseValue: number;
  multiplier?: number;
  metadata?: any;
}

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  xpForCurrentLevel: number;
  progressPercentage: number;
  title: string;
  prestigeLevel?: number;
}

export interface XPTransaction {
  id: string;
  userId: string;
  source: XPSource;
  xpGained: number;
  timestamp: Date;
  sessionId?: string;
  description: string;
}

export class XPManager {
  
  // XP Source Definitions
  private static readonly XP_SOURCES = {
    SESSION_COMPLETION: {
      baseFormula: (duration: number, productivity: number) => {
        const baseXP = Math.floor(duration / 60) * 2; // 2 XP per minute
        const productivityBonus = productivity > 80 ? baseXP * 0.5 : 
                                 productivity > 60 ? baseXP * 0.3 : 
                                 productivity > 40 ? baseXP * 0.1 : 0;
        return Math.floor(baseXP + productivityBonus);
      }
    },
    
    STREAK_BONUS: {
      formula: (streakDays: number) => {
        if (streakDays < 3) return 0;
        if (streakDays < 7) return streakDays * 5;
        if (streakDays < 30) return streakDays * 8;
        if (streakDays < 100) return streakDays * 12;
        return streakDays * 15; // 100+ days
      }
    },
    
    GOAL_ACHIEVEMENT: {
      daily: 25,
      weekly: 100,
      monthly: 400,
      perfect_day: 200 // All goals completed with high productivity
    },
    
    CATEGORY_MASTERY: {
      first_hour: 5,
      milestone_10h: 50,
      milestone_50h: 150,
      milestone_100h: 300,
      expertise_500h: 1000
    },
    
    PRODUCTIVITY_PEAKS: {
      formula: (score: number) => {
        if (score >= 95) return 100;
        if (score >= 90) return 75;
        if (score >= 85) return 50;
        if (score >= 80) return 25;
        return 0;
      }
    },
    
    SPECIAL_ACHIEVEMENTS: {
      early_bird: 30,      // Session before 6 AM
      night_owl: 20,       // Session after 10 PM
      weekend_warrior: 40, // Weekend productivity
      comeback: 60,        // Return after break
      marathon: 100,       // 6+ hour session
      sprint_master: 50    // Perfect 25min pomodoro
    },
    
    SOCIAL_BONUSES: {
      challenge_complete: 150,
      leaderboard_top10: 200,
      helping_others: 25,
      sharing_achievement: 15
    }
  };

  // Level System Configuration
  private static readonly LEVEL_CONFIG = {
    BASE_XP: 100,
    EXPONENTIAL_FACTOR: 1.15,
    PRESTIGE_THRESHOLD: 100,
    
    TITLES: [
      'Novato', 'Iniciante', 'Aprendiz', 'Focado', 'Dedicado',
      'Produtivo', 'Eficiente', 'Expert', 'Veterano', 'Mestre',
      'Guru', 'Lenda', 'Imortal', 'Transcendente', 'Divino'
    ],
    
    PRESTIGE_TITLES: [
      'Ascendido', 'Iluminado', 'Cósmico', 'Dimensional', 'Infinito'
    ]
  };

  /**
   * Calculate XP for session completion
   */
  static calculateSessionXP(
    duration: number, 
    productivity: number, 
    category: string,
    metadata: any = {}
  ): XPTransaction {
    const baseXP = this.XP_SOURCES.SESSION_COMPLETION.baseFormula(duration, productivity);
    
    // Apply multipliers
    let multiplier = 1.0;
    
    // Streak bonus
    if (metadata.streakDays) {
      const streakBonus = this.XP_SOURCES.STREAK_BONUS.formula(metadata.streakDays);
      multiplier += streakBonus / 100; // Convert to percentage
    }
    
    // Time-of-day bonuses
    const hour = new Date().getHours();
    if (hour < 6 && hour >= 4) multiplier += 0.2; // Early bird
    if (hour >= 22 || hour < 2) multiplier += 0.15; // Night owl
    
    // Weekend bonus
    const isWeekend = [0, 6].includes(new Date().getDay());
    if (isWeekend) multiplier += 0.25;
    
    // Category mastery bonus (placeholder - would come from user stats)
    if (metadata.categoryMasteryLevel) {
      multiplier += metadata.categoryMasteryLevel * 0.1;
    }
    
    const finalXP = Math.floor(baseXP * multiplier);
    
    return {
      id: this.generateTransactionId(),
      userId: metadata.userId || 'default',
      source: {
        type: 'SESSION_COMPLETION',
        baseValue: baseXP,
        multiplier,
        metadata: { duration, productivity, category }
      },
      xpGained: finalXP,
      timestamp: new Date(),
      sessionId: metadata.sessionId,
      description: `Session completed: ${category} (${Math.floor(duration/60)}min, ${productivity}% productivity)`
    };
  }

  /**
   * Calculate XP for achieving goals
   */
  static calculateGoalXP(
    goalType: 'daily' | 'weekly' | 'monthly' | 'perfect_day',
    metadata: any = {}
  ): XPTransaction {
    const baseXP = this.XP_SOURCES.GOAL_ACHIEVEMENT[goalType];
    
    return {
      id: this.generateTransactionId(),
      userId: metadata.userId || 'default',
      source: {
        type: 'GOAL_ACHIEVEMENT',
        baseValue: baseXP,
        metadata: { goalType }
      },
      xpGained: baseXP,
      timestamp: new Date(),
      description: `Goal achieved: ${goalType}`
    };
  }

  /**
   * Calculate XP for productivity peaks
   */
  static calculateProductivityPeakXP(
    productivityScore: number,
    metadata: any = {}
  ): XPTransaction | null {
    const xpGained = this.XP_SOURCES.PRODUCTIVITY_PEAKS.formula(productivityScore);
    
    if (xpGained === 0) return null;
    
    return {
      id: this.generateTransactionId(),
      userId: metadata.userId || 'default',
      source: {
        type: 'PRODUCTIVITY_PEAK',
        baseValue: xpGained,
        metadata: { productivityScore }
      },
      xpGained,
      timestamp: new Date(),
      description: `Productivity peak achieved: ${productivityScore}%`
    };
  }

  /**
   * Calculate XP for special achievements
   */
  static calculateSpecialAchievementXP(
    achievementType: keyof typeof XPManager.XP_SOURCES.SPECIAL_ACHIEVEMENTS,
    metadata: any = {}
  ): XPTransaction {
    const baseXP = this.XP_SOURCES.SPECIAL_ACHIEVEMENTS[achievementType];
    
    return {
      id: this.generateTransactionId(),
      userId: metadata.userId || 'default',
      source: {
        type: 'SPECIAL_ACHIEVEMENT',
        baseValue: baseXP,
        metadata: { achievementType }
      },
      xpGained: baseXP,
      timestamp: new Date(),
      description: `Special achievement: ${achievementType}`
    };
  }

  /**
   * Calculate required XP for a specific level
   */
  static calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;
    
    const { BASE_XP, EXPONENTIAL_FACTOR } = this.LEVEL_CONFIG;
    return Math.floor(BASE_XP * Math.pow(EXPONENTIAL_FACTOR, level - 1));
  }

  /**
   * Calculate total XP required to reach a level
   */
  static calculateTotalXPForLevel(level: number): number {
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      totalXP += this.calculateXPForLevel(i);
    }
    return totalXP;
  }

  /**
   * Get level information from total XP
   */
  static getLevelInfo(totalXP: number, prestigeLevel: number = 0): LevelInfo {
    let currentLevel = 1;
    let xpRemaining = totalXP;
    
    // Calculate current level
    while (xpRemaining >= this.calculateXPForLevel(currentLevel + 1)) {
      xpRemaining -= this.calculateXPForLevel(currentLevel + 1);
      currentLevel++;
      
      // Handle prestige
      if (currentLevel >= this.LEVEL_CONFIG.PRESTIGE_THRESHOLD) {
        currentLevel = 1;
        prestigeLevel++;
        xpRemaining = totalXP - this.calculateTotalXPForLevel(this.LEVEL_CONFIG.PRESTIGE_THRESHOLD);
      }
    }
    
    const xpForCurrentLevel = this.calculateXPForLevel(currentLevel);
    const xpForNextLevel = this.calculateXPForLevel(currentLevel + 1);
    const progressPercentage = xpForNextLevel > 0 ? (xpRemaining / xpForNextLevel) * 100 : 100;
    
    // Determine title
    const title = this.getTitle(currentLevel, prestigeLevel);
    
    return {
      level: currentLevel,
      currentXP: xpRemaining,
      xpForNextLevel,
      xpForCurrentLevel,
      progressPercentage: Math.min(progressPercentage, 100),
      title,
      prestigeLevel
    };
  }

  /**
   * Get title based on level and prestige
   */
  static getTitle(level: number, prestigeLevel: number = 0): string {
    const { TITLES, PRESTIGE_TITLES } = this.LEVEL_CONFIG;
    
    if (prestigeLevel > 0) {
      const prestigeTitle = PRESTIGE_TITLES[Math.min(prestigeLevel - 1, PRESTIGE_TITLES.length - 1)];
      const baseTitle = TITLES[Math.min(level - 1, TITLES.length - 1)];
      return `${prestigeTitle} ${baseTitle}`;
    }
    
    return TITLES[Math.min(level - 1, TITLES.length - 1)];
  }

  /**
   * Calculate daily XP summary
   */
  static calculateDailyXPSummary(transactions: XPTransaction[]): {
    totalXP: number;
    sourceBreakdown: { [key: string]: number };
    transactionCount: number;
    averageXPPerTransaction: number;
    topSource: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => 
      t.timestamp >= today && t.timestamp < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    );
    
    const totalXP = todayTransactions.reduce((sum, t) => sum + t.xpGained, 0);
    const sourceBreakdown: { [key: string]: number } = {};
    
    todayTransactions.forEach(t => {
      sourceBreakdown[t.source.type] = (sourceBreakdown[t.source.type] || 0) + t.xpGained;
    });
    
    const topSource = Object.keys(sourceBreakdown).reduce((a, b) => 
      sourceBreakdown[a] > sourceBreakdown[b] ? a : b, ''
    );
    
    return {
      totalXP,
      sourceBreakdown,
      transactionCount: todayTransactions.length,
      averageXPPerTransaction: todayTransactions.length > 0 ? totalXP / todayTransactions.length : 0,
      topSource
    };
  }

  /**
   * Simulate level progression preview
   */
  static simulateLevelProgression(currentXP: number, projectedDailyXP: number, days: number): LevelInfo[] {
    const progression: LevelInfo[] = [];
    
    for (let day = 0; day <= days; day++) {
      const totalXP = currentXP + (projectedDailyXP * day);
      progression.push(this.getLevelInfo(totalXP));
    }
    
    return progression;
  }

  /**
   * Get XP multiplier for current streak
   */
  static getStreakMultiplier(streakDays: number): number {
    if (streakDays < 3) return 1.0;
    if (streakDays < 7) return 1.1;
    if (streakDays < 14) return 1.2;
    if (streakDays < 30) return 1.3;
    if (streakDays < 60) return 1.4;
    if (streakDays < 100) return 1.5;
    return 1.6; // 100+ days
  }

  /**
   * Calculate bonus XP for maintaining streaks
   */
  static calculateStreakMaintainanceBonus(streakDays: number): number {
    // Daily bonus for maintaining streak
    if (streakDays >= 100) return 50;
    if (streakDays >= 50) return 30;
    if (streakDays >= 21) return 20;
    if (streakDays >= 7) return 10;
    if (streakDays >= 3) return 5;
    return 0;
  }

  /**
   * Generate unique transaction ID
   */
  private static generateTransactionId(): string {
    return `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format XP value for display
   */
  static formatXP(xp: number): string {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M XP`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k XP`;
    return `${xp} XP`;
  }

  /**
   * Get level color based on level and prestige
   */
  static getLevelColor(level: number, prestigeLevel: number = 0): string {
    if (prestigeLevel > 0) {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
      return colors[Math.min(prestigeLevel - 1, colors.length - 1)];
    }
    
    if (level >= 80) return '#ffd700'; // Gold
    if (level >= 60) return '#c0392b'; // Red
    if (level >= 40) return '#8e44ad'; // Purple
    if (level >= 20) return '#3498db'; // Blue
    if (level >= 10) return '#27ae60'; // Green
    return '#95a5a6'; // Gray
  }

  /**
   * Calculate XP efficiency (XP per minute)
   */
  static calculateXPEfficiency(totalXP: number, totalMinutes: number): number {
    return totalMinutes > 0 ? totalXP / totalMinutes : 0;
  }

  /**
   * Get recommended daily XP target based on current level
   */
  static getRecommendedDailyXP(currentLevel: number): number {
    const baseTarget = 200;
    const levelMultiplier = Math.floor(currentLevel / 10) * 50;
    return baseTarget + levelMultiplier;
  }
}