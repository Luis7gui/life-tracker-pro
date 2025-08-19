/**
 * Life Tracker Pro - Gamification Service
 * Main orchestration service for all gamification features
 */

import { XPManager, XPTransaction, LevelInfo } from '../managers/XPManager';
import { AchievementEngine, Achievement, AchievementProgress, AchievementUnlock } from '../engines/AchievementEngine';
import { StreakTracker, Streak, StreakType } from '../trackers/StreakTracker';

export interface UserGamificationData {
  userId: string;
  totalXP: number;
  levelInfo: LevelInfo;
  achievements: AchievementProgress[];
  streaks: Streak[];
  badges: UserBadge[];
  stats: GamificationStats;
  preferences: GamificationPreferences;
  lastUpdated: Date;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: string;
  earnedAt: Date;
  category: string;
}

export interface GamificationStats {
  totalSessionsCompleted: number;
  totalTimeTracked: number; // in seconds
  averageProductivity: number;
  longestStreak: number;
  currentActiveStreaks: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  xpEarnedToday: number;
  xpEarnedThisWeek: number;
  xpEarnedThisMonth: number;
  categoryHours: { [category: string]: number };
  productivityHistory: number[];
  streakHistory: number[];
}

export interface GamificationPreferences {
  enableNotifications: boolean;
  enableCelebrations: boolean;
  enableSounds: boolean;
  preferredChallenges: string[];
  privacyLevel: 'public' | 'friends' | 'private';
  autoStreakFreeze: boolean;
}

export interface DailyActivityData {
  userId: string;
  date: Date;
  sessions: any[];
  totalDuration: number;
  averageProductivity: number;
  categoriesUsed: string[];
  categoryBreakdown: { [category: string]: number };
  goalsCompleted: number;
  goalsTotal: number;
  timeOfDayBreakdown: { [hour: number]: number };
}

export interface GamificationUpdate {
  xpTransactions: XPTransaction[];
  achievementUnlocks: AchievementUnlock[];
  streakUpdates: { streak: Streak; milestone?: any; broken: boolean }[];
  levelUpOccurred: boolean;
  newLevel?: LevelInfo;
  celebrationTriggers: CelebrationTrigger[];
}

export interface CelebrationTrigger {
  type: 'level_up' | 'achievement' | 'streak_milestone' | 'perfect_day';
  data: any;
  priority: 'low' | 'medium' | 'high' | 'epic';
}

export class GamificationService {
  
  /**
   * Process daily activity and update gamification data
   */
  static async processDailyActivity(
    activityData: DailyActivityData,
    currentGamificationData: UserGamificationData
  ): Promise<GamificationUpdate> {
    const updates: GamificationUpdate = {
      xpTransactions: [],
      achievementUnlocks: [],
      streakUpdates: [],
      levelUpOccurred: false,
      celebrationTriggers: []
    };

    // 1. Calculate XP from sessions
    for (const session of activityData.sessions) {
      const xpTransaction = XPManager.calculateSessionXP(
        session.duration,
        session.productivityScore,
        session.category,
        {
          userId: activityData.userId,
          sessionId: session.id,
          streakDays: this.getLongestActiveStreak(currentGamificationData.streaks)
        }
      );
      updates.xpTransactions.push(xpTransaction);
    }

    // 2. Check for productivity peaks
    if (activityData.averageProductivity > 80) {
      const peakXP = XPManager.calculateProductivityPeakXP(
        activityData.averageProductivity,
        { userId: activityData.userId }
      );
      if (peakXP) {
        updates.xpTransactions.push(peakXP);
      }
    }

    // 3. Check for daily goal completion
    if (activityData.goalsCompleted >= activityData.goalsTotal && activityData.goalsTotal > 0) {
      const goalXP = XPManager.calculateGoalXP('daily', { userId: activityData.userId });
      updates.xpTransactions.push(goalXP);
      
      // Perfect day bonus
      if (activityData.averageProductivity > 85) {
        const perfectDayXP = XPManager.calculateGoalXP('perfect_day', { userId: activityData.userId });
        updates.xpTransactions.push(perfectDayXP);
        
        updates.celebrationTriggers.push({
          type: 'perfect_day',
          data: { productivity: activityData.averageProductivity },
          priority: 'epic'
        });
      }
    }

    // 4. Check for special achievements (time-based)
    const timeBasedXP = this.checkTimeBasedAchievements(activityData);
    updates.xpTransactions.push(...timeBasedXP);

    // 5. Update streaks
    for (const streak of currentGamificationData.streaks) {
      if (streak.isActive) {
        const streakUpdate = StreakTracker.updateStreak(streak, activityData, activityData.date);
        
        updates.streakUpdates.push({
          streak: streakUpdate.updatedStreak,
          milestone: streakUpdate.milestoneReached,
          broken: streakUpdate.streakBroken
        });

        // Add milestone XP if reached
        if (streakUpdate.milestoneReached) {
          const milestoneXP: XPTransaction = {
            id: XPManager['generateTransactionId'](),
            userId: activityData.userId,
            source: {
              type: 'STREAK_MILESTONE',
              baseValue: streakUpdate.milestoneReached.reward,
              metadata: { milestone: streakUpdate.milestoneReached, streakType: streak.type }
            },
            xpGained: streakUpdate.milestoneReached.reward,
            timestamp: new Date(),
            description: `Streak milestone: ${streakUpdate.milestoneReached.name}`
          };
          updates.xpTransactions.push(milestoneXP);

          updates.celebrationTriggers.push({
            type: 'streak_milestone',
            data: { milestone: streakUpdate.milestoneReached, streak },
            priority: 'high'
          });
        }
      }
    }

    // 6. Check for achievement unlocks
    const userData = this.buildUserDataForAchievements(currentGamificationData, activityData);
    const achievementUnlocks = AchievementEngine.checkAchievementUnlocks(
      userData,
      currentGamificationData.achievements,
      activityData
    );
    
    updates.achievementUnlocks = achievementUnlocks;

    // Add achievement XP
    for (const unlock of achievementUnlocks) {
      const achievementXP: XPTransaction = {
        id: XPManager['generateTransactionId'](),
        userId: activityData.userId,
        source: {
          type: 'ACHIEVEMENT_UNLOCK',
          baseValue: unlock.xpAwarded,
          metadata: { achievement: unlock.achievement }
        },
        xpGained: unlock.xpAwarded,
        timestamp: new Date(),
        description: `Achievement unlocked: ${unlock.achievement.name}`
      };
      updates.xpTransactions.push(achievementXP);

      updates.celebrationTriggers.push({
        type: 'achievement',
        data: unlock,
        priority: unlock.achievement.rarity === 'legendary' ? 'epic' : 'high'
      });
    }

    // 7. Check for level up
    const totalNewXP = updates.xpTransactions.reduce((sum, tx) => sum + tx.xpGained, 0);
    const newTotalXP = currentGamificationData.totalXP + totalNewXP;
    const currentLevel = currentGamificationData.levelInfo.level;
    const newLevelInfo = XPManager.getLevelInfo(newTotalXP, currentGamificationData.levelInfo.prestigeLevel);
    
    if (newLevelInfo.level > currentLevel) {
      updates.levelUpOccurred = true;
      updates.newLevel = newLevelInfo;
      
      updates.celebrationTriggers.push({
        type: 'level_up',
        data: { oldLevel: currentLevel, newLevel: newLevelInfo.level, newTitle: newLevelInfo.title },
        priority: 'epic'
      });
    }

    return updates;
  }

  /**
   * Initialize gamification data for new user
   */
  static initializeUserGamificationData(userId: string): UserGamificationData {
    return {
      userId,
      totalXP: 0,
      levelInfo: XPManager.getLevelInfo(0),
      achievements: AchievementEngine.calculateAllProgress({}, userId),
      streaks: [
        StreakTracker.createStreak(userId, 'daily_general'),
        StreakTracker.createStreak(userId, 'productivity')
      ],
      badges: [],
      stats: {
        totalSessionsCompleted: 0,
        totalTimeTracked: 0,
        averageProductivity: 0,
        longestStreak: 0,
        currentActiveStreaks: 2,
        achievementsUnlocked: 0,
        totalAchievements: AchievementEngine.getAllAchievements().length,
        xpEarnedToday: 0,
        xpEarnedThisWeek: 0,
        xpEarnedThisMonth: 0,
        categoryHours: {},
        productivityHistory: [],
        streakHistory: []
      },
      preferences: {
        enableNotifications: true,
        enableCelebrations: true,
        enableSounds: true,
        preferredChallenges: [],
        privacyLevel: 'private',
        autoStreakFreeze: false
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Get user's gamification summary
   */
  static getUserGamificationSummary(data: UserGamificationData): {
    currentLevel: number;
    title: string;
    xpToNextLevel: number;
    progressPercentage: number;
    activeStreaks: number;
    longestStreak: number;
    achievementsUnlocked: number;
    totalXP: number;
    rank?: string;
  } {
    return {
      currentLevel: data.levelInfo.level,
      title: data.levelInfo.title,
      xpToNextLevel: data.levelInfo.xpForNextLevel - data.levelInfo.currentXP,
      progressPercentage: data.levelInfo.progressPercentage,
      activeStreaks: data.streaks.filter(s => s.isActive).length,
      longestStreak: Math.max(...data.streaks.map(s => s.currentCount), 0),
      achievementsUnlocked: data.achievements.filter(a => a.isUnlocked).length,
      totalXP: data.totalXP
    };
  }

  /**
   * Get daily XP progress
   */
  static getDailyXPProgress(
    transactions: XPTransaction[],
    targetXP: number
  ): {
    earnedToday: number;
    targetXP: number;
    progressPercentage: number;
    sourceBreakdown: { [source: string]: number };
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(tx => 
      tx.timestamp >= today && tx.timestamp < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    );
    
    const earnedToday = todayTransactions.reduce((sum, tx) => sum + tx.xpGained, 0);
    const sourceBreakdown: { [source: string]: number } = {};
    
    todayTransactions.forEach(tx => {
      sourceBreakdown[tx.source.type] = (sourceBreakdown[tx.source.type] || 0) + tx.xpGained;
    });
    
    return {
      earnedToday,
      targetXP,
      progressPercentage: Math.min((earnedToday / targetXP) * 100, 100),
      sourceBreakdown
    };
  }

  /**
   * Get achievement progress for specific categories
   */
  static getAchievementProgress(
    data: UserGamificationData,
    categories?: string[]
  ): {
    unlocked: Achievement[];
    inProgress: { achievement: Achievement; progress: AchievementProgress }[];
    locked: Achievement[];
  } {
    const allAchievements = AchievementEngine.getAllAchievements();
    const filteredAchievements = categories 
      ? allAchievements.filter(a => categories.includes(a.category))
      : allAchievements;
    
    const unlocked: Achievement[] = [];
    const inProgress: { achievement: Achievement; progress: AchievementProgress }[] = [];
    const locked: Achievement[] = [];
    
    filteredAchievements.forEach(achievement => {
      const progress = data.achievements.find(p => p.achievementId === achievement.id);
      
      if (progress?.isUnlocked) {
        unlocked.push(achievement);
      } else if (progress && progress.progressPercentage > 0) {
        inProgress.push({ achievement, progress });
      } else {
        locked.push(achievement);
      }
    });
    
    return { unlocked, inProgress, locked };
  }

  /**
   * Get streak dashboard data
   */
  static getStreakDashboard(streaks: Streak[]): {
    activeStreaks: Streak[];
    longestCurrent: number;
    totalStreakDays: number;
    streaksAtRisk: Streak[];
    milestoneProgress: { streak: Streak; nextMilestone: any; progress: number }[];
  } {
    const activeStreaks = streaks.filter(s => s.isActive);
    const longestCurrent = Math.max(...activeStreaks.map(s => s.currentCount), 0);
    const totalStreakDays = streaks.reduce((sum, s) => sum + s.currentCount, 0);
    
    const streaksAtRisk = activeStreaks.filter(s => {
      const health = StreakTracker.getStreakHealth(s);
      return health.status === 'warning' || health.status === 'critical';
    });
    
    const milestoneProgress = activeStreaks.map(streak => {
      const nextMilestone = StreakTracker.getNextMilestone(streak.currentCount);
      const progress = nextMilestone 
        ? (streak.currentCount / nextMilestone.count) * 100
        : 100;
      
      return { streak, nextMilestone, progress };
    }).filter(item => item.nextMilestone);
    
    return {
      activeStreaks,
      longestCurrent,
      totalStreakDays,
      streaksAtRisk,
      milestoneProgress
    };
  }

  /**
   * Get recommended actions for user
   */
  static getRecommendedActions(data: UserGamificationData): {
    type: string;
    title: string;
    description: string;
    reward: string;
    priority: 'low' | 'medium' | 'high';
  }[] {
    const recommendations = [];
    
    // Streak maintenance
    const streaksAtRisk = data.streaks.filter(s => {
      const health = StreakTracker.getStreakHealth(s);
      return health.status === 'warning' || health.status === 'critical';
    });
    
    if (streaksAtRisk.length > 0) {
      recommendations.push({
        type: 'streak_maintenance',
        title: 'Manter Streaks',
        description: `${streaksAtRisk.length} streak(s) em risco`,
        reward: 'Evitar perda de progresso',
        priority: 'high' as const
      });
    }
    
    // Almost achieved achievements
    const almostUnlocked = data.achievements.filter(a => 
      !a.isUnlocked && a.progressPercentage >= 80
    );
    
    if (almostUnlocked.length > 0) {
      recommendations.push({
        type: 'achievement_close',
        title: 'Conquistas Próximas',
        description: `${almostUnlocked.length} conquista(s) quase desbloqueada(s)`,
        reward: 'XP e badges',
        priority: 'medium' as const
      });
    }
    
    // Daily XP target
    const recommendedXP = XPManager.getRecommendedDailyXP(data.levelInfo.level);
    if (data.stats.xpEarnedToday < recommendedXP) {
      recommendations.push({
        type: 'daily_xp',
        title: 'Meta Diária de XP',
        description: `Faltam ${recommendedXP - data.stats.xpEarnedToday} XP para atingir a meta`,
        reward: 'Progresso consistente',
        priority: 'medium' as const
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Private helper methods
  
  private static getLongestActiveStreak(streaks: Streak[]): number {
    const activeStreaks = streaks.filter(s => s.isActive);
    return Math.max(...activeStreaks.map(s => s.currentCount), 0);
  }

  private static checkTimeBasedAchievements(activityData: DailyActivityData): XPTransaction[] {
    const xpTransactions: XPTransaction[] = [];
    
    // Early bird sessions (before 6 AM)
    const earlyBirdSessions = activityData.sessions.filter(s => {
      const hour = new Date(s.startTime).getHours();
      return hour >= 4 && hour < 6;
    });
    
    if (earlyBirdSessions.length > 0) {
      const earlyBirdXP = XPManager.calculateSpecialAchievementXP(
        'early_bird',
        { userId: activityData.userId }
      );
      xpTransactions.push(earlyBirdXP);
    }
    
    // Night owl sessions (after 10 PM)
    const nightOwlSessions = activityData.sessions.filter(s => {
      const hour = new Date(s.startTime).getHours();
      return hour >= 22 || hour < 2;
    });
    
    if (nightOwlSessions.length > 0) {
      const nightOwlXP = XPManager.calculateSpecialAchievementXP(
        'night_owl',
        { userId: activityData.userId }
      );
      xpTransactions.push(nightOwlXP);
    }
    
    // Weekend warrior
    const isWeekend = [0, 6].includes(activityData.date.getDay());
    if (isWeekend && activityData.totalDuration > 3600) { // 1+ hour on weekend
      const weekendXP = XPManager.calculateSpecialAchievementXP(
        'weekend_warrior',
        { userId: activityData.userId }
      );
      xpTransactions.push(weekendXP);
    }
    
    // Marathon session (6+ hours)
    const marathonSessions = activityData.sessions.filter(s => s.duration >= 21600);
    if (marathonSessions.length > 0) {
      const marathonXP = XPManager.calculateSpecialAchievementXP(
        'marathon',
        { userId: activityData.userId }
      );
      xpTransactions.push(marathonXP);
    }
    
    return xpTransactions;
  }

  private static buildUserDataForAchievements(
    gamificationData: UserGamificationData,
    activityData: DailyActivityData
  ): any {
    return {
      userId: gamificationData.userId,
      totalSessions: gamificationData.stats.totalSessionsCompleted + activityData.sessions.length,
      maxProductivity: Math.max(
        gamificationData.stats.averageProductivity,
        activityData.averageProductivity
      ),
      productivityStreak90Plus: 0, // Would need to calculate from history
      currentStreak: this.getLongestActiveStreak(gamificationData.streaks),
      categoriesUsed: Object.keys(gamificationData.stats.categoryHours).length,
      categoryHours: gamificationData.stats.categoryHours,
      earlyBirdSessions: 0, // Would need to calculate from history
      nightOwlSessions: 0, // Would need to calculate from history
      longestSession: Math.max(...activityData.sessions.map(s => s.duration), 0),
      perfectPomodoros: 0, // Would need to calculate from history
      productiveWeekends: 0, // Would need to calculate from history
      longestBreak: 0, // Would need to calculate from history
      hasReturned: false, // Would need to calculate from history
      perfectDaysStreak: 0 // Would need to calculate from history
    };
  }
}