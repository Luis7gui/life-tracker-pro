/**
 * Life Tracker Pro - Database Optimizer Service
 * Handles database maintenance, cleanup, and performance optimization
 */

import { Knex } from 'knex';

export interface OptimizationStats {
  vacuum: {
    before: number;
    after: number;
    saved: number;
  };
  cleanup: {
    oldSessions: number;
    duplicates: number;
    orphaned: number;
  };
  indexes: {
    analyzed: number;
    fragmented: string[];
  };
  performance: {
    queryTime: number;
    cacheHits: number;
  };
}

export class DatabaseOptimizer {
  constructor(private db: Knex) {}

  /**
   * Run complete database optimization
   */
  async optimize(): Promise<OptimizationStats> {
    console.log('Starting database optimization...');
    
    const stats: OptimizationStats = {
      vacuum: { before: 0, after: 0, saved: 0 },
      cleanup: { oldSessions: 0, duplicates: 0, orphaned: 0 },
      indexes: { analyzed: 0, fragmented: [] },
      performance: { queryTime: 0, cacheHits: 0 }
    };

    try {
      // 1. Database vacuum and analyze
      stats.vacuum = await this.vacuumDatabase();
      
      // 2. Clean up old data
      stats.cleanup = await this.cleanupOldData();
      
      // 3. Analyze and rebuild indexes
      stats.indexes = await this.optimizeIndexes();
      
      // 4. Update daily summaries cache
      await this.updateDailySummariesCache();
      
      // 5. Analyze query performance
      stats.performance = await this.analyzePerformance();
      
      console.log('Database optimization completed successfully');
      return stats;
      
    } catch (error) {
      console.error('Database optimization failed:', error);
      throw error;
    }
  }

  /**
   * Vacuum database to reclaim space and defragment
   */
  private async vacuumDatabase(): Promise<OptimizationStats['vacuum']> {
    console.log('Running database vacuum...');
    
    // Get database size before vacuum
    const sizeBeforeResult = await this.db.raw('PRAGMA page_count');
    const pageSize = await this.db.raw('PRAGMA page_size');
    const before = sizeBeforeResult[0].page_count * pageSize[0].page_size;
    
    // Run vacuum
    await this.db.raw('VACUUM');
    
    // Get size after vacuum
    const sizeAfterResult = await this.db.raw('PRAGMA page_count');
    const after = sizeAfterResult[0].page_count * pageSize[0].page_size;
    
    const saved = before - after;
    
    console.log(`Vacuum completed: ${(saved / 1024 / 1024).toFixed(2)}MB reclaimed`);
    
    return { before, after, saved };
  }

  /**
   * Clean up old and unnecessary data
   */
  private async cleanupOldData(): Promise<OptimizationStats['cleanup']> {
    console.log('Cleaning up old data...');
    
    const cleanup = {
      oldSessions: 0,
      duplicates: 0,
      orphaned: 0
    };

    // 1. Remove sessions older than 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    cleanup.oldSessions = await this.db('activity_sessions')
      .where('start_time', '<', oneYearAgo)
      .del();

    // 2. Remove duplicate sessions (same app, start time within 5 seconds)
    const duplicateQuery = `
      DELETE FROM activity_sessions 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM activity_sessions 
        GROUP BY application_name, 
                 ROUND(strftime('%s', start_time) / 5) * 5
      )
    `;
    
    const duplicateResult = await this.db.raw(duplicateQuery);
    cleanup.duplicates = duplicateResult.changes || 0;

    // 3. Remove orphaned daily summaries without corresponding sessions
    cleanup.orphaned = await this.db('daily_summaries')
      .whereNotIn('summary_date', 
        this.db('activity_sessions')
          .select(this.db.raw('DATE(start_time) as date'))
          .distinct()
      )
      .del();

    console.log(`Cleanup completed: ${cleanup.oldSessions} old sessions, ${cleanup.duplicates} duplicates, ${cleanup.orphaned} orphaned summaries removed`);
    
    return cleanup;
  }

  /**
   * Optimize database indexes
   */
  private async optimizeIndexes(): Promise<OptimizationStats['indexes']> {
    console.log('Optimizing indexes...');
    
    // Analyze all tables
    await this.db.raw('ANALYZE');
    
    // Get index information
    const indexes = await this.db.raw(`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type = 'index' 
      AND name NOT LIKE 'sqlite_%'
    `);

    const analyzed = indexes.length;
    const fragmented: string[] = [];

    // Check for potentially fragmented indexes (simplified check)
    for (const index of indexes) {
      try {
        const integrityCheck = await this.db.raw(`PRAGMA integrity_check(${index.name})`);
        if (integrityCheck[0]?.integrity_check !== 'ok') {
          fragmented.push(index.name);
        }
      } catch (error) {
        // Skip if index doesn't support integrity check
        continue;
      }
    }

    // Reindex if needed
    if (fragmented.length > 0) {
      console.log(`Reindexing ${fragmented.length} fragmented indexes...`);
      await this.db.raw('REINDEX');
    }

    console.log(`Index optimization completed: ${analyzed} indexes analyzed, ${fragmented.length} rebuilt`);
    
    return { analyzed, fragmented };
  }

  /**
   * Update daily summaries cache for faster queries
   */
  private async updateDailySummariesCache(): Promise<void> {
    console.log('Updating daily summaries cache...');
    
    // Get all dates that have sessions but no cached summary
    const uncachedDates = await this.db.raw(`
      SELECT DISTINCT DATE(start_time) as summary_date
      FROM activity_sessions
      WHERE DATE(start_time) NOT IN (
        SELECT summary_date FROM daily_summaries
      )
      AND start_time >= date('now', '-30 days')
      ORDER BY summary_date DESC
    `);

    for (const { summary_date } of uncachedDates) {
      await this.calculateDailySummary(summary_date);
    }

    // Update summaries for the last 7 days (in case of new sessions)
    const recentDates = await this.db.raw(`
      SELECT DISTINCT DATE(start_time) as summary_date
      FROM activity_sessions
      WHERE start_time >= date('now', '-7 days')
      ORDER BY summary_date DESC
    `);

    for (const { summary_date } of recentDates) {
      await this.calculateDailySummary(summary_date);
    }

    console.log(`Daily summaries cache updated for ${uncachedDates.length + recentDates.length} dates`);
  }

  /**
   * Calculate and cache daily summary for a specific date
   */
  private async calculateDailySummary(date: string): Promise<void> {
    const sessions = await this.db('activity_sessions')
      .whereRaw('DATE(start_time) = ?', [date])
      .whereNotNull('duration_seconds');

    if (sessions.length === 0) return;

    const totalActiveTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const averageProductivity = sessions
      .filter(s => s.productivity_score !== null)
      .reduce((sum, s, _, arr) => sum + (s.productivity_score || 0) / arr.length, 0);

    const categoryBreakdown: { [key: string]: number } = {};
    const hourlyBreakdown = new Array(24).fill(0);

    sessions.forEach(session => {
      // Category breakdown
      const category = session.category || 'uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (session.duration_seconds || 0);

      // Hourly breakdown
      const hour = new Date(session.start_time).getHours();
      hourlyBreakdown[hour] += (session.duration_seconds || 0);
    });

    // Insert or update daily summary
    await this.db('daily_summaries')
      .insert({
        summary_date: date,
        total_active_time: totalActiveTime,
        average_productivity: averageProductivity,
        session_count: sessions.length,
        category_breakdown: JSON.stringify(categoryBreakdown),
        hourly_breakdown: JSON.stringify(hourlyBreakdown),
        last_calculated: new Date()
      })
      .onConflict('summary_date')
      .merge();
  }

  /**
   * Analyze query performance
   */
  private async analyzePerformance(): Promise<OptimizationStats['performance']> {
    console.log('Analyzing query performance...');
    
    const startTime = Date.now();
    
    // Run some common queries to test performance
    await this.db('activity_sessions')
      .where('start_time', '>=', this.db.raw("date('now', '-7 days')"))
      .count('* as count');
    
    await this.db('activity_sessions')
      .where('is_active', true)
      .whereNull('end_time')
      .first();
    
    await this.db('daily_summaries')
      .where('summary_date', '>=', this.db.raw("date('now', '-30 days')"))
      .orderBy('summary_date', 'desc');
    
    const queryTime = Date.now() - startTime;
    
    // Get cache hit ratio (approximate)
    const cacheStats = await this.db.raw('PRAGMA cache_size');
    const cacheHits = cacheStats[0]?.cache_size || 0;
    
    console.log(`Performance analysis completed: ${queryTime}ms query time`);
    
    return { queryTime, cacheHits };
  }

  /**
   * Get optimization recommendations
   */
  async getRecommendations(): Promise<{
    recommendations: string[];
    severity: 'low' | 'medium' | 'high';
  }> {
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check database size
    const sizeResult = await this.db.raw('PRAGMA page_count');
    const pageSize = await this.db.raw('PRAGMA page_size');
    const dbSize = sizeResult[0].page_count * pageSize[0].page_size;
    
    if (dbSize > 100 * 1024 * 1024) { // > 100MB
      recommendations.push('Database is large (>100MB). Consider archiving old data.');
      severity = 'medium';
    }

    // Check for old data
    const oldDataCount = await this.db('activity_sessions')
      .where('start_time', '<', this.db.raw("date('now', '-365 days')"))
      .count('* as count');
    
    if (oldDataCount[0].count > 1000) {
      recommendations.push('Many old sessions found. Consider cleanup.');
      severity = 'medium';
    }

    // Check cache effectiveness
    const cacheStats = await this.db.raw('PRAGMA cache_size');
    if (cacheStats[0]?.cache_size < 1000) {
      recommendations.push('Consider increasing cache size for better performance.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is well optimized!');
    }

    return { recommendations, severity };
  }

  /**
   * Schedule automatic optimization
   */
  scheduleOptimization(intervalHours: number = 24): NodeJS.Timeout {
    console.log(`Scheduling automatic optimization every ${intervalHours} hours`);
    
    return setInterval(async () => {
      try {
        console.log('Running scheduled database optimization...');
        await this.optimize();
      } catch (error) {
        console.error('Scheduled optimization failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

export default DatabaseOptimizer;