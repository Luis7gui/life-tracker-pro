/**
 * Gamification API Service
 * Frontend service for interacting with gamification endpoints
 */

import apiClient from './client';

export interface UserGamificationProfile {
  userId: string;
  totalXP: number;
  levelInfo: {
    level: number;
    currentXP: number;
    xpForNextLevel: number;
    xpForCurrentLevel: number;
    progressPercentage: number;
    title: string;
    prestigeLevel: number;
  };
  achievements: Achievement[];
  streaks: Streak[];
  badges: Badge[];
  stats: UserStats;
  preferences: UserPreferences;
  lastUpdated: string;
}

export interface Achievement {
  achievementId: string;
  userId: string;
  currentValue?: number;
  targetValue: number;
  progressPercentage: number | null;
  isUnlocked: boolean;
  unlockedAt?: string;
  repetitionCount: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  badgeColor: string;
  isSecret?: boolean;
  unlockCondition: {
    type: string;
    parameters: Record<string, any>;
  };
}

export interface Streak {
  id: string;
  userId: string;
  type: 'daily_general' | 'productivity' | 'daily_category' | 'weekly' | 'custom';
  category?: string;
  currentCount: number;
  maxCount: number;
  lastActiveDate: string;
  startDate: string;
  isActive: boolean;
  freezeUsed: number;
  maxFreezes: number;
  displayInfo?: {
    title: string;
    description: string;
    icon: string;
    color: string;
  };
  health?: {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    daysUntilBreak: number;
    freezesRemaining: number;
    healthPercentage: number;
  };
  nextMilestone?: {
    count: number;
    name: string;
    reward: number;
    badge?: string;
    description: string;
  };
  multiplier?: number;
}

export interface Badge {
  badgeId: string;
  userId: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpEarned: number;
  earnedAt: string;
  earnedFromAchievement?: string;
  earnedFromStreak?: string;
  earningContext?: Record<string, any>;
}

export interface UserStats {
  totalSessionsCompleted: number;
  totalTimeTracked: number;
  averageProductivity: number;
  longestStreak: number;
  currentActiveStreaks: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  xpEarnedToday: number;
  xpEarnedThisWeek: number;
  xpEarnedThisMonth: number;
  categoryHours: Record<string, number>;
  productivityHistory: any[];
  streakHistory: any[];
}

export interface UserPreferences {
  enableNotifications: boolean;
  enableCelebrations: boolean;
  enableSounds: boolean;
  preferredChallenges: string[];
  privacyLevel: 'public' | 'friends' | 'private';
  autoStreakFreeze: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username?: string;
  totalXP: number;
  level: number;
  title: string;
  rank: number;
  badge?: string;
}

export interface DailyActivityData {
  sessionsCompleted: number;
  totalTime: number;
  averageProductivity: number;
  categoriesUsed: string[];
  timeOfDay: string;
  sessions: Array<{
    duration: number;
    category: string;
    productivity: number;
    startTime: string;
  }>;
}

export interface GamificationNotification {
  id: string;
  type: 'achievement' | 'level_up' | 'streak_milestone' | 'badge_earned' | 'xp_gained';
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

class GamificationApiService {
  /**
   * Get user's complete gamification profile
   */
  async getUserProfile(userId: string): Promise<{ success: boolean; data: { profile: UserGamificationProfile; summary: any } }> {
    const response = await apiClient.get(`/gamification/profile/${userId}`);
    return response.data;
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string): Promise<{ success: boolean; data: { achievements: AchievementDefinition[]; progress: Achievement[]; stats: any } }> {
    const response = await apiClient.get(`/gamification/achievements/${userId}`);
    return response.data;
  }

  /**
   * Get user's streaks
   */
  async getUserStreaks(userId: string): Promise<{ success: boolean; data: { streaks: Streak[]; stats: any; dashboard: any; milestones: any[] } }> {
    const response = await apiClient.get(`/gamification/streaks/${userId}`);
    return response.data;
  }

  /**
   * Get user's badges
   */
  async getUserBadges(userId: string): Promise<{ success: boolean; data: { badges: Badge[]; stats: any } }> {
    const response = await apiClient.get(`/gamification/badges/${userId}`);
    return response.data;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: string = 'xp', limit: number = 50): Promise<{ success: boolean; data: { leaderboard: LeaderboardEntry[]; userRank?: number } }> {
    const response = await apiClient.get(`/gamification/leaderboard?type=${type}&limit=${limit}`);
    return response.data;
  }

  /**
   * Process daily activity and update gamification data
   */
  async processActivity(userId: string, activityData: DailyActivityData): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post('/gamification/process-activity', {
      userId,
      activityData
    });
    return response.data;
  }

  /**
   * Use streak freeze
   */
  async useStreakFreeze(userId: string, streakId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post('/gamification/streak-freeze', {
      userId,
      streakId
    });
    return response.data;
  }

  /**
   * Get level preview for next level
   */
  async getLevelPreview(userId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get(`/gamification/level-preview/${userId}`);
    return response.data;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<{ success: boolean; data: UserPreferences }> {
    const response = await apiClient.patch(`/gamification/preferences/${userId}`, preferences);
    return response.data;
  }

  /**
   * Get XP history
   */
  async getXPHistory(userId: string, limit: number = 50): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get(`/gamification/xp-history/${userId}?limit=${limit}`);
    return response.data;
  }

  /**
   * Get recent notifications
   */
  async getNotifications(userId: string, limit: number = 20): Promise<{ success: boolean; data: GamificationNotification[] }> {
    const response = await apiClient.get(`/gamification/notifications/${userId}?limit=${limit}`);
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.patch(`/gamification/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Get achievement details
   */
  async getAchievementDetails(achievementId: string): Promise<{ success: boolean; data: AchievementDefinition }> {
    const response = await apiClient.get(`/gamification/achievement-details/${achievementId}`);
    return response.data;
  }

  /**
   * Get streak milestones
   */
  async getStreakMilestones(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/gamification/streak-milestones');
    return response.data;
  }
}

export const gamificationService = new GamificationApiService();
export default gamificationService;