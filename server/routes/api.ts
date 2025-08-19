/**
 * Life Tracker Pro - API Routes
 * RESTful endpoints for dashboard data and real-time updates
 */

import { Router, Request, Response } from 'express';
import { ActivitySessionService } from '../models/ActivitySession';
import { categoryManager, CategoryManager } from '../models/CategoryManager';
import ActivityMonitor from '../services/ActivityMonitor';
import { Knex } from 'knex';
// import aiRoutes from '../ai/routes/aiRoutes';
// import analyticsRoutes from '../analytics/routes/analyticsRoutes';
import { createGamificationRoutes } from '../gamification/routes/gamificationRoutes';

export interface ApiDependencies {
  db: Knex;
  activityMonitor: ActivityMonitor;
  sessionService: ActivitySessionService;
}

export function createApiRoutes(deps: ApiDependencies): Router {
  const router = Router();
  const { db, activityMonitor, sessionService } = deps;

  // Mount AI routes
  // router.use('/ai', aiRoutes);
  
  // Mount Analytics routes
  // router.use('/analytics', analyticsRoutes);
  
  // Mount Gamification routes
  router.use('/gamification', createGamificationRoutes(deps));

  // Middleware for error handling
  const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) => (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  /**
   * GET /api/status - Get current system and monitoring status
   */
  router.get('/status', asyncHandler(async (req: Request, res: Response) => {
    try {
      const monitorStatus = activityMonitor.getStatus();
      
      const status = {
        timestamp: new Date().toISOString(),
        monitor: monitorStatus,
        database_connected: true,
        categories_loaded: categoryManager.getActiveRules().length,
        version: '0.4.0'
      };
      
      res.json(status);
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }));

  /**
   * GET /api/current-session - Get current active session
   */
  router.get('/current-session', asyncHandler(async (req: Request, res: Response) => {
    try {
      const currentSession = await sessionService.getCurrentSession();
      
      if (!currentSession) {
        res.json({ active: false });
        return;
      }

      const sessionInfo = {
        id: currentSession.id,
        application: currentSession.applicationName,
        startTime: currentSession.startTime.toISOString(),
        duration: currentSession.calculatedDuration,
        category: currentSession.category,
        productivityScore: currentSession.productivityScore,
        categoryColor: CategoryManager.getCategoryColor(currentSession.category!)
      };

      res.json({
        active: true,
        session: sessionInfo
      });
    } catch (error) {
      console.error('Error getting current session:', error);
      res.status(500).json({ error: 'Failed to get current session' });
    }
  }));

  /**
   * GET /api/today-summary - Get summary of today's activities by category
   */
  router.get('/today-summary', asyncHandler(async (req: Request, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await sessionService.getSessionsByDateRange(today, tomorrow);
      
      const categoryBreakdown: { [key: string]: any } = {};
      let totalTime = 0;
      let sessionCount = 0;

      sessions.forEach(session => {
        const category = session.category || 'Uncategorized';
        const duration = session.duration || 0;

        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = {
            totalTime: 0,
            sessionCount: 0,
            totalProductivity: 0,
            color: CategoryManager.getCategoryColor(session.category!)
          };
        }

        categoryBreakdown[category].totalTime += duration;
        categoryBreakdown[category].sessionCount += 1;
        categoryBreakdown[category].totalProductivity += session.productivityScore || 0;

        totalTime += duration;
        sessionCount += 1;
      });

      // Calculate percentages and averages
      Object.keys(categoryBreakdown).forEach(category => {
        const data = categoryBreakdown[category];
        data.totalHours = Math.round((data.totalTime / 3600) * 100) / 100;
        data.percentage = totalTime > 0 ? Math.round((data.totalTime / totalTime * 100) * 10) / 10 : 0;
        data.avgProductivity = data.sessionCount > 0 ? data.totalProductivity / data.sessionCount : 0;
      });

      res.json({
        date: today.toISOString().split('T')[0],
        totalTimeSeconds: totalTime,
        totalTimeHours: Math.round((totalTime / 3600) * 100) / 100,
        sessionCount,
        categories: categoryBreakdown
      });
    } catch (error) {
      console.error('Error getting today summary:', error);
      res.status(500).json({ error: 'Failed to get today summary' });
    }
  }));

  /**
   * GET /api/time-of-day-analysis - Analyze productivity patterns by time of day
   */
  router.get('/time-of-day-analysis', asyncHandler(async (req: Request, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await sessionService.getSessionsByDateRange(today, tomorrow);

      const timePeriods = {
        Morning: { start: 6, end: 12, sessions: [] as any[] },
        Afternoon: { start: 12, end: 18, sessions: [] as any[] },
        Evening: { start: 18, end: 24, sessions: [] as any[] },
        Night: { start: 0, end: 6, sessions: [] as any[] }
      };

      // Categorize sessions by time period
      sessions.forEach(session => {
        const hour = session.startTime.getHours();
        
        Object.entries(timePeriods).forEach(([periodName, period]) => {
          const { start, end } = period;
          
          if (start > end) { // Night period (crosses midnight)
            if (hour >= start || hour < end) {
              period.sessions.push(session);
            }
          } else {
            if (hour >= start && hour < end) {
              period.sessions.push(session);
            }
          }
        });
      });

      // Calculate period statistics
      const periodAnalysis: { [key: string]: any } = {};
      
      Object.entries(timePeriods).forEach(([periodName, period]) => {
        const totalTime = period.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalProductivity = period.sessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0);
        const avgProductivity = period.sessions.length > 0 ? totalProductivity / period.sessions.length : 0;

        periodAnalysis[periodName] = {
          totalTimeSeconds: totalTime,
          totalTimeHours: Math.round((totalTime / 3600) * 100) / 100,
          sessionCount: period.sessions.length,
          avgProductivity: Math.round(avgProductivity * 100) / 100,
          timeRange: `${period.start.toString().padStart(2, '0')}:00 - ${period.end.toString().padStart(2, '0')}:00`
        };
      });

      res.json({
        date: today.toISOString().split('T')[0],
        periods: periodAnalysis
      });
    } catch (error) {
      console.error('Error getting time of day analysis:', error);
      res.status(500).json({ error: 'Failed to get time of day analysis' });
    }
  }));

  /**
   * GET /api/recent-sessions - Get recent activity sessions
   */
  router.get('/recent-sessions', asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const sessions = await sessionService.getRecentSessions(limit);

      const sessionData = sessions.map(session => ({
        id: session.id,
        applicationName: session.applicationName,
        windowTitle: session.windowTitle ? session.windowTitle.substring(0, 50) : null,
        startTime: session.startTime.toISOString(),
        durationSeconds: session.duration,
        durationMinutes: session.duration ? Math.round((session.duration / 60) * 10) / 10 : 0,
        category: session.category,
        productivityScore: session.productivityScore ? Math.round(session.productivityScore * 100) / 100 : 0,
        categoryColor: CategoryManager.getCategoryColor(session.category!)
      }));

      res.json({
        sessions: sessionData,
        count: sessionData.length
      });
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      res.status(500).json({ error: 'Failed to get recent sessions' });
    }
  }));

  /**
   * GET /api/categories - Get available categories and their configuration
   */
  router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = categoryManager.getCategoryStats();
      const categories = Object.entries(stats).map(([name, stat]) => ({
        name,
        color: CategoryManager.getCategoryColor(name as any),
        rulesCount: stat.rulesCount,
        avgProductivity: Math.round(stat.avgProductivity * 100) / 100,
        appPatternsCount: stat.appPatternsCount,
        titlePatternsCount: stat.titlePatternsCount
      }));

      res.json({
        categories: categories.filter(c => c.name !== 'Uncategorized'),
        totalRules: categoryManager.getActiveRules().length
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }));

  /**
   * POST /api/categories/test - Test categorization for an app
   */
  router.post('/categories/test', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { appName, windowTitle } = req.body;
      
      if (!appName) {
        res.status(400).json({ error: 'appName is required' });
        return;
      }

      const result = categoryManager.testCategorization(appName, windowTitle);
      
      res.json({
        appName: result.appName,
        windowTitle: result.windowTitle,
        category: result.result.category,
        productivityScore: result.result.productivityScore,
        matchType: result.result.matchType,
        matchedRule: result.result.matchedRule ? {
          id: result.result.matchedRule.id,
          description: result.result.matchedRule.description,
          priority: result.result.matchedRule.priority
        } : null,
        allMatches: result.allMatches
      });
    } catch (error) {
      console.error('Error testing categorization:', error);
      res.status(500).json({ error: 'Failed to test categorization' });
    }
  }));

  /**
   * GET /api/productivity-stats - Get productivity statistics for date range
   */
  router.get('/productivity-stats', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, period = 'today' } = req.query;
      
      let start: Date, end: Date;
      
      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        // Default to today
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
      }

      const stats = await sessionService.getProductivityStats(start, end);
      
      res.json({
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        totalTimeSeconds: stats.totalTime,
        totalTimeHours: Math.round((stats.totalTime / 3600) * 100) / 100,
        averageProductivity: Math.round(stats.averageProductivity * 100) / 100,
        sessionCount: stats.sessionCount,
        categoryBreakdown: Object.entries(stats.categoryBreakdown).map(([category, time]) => ({
          category,
          timeSeconds: time,
          timeHours: Math.round((time / 3600) * 100) / 100,
          percentage: stats.totalTime > 0 ? Math.round((time / stats.totalTime * 100) * 10) / 10 : 0,
          color: CategoryManager.getCategoryColor(category as any)
        }))
      });
    } catch (error) {
      console.error('Error getting productivity stats:', error);
      res.status(500).json({ error: 'Failed to get productivity stats' });
    }
  }));

  /**
   * POST /api/monitor/start - Start the activity monitor
   */
  router.post('/monitor/start', asyncHandler(async (req: Request, res: Response) => {
    try {
      if (activityMonitor.getStatus().isRunning) {
        res.status(400).json({ error: 'Monitor is already running' });
        return;
      }

      await activityMonitor.start();
      res.json({ message: 'Monitor started successfully', status: activityMonitor.getStatus() });
    } catch (error) {
      console.error('Error starting monitor:', error);
      res.status(500).json({ error: 'Failed to start monitor' });
    }
  }));

  /**
   * POST /api/monitor/stop - Stop the activity monitor
   */
  router.post('/monitor/stop', asyncHandler(async (req: Request, res: Response) => {
    try {
      await activityMonitor.stop();
      res.json({ message: 'Monitor stopped successfully', status: activityMonitor.getStatus() });
    } catch (error) {
      console.error('Error stopping monitor:', error);
      res.status(500).json({ error: 'Failed to stop monitor' });
    }
  }));

  /**
   * GET /api/dashboard - Complete dashboard data in one request
   */
  router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get current session
      const currentSession = await sessionService.getCurrentSession();
      
      // Get today's summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sessions = await sessionService.getSessionsByDateRange(today, tomorrow);
      const recentSessions = await sessionService.getRecentSessions(10);
      
      // Calculate today's stats
      const totalActiveTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalProductivity = sessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0);
      const productivityScore = sessions.length > 0 ? Math.round((totalProductivity / sessions.length) * 100) : 0;
      
      // Time of day analysis
      const timePeriods = {
        morning: sessions.filter(s => s.startTime.getHours() >= 6 && s.startTime.getHours() < 12).reduce((sum, s) => sum + (s.duration || 0), 0),
        afternoon: sessions.filter(s => s.startTime.getHours() >= 12 && s.startTime.getHours() < 18).reduce((sum, s) => sum + (s.duration || 0), 0),
        evening: sessions.filter(s => s.startTime.getHours() >= 18 && s.startTime.getHours() < 24).reduce((sum, s) => sum + (s.duration || 0), 0),
        night: sessions.filter(s => s.startTime.getHours() >= 0 && s.startTime.getHours() < 6).reduce((sum, s) => sum + (s.duration || 0), 0),
      };

      const dashboardData = {
        todaySummary: {
          totalActiveTime,
          productivityScore,
        },
        recentSessions: {
          sessions: recentSessions.map(s => ({
            id: s.id?.toString() || '0',
            activity: s.applicationName,
            category: s.category || 'uncategorized',
            startTime: s.startTime.toISOString(),
            duration: s.duration || 0,
            active: s.isActive
          }))
        },
        timeOfDayAnalysis: timePeriods
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  }));

  /**
   * GET /api/health - Simple health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.4.0'
    });
  });

  // Error handling middleware
  router.use((error: Error, req: Request, res: Response, next: Function) => {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  });

  return router;
}

export default createApiRoutes;// trigger rebuild
