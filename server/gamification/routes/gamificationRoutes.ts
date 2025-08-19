/**
 * Life Tracker Pro - Gamification Routes
 * API endpoints for gamification features
 */

import { Router, Request, Response } from 'express';
import { GamificationService, UserGamificationData, DailyActivityData } from '../services/GamificationService';
import { XPManager } from '../managers/XPManager';
import { AchievementEngine } from '../engines/AchievementEngine';
import { StreakTracker } from '../trackers/StreakTracker';
import { DatabaseManager } from '../../services/DatabaseManager';
import { Knex } from 'knex';
import ActivityMonitor from '../../services/ActivityMonitor';
import { ActivitySessionService } from '../../models/ActivitySession';

export interface GamificationApiDependencies {
  db: Knex;
  activityMonitor: ActivityMonitor;
  sessionService: ActivitySessionService;
}

export function createGamificationRoutes(deps: GamificationApiDependencies): Router {
  const router = Router();
  const { db, activityMonitor, sessionService } = deps;

// Middleware for error handling
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => 
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

/**
 * @route GET /api/gamification/profile/:userId
 * @desc Get user's complete gamification profile
 */
router.get('/profile/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // In a real implementation, this would load from database
    // For now, we'll create mock data
    const gamificationData = GamificationService.initializeUserGamificationData(userId);
    const summary = GamificationService.getUserGamificationSummary(gamificationData);
    
    res.json({
      success: true,
      data: {
        profile: gamificationData,
        summary
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get gamification profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/xp/:userId
 * @desc Get user's XP information and level details
 */
router.get('/xp/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Mock total XP - in real app, load from database
    const totalXP = 2450;
    const levelInfo = XPManager.getLevelInfo(totalXP);
    const recommendedDailyXP = XPManager.getRecommendedDailyXP(levelInfo.level);
    
    // Mock daily XP calculation
    const dailyProgress = {
      earnedToday: 125,
      targetXP: recommendedDailyXP,
      progressPercentage: (125 / recommendedDailyXP) * 100,
      sourceBreakdown: {
        'SESSION_COMPLETION': 85,
        'STREAK_BONUS': 25,
        'PRODUCTIVITY_PEAK': 15
      }
    };
    
    res.json({
      success: true,
      data: {
        totalXP,
        levelInfo,
        dailyProgress,
        xpHistory: {
          today: 125,
          yesterday: 180,
          thisWeek: 890,
          lastWeek: 750,
          thisMonth: 3200,
          lastMonth: 2800
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get XP information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/achievements/:userId
 * @desc Get user's achievement progress
 */
router.get('/achievements/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, rarity } = req.query;
    
    // Get all achievements
    let achievements = AchievementEngine.getAllAchievements();
    
    // Filter by category if specified
    if (category) {
      achievements = AchievementEngine.getAchievementsByCategory(category as any);
    }
    
    // Filter by rarity if specified
    if (rarity) {
      achievements = AchievementEngine.getAchievementsByRarity(rarity as any);
    }
    
    // Mock user progress - in real app, load from database
    const mockUserData = {
      totalSessions: 45,
      maxProductivity: 92,
      currentStreak: 12,
      categoriesUsed: 5,
      categoryHours: { work: 85, study: 62, exercise: 23 }
    };
    
    const progress = AchievementEngine.calculateAllProgress(mockUserData, userId);
    
    // Get achievement statistics
    const stats = AchievementEngine.getAchievementStats();
    const unlockedCount = progress.filter(p => p.isUnlocked).length;
    
    res.json({
      success: true,
      data: {
        achievements,
        progress,
        stats: {
          ...stats,
          unlockedCount,
          completionPercentage: (unlockedCount / stats.totalAchievements) * 100
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get achievements',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/streaks/:userId
 * @desc Get user's streak information
 */
router.get('/streaks/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Mock streaks - in real app, load from database
    const mockStreaks = [
      StreakTracker.createStreak(userId, 'daily_general'),
      StreakTracker.createStreak(userId, 'productivity'),
      StreakTracker.createStreak(userId, 'daily_category', 'work')
    ];
    
    // Simulate some progress
    mockStreaks[0].currentCount = 12;
    mockStreaks[0].maxCount = 15;
    mockStreaks[1].currentCount = 8;
    mockStreaks[1].maxCount = 10;
    mockStreaks[2].currentCount = 5;
    mockStreaks[2].maxCount = 7;
    
    const streakStats = StreakTracker.calculateStreakStats(mockStreaks);
    const streakDashboard = GamificationService.getStreakDashboard(mockStreaks);
    const milestones = StreakTracker.getAllMilestones();
    
    res.json({
      success: true,
      data: {
        streaks: mockStreaks.map(streak => ({
          ...streak,
          displayInfo: StreakTracker.getStreakDisplayInfo(streak),
          health: StreakTracker.getStreakHealth(streak),
          nextMilestone: StreakTracker.getNextMilestone(streak.currentCount),
          multiplier: StreakTracker.getStreakMultiplier(streak.currentCount)
        })),
        stats: streakStats,
        dashboard: streakDashboard,
        milestones
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get streaks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/gamification/process-activity
 * @desc Process daily activity and update gamification data
 */
router.post('/process-activity', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId, activityData } = req.body;
    
    if (!userId || !activityData) {
      return res.status(400).json({
        success: false,
        error: 'userId and activityData are required'
      });
    }
    
    // Mock current gamification data - in real app, load from database
    const currentData = GamificationService.initializeUserGamificationData(userId);
    
    // Process the activity
    const updates = await GamificationService.processDailyActivity(
      activityData as DailyActivityData,
      currentData
    );
    
    res.json({
      success: true,
      data: updates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/leaderboard
 * @desc Get leaderboard data
 */
router.get('/leaderboard', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { type = 'xp', period = 'all_time', limit = 10 } = req.query;
    
    // Mock leaderboard data - in real app, query database
    const mockLeaderboard = [
      { userId: 'user1', username: 'ProductivityGuru', value: 15420, level: 23, title: 'Mestre', rank: 1 },
      { userId: 'user2', username: 'StreakMaster', value: 12850, level: 19, title: 'Expert', rank: 2 },
      { userId: 'user3', username: 'GoalCrusher', value: 11200, level: 17, title: 'Produtivo', rank: 3 },
      { userId: 'user4', username: 'TimeWarrior', value: 9800, level: 15, title: 'Focado', rank: 4 },
      { userId: 'user5', username: 'ConsistencyKing', value: 8500, level: 13, title: 'Dedicado', rank: 5 }
    ];
    
    res.json({
      success: true,
      data: {
        leaderboard: mockLeaderboard.slice(0, parseInt(limit as string)),
        type,
        period,
        totalUsers: 1247,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/recommendations/:userId
 * @desc Get personalized recommendations for user
 */
router.get('/recommendations/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Mock gamification data - in real app, load from database
    const gamificationData = GamificationService.initializeUserGamificationData(userId);
    
    // Simulate some progress
    gamificationData.stats.xpEarnedToday = 85;
    gamificationData.streaks[0].currentCount = 5; // At risk streak
    
    const recommendations = GamificationService.getRecommendedActions(gamificationData);
    
    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === 'high').length,
          mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
          lowPriority: recommendations.filter(r => r.priority === 'low').length
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/gamification/streak-freeze
 * @desc Use streak freeze to maintain a streak
 */
router.post('/streak-freeze', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId, streakId } = req.body;
    
    if (!userId || !streakId) {
      return res.status(400).json({
        success: false,
        error: 'userId and streakId are required'
      });
    }
    
    // Mock streak - in real app, load from database
    const mockStreak = StreakTracker.createStreak(userId, 'daily_general');
    mockStreak.id = streakId;
    mockStreak.currentCount = 15;
    mockStreak.freezeUsed = 0;
    
    try {
      const updatedStreak = StreakTracker.useStreakFreeze(mockStreak);
      
      res.json({
        success: true,
        data: {
          streak: updatedStreak,
          message: 'Streak freeze used successfully',
          freezesRemaining: updatedStreak.maxFreezes - updatedStreak.freezeUsed
        }
      });
    } catch (freezeError) {
      return res.status(400).json({
        success: false,
        error: freezeError instanceof Error ? freezeError.message : 'Cannot use streak freeze'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to use streak freeze',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/level-preview/:userId
 * @desc Get level progression preview
 */
router.get('/level-preview/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = '30', dailyXP = '150' } = req.query;
    
    // Mock current XP - in real app, load from database
    const currentXP = 2450;
    const projectedDailyXP = parseInt(dailyXP as string);
    const projectionDays = parseInt(days as string);
    
    const progression = XPManager.simulateLevelProgression(
      currentXP,
      projectedDailyXP,
      projectionDays
    );
    
    res.json({
      success: true,
      data: {
        currentXP,
        projectedDailyXP,
        projectionDays,
        progression,
        summary: {
          startLevel: progression[0].level,
          endLevel: progression[progression.length - 1].level,
          levelsGained: progression[progression.length - 1].level - progression[0].level,
          totalXPGained: projectedDailyXP * projectionDays
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate level preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/gamification/stats
 * @desc Get overall gamification statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const achievementStats = AchievementEngine.getAchievementStats();
    const streakMilestones = StreakTracker.getAllMilestones();
    
    res.json({
      success: true,
      data: {
        achievements: achievementStats,
        streaks: {
          totalMilestones: streakMilestones.length,
          maxStreakReward: Math.max(...streakMilestones.map(m => m.reward)),
          streakTypes: Object.keys(StreakTracker['STREAK_CONFIGS']).length
        },
        xp: {
          maxLevel: 100, // Before prestige
          prestigeThreshold: 100,
          baseXPRequirement: 100,
          exponentialFactor: 1.15
        },
        general: {
          totalFeatures: 3, // XP, Achievements, Streaks
          totalRewards: achievementStats.totalXPAvailable + 
                       streakMilestones.reduce((sum, m) => sum + m.reward, 0)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get gamification stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('Gamification API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal gamification error',
    message: error.message
  });
});

  return router;
}

export default createGamificationRoutes;