/**
 * Life Tracker Pro - Chronicles Component
 * Gamified achievements and progress tracking with earthen theme
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Trophy, 
  Flame, 
  Star,
  Zap,
  Crown,
  Target,
  Clock,
  Sparkles,
  Check,
  Lock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedDate?: string;
}

interface StreakData {
  current: number;
  record: number;
  type: string;
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasActivity: boolean;
  activityLevel: 'none' | 'low' | 'medium' | 'high' | 'legendary';
  sessionCount: number;
  totalMinutes: number;
}

interface ChroniclesProps {
  productivityData?: { [key: string]: { sessions: number; minutes: number; productivity: number } };
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const ACTIVITY_LEVELS = {
  none: { color: 'var(--color-surface)', glow: 'none' },
  low: { color: 'rgba(255, 159, 10, 0.2)', glow: 'rgba(255, 159, 10, 0.3)' },
  medium: { color: 'rgba(255, 159, 10, 0.4)', glow: 'rgba(255, 159, 10, 0.5)' },
  high: { color: 'rgba(255, 159, 10, 0.6)', glow: 'rgba(255, 159, 10, 0.7)' },
  legendary: { color: 'var(--color-accent-primary)', glow: 'rgba(255, 159, 10, 0.8)' }
};

export default function Chronicles({ 
  productivityData = {},
  className = '' 
}: ChroniclesProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock achievements data - replace with real data
  const achievements: Achievement[] = [
    {
      id: 'first_week',
      title: 'First week of enlightenment',
      description: 'Complete your first week of consistent tracking',
      icon: Trophy,
      unlocked: true,
      unlockedDate: '2025-08-08'
    },
    {
      id: 'spiritual_awakening',
      title: 'Streak of spiritual awakening',
      description: 'Maintain a 7-day productivity streak',
      icon: Zap,
      unlocked: true,
      unlockedDate: '2025-08-12'
    },
    {
      id: 'perfect_harmony',
      title: 'Perfect harmony achieved',
      description: 'Reach 95% productivity score in a single day',
      icon: Sparkles,
      unlocked: true,
      unlockedDate: '2025-08-15'
    },
    {
      id: 'time_master',
      title: 'Master of Time',
      description: 'Log 8+ hours of productive work in one day',
      icon: Clock,
      unlocked: false,
      progress: 6,
      maxProgress: 8
    },
    {
      id: 'focus_legend',
      title: 'Legend of Focus',
      description: 'Complete 10 sessions in a single day',
      icon: Target,
      unlocked: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: 'monthly_champion',
      title: 'Monthly Champion',
      description: 'Achieve 30-day streak',
      icon: Crown,
      unlocked: false,
      progress: 12,
      maxProgress: 30
    }
  ];

  // Calculate current streak
  const currentStreak: StreakData = useMemo(() => {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check backwards from today
    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      const dayData = productivityData[dateKey];
      
      if (dayData && dayData.sessions > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return {
      current: streak,
      record: 25, // Mock record
      type: 'mystical achievements'
    };
  }, [productivityData]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(firstDayOfCalendar);
      date.setDate(date.getDate() + i);
      
      const dateKey = date.toISOString().split('T')[0];
      const dayData = productivityData[dateKey] || { sessions: 0, minutes: 0, productivity: 0 };
      
      let activityLevel: CalendarDay['activityLevel'] = 'none';
      if (dayData.minutes > 0) {
        if (dayData.productivity >= 90) activityLevel = 'legendary';
        else if (dayData.productivity >= 75) activityLevel = 'high';
        else if (dayData.productivity >= 50) activityLevel = 'medium';
        else activityLevel = 'low';
      }
      
      days.push({
        date: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        hasActivity: dayData.sessions > 0,
        activityLevel,
        sessionCount: dayData.sessions,
        totalMinutes: dayData.minutes
      });
    }
    
    return days;
  }, [currentDate, productivityData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Current Streak Section */}
      <div className="glass-card p-8 text-center animate-scale-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Flame className="h-8 w-8 text-accent-primary" />
          <div>
            <h2 className="heading-2">Current Streak</h2>
            <p className="body-medium text-2">Consecutive days of {currentStreak.type}</p>
          </div>
        </div>
        
        <div className="py-8">
          <div className="relative inline-block">
            <div className="heading-display text-gradient mb-4">
              {currentStreak.current}
              <Flame className="inline-block ml-4 h-16 w-16 text-accent-secondary" />
            </div>
          </div>
          <div className="body-large text-2 mb-6">days of progress</div>
          <div className="surface-1 px-6 py-3 rounded-full border border-glass-border inline-block">
            <span className="body-medium text-1">Record: {currentStreak.record} days</span>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-4 mb-8">
          <Trophy className="h-8 w-8 text-accent-secondary" />
          <div>
            <h2 className="heading-2">Achievements</h2>
            <p className="body-medium text-2">Milestones and accomplishments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`${achievement.unlocked ? 'filter-none' : 'grayscale opacity-50'}`}>
                  <achievement.icon 
                    className="h-7 w-7" 
                    style={{ color: achievement.unlocked ? 'var(--color-accent-primary)' : 'var(--color-text-quaternary)' }} 
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`body-large font-semibold mb-2 ${
                    achievement.unlocked ? 'text-1' : 'text-4'
                  }`}>
                    {achievement.title}
                  </h3>
                  <p className={`body-small mb-3 ${
                    achievement.unlocked ? 'text-2' : 'text-4'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-2 caption text-success">
                      <Check className="h-4 w-4" />
                      Unlocked {achievement.unlockedDate}
                    </div>
                  ) : achievement.progress !== undefined ? (
                    <div className="space-y-2">
                      <div className="flex justify-between caption text-3">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="progress-container">
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${(achievement.progress! / achievement.maxProgress!) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 caption text-4">
                      <Lock className="h-4 w-4" />
                      Locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Calendar Section */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-accent-tertiary" />
            <div>
              <h2 className="heading-2">Activity Calendar</h2>
              <p className="body-medium text-2">Visualize your productivity journey</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateMonth('prev')}
              className="modern-button-secondary w-10 h-10 p-0 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="heading-3 min-w-[160px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="modern-button-secondary w-10 h-10 p-0 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="calendar-grid mb-4">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center p-3">
              <span className="caption text-2">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid mb-6">
          {calendarDays.map((day, index) => {
            const levelStyle = ACTIVITY_LEVELS[day.activityLevel];
            
            return (
              <div
                key={index}
                className={`
                  calendar-day
                  ${day.isToday ? 'today' : ''}
                  ${day.hasActivity ? 'has-activity' : ''}
                  ${!day.isCurrentMonth ? 'opacity-40' : ''}
                `}
                style={{
                  backgroundColor: levelStyle.color,
                  boxShadow: day.activityLevel !== 'none' 
                    ? `0 0 8px ${levelStyle.glow}, inset 0 0 8px ${levelStyle.glow}` 
                    : 'none'
                }}
                title={`${day.date}${day.hasActivity ? ` • ${formatTime(day.totalMinutes)} • ${day.sessionCount} sessions` : ''}`}
              >
                {/* Date Number */}
                <span className={`mono font-semibold ${
                  day.isToday ? 'text-white' : 
                  day.activityLevel === 'none' ? 'text-4' : 'text-1'
                }`}>
                  {day.date}
                </span>

                {/* Activity Indicator */}
                {day.sessionCount > 0 && (
                  <>
                    <span className="absolute bottom-1 right-1 caption text-1 opacity-80">
                      {day.sessionCount}
                    </span>
                    {day.activityLevel === 'legendary' && (
                      <Star className="absolute -top-1 -right-1 h-3 w-3 text-warning" />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Calendar Stats */}
        <div className="grid grid-cols-3 gap-6 text-center pt-6 border-t border-glass-border">
          <div>
            <div className="heading-2 mono text-accent-primary">
              {Object.values(productivityData).filter(d => d.sessions > 0).length}
            </div>
            <div className="caption">Active Days</div>
          </div>
          <div>
            <div className="heading-2 mono text-accent-secondary">
              {Object.values(productivityData).reduce((sum, d) => sum + d.sessions, 0)}
            </div>
            <div className="caption">Total Sessions</div>
          </div>
          <div>
            <div className="heading-2 mono text-accent-tertiary">
              {formatTime(Object.values(productivityData).reduce((sum, d) => sum + d.minutes, 0))}
            </div>
            <div className="caption">Total Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}