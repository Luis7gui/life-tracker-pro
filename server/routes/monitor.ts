/**
 * Activity Monitor API Routes
 */

import { Router, Request, Response } from 'express';
import { ActivityMonitor } from '../services/ActivityMonitor';
import { ActivitySessionService } from '../models/ActivitySession';
import { knex } from 'knex';
import path from 'path';

const router = Router();

let activityMonitor: ActivityMonitor | null = null;
let db: any = null;

// Initialize database connection for monitor
const initializeDb = () => {
  if (!db) {
    db = knex({
      client: 'sqlite3',
      connection: {
        filename: path.join(process.cwd(), 'database', 'life_tracker.db')
      },
      useNullAsDefault: true
    });
  }
  return db;
};

// Initialize monitor
const initializeMonitor = () => {
  if (!activityMonitor) {
    const database = initializeDb();
    const sessionService = new ActivitySessionService(database);
    activityMonitor = new ActivityMonitor(sessionService, {
      sampleInterval: 2000,
      idleThreshold: 300000,
      trackWindowTitles: true,
      excludeApplications: [
        'keychain', '1password', 'bitwarden', 'lastpass', 'keepass',
        'system preferences', 'task manager', 'activity monitor',
        'security agent', 'windowserver'
      ]
    });

    // Setup event listeners
    activityMonitor.on('started', () => {
      console.log('Activity monitoring started');
    });

    activityMonitor.on('stopped', () => {
      console.log('Activity monitoring stopped');
    });

    activityMonitor.on('session:started', (data) => {
      console.log(`New session: ${data.session.applicationName}`);
    });

    activityMonitor.on('session:ended', (data) => {
      console.log(`Session ended: ${data.session.applicationName} (${data.session.calculatedDuration}s)`);
    });

    activityMonitor.on('idle', () => {
      console.log('User went idle');
    });

    activityMonitor.on('active', () => {
      console.log('User became active');
    });

    activityMonitor.on('error', (error) => {
      console.error('Activity Monitor error:', error);
    });
  }
  return activityMonitor;
};

/**
 * GET /api/monitor/status
 * Get current monitor status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    const status = monitor.getStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting monitor status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get monitor status'
    });
  }
});

/**
 * POST /api/monitor/start
 * Start activity monitoring
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    
    if (monitor.getStatus().isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Monitor is already running'
      });
    }

    await monitor.start();
    
    return res.json({
      success: true,
      message: 'Activity monitoring started',
      data: monitor.getStatus()
    });
  } catch (error) {
    console.error('Error starting monitor:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start monitor'
    });
  }
});

/**
 * POST /api/monitor/stop
 * Stop activity monitoring
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    
    if (!monitor.getStatus().isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Monitor is not running'
      });
    }

    await monitor.stop();
    
    return res.json({
      success: true,
      message: 'Activity monitoring stopped',
      data: monitor.getStatus()
    });
  } catch (error) {
    console.error('Error stopping monitor:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop monitor'
    });
  }
});

/**
 * POST /api/monitor/force-end-session
 * Force end current session
 */
router.post('/force-end-session', async (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    const ended = await monitor.forceEndCurrentSession();
    
    return res.json({
      success: true,
      message: ended ? 'Session ended' : 'No active session',
      data: { sessionEnded: ended }
    });
  } catch (error) {
    console.error('Error force ending session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

/**
 * PUT /api/monitor/config
 * Update monitor configuration
 */
router.put('/config', (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    const { sampleInterval, idleThreshold, trackWindowTitles, excludeApplications } = req.body;
    
    const configUpdate: any = {};
    
    if (typeof sampleInterval === 'number' && sampleInterval >= 1000) {
      configUpdate.sampleInterval = sampleInterval;
    }
    
    if (typeof idleThreshold === 'number' && idleThreshold >= 60000) {
      configUpdate.idleThreshold = idleThreshold;
    }
    
    if (typeof trackWindowTitles === 'boolean') {
      configUpdate.trackWindowTitles = trackWindowTitles;
    }
    
    if (Array.isArray(excludeApplications)) {
      configUpdate.excludeApplications = excludeApplications;
    }
    
    monitor.updateConfig(configUpdate);
    
    return res.json({
      success: true,
      message: 'Configuration updated',
      data: monitor.getStatus().config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

/**
 * GET /api/monitor/sessions/recent
 * Get recent activity sessions
 */
router.get('/sessions/recent', async (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    const limit = parseInt(req.query.limit as string) || 20;
    const sessions = await monitor.getRecentSessions(limit);
    
    return res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error getting recent sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get recent sessions'
    });
  }
});

/**
 * GET /api/monitor/sessions/today
 * Get today's activity sessions
 */
router.get('/sessions/today', async (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    const sessions = await monitor.getTodaySessions();
    
    return res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error getting today sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get today sessions'
    });
  }
});

/**
 * GET /api/monitor/stats/productivity
 * Get productivity statistics for date range
 */
router.get('/stats/productivity', async (req: Request, res: Response) => {
  try {
    const monitor = initializeMonitor();
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }
    
    const stats = await monitor.getProductivityStats(start, end);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting productivity stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get productivity statistics'
    });
  }
});

export default router;
export { activityMonitor };