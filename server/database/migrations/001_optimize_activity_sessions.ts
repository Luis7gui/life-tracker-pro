/**
 * Life Tracker Pro - Database Optimization Migration
 * Adds indexes and optimizations for better performance
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create the main activity_sessions table if it doesn't exist
  const hasTable = await knex.schema.hasTable('activity_sessions');
  
  if (!hasTable) {
    await knex.schema.createTable('activity_sessions', (table) => {
      table.increments('id').primary();
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time').nullable();
      table.integer('duration_seconds').nullable();
      table.string('application_name', 255).notNullable();
      table.string('application_path', 500).nullable();
      table.text('window_title').nullable();
      table.string('window_title_hash', 64).nullable();
      table.string('category', 50).nullable();
      table.decimal('productivity_score', 3, 2).nullable(); // 0.00 to 1.00
      table.boolean('is_idle').notNullable().defaultTo(false);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.string('hostname', 100).nullable();
      table.string('os_name', 50).nullable();
      table.timestamps(true, true);
    });
  }

  // Add performance indexes
  await knex.schema.alterTable('activity_sessions', (table) => {
    // Index for date-based queries (most common)
    table.index(['start_time'], 'idx_sessions_start_time');
    
    // Index for finding active sessions
    table.index(['is_active', 'end_time'], 'idx_sessions_active');
    
    // Index for category analytics
    table.index(['category', 'start_time'], 'idx_sessions_category_time');
    
    // Index for application analytics
    table.index(['application_name', 'start_time'], 'idx_sessions_app_time');
    
    // Index for productivity queries
    table.index(['productivity_score', 'start_time'], 'idx_sessions_productivity');
    
    // Composite index for daily queries
    table.index(['start_time', 'category', 'is_active'], 'idx_sessions_daily_queries');
  });

  // Create categories table for better normalization
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('color', 7).nullable(); // Hex color
    table.string('icon', 50).nullable();
    table.decimal('default_productivity_score', 3, 2).nullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  // Insert default categories
  await knex('categories').insert([
    {
      name: 'work',
      color: '#cc8844',
      icon: 'briefcase',
      default_productivity_score: 0.85,
      description: 'Work-related activities',
      is_active: true
    },
    {
      name: 'study', 
      color: '#cd853f',
      icon: 'book-open',
      default_productivity_score: 0.90,
      description: 'Learning and educational activities',
      is_active: true
    },
    {
      name: 'exercise',
      color: '#daa520',
      icon: 'activity',
      default_productivity_score: 0.95,
      description: 'Physical activities and fitness',
      is_active: true
    },
    {
      name: 'personal',
      color: '#b8860b',
      icon: 'user',
      default_productivity_score: 0.60,
      description: 'Personal tasks and activities',
      is_active: true
    },
    {
      name: 'creative',
      color: '#a0522d',
      icon: 'palette',
      default_productivity_score: 0.80,
      description: 'Creative and artistic work',
      is_active: true
    }
  ]);

  // Create application rules table for auto-categorization
  await knex.schema.createTable('application_rules', (table) => {
    table.increments('id').primary();
    table.string('application_name', 255).notNullable();
    table.string('window_title_pattern', 500).nullable();
    table.integer('category_id').unsigned().references('id').inTable('categories');
    table.decimal('productivity_score', 3, 2).nullable();
    table.integer('priority').notNullable().defaultTo(1); // Higher = more priority
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
    
    // Index for fast lookups
    table.index(['application_name', 'is_active'], 'idx_app_rules_lookup');
  });

  // Insert some default application rules
  await knex('application_rules').insert([
    {
      application_name: 'Code',
      category_id: 1, // work
      productivity_score: 0.95,
      priority: 10
    },
    {
      application_name: 'Visual Studio Code',
      category_id: 1, // work
      productivity_score: 0.95,
      priority: 10
    },
    {
      application_name: 'Chrome',
      window_title_pattern: '%github%',
      category_id: 1, // work
      productivity_score: 0.80,
      priority: 8
    },
    {
      application_name: 'Chrome',
      window_title_pattern: '%stackoverflow%',
      category_id: 2, // study
      productivity_score: 0.85,
      priority: 7
    },
    {
      application_name: 'Chrome',
      window_title_pattern: '%youtube%',
      category_id: 4, // personal
      productivity_score: 0.30,
      priority: 5
    },
    {
      application_name: 'Figma',
      category_id: 5, // creative
      productivity_score: 0.90,
      priority: 9
    }
  ]);

  // Create daily summaries table for caching
  await knex.schema.createTable('daily_summaries', (table) => {
    table.increments('id').primary();
    table.date('summary_date').notNullable().unique();
    table.integer('total_active_time').notNullable().defaultTo(0); // seconds
    table.decimal('average_productivity', 3, 2).notNullable().defaultTo(0);
    table.integer('session_count').notNullable().defaultTo(0);
    table.json('category_breakdown').nullable(); // JSON object with category totals
    table.json('hourly_breakdown').nullable(); // JSON array with 24 hourly totals
    table.timestamp('last_calculated').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Index for date queries
    table.index(['summary_date'], 'idx_daily_summaries_date');
  });

  console.log('Database optimization migration completed successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('daily_summaries');
  await knex.schema.dropTableIfExists('application_rules');
  await knex.schema.dropTableIfExists('categories');
  
  // Remove indexes from activity_sessions
  await knex.schema.alterTable('activity_sessions', (table) => {
    table.dropIndex([], 'idx_sessions_start_time');
    table.dropIndex([], 'idx_sessions_active');
    table.dropIndex([], 'idx_sessions_category_time');
    table.dropIndex([], 'idx_sessions_app_time');
    table.dropIndex([], 'idx_sessions_productivity');
    table.dropIndex([], 'idx_sessions_daily_queries');
  });
  
  console.log('Database optimization migration rolled back');
}