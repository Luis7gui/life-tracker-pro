/**
 * Migration: Optimize Database Indexes
 * v0.4 - Performance optimizations
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🚀 Running migration: Optimize Database Indexes');

  // Create optimized indexes for activity_sessions table
  await knex.schema.alterTable('activity_sessions', (table) => {
    // Composite index for date-based queries (most common)
    table.index(['start_time', 'end_time'], 'idx_sessions_time_range');
    
    // Index for application-based queries
    table.index(['application_name', 'start_time'], 'idx_sessions_app_time');
    
    // Index for category analysis
    table.index(['category', 'start_time'], 'idx_sessions_category_time');
    
    // Index for productivity analysis
    table.index(['productivity_score', 'start_time'], 'idx_sessions_productivity_time');
    
    // Index for hostname filtering (multi-device support)
    table.index(['hostname', 'start_time'], 'idx_sessions_host_time');
    
    // Index for active sessions lookup
    table.index(['is_active', 'start_time'], 'idx_sessions_active');
    
    // Index for duration-based queries
    table.index(['duration_seconds'], 'idx_sessions_duration');
    
    // Composite index for analytics (category + productivity + time)
    table.index(['category', 'productivity_score', 'start_time'], 'idx_sessions_analytics');
  });

  // Create table for query performance monitoring
  await knex.schema.createTable('query_performance', (table) => {
    table.increments('id').primary();
    table.string('query_type', 100).notNullable();
    table.text('query_hash');
    table.integer('execution_time_ms').notNullable();
    table.integer('rows_affected').defaultTo(0);
    table.json('query_params');
    table.timestamp('executed_at').defaultTo(knex.fn.now());
    
    // Indexes for performance monitoring
    table.index(['query_type', 'executed_at'], 'idx_perf_type_time');
    table.index(['execution_time_ms'], 'idx_perf_exec_time');
    table.index(['executed_at'], 'idx_perf_executed_at');
  });

  // Create table for database statistics
  await knex.schema.createTable('db_statistics', (table) => {
    table.increments('id').primary();
    table.string('stat_name', 100).notNullable();
    table.json('stat_value').notNullable();
    table.timestamp('recorded_at').defaultTo(knex.fn.now());
    table.string('stat_type', 50).defaultTo('counter'); // counter, gauge, histogram
    
    table.index(['stat_name', 'recorded_at'], 'idx_stats_name_time');
    table.index(['stat_type'], 'idx_stats_type');
    table.index(['recorded_at'], 'idx_stats_recorded_at');
  });

  // Create materialized view for daily summaries (PostgreSQL style, adapted for SQLite)
  await knex.schema.createTable('daily_summaries', (table) => {
    table.increments('id').primary();
    table.date('summary_date').notNullable();
    table.string('hostname', 255).notNullable();
    table.string('category', 100).notNullable();
    table.integer('total_duration_seconds').defaultTo(0);
    table.integer('session_count').defaultTo(0);
    table.decimal('avg_productivity_score', 5, 4).defaultTo(0);
    table.decimal('total_productivity_time', 10, 2).defaultTo(0);
    table.json('top_applications'); // JSON array of top apps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint for summary uniqueness
    table.unique(['summary_date', 'hostname', 'category'], 'uq_daily_summary');
    
    // Indexes for fast queries
    table.index(['summary_date'], 'idx_daily_summary_date');
    table.index(['hostname', 'summary_date'], 'idx_daily_summary_host_date');
    table.index(['category', 'summary_date'], 'idx_daily_summary_cat_date');
    table.index(['total_duration_seconds'], 'idx_daily_summary_duration');
  });

  console.log('✅ Database indexes optimized successfully');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Rolling back: Optimize Database Indexes');

  // Drop the new tables
  await knex.schema.dropTableIfExists('daily_summaries');
  await knex.schema.dropTableIfExists('db_statistics');
  await knex.schema.dropTableIfExists('query_performance');

  // Drop indexes from activity_sessions
  await knex.schema.alterTable('activity_sessions', (table) => {
    table.dropIndex([], 'idx_sessions_time_range');
    table.dropIndex([], 'idx_sessions_app_time');
    table.dropIndex([], 'idx_sessions_category_time');
    table.dropIndex([], 'idx_sessions_productivity_time');
    table.dropIndex([], 'idx_sessions_host_time');
    table.dropIndex([], 'idx_sessions_active');
    table.dropIndex([], 'idx_sessions_duration');
    table.dropIndex([], 'idx_sessions_analytics');
  });

  console.log('✅ Database optimization rollback completed');
}