/**
 * Database Management and Performance API Routes
 * v0.4 - Database optimization and monitoring
 */

import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/DatabaseManager';

const router = Router();

// This will be initialized by the main server
let dbManager: DatabaseManager;

export const setDatabaseManager = (manager: DatabaseManager) => {
  dbManager = manager;
};

/**
 * GET /api/database/stats
 * Get comprehensive database statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const stats = await dbManager.getStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get database statistics'
    });
  }
});

/**
 * GET /api/database/health
 * Database health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: 'Database manager not initialized'
      });
    }

    const health = await dbManager.healthCheck();

    return res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      ...health
    });
  } catch (error) {
    console.error('Error checking database health:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

/**
 * POST /api/database/optimize
 * Optimize database performance
 */
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const result = await dbManager.optimize();

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error optimizing database:', error);
    return res.status(500).json({
      success: false,
      error: 'Database optimization failed'
    });
  }
});

/**
 * POST /api/database/backup
 * Create database backup
 */
router.post('/backup', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const { path: backupPath } = req.body;
    const resultPath = await dbManager.backup(backupPath);

    return res.json({
      success: true,
      message: 'Database backup created successfully',
      backupPath: resultPath
    });
  } catch (error) {
    console.error('Error creating database backup:', error);
    return res.status(500).json({
      success: false,
      error: 'Database backup failed'
    });
  }
});

/**
 * GET /api/database/queries/performance
 * Get query performance statistics
 */
router.get('/queries/performance', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const queryBuilder = dbManager.getQueryBuilder();
    const queryStats = queryBuilder.getQueryStats();
    const cacheStats = queryBuilder.getCacheStats();

    // Get recent slow queries from database
    const db = dbManager.getRawConnection();
    const slowQueries = await db('query_performance')
      .select('query_type', 'execution_time_ms', 'executed_at', 'rows_affected')
      .where('execution_time_ms', '>', 1000) // > 1 second
      .where('executed_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // last 24 hours
      .orderBy('execution_time_ms', 'desc')
      .limit(20);

    // Get query frequency over time
    const queryFrequency = await db('query_performance')
      .select(db.raw('strftime(\'%Y-%m-%d %H:00:00\', executed_at) as hour'))
      .count('* as query_count')
      .avg('execution_time_ms as avg_execution_time')
      .where('executed_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .groupBy('hour')
      .orderBy('hour', 'desc')
      .limit(24);

    return res.json({
      success: true,
      data: {
        summary: queryStats,
        cache: cacheStats,
        slowQueries,
        frequencyOverTime: queryFrequency
      }
    });
  } catch (error) {
    console.error('Error getting query performance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get query performance statistics'
    });
  }
});

/**
 * DELETE /api/database/cache
 * Clear query cache
 */
router.delete('/cache', (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const { pattern } = req.query;
    const queryBuilder = dbManager.getQueryBuilder();
    const clearedEntries = queryBuilder.clearCache(pattern as string);

    return res.json({
      success: true,
      message: `Cleared ${clearedEntries} cache entries`,
      clearedEntries
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/database/queries/slow
 * Get slow query analysis
 */
router.get('/queries/slow', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const { threshold = 1000, limit = 50 } = req.query;
    const db = dbManager.getRawConnection();

    const slowQueries = await db('query_performance')
      .select('query_type')
      .count('* as occurrence_count')
      .avg('execution_time_ms as avg_execution_time')
      .max('execution_time_ms as max_execution_time')
      .min('execution_time_ms as min_execution_time')
      .where('execution_time_ms', '>', Number(threshold))
      .where('executed_at', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // last week
      .groupBy('query_type')
      .orderBy('avg_execution_time', 'desc')
      .limit(Number(limit));

    // Get most recent slow queries with details
    const recentSlowQueries = await db('query_performance')
      .select('*')
      .where('execution_time_ms', '>', Number(threshold))
      .orderBy('executed_at', 'desc')
      .limit(20);

    return res.json({
      success: true,
      data: {
        summary: slowQueries,
        recentQueries: recentSlowQueries,
        threshold: Number(threshold),
        analysisTimeRange: '7 days'
      }
    });
  } catch (error) {
    console.error('Error getting slow queries:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get slow query analysis'
    });
  }
});

/**
 * GET /api/database/tables/info
 * Get detailed table information
 */
router.get('/tables/info', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const db = dbManager.getRawConnection();

    // Get all tables
    const tables = await db.raw(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tableInfo = [];
    
    for (const table of tables) {
      // Get row count
      const countResult = await db(table.name).count('* as count').first();
      const rowCount = (countResult?.count as number) || 0;

      // Get table info (columns, types, etc.)
      const tableSchema = await db.raw(`PRAGMA table_info(${table.name})`);
      
      // Get index information
      const indexes = await db.raw(`PRAGMA index_list(${table.name})`);
      
      tableInfo.push({
        name: table.name,
        sql: table.sql,
        rowCount,
        columns: tableSchema,
        indexes: indexes
      });
    }

    return res.json({
      success: true,
      data: {
        tables: tableInfo,
        totalTables: tables.length
      }
    });
  } catch (error) {
    console.error('Error getting table info:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get table information'
    });
  }
});

/**
 * GET /api/database/analytics/summary
 * Get database analytics summary
 */
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    if (!dbManager) {
      return res.status(503).json({
        success: false,
        error: 'Database manager not initialized'
      });
    }

    const { days = 30 } = req.query;
    const db = dbManager.getRawConnection();
    const daysBack = Number(days);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get activity summary
    const activitySummary = await db('activity_sessions')
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('SUM(duration_seconds) as total_duration'),
        db.raw('AVG(duration_seconds) as avg_duration'),
        db.raw('AVG(productivity_score) as avg_productivity'),
        db.raw('COUNT(DISTINCT application_name) as unique_applications'),
        db.raw('COUNT(DISTINCT hostname) as unique_devices')
      )
      .where('start_time', '>=', startDate)
      .first();

    // Get category breakdown
    const categoryBreakdown = await db('activity_sessions')
      .select('category')
      .count('* as session_count')
      .sum('duration_seconds as total_duration')
      .avg('productivity_score as avg_productivity')
      .where('start_time', '>=', startDate)
      .whereNotNull('category')
      .groupBy('category')
      .orderBy('total_duration', 'desc');

    // Get daily trends
    const dailyTrends = await db('activity_sessions')
      .select(db.raw('DATE(start_time) as date'))
      .count('* as sessions')
      .sum('duration_seconds as duration')
      .avg('productivity_score as productivity')
      .where('start_time', '>=', startDate)
      .groupBy('date')
      .orderBy('date', 'asc');

    // Get hourly patterns
    const hourlyPatterns = await db('activity_sessions')
      .select(db.raw('strftime(\'%H\', start_time) as hour'))
      .count('* as sessions')
      .sum('duration_seconds as duration')
      .avg('productivity_score as productivity')
      .where('start_time', '>=', startDate)
      .groupBy('hour')
      .orderBy('hour', 'asc');

    return res.json({
      success: true,
      data: {
        timeRange: `${daysBack} days`,
        summary: activitySummary,
        categoryBreakdown,
        dailyTrends,
        hourlyPatterns
      }
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get analytics summary'
    });
  }
});

export default router;