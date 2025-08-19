/**
 * Script to create gamification tables
 * Run with: npx ts-node --project tsconfig.server.json scripts/create-gamification-tables.ts
 */

import { DatabaseManager } from '../server/services/DatabaseManager';

async function createGamificationTables() {
  console.log('🎮 Creating gamification tables...');
  
  const dbManager = DatabaseManager.getInstance();
  await dbManager.initialize();
  
  const knex = dbManager.getKnex();
  
  try {
    // User Gamification Profile Table
    console.log('📊 Creating user_gamification table...');
    await knex.schema.createTableIfNotExists('user_gamification', (table) => {
      table.increments('id').primary();
      table.string('user_id', 100).notNullable().unique().index();
      
      // Level & XP System
      table.integer('total_xp').defaultTo(0).notNullable();
      table.integer('current_level').defaultTo(1).notNullable();
      table.integer('prestige_level').defaultTo(0).notNullable();
      
      // Preferences
      table.boolean('enable_notifications').defaultTo(true);
      table.boolean('enable_celebrations').defaultTo(true);
      table.boolean('enable_sounds').defaultTo(true);
      table.string('privacy_level', 20).defaultTo('private');
      table.boolean('auto_streak_freeze').defaultTo(false);
      
      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('last_activity').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index(['total_xp', 'current_level'], 'idx_user_level');
      table.index('last_activity', 'idx_last_activity');
    });

    // User Achievements Table
    console.log('🏆 Creating user_achievements table...');
    await knex.schema.createTableIfNotExists('user_achievements', (table) => {
      table.increments('id').primary();
      table.string('user_id', 100).notNullable().index();
      table.string('achievement_id', 100).notNullable();
      
      // Progress tracking
      table.integer('current_value').defaultTo(0);
      table.integer('target_value').notNullable();
      table.decimal('progress_percentage', 5, 2).defaultTo(0);
      table.boolean('is_unlocked').defaultTo(false).notNullable();
      table.integer('repetition_count').defaultTo(0);
      
      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('unlocked_at').nullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      // Constraints and indexes
      table.unique(['user_id', 'achievement_id'], 'unique_user_achievement');
      table.index(['user_id', 'is_unlocked'], 'idx_user_unlocked');
      table.index(['achievement_id', 'is_unlocked'], 'idx_achievement_progress');
    });

    // User Streaks Table
    console.log('🔥 Creating user_streaks table...');
    await knex.schema.createTableIfNotExists('user_streaks', (table) => {
      table.increments('id').primary();
      table.string('streak_id', 150).notNullable().unique();
      table.string('user_id', 100).notNullable().index();
      
      // Streak configuration
      table.string('type', 50).notNullable(); // daily_general, productivity, daily_category, etc.
      table.string('category', 100).nullable(); // For category-specific streaks
      table.text('custom_config').nullable(); // For custom streak configurations (JSON)
      
      // Streak data
      table.integer('current_count').defaultTo(0).notNullable();
      table.integer('max_count').defaultTo(0).notNullable();
      table.boolean('is_active').defaultTo(true).notNullable();
      
      // Freeze system
      table.integer('freeze_used').defaultTo(0).notNullable();
      table.integer('max_freezes').defaultTo(2).notNullable();
      
      // Dates
      table.timestamp('start_date').notNullable();
      table.timestamp('last_active_date').notNullable();
      table.timestamp('end_date').nullable(); // When streak was broken
      
      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index(['user_id', 'is_active'], 'idx_user_active_streaks');
      table.index(['type', 'user_id'], 'idx_streak_type');
      table.index(['current_count', 'is_active'], 'idx_streak_leaderboard');
      table.index('last_active_date', 'idx_last_active');
    });

    // User Badges Table
    console.log('🎖️ Creating user_badges table...');
    await knex.schema.createTableIfNotExists('user_badges', (table) => {
      table.increments('id').primary();
      table.string('user_id', 100).notNullable().index();
      table.string('badge_id', 100).notNullable();
      
      // Badge metadata
      table.string('category', 50).notNullable();
      table.string('rarity', 20).notNullable(); // common, uncommon, rare, epic, legendary
      table.integer('xp_earned').defaultTo(0);
      
      // Context of earning
      table.string('earned_from_achievement', 100).nullable();
      table.string('earned_from_streak', 150).nullable();
      table.text('earning_context').nullable(); // JSON
      
      // Timestamps
      table.timestamp('earned_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      
      // Constraints and indexes
      table.unique(['user_id', 'badge_id'], 'unique_user_badge');
      table.index(['user_id', 'category'], 'idx_user_badge_category');
      table.index(['rarity', 'earned_at'], 'idx_badge_rarity');
    });

    // XP History Table
    console.log('⚡ Creating xp_history table...');
    await knex.schema.createTableIfNotExists('xp_history', (table) => {
      table.increments('id').primary();
      table.string('user_id', 100).notNullable().index();
      
      // XP details
      table.integer('xp_amount').notNullable();
      table.string('source_type', 50).notNullable(); // achievement, streak, session, bonus
      table.string('source_id', 150).nullable();
      table.text('description').nullable();
      
      // Multipliers and bonuses
      table.decimal('base_multiplier', 3, 2).defaultTo(1.0);
      table.decimal('streak_multiplier', 3, 2).defaultTo(1.0);
      table.decimal('bonus_multiplier', 3, 2).defaultTo(1.0);
      table.decimal('final_multiplier', 3, 2).defaultTo(1.0);
      
      // Level tracking
      table.integer('level_before').notNullable();
      table.integer('level_after').notNullable();
      table.boolean('level_up_occurred').defaultTo(false);
      
      // Timestamps
      table.timestamp('earned_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index(['user_id', 'earned_at'], 'idx_user_xp_time');
      table.index(['source_type', 'source_id'], 'idx_xp_source');
      table.index(['level_up_occurred', 'earned_at'], 'idx_level_ups');
    });

    // Streak History Table
    console.log('📈 Creating streak_history table...');
    await knex.schema.createTableIfNotExists('streak_history', (table) => {
      table.increments('id').primary();
      table.string('user_id', 100).notNullable().index();
      table.string('streak_id', 150).notNullable();
      
      // Streak milestone data
      table.integer('milestone_count').notNullable();
      table.string('milestone_name', 100).nullable();
      table.integer('xp_reward').defaultTo(0);
      table.string('badge_earned', 100).nullable();
      
      // Context
      table.string('event_type', 20).notNullable(); // milestone, break, freeze_used, recovery
      table.text('event_data').nullable(); // JSON
      
      // Timestamps
      table.timestamp('event_date').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index(['user_id', 'event_date'], 'idx_user_streak_events');
      table.index(['streak_id', 'event_type'], 'idx_streak_events');
      table.index(['milestone_count', 'event_type'], 'idx_milestone_analysis');
    });

    console.log('✅ All gamification tables created successfully!');
    
    // Show table info
    const tables = await knex('sqlite_master')
      .select('name')
      .where('type', 'table')
      .whereIn('name', [
        'user_gamification',
        'user_achievements', 
        'user_streaks',
        'user_badges',
        'xp_history',
        'streak_history'
      ]);
    
    console.log('📋 Created tables:', tables.map(t => t.name).join(', '));
    
  } catch (error) {
    console.error('❌ Error creating gamification tables:', error);
    throw error;
  } finally {
    await dbManager.close();
  }
}

// Run the script
createGamificationTables()
  .then(() => {
    console.log('🎮 Gamification database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to setup gamification database:', error);
    process.exit(1);
  });