#!/usr/bin/env node
/**
 * Life Tracker Pro - Database Maintenance Script
 * Run database optimization, cleanup, and health checks
 */

import { knex, Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import DatabaseOptimizer from '../server/services/DatabaseOptimizer';

interface MaintenanceOptions {
  vacuum?: boolean;
  cleanup?: boolean;
  analyze?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

class DatabaseMaintenance {
  private db: Knex;
  private optimizer: DatabaseOptimizer;

  constructor(dbPath: string) {
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = knex({
      client: 'sqlite3',
      connection: { filename: dbPath },
      useNullAsDefault: true,
      pool: {
        afterCreate: (conn: any, cb: Function) => {
          conn.run('PRAGMA journal_mode=WAL', cb);
          conn.run('PRAGMA synchronous=NORMAL', cb);
          conn.run('PRAGMA cache_size=-10000', cb);
          conn.run('PRAGMA foreign_keys=ON', cb);
        }
      }
    });

    this.optimizer = new DatabaseOptimizer(this.db);
  }

  /**
   * Run complete maintenance routine
   */
  async runMaintenance(options: MaintenanceOptions = {}): Promise<void> {
    console.log('🔧 Starting database maintenance...\n');

    try {
      // 1. Create backup if requested
      if (options.backup) {
        await this.createBackup();
      }

      // 2. Run health check
      await this.healthCheck();

      // 3. Run optimization
      if (options.vacuum || options.cleanup || options.analyze) {
        const stats = await this.optimizer.optimize();
        this.printOptimizationStats(stats);
      } else {
        // Run full optimization by default
        const stats = await this.optimizer.optimize();
        this.printOptimizationStats(stats);
      }

      // 4. Get recommendations
      const recommendations = await this.optimizer.getRecommendations();
      this.printRecommendations(recommendations);

      console.log('\n✅ Database maintenance completed successfully!');

    } catch (error) {
      console.error('\n❌ Database maintenance failed:', error);
      throw error;
    } finally {
      await this.db.destroy();
    }
  }

  /**
   * Perform database health check
   */
  private async healthCheck(): Promise<void> {
    console.log('🏥 Performing health check...');

    try {
      // Test connection
      await this.db.raw('SELECT 1');
      console.log('✓ Database connection: OK');

      // Check integrity
      const integrityCheck = await this.db.raw('PRAGMA integrity_check');
      const isOk = integrityCheck[0]?.integrity_check === 'ok';
      console.log(`✓ Database integrity: ${isOk ? 'OK' : 'ISSUES FOUND'}`);

      // Get database stats
      const stats = await this.getDatabaseStats();
      console.log(`✓ Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✓ Total sessions: ${stats.sessionCount.toLocaleString()}`);
      console.log(`✓ Total categories: ${stats.categoryCount}`);
      console.log(`✓ Cached summaries: ${stats.summaryCount}`);

      // Check for issues
      if (stats.activeSessionsCount > 5) {
        console.log(`⚠️  Warning: ${stats.activeSessionsCount} active sessions found (potential data integrity issue)`);
      }

      if (stats.oldSessionsCount > 1000) {
        console.log(`⚠️  Warning: ${stats.oldSessionsCount} sessions older than 1 year (consider cleanup)`);
      }

      console.log('');

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  private async getDatabaseStats(): Promise<{
    size: number;
    sessionCount: number;
    categoryCount: number;
    summaryCount: number;
    activeSessionsCount: number;
    oldSessionsCount: number;
  }> {
    const sizeResult = await this.db.raw('PRAGMA page_count');
    const pageSize = await this.db.raw('PRAGMA page_size');
    const size = sizeResult[0].page_count * pageSize[0].page_size;

    const sessionCount = await this.db('activity_sessions').count('* as count');
    const categoryCount = await this.db('categories').count('* as count');
    const summaryCount = await this.db('daily_summaries').count('* as count');

    const activeSessionsCount = await this.db('activity_sessions')
      .where('is_active', true)
      .whereNull('end_time')
      .count('* as count');

    const oldSessionsCount = await this.db('activity_sessions')
      .where('start_time', '<', this.db.raw("date('now', '-365 days')"))
      .count('* as count');

    return {
      size,
      sessionCount: sessionCount[0].count,
      categoryCount: categoryCount[0].count,
      summaryCount: summaryCount[0].count,
      activeSessionsCount: activeSessionsCount[0].count,
      oldSessionsCount: oldSessionsCount[0].count
    };
  }

  /**
   * Create database backup
   */
  private async createBackup(): Promise<void> {
    console.log('💾 Creating database backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./database/backups/life_tracker_${timestamp}.db`;
    const backupDir = path.dirname(backupPath);

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      // SQLite backup using .backup command
      await this.db.raw(`VACUUM INTO '${backupPath}'`);
      
      const stats = fs.statSync(backupPath);
      console.log(`✓ Backup created: ${backupPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      // Clean old backups (keep last 5)
      await this.cleanOldBackups(backupDir);

    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Clean old backup files
   */
  private async cleanOldBackups(backupDir: string): Promise<void> {
    try {
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('life_tracker_') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: fs.statSync(path.join(backupDir, file)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      // Keep only the 5 most recent backups
      const filesToDelete = files.slice(5);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Removed old backup: ${file.name}`);
      }

    } catch (error) {
      console.error('Warning: Could not clean old backups:', error);
    }
  }

  /**
   * Print optimization statistics
   */
  private printOptimizationStats(stats: any): void {
    console.log('📊 Optimization Results:');
    console.log(`   Vacuum: ${(stats.vacuum.saved / 1024 / 1024).toFixed(2)} MB reclaimed`);
    console.log(`   Cleanup: ${stats.cleanup.oldSessions} old sessions, ${stats.cleanup.duplicates} duplicates removed`);
    console.log(`   Indexes: ${stats.indexes.analyzed} analyzed, ${stats.indexes.fragmented.length} rebuilt`);
    console.log(`   Performance: ${stats.performance.queryTime}ms query time`);
    console.log('');
  }

  /**
   * Print recommendations
   */
  private printRecommendations(recommendations: any): void {
    const icon = recommendations.severity === 'high' ? '🔴' : 
                 recommendations.severity === 'medium' ? '🟡' : '🟢';
    
    console.log(`${icon} Recommendations (${recommendations.severity} priority):`);
    recommendations.recommendations.forEach((rec: string) => {
      console.log(`   • ${rec}`);
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: MaintenanceOptions = {
    vacuum: args.includes('--vacuum'),
    cleanup: args.includes('--cleanup'),
    analyze: args.includes('--analyze'),
    backup: args.includes('--backup'),
    verbose: args.includes('--verbose')
  };

  // Default database path
  const dbPath = process.env.DB_PATH || './database/life_tracker.db';

  if (args.includes('--help')) {
    console.log(`
Life Tracker Pro - Database Maintenance Tool

Usage: npm run db:maintenance [options]

Options:
  --vacuum    Run database vacuum only
  --cleanup   Run data cleanup only  
  --analyze   Run index analysis only
  --backup    Create backup before maintenance
  --verbose   Verbose output
  --help      Show this help

Examples:
  npm run db:maintenance                    # Full maintenance
  npm run db:maintenance --backup          # Full maintenance with backup
  npm run db:maintenance --vacuum --backup # Vacuum with backup
    `);
    return;
  }

  try {
    const maintenance = new DatabaseMaintenance(dbPath);
    await maintenance.runMaintenance(options);
  } catch (error) {
    console.error('Maintenance failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default DatabaseMaintenance;