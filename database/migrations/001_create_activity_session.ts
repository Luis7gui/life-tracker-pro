/**
 * Life Tracker Pro - Activity Sessions Migration
 * Creates the core activity_sessions table with proper indexing
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('activity_sessions', (table) => {
    // Primary key
    table.increments('id').primary();
    
    // Time tracking
    table.timestamp('start_time', { useTz: true }).notNullable().index();
    table.timestamp('end_time', { useTz: true }).nullable().index();
    table.integer('duration_seconds').nullable();
    
    // Application details
    table.string('application_name', 255).notNullable().index();
    table.text('application_path').nullable();
    
    // Window details (privacy-aware)
    table.text('window_title').nullable();
    table.string('window_title_hash', 64).nullable().index();
    
    // Activity classification
    table.string('category', 100).nullable().index();
    table.decimal('productivity_score', 3, 2).nullable(); // 0.00 to 1.00
    
    // Metadata
    table.boolean('is_idle').defaultTo(false).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable().index();
    
    // System info
    table.string('hostname', 255).nullable();
    table.string('os_name', 50).nullable();
    
    // Timestamps
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    
    // Composite indexes for common queries
    table.index(['application_name', 'start_time'], 'idx_app_time');
    table.index(['start_time', 'end_time'], 'idx_date_range');
    table.index(['category', 'start_time'], 'idx_category_time');
    table.index(['productivity_score', 'start_time'], 'idx_productivity');
    table.index(['is_active', 'end_time'], 'idx_active_sessions');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('activity_sessions');
}