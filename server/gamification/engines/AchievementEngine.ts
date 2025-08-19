/**
 * Life Tracker Pro - Achievement Engine
 * Advanced achievement detection and unlock system
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  iconUrl?: string;
  badgeColor: string;
  unlockCondition: AchievementCondition;
  prerequisites?: string[]; // Other achievement IDs required
  isSecret?: boolean;
  isRepeatable?: boolean;
  maxRepetitions?: number;
}

export interface AchievementProgress {
  achievementId: string;
  userId: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  repetitionCount: number;
}

export interface AchievementUnlock {
  achievement: Achievement;
  userId: string;
  unlockedAt: Date;
  triggerData?: any;
  xpAwarded: number;
}

export type AchievementCategory = 
  | 'productivity' 
  | 'consistency' 
  | 'mastery' 
  | 'social' 
  | 'exploration' 
  | 'time_management'
  | 'special_events';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface AchievementCondition {
  type: string;
  parameters: { [key: string]: any };
  evaluator: (userData: any, sessionData?: any) => { met: boolean; currentValue: number; targetValue: number };
}

export class AchievementEngine {
  
  // Achievement Definitions
  private static readonly ACHIEVEMENTS: Achievement[] = [
    // PRODUCTIVITY ACHIEVEMENTS
    {
      id: 'first_session',
      name: 'Primeira Jornada',
      description: 'Complete sua primeira sessão de produtividade',
      category: 'productivity',
      rarity: 'common',
      xpReward: 25,
      badgeColor: '#27ae60',
      unlockCondition: {
        type: 'session_count',
        parameters: { target: 1 },
        evaluator: (userData) => ({
          met: userData.totalSessions >= 1,
          currentValue: userData.totalSessions,
          targetValue: 1
        })
      }
    },
    
    {
      id: 'productivity_perfectionist',
      name: 'Perfeccionista',
      description: 'Alcance 100% de produtividade em uma sessão',
      category: 'productivity',
      rarity: 'uncommon',
      xpReward: 75,
      badgeColor: '#f39c12',
      unlockCondition: {
        type: 'max_productivity',
        parameters: { target: 100 },
        evaluator: (userData) => ({
          met: userData.maxProductivity >= 100,
          currentValue: userData.maxProductivity,
          targetValue: 100
        })
      }
    },
    
    {
      id: 'high_performer',
      name: 'Alto Desempenho',
      description: 'Mantenha produtividade acima de 90% por 7 dias consecutivos',
      category: 'productivity',
      rarity: 'rare',
      xpReward: 200,
      badgeColor: '#9b59b6',
      unlockCondition: {
        type: 'productivity_streak',
        parameters: { threshold: 90, days: 7 },
        evaluator: (userData) => ({
          met: userData.productivityStreak90Plus >= 7,
          currentValue: userData.productivityStreak90Plus,
          targetValue: 7
        })
      }
    },
    
    // CONSISTENCY ACHIEVEMENTS
    {
      id: 'week_warrior',
      name: 'Guerreiro da Semana',
      description: 'Complete pelo menos uma sessão por dia durante 7 dias',
      category: 'consistency',
      rarity: 'uncommon',
      xpReward: 100,
      badgeColor: '#3498db',
      unlockCondition: {
        type: 'daily_streak',
        parameters: { target: 7 },
        evaluator: (userData) => ({
          met: userData.currentStreak >= 7,
          currentValue: userData.currentStreak,
          targetValue: 7
        })
      }
    },
    
    {
      id: 'month_master',
      name: 'Mestre do Mês',
      description: 'Mantenha um streak de 30 dias',
      category: 'consistency',
      rarity: 'epic',
      xpReward: 500,
      badgeColor: '#e74c3c',
      unlockCondition: {
        type: 'daily_streak',
        parameters: { target: 30 },
        evaluator: (userData) => ({
          met: userData.currentStreak >= 30,
          currentValue: userData.currentStreak,
          targetValue: 30
        })
      }
    },
    
    {
      id: 'century_legend',
      name: 'Lenda do Século',
      description: 'Alcance um streak impressionante de 100 dias',
      category: 'consistency',
      rarity: 'legendary',
      xpReward: 2000,
      badgeColor: '#ffd700',
      unlockCondition: {
        type: 'daily_streak',
        parameters: { target: 100 },
        evaluator: (userData) => ({
          met: userData.currentStreak >= 100,
          currentValue: userData.currentStreak,
          targetValue: 100
        })
      }
    },
    
    // MASTERY ACHIEVEMENTS
    {
      id: 'category_explorer',
      name: 'Explorador',
      description: 'Use todas as categorias disponíveis pelo menos uma vez',
      category: 'exploration',
      rarity: 'uncommon',
      xpReward: 150,
      badgeColor: '#16a085',
      unlockCondition: {
        type: 'categories_used',
        parameters: { target: 6 }, // Assuming 6 categories
        evaluator: (userData) => ({
          met: userData.categoriesUsed >= 6,
          currentValue: userData.categoriesUsed,
          targetValue: 6
        })
      }
    },
    
    {
      id: 'work_specialist',
      name: 'Especialista em Trabalho',
      description: 'Acumule 100 horas na categoria Trabalho',
      category: 'mastery',
      rarity: 'rare',
      xpReward: 300,
      badgeColor: '#34495e',
      unlockCondition: {
        type: 'category_hours',
        parameters: { category: 'work', target: 100 },
        evaluator: (userData) => ({
          met: (userData.categoryHours?.work || 0) >= 100,
          currentValue: userData.categoryHours?.work || 0,
          targetValue: 100
        })
      }
    },
    
    {
      id: 'study_guru',
      name: 'Guru dos Estudos',
      description: 'Acumule 200 horas na categoria Estudos',
      category: 'mastery',
      rarity: 'epic',
      xpReward: 600,
      badgeColor: '#8e44ad',
      unlockCondition: {
        type: 'category_hours',
        parameters: { category: 'study', target: 200 },
        evaluator: (userData) => ({
          met: (userData.categoryHours?.study || 0) >= 200,
          currentValue: userData.categoryHours?.study || 0,
          targetValue: 200
        })
      }
    },
    
    // TIME MANAGEMENT ACHIEVEMENTS
    {
      id: 'early_bird',
      name: 'Madrugador',
      description: 'Complete 10 sessões antes das 6:00',
      category: 'time_management',
      rarity: 'uncommon',
      xpReward: 100,
      badgeColor: '#f1c40f',
      unlockCondition: {
        type: 'early_sessions',
        parameters: { target: 10, hour: 6 },
        evaluator: (userData) => ({
          met: userData.earlyBirdSessions >= 10,
          currentValue: userData.earlyBirdSessions,
          targetValue: 10
        })
      }
    },
    
    {
      id: 'night_owl',
      name: 'Coruja Noturna',
      description: 'Complete 15 sessões após as 22:00',
      category: 'time_management',
      rarity: 'uncommon',
      xpReward: 100,
      badgeColor: '#2c3e50',
      unlockCondition: {
        type: 'late_sessions',
        parameters: { target: 15, hour: 22 },
        evaluator: (userData) => ({
          met: userData.nightOwlSessions >= 15,
          currentValue: userData.nightOwlSessions,
          targetValue: 15
        })
      }
    },
    
    {
      id: 'marathon_runner',
      name: 'Maratonista',
      description: 'Complete uma sessão de 6 horas ou mais',
      category: 'time_management',
      rarity: 'rare',
      xpReward: 250,
      badgeColor: '#e67e22',
      unlockCondition: {
        type: 'long_session',
        parameters: { target: 21600 }, // 6 hours in seconds
        evaluator: (userData) => ({
          met: userData.longestSession >= 21600,
          currentValue: userData.longestSession,
          targetValue: 21600
        })
      }
    },
    
    {
      id: 'pomodoro_master',
      name: 'Mestre Pomodoro',
      description: 'Complete 100 sessões perfeitas de 25 minutos',
      category: 'time_management',
      rarity: 'epic',
      xpReward: 400,
      badgeColor: '#c0392b',
      unlockCondition: {
        type: 'perfect_pomodoros',
        parameters: { target: 100, duration: 1500 }, // 25 minutes
        evaluator: (userData) => ({
          met: userData.perfectPomodoros >= 100,
          currentValue: userData.perfectPomodoros,
          targetValue: 100
        })
      }
    },
    
    // SPECIAL ACHIEVEMENTS
    {
      id: 'weekend_warrior',
      name: 'Guerreiro do Fim de Semana',
      description: 'Seja produtivo durante 10 fins de semana',
      category: 'special_events',
      rarity: 'rare',
      xpReward: 200,
      badgeColor: '#d35400',
      unlockCondition: {
        type: 'weekend_sessions',
        parameters: { target: 10 },
        evaluator: (userData) => ({
          met: userData.productiveWeekends >= 10,
          currentValue: userData.productiveWeekends,
          targetValue: 10
        })
      }
    },
    
    {
      id: 'comeback_king',
      name: 'Rei do Retorno',
      description: 'Retorne à atividade após 7+ dias de pausa',
      category: 'special_events',
      rarity: 'uncommon',
      xpReward: 150,
      badgeColor: '#16a085',
      isSecret: true,
      unlockCondition: {
        type: 'comeback',
        parameters: { minimumBreak: 7 },
        evaluator: (userData) => ({
          met: userData.longestBreak >= 7 && userData.hasReturned,
          currentValue: userData.hasReturned ? 1 : 0,
          targetValue: 1
        })
      }
    },
    
    {
      id: 'perfectionist_week',
      name: 'Semana Perfeita',
      description: 'Complete todas as metas diárias por 7 dias consecutivos',
      category: 'special_events',
      rarity: 'legendary',
      xpReward: 1000,
      badgeColor: '#9b59b6',
      unlockCondition: {
        type: 'perfect_week',
        parameters: { target: 7 },
        evaluator: (userData) => ({
          met: userData.perfectDaysStreak >= 7,
          currentValue: userData.perfectDaysStreak,
          targetValue: 7
        })
      }
    }
  ];

  /**
   * Get all achievements
   */
  static getAllAchievements(): Achievement[] {
    return this.ACHIEVEMENTS;
  }

  /**
   * Get achievements by category
   */
  static getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.ACHIEVEMENTS.filter(achievement => achievement.category === category);
  }

  /**
   * Get achievements by rarity
   */
  static getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return this.ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
  }

  /**
   * Check for new achievement unlocks
   */
  static checkAchievementUnlocks(
    userData: any, 
    currentProgress: AchievementProgress[],
    sessionData?: any
  ): AchievementUnlock[] {
    const unlocks: AchievementUnlock[] = [];

    for (const achievement of this.ACHIEVEMENTS) {
      const progress = currentProgress.find(p => p.achievementId === achievement.id);
      
      // Skip if already unlocked and not repeatable
      if (progress?.isUnlocked && !achievement.isRepeatable) continue;
      
      // Check prerequisites
      if (achievement.prerequisites) {
        const prerequisitesMet = achievement.prerequisites.every(prereqId =>
          currentProgress.find(p => p.achievementId === prereqId)?.isUnlocked
        );
        if (!prerequisitesMet) continue;
      }

      // Check repetition limit
      if (achievement.isRepeatable && achievement.maxRepetitions) {
        const repetitionCount = progress?.repetitionCount || 0;
        if (repetitionCount >= achievement.maxRepetitions) continue;
      }

      // Evaluate condition
      const evaluation = achievement.unlockCondition.evaluator(userData, sessionData);
      
      if (evaluation.met) {
        unlocks.push({
          achievement,
          userId: userData.userId || 'default',
          unlockedAt: new Date(),
          triggerData: sessionData,
          xpAwarded: achievement.xpReward
        });
      }
    }

    return unlocks;
  }

  /**
   * Calculate achievement progress for all achievements
   */
  static calculateAllProgress(userData: any, userId: string): AchievementProgress[] {
    return this.ACHIEVEMENTS.map(achievement => {
      const evaluation = achievement.unlockCondition.evaluator(userData);
      
      return {
        achievementId: achievement.id,
        userId,
        currentValue: evaluation.currentValue,
        targetValue: evaluation.targetValue,
        progressPercentage: Math.min((evaluation.currentValue / evaluation.targetValue) * 100, 100),
        isUnlocked: evaluation.met,
        unlockedAt: evaluation.met ? new Date() : undefined,
        repetitionCount: 0 // Would be loaded from database
      };
    });
  }

  /**
   * Get achievement by ID
   */
  static getAchievementById(id: string): Achievement | undefined {
    return this.ACHIEVEMENTS.find(achievement => achievement.id === id);
  }

  /**
   * Get achievement statistics
   */
  static getAchievementStats(): {
    totalAchievements: number;
    byCategory: { [key: string]: number };
    byRarity: { [key: string]: number };
    totalXPAvailable: number;
  } {
    const stats = {
      totalAchievements: this.ACHIEVEMENTS.length,
      byCategory: {} as { [key: string]: number },
      byRarity: {} as { [key: string]: number },
      totalXPAvailable: 0
    };

    this.ACHIEVEMENTS.forEach(achievement => {
      // Count by category
      stats.byCategory[achievement.category] = (stats.byCategory[achievement.category] || 0) + 1;
      
      // Count by rarity
      stats.byRarity[achievement.rarity] = (stats.byRarity[achievement.rarity] || 0) + 1;
      
      // Sum XP
      stats.totalXPAvailable += achievement.xpReward;
    });

    return stats;
  }

  /**
   * Get rarity color
   */
  static getRarityColor(rarity: AchievementRarity): string {
    const colors = {
      common: '#95a5a6',
      uncommon: '#27ae60',
      rare: '#3498db',
      epic: '#9b59b6',
      legendary: '#f39c12',
      mythic: '#e74c3c'
    };
    return colors[rarity];
  }

  /**
   * Get rarity display name
   */
  static getRarityDisplayName(rarity: AchievementRarity): string {
    const names = {
      common: 'Comum',
      uncommon: 'Incomum',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Lendário',
      mythic: 'Mítico'
    };
    return names[rarity];
  }

  /**
   * Get category icon
   */
  static getCategoryIcon(category: AchievementCategory): string {
    const icons = {
      productivity: '⚡',
      consistency: '🔥',
      mastery: '🎯',
      social: '👥',
      exploration: '🗺️',
      time_management: '⏰',
      special_events: '✨'
    };
    return icons[category];
  }

  /**
   * Get category display name
   */
  static getCategoryDisplayName(category: AchievementCategory): string {
    const names = {
      productivity: 'Produtividade',
      consistency: 'Consistência',
      mastery: 'Maestria',
      social: 'Social',
      exploration: 'Exploração',
      time_management: 'Gestão de Tempo',
      special_events: 'Eventos Especiais'
    };
    return names[category];
  }

  /**
   * Sort achievements by priority for display
   */
  static sortAchievementsByPriority(achievements: Achievement[]): Achievement[] {
    const rarityOrder = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    
    return achievements.sort((a, b) => {
      // First by rarity (higher first)
      const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      
      // Then by XP reward (higher first)
      return b.xpReward - a.xpReward;
    });
  }

  /**
   * Get next achievable achievements for a user
   */
  static getNextAchievableAchievements(
    userData: any, 
    currentProgress: AchievementProgress[],
    limit: number = 5
  ): Achievement[] {
    const achievable = this.ACHIEVEMENTS.filter(achievement => {
      const progress = currentProgress.find(p => p.achievementId === achievement.id);
      
      // Must not be unlocked yet
      if (progress?.isUnlocked) return false;
      
      // Must have prerequisites met
      if (achievement.prerequisites) {
        const prerequisitesMet = achievement.prerequisites.every(prereqId =>
          currentProgress.find(p => p.achievementId === prereqId)?.isUnlocked
        );
        if (!prerequisitesMet) return false;
      }
      
      // Must have some progress (at least 10%)
      const evaluation = achievement.unlockCondition.evaluator(userData);
      return evaluation.currentValue / evaluation.targetValue >= 0.1;
    });

    return this.sortAchievementsByPriority(achievable).slice(0, limit);
  }
}