/**
 * Advanced Database Manager
 * v0.4 - Connection pooling, monitoring, and optimization
 */

import { Knex, knex } from 'knex';
import path from 'path';
import fs from 'fs';
import OptimizedQueryBuilder from './OptimizedQueryBuilder';

export interface DatabaseConfig {
  client: string;
  connection: any;
  pool?: {
    min?: number;
    max?: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
    afterCreate?: (conn: any, cb: Function) => void;
  };
  migrations?: {
    directory: string;
    extension: string;
  };
  useNullAsDefault?: boolean;
  debug?: boolean;
}

export interface DatabaseStats {
  connectionPool: {
    used: number;
    free: number;
    pending: number;
    size: number;
  };
  performance: {
    avgQueryTime: number;
    totalQueries: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  storage: {
    databaseSizeBytes: number;
    tableStats: { [tableName: string]: { rows: number; sizeBytes: number } };
  };
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Knex;
  private queryBuilder: OptimizedQueryBuilder;
  private config: DatabaseConfig;
  private startTime: number = Date.now();
  private queryCount: number = 0;
  private totalQueryTime: number = 0;
  private slowQueryThreshold: number = 1000; // 1 second

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = this.buildConfig(config);
    this.db = knex(this.config);
    this.queryBuilder = new OptimizedQueryBuilder(this.db);
    this.setupMonitoring();
    this.setupHealthChecks();
  }

  private buildConfig(userConfig: Partial<DatabaseConfig>): DatabaseConfig {
    const dbPath = userConfig.connection?.filename || 
                   process.env.DB_PATH || 
                   path.join(process.cwd(), 'database', 'life_tracker.db');

    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const defaultConfig = {
      client: 'sqlite3',
      connection: {
        filename: dbPath
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        afterCreate: (conn: any, cb: Function) => {
          // SQLite performance optimizations
          conn.run('PRAGMA journal_mode=WAL', cb); // Write-Ahead Logging
          conn.run('PRAGMA synchronous=NORMAL');   // Balance safety/performance
          conn.run('PRAGMA cache_size=-20000');    // 20MB cache
          conn.run('PRAGMA foreign_keys=ON');      // Enable foreign keys
          conn.run('PRAGMA temp_store=MEMORY');    // Temp tables in memory
          conn.run('PRAGMA mmap_size=268435456');  // Memory map 256MB
          conn.run('PRAGMA page_size=4096');       // Optimal page size
          conn.run('PRAGMA busy_timeout=30000');   // 30s busy timeout
          
          // Additional optimizations for write performance
          conn.run('PRAGMA wal_autocheckpoint=1000');
          conn.run('PRAGMA checkpoint_fullfsync=0');
          cb();
        }
      },
      migrations: {
        directory: path.join(process.cwd(), 'database', 'migrations'),
        extension: 'ts'
      },
      useNullAsDefault: true,
      debug: process.env.NODE_ENV === 'development'
    };

    // Merge user config with defaults
    return {
      ...defaultConfig,
      ...userConfig,
      pool: {
        ...defaultConfig.pool,
        ...userConfig.pool
      },
      migrations: {
        ...defaultConfig.migrations,
        ...userConfig.migrations
      }
    };
  }

  /**
   * Singleton instance getter
   */
  static getInstance(config?: Partial<DatabaseConfig>): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database with migrations and optimizations
   */
  async initialize(): Promise<void> {
    console.log('🗄️  Initializing optimized database connection...');
    
    try {
      // Test connection
      await this.db.raw('SELECT 1');
      console.log('✅ Database connection established');

      // Run migrations
      await this.db.migrate.latest();
      console.log('✅ Database migrations completed');

      // Analyze database for optimization
      await this.analyzeDatabaseStructure();

      // Start background tasks
      this.startBackgroundTasks();

      console.log('🚀 Database manager fully initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the optimized query builder
   */
  getQueryBuilder(): OptimizedQueryBuilder {
    return this.queryBuilder;
  }

  /**
   * Get raw Knex instance (use sparingly)
   */
  getRawConnection(): Knex {
    return this.db;
  }

  /**
   * Get comprehensive database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    const poolStats = (this.db.client as any).pool;
    
    // Get query performance stats
    const queryStats = this.queryBuilder.getQueryStats();
    const cacheStats = this.queryBuilder.getCacheStats();

    // Calculate performance metrics
    const avgQueryTime = this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0;
    const slowQueries = await this.db('query_performance')
      .where('execution_time_ms', '>', this.slowQueryThreshold)
      .count('* as count')
      .first();

    // Get storage statistics
    const storageStats = await this.getStorageStats();

    return {
      connectionPool: {
        used: poolStats?.numUsed() || 0,
        free: poolStats?.numFree() || 0,
        pending: poolStats?.numPendingAcquires() || 0,
        size: poolStats?.size || 0
      },
      performance: {
        avgQueryTime: Math.round(avgQueryTime * 100) / 100,
        totalQueries: this.queryCount,
        slowQueries: (slowQueries?.count as number) || 0,
        cacheHitRate: cacheStats.activeEntries > 0 ? 
          (cacheStats.activeEntries / (cacheStats.activeEntries + cacheStats.expiredEntries)) * 100 : 0
      },
      storage: storageStats
    };
  }

  /**
   * Optimize database performance
   */
  async optimize(): Promise<{ message: string; details: any }> {
    console.log('🔧 Starting database optimization...');
    
    const startTime = Date.now();
    const results: any = {};

    try {
      // 1. Vacuum database to reclaim space
      console.log('📦 Vacuuming database...');
      await this.db.raw('VACUUM');
      results.vacuum = 'completed';

      // 2. Analyze tables for query optimization
      console.log('📊 Analyzing tables...');
      await this.db.raw('ANALYZE');
      results.analyze = 'completed';

      // 3. Update table statistics
      console.log('📈 Updating table statistics...');
      await this.db.raw('PRAGMA optimize');
      results.optimize = 'completed';

      // 4. Integrity check
      console.log('🔍 Checking database integrity...');
      const integrityCheck = await this.db.raw('PRAGMA integrity_check');
      results.integrityCheck = integrityCheck[0]?.integrity_check || 'ok';

      // 5. Clear old performance data (keep last 7 days)
      console.log('🧹 Cleaning old performance data...');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deletedRows = await this.db('query_performance')
        .where('executed_at', '<', sevenDaysAgo)
        .del();
      results.cleanedPerformanceRecords = deletedRows;

      // 6. Update daily summaries for recent dates
      console.log('📅 Updating daily summaries...');
      await this.updateDailySummaries();
      results.dailySummariesUpdated = true;

      const totalTime = Date.now() - startTime;
      console.log(`✅ Database optimization completed in ${totalTime}ms`);

      return {
        message: `Database optimization completed successfully in ${totalTime}ms`,
        details: results
      };
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      throw error;
    }
  }

  /**
   * Backup database
   */
  async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupPath = path.join(
      process.cwd(), 
      'backups', 
      `life_tracker_backup_${timestamp}.db`
    );
    
    const finalBackupPath = backupPath || defaultBackupPath;
    
    // Ensure backup directory exists
    const backupDir = path.dirname(finalBackupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Use SQLite backup command
    await this.db.raw(`VACUUM INTO '${finalBackupPath}'`);
    
    console.log(`✅ Database backed up to: ${finalBackupPath}`);
    return finalBackupPath;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const startTime = Date.now();
      
      // Test basic query
      await this.db.raw('SELECT 1');
      const queryTime = Date.now() - startTime;
      
      // Get pool status
      const poolStats = (this.db.client as any).pool;
      const poolHealth = {
        used: poolStats?.numUsed() || 0,
        free: poolStats?.numFree() || 0,
        max: this.config.pool?.max || 0
      };

      // Check for any very slow queries
      const recentSlowQueries = await this.db('query_performance')
        .where('executed_at', '>', new Date(Date.now() - 60000)) // last minute
        .where('execution_time_ms', '>', 5000) // > 5 seconds
        .count('* as count')
        .first();

      const details = {
        responseTime: queryTime,
        connectionPool: poolHealth,
        recentSlowQueries: (recentSlowQueries?.count as number) || 0,
        uptime: Date.now() - this.startTime
      };

      const isHealthy = queryTime < 1000 && // Response under 1s
                       poolHealth.used < poolHealth.max * 0.9 && // Pool not overwhelmed
                       details.recentSlowQueries < 10; // Not too many slow queries

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Get all activity sessions from the database
   */
  async getAllSessions(limit?: number, offset?: number): Promise<any[]> {
    try {
      let query = this.db('activity_sessions')
        .select('*')
        .orderBy('start_time', 'desc');

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.offset(offset);
      }

      const sessions = await query;
      
      // Convert snake_case to camelCase for compatibility
      return sessions.map(session => ({
        id: session.id,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        duration: session.duration_seconds,
        applicationName: session.application_name,
        applicationPath: session.application_path,
        windowTitle: session.window_title,
        windowTitleHash: session.window_title_hash,
        category: session.category,
        productivityScore: session.productivity_score,
        isIdle: Boolean(session.is_idle),
        isActive: Boolean(session.is_active),
        hostname: session.hostname,
        osName: session.os_name,
        createdAt: session.created_at ? new Date(session.created_at) : undefined,
        updatedAt: session.updated_at ? new Date(session.updated_at) : undefined
      }));
    } catch (error) {
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  /**
   * Get the Knex instance for direct database operations
   */
  getKnex(): Knex {
    return this.db;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    console.log('🔐 Closing database connections...');
    await this.db.destroy();
    console.log('✅ Database connections closed');
  }

  // Private methods

  private setupMonitoring(): void {
    // Monitor query performance
    this.db.on('query', (query) => {
      this.queryCount++;
      const startTime = Date.now();
      
      if (query && typeof query.on === 'function') {
        query.on('end', () => {
          const executionTime = Date.now() - startTime;
          this.totalQueryTime += executionTime;
        });
      }
    });

    // Monitor connection events
    this.db.client.on('start', () => {
      console.log('🔗 Database connection started');
    });

    this.db.client.on('query-error', (error: any, query: any) => {
      console.error('❌ Database query error:', error.message, query.sql);
    });
  }

  private setupHealthChecks(): void {
    // Periodic health checks every 5 minutes
    setInterval(async () => {
      const health = await this.healthCheck();
      if (health.status === 'unhealthy') {
        console.warn('⚠️  Database health check failed:', health.details);
      }
    }, 5 * 60 * 1000);
  }

  private async analyzeDatabaseStructure(): Promise<void> {
    // Get table information
    const tables = await this.db.raw(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    console.log(`📊 Found ${tables.length} tables:`, tables.map((t: any) => t.name).join(', '));

    // Analyze each table
    for (const table of tables) {
      await this.db.raw(`ANALYZE ${table.name}`);
    }
  }

  private async getStorageStats(): Promise<any> {
    try {
      // Get database file size
      const dbPath = this.config.connection.filename;
      const dbStats = fs.statSync(dbPath);
      
      // Get table statistics
      const tableStats: any = {};
      const tables = await this.db.raw(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      for (const table of tables) {
        const count = await this.db(table.name).count('* as count').first();
        tableStats[table.name] = {
          rows: (count?.count as number) || 0,
          sizeBytes: 0 // SQLite doesn't easily provide per-table size
        };
      }

      return {
        databaseSizeBytes: dbStats.size,
        tableStats
      };
    } catch (error) {
      console.warn('Could not get storage stats:', error);
      return {
        databaseSizeBytes: 0,
        tableStats: {}
      };
    }
  }

  private async updateDailySummaries(): Promise<void> {
    // Update summaries for last 7 days
    const today = new Date();
    const promises = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Get unique hostnames for the date
      const hostnames = await this.db('activity_sessions')
        .distinct('hostname')
        .where('start_time', '>=', date.toISOString().split('T')[0])
        .where('start_time', '<', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      for (const { hostname } of hostnames) {
        promises.push(this.queryBuilder.generateDailySummaries(date, hostname));
      }
    }

    await Promise.all(promises);
  }

  private startBackgroundTasks(): void {
    // Auto-optimize every hour
    setInterval(() => {
      this.optimize().catch(err => console.error('Background optimization failed:', err));
    }, 60 * 60 * 1000);

    // Update daily summaries every 30 minutes
    setInterval(() => {
      this.updateDailySummaries().catch(err => console.error('Daily summary update failed:', err));
    }, 30 * 60 * 1000);

    // Auto-backup daily at 2 AM
    const scheduleBackup = () => {
      const now = new Date();
      const tomorrow2AM = new Date();
      tomorrow2AM.setDate(now.getDate() + 1);
      tomorrow2AM.setHours(2, 0, 0, 0);
      
      const timeUntilBackup = tomorrow2AM.getTime() - now.getTime();
      
      setTimeout(() => {
        this.backup().catch(err => console.error('Auto-backup failed:', err));
        // Schedule next backup
        setInterval(() => {
          this.backup().catch(err => console.error('Auto-backup failed:', err));
        }, 24 * 60 * 60 * 1000); // Every 24 hours
      }, timeUntilBackup);
    };

    scheduleBackup();
  }
}

export default DatabaseManager;