/**
 * Feature Configuration for Life Tracker Pro
 * Control which features are enabled/disabled
 */

export const FEATURES = {
  // Basic features (always enabled)
  tracking: true,
  goals: true,
  reports: true,
  pomodoro: true,
  notifications: true,
  
  // Advanced features (disabled for v1.0)
  gamification: false,
  ai: false,
  analytics: false,
  database_monitor: false,
  category_manager: false,
  chronicles: false,
  export_center: false,
  
  // Settings
  simple_mode: true,
  
  // Theme
  dark_mode: false
};

export const APP_CONFIG = {
  version: '1.0.0',
  name: 'Life Tracker - Simple',
  description: 'Versão simplificada para uso pessoal',
  
  // Default goals (in minutes)
  default_goals: {
    work: 240,      // 4 hours
    study: 120,     // 2 hours
    exercise: 60,   // 1 hour
    personal: 90,   // 1.5 hours
    entertainment: 120  // 2 hours
  },
  
  // Notification settings
  notifications: {
    goal_completion: true,
    pomodoro_completion: true,
    session_reminders: false
  }
};