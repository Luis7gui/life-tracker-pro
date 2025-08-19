/**
 * Optimized Query Builder Service
 * v0.4 - High-performance database queries with caching and monitoring
 */

import { Knex } from 'knex';
import { performance } from 'perf_hooks';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  useCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // seconds
}

export interface QueryResult<T> {
  data: T[];
  total?: number;
  executionTime: number;
  fromCache: boolean;
  queryHash: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ActivityFilter {
  applications?: string[];
  categories?: string[];
  hostnames?: string[];
  minDuration?: number;
  maxDuration?: number;
  minProductivityScore?: number;
  maxProductivityScore?: number;
  isActive?: boolean;
}

export class OptimizedQueryBuilder {
  private db: Knex;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private queryStats: Map<string, { totalTime: number; count: number; avgTime: number }> = new Map();

  constructor(database: Knex) {
    this.db = database;
    this.startPeriodicCacheCleanup();
  }

  /**
   * Get activity sessions with advanced filtering and optimization
   */
  async getActivitySessions(
    dateRange: DateRange,
    filters: ActivityFilter = {},
    options: QueryOptions = {}
  ): Promise<QueryResult<any>> {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash('activity_sessions', { dateRange, filters, options });
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getFromCache(queryHash);
      if (cached) {
        return {
          data: cached.data,
          total: cached.total,
          executionTime: performance.now() - startTime,
          fromCache: true,
          queryHash
        };
      }
    }

    let query = this.db('activity_sessions')
      .whereBetween('start_time', [dateRange.startDate, dateRange.endDate]);

    // Apply filters with optimized conditions
    if (filters.applications?.length) {
      query = query.whereIn('application_name', filters.applications);
    }

    if (filters.categories?.length) {
      query = query.whereIn('category', filters.categories);
    }

    if (filters.hostnames?.length) {
      query = query.whereIn('hostname', filters.hostnames);
    }

    if (filters.minDuration !== undefined) {
      query = query.where('duration_seconds', '>=', filters.minDuration);
    }

    if (filters.maxDuration !== undefined) {
      query = query.where('duration_seconds', '<=', filters.maxDuration);
    }

    if (filters.minProductivityScore !== undefined) {
      query = query.where('productivity_score', '>=', filters.minProductivityScore);
    }

    if (filters.maxProductivityScore !== undefined) {
      query = query.where('productivity_score', '<=', filters.maxProductivityScore);
    }

    if (filters.isActive !== undefined) {
      query = query.where('is_active', filters.isActive);
    }

    // Get total count for pagination (optimized)
    let total: number | undefined;
    if (options.limit !== undefined) {
      const countQuery = query.clone().count('* as count').first();
      const countResult = await countQuery;
      total = countResult?.count as number || 0;
    }

    // Apply ordering with index optimization
    const orderBy = options.orderBy || 'start_time';
    const orderDirection = options.orderDirection || 'desc';
    query = query.orderBy(orderBy, orderDirection);

    // Apply pagination
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
      if (options.offset !== undefined) {
        query = query.offset(options.offset);
      }
    }

    // Execute query
    const data = await query;
    const executionTime = performance.now() - startTime;

    // Cache result if enabled
    if (options.useCache !== false) {
      const cacheTTL = options.cacheTTL || 300; // 5 minutes default
      this.setCache(queryHash, { data, total }, cacheTTL);
    }

    // Record performance metrics
    this.recordQueryPerformance('activity_sessions', executionTime, data.length, queryHash);

    return {
      data,
      total,
      executionTime,
      fromCache: false,
      queryHash
    };
  }

  /**
   * Get daily summaries (pre-aggregated data for fast dashboard loading)
   */
  async getDailySummaries(
    dateRange: DateRange,
    hostname?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<any>> {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash('daily_summaries', { dateRange, hostname, options });

    // Check cache
    const cached = this.getFromCache(queryHash);
    if (cached && options.useCache !== false) {
      return {
        data: cached.data,
        total: cached.total,
        executionTime: performance.now() - startTime,
        fromCache: true,
        queryHash
      };
    }

    let query = this.db('daily_summaries')
      .whereBetween('summary_date', [dateRange.startDate, dateRange.endDate]);

    if (hostname) {
      query = query.where('hostname', hostname);
    }

    // Order by date
    query = query.orderBy('summary_date', 'desc');

    const data = await query;
    const executionTime = performance.now() - startTime;

    // Cache for longer since summaries don't change often
    this.setCache(queryHash, { data }, options.cacheTTL || 3600); // 1 hour

    this.recordQueryPerformance('daily_summaries', executionTime, data.length, queryHash);

    return {
      data,
      executionTime,
      fromCache: false,
      queryHash
    };
  }

  /**
   * Get top applications by usage
   */
  async getTopApplications(
    dateRange: DateRange,
    limit: number = 10,
    hostname?: string
  ): Promise<QueryResult<any>> {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash('top_applications', { dateRange, limit, hostname });

    const cached = this.getFromCache(queryHash);
    if (cached) {
      return {
        data: cached.data,
        executionTime: performance.now() - startTime,
        fromCache: true,
        queryHash
      };
    }

    let query = this.db('activity_sessions')
      .select('application_name')
      .sum('duration_seconds as total_duration')
      .count('* as session_count')
      .avg('productivity_score as avg_productivity')
      .whereBetween('start_time', [dateRange.startDate, dateRange.endDate])
      .whereNotNull('duration_seconds')
      .groupBy('application_name')
      .orderBy('total_duration', 'desc')
      .limit(limit);

    if (hostname) {
      query = query.where('hostname', hostname);
    }

    const data = await query;
    const executionTime = performance.now() - startTime;

    // Cache for 10 minutes
    this.setCache(queryHash, { data }, 600);
    this.recordQueryPerformance('top_applications', executionTime, data.length, queryHash);

    return {
      data,
      executionTime,
      fromCache: false,
      queryHash
    };
  }

  /**
   * Get productivity trends over time
   */
  async getProductivityTrends(
    dateRange: DateRange,
    groupBy: 'hour' | 'day' | 'week' = 'day',
    hostname?: string
  ): Promise<QueryResult<any>> {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash('productivity_trends', { dateRange, groupBy, hostname });

    const cached = this.getFromCache(queryHash);
    if (cached) {
      return {
        data: cached.data,
        executionTime: performance.now() - startTime,
        fromCache: true,
        queryHash
      };
    }

    // Use different grouping based on the requirement
    let dateFormat: string;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'week':
        dateFormat = '%Y-W%W';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    let query = this.db('activity_sessions')
      .select(this.db.raw(`strftime('${dateFormat}', start_time) as time_period`))
      .sum('duration_seconds as total_duration')
      .avg('productivity_score as avg_productivity')
      .count('* as session_count')
      .whereBetween('start_time', [dateRange.startDate, dateRange.endDate])
      .whereNotNull('duration_seconds')
      .groupBy('time_period')
      .orderBy('time_period', 'asc');

    if (hostname) {
      query = query.where('hostname', hostname);
    }

    const data = await query;
    const executionTime = performance.now() - startTime;

    // Cache for 15 minutes
    this.setCache(queryHash, { data }, 900);
    this.recordQueryPerformance('productivity_trends', executionTime, data.length, queryHash);

    return {
      data,
      executionTime,
      fromCache: false,
      queryHash
    };
  }

  /**
   * Generate or update daily summaries (for background processing)
   */
  async generateDailySummaries(date: Date, hostname: string): Promise<void> {
    const startTime = performance.now();
    
    // Delete existing summaries for the date
    await this.db('daily_summaries')
      .where('summary_date', date.toISOString().split('T')[0])
      .where('hostname', hostname)
      .del();

    // Generate new summaries
    const summaryQuery = `
      INSERT INTO daily_summaries (
        summary_date, hostname, category, total_duration_seconds, 
        session_count, avg_productivity_score, total_productivity_time, 
        top_applications
      )
      SELECT 
        DATE(start_time) as summary_date,
        hostname,
        category,
        SUM(duration_seconds) as total_duration_seconds,
        COUNT(*) as session_count,
        AVG(productivity_score) as avg_productivity_score,
        SUM(duration_seconds * productivity_score) as total_productivity_time,
        JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'app', application_name,
            'duration', duration_seconds
          )
        ) as top_applications
      FROM activity_sessions 
      WHERE DATE(start_time) = ? 
        AND hostname = ?
        AND duration_seconds IS NOT NULL
      GROUP BY DATE(start_time), hostname, category
    `;

    await this.db.raw(summaryQuery, [date.toISOString().split('T')[0], hostname]);

    const executionTime = performance.now() - startTime;
    this.recordQueryPerformance('generate_daily_summaries', executionTime, 1, 'batch_operation');

    // Clear related cache entries
    this.clearCacheByPattern('daily_summaries');
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): any {
    const stats: any = {};
    this.queryStats.forEach((value, key) => {
      stats[key] = {
        totalExecutions: value.count,
        totalTime: Math.round(value.totalTime),
        avgTime: Math.round(value.avgTime * 100) / 100,
        estimatedQueriesPerSecond: value.avgTime > 0 ? Math.round(1000 / value.avgTime) : 0
      };
    });
    return stats;
  }

  /**
   * Clear cache manually
   */
  clearCache(pattern?: string): number {
    if (!pattern) {
      const count = this.cache.size;
      this.cache.clear();
      return count;
    }
    return this.clearCacheByPattern(pattern);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;
    
    this.cache.forEach(entry => {
      if (entry.expires > now) {
        activeEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      memoryUsage: `${(JSON.stringify([...this.cache.values()]).length / 1024 / 1024).toFixed(2)} MB`
    };
  }

  // Private methods

  private generateQueryHash(table: string, params: any): string {
    const hashInput = `${table}:${JSON.stringify(params)}`;
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  private clearCacheByPattern(pattern: string): number {
    let cleared = 0;
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleared++;
      }
    });
    return cleared;
  }

  private recordQueryPerformance(queryType: string, executionTime: number, rowCount: number, queryHash: string): void {
    // Update in-memory stats
    const currentStats = this.queryStats.get(queryType) || { totalTime: 0, count: 0, avgTime: 0 };
    currentStats.totalTime += executionTime;
    currentStats.count += 1;
    currentStats.avgTime = currentStats.totalTime / currentStats.count;
    this.queryStats.set(queryType, currentStats);

    // Store in database asynchronously (don't await to avoid slowing down queries)
    this.db('query_performance').insert({
      query_type: queryType,
      query_hash: queryHash,
      execution_time_ms: Math.round(executionTime),
      rows_affected: rowCount,
      executed_at: new Date()
    }).catch(err => console.warn('Failed to record query performance:', err));
  }

  private startPeriodicCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      this.cache.forEach((entry, key) => {
        if (entry.expires < now) {
          this.cache.delete(key);
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

export default OptimizedQueryBuilder;