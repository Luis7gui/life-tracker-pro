import React from 'react';
import { Briefcase, BookOpen, Dumbbell, User, Gamepad2, Clock, Target } from 'lucide-react';

interface ActivityData {
  id: string;
  name: string;
  icon: React.ElementType;
  timeToday: string;
  percentage: number;
  status: 'ACTIVE' | 'IDLE' | 'COMPLETE';
  goal: string;
}

interface ActivityTrackerProps {
  dailyGoals: any[];
  isTracking: boolean;
  sessionDuration: number;
  onStartTracking: () => void;
  onStopTracking: () => void;
  formatDuration: (seconds: number) => string;
  dashboardData?: any;
}

export function ActivityTracker({ 
  dailyGoals, 
  isTracking, 
  sessionDuration, 
  onStartTracking, 
  onStopTracking, 
  formatDuration,
  dashboardData 
}: ActivityTrackerProps) {
  // Map dailyGoals to ActivityData format
  const activities: ActivityData[] = dailyGoals.map((goal) => {
    const icons = {
      work: Briefcase,
      study: BookOpen,
      exercise: Dumbbell,
      personal: User,
      entertainment: Gamepad2
    };

    const percentage = Math.min((goal.currentMinutes / goal.targetMinutes) * 100, 100);
    const hours = Math.floor(goal.currentMinutes / 60);
    const minutes = goal.currentMinutes % 60;
    const goalHours = Math.floor(goal.targetMinutes / 60);
    const goalMinutes = goal.targetMinutes % 60;

    return {
      id: goal.category,
      name: goal.category.toUpperCase(),
      icon: icons[goal.category as keyof typeof icons] || Briefcase,
      timeToday: `${hours}h ${minutes}m`,
      percentage: Math.round(percentage),
      status: goal.completed ? 'COMPLETE' : (isTracking && goal.category === 'work' ? 'ACTIVE' : 'IDLE'),
      goal: `${goalHours}h ${goalMinutes}m`
    };
  });

  const totalMinutes = dailyGoals.reduce((sum, goal) => sum + goal.currentMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const totalTime = `${totalHours}h ${totalMins}m`;
  const completedGoals = activities.filter(a => a.status === 'COMPLETE').length;

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 cyber-interface overflow-y-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-700 p-6 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="font-mono text-xl font-bold terminal-text mb-2 not-italic no-underline text-[24px]">
              SYSTEM STATUS: &gt;&gt; TRACKING HUMAN ACTIVITY
            </h1>
            <p className="font-mono text-sm text-gray-400 leading-relaxed">
              &gt; Monitoring work activity patterns. Neural interface active.<br/>
              &gt; Time tracking algorithm: running in background.
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-gray-400 mb-3">STATUS: {isTracking ? 'ACTIVE' : 'STANDBY'}</div>
            <button 
              className="cyber-button text-xs"
              onClick={isTracking ? onStopTracking : onStartTracking}
            >
              <span className="flex items-center gap-2">
                <div className={`w-2 h-2 ${isTracking ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                {isTracking ? 'HALT TRACKING' : 'INIT TRACKING'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-blue-400" />
              <div className="text-xs font-mono text-gray-400">TODAY</div>
            </div>
            <div className="data-value text-3xl mb-1">{totalTime}</div>
            <div className="text-sm text-gray-400 font-mono">TOTAL TIME</div>
          </div>
          
          <div className="cyber-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-green-400" />
              <div className="text-xs font-mono text-gray-400">GOALS</div>
            </div>
            <div className="data-value text-3xl mb-1 text-green-400">{completedGoals}/{activities.length}</div>
            <div className="text-sm text-gray-400 font-mono">COMPLETED</div>
          </div>

          <div className="cyber-card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className={`w-3 h-3 ${isTracking ? 'bg-red-500' : 'bg-gray-500'} rounded-full animate-pulse`}></div>
              </div>
              <div className="text-xs font-mono text-gray-400">STATUS</div>
            </div>
            <div className={`data-value text-3xl mb-1 ${isTracking ? 'text-red-400 glitch-text' : 'text-gray-400'}`}>
              {isTracking ? 'ACTIVE' : 'STANDBY'}
            </div>
            <div className="text-sm text-gray-400 font-mono">
              {isTracking ? 'MONITORING' : 'INACTIVE'}
            </div>
            {isTracking && (
              <div className="text-xs font-mono text-red-400 mt-2">
                {formatDuration(sessionDuration)}
              </div>
            )}
          </div>
        </div>

        {/* Activity Grid */}
        <div className="space-y-4">
          <h2 className="font-mono text-lg font-bold text-gray-200 mb-4">ACTIVITY BREAKDOWN</h2>
          
          {activities.map((activity) => {
            const Icon = activity.icon;
            
            return (
              <div key={activity.id} className="cyber-card p-6 scanlines">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 border-2 border-gray-600 flex items-center justify-center bg-gray-800 rounded-sm">
                      <Icon className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-lg text-gray-200">{activity.name}</div>
                      <div className={`text-sm font-mono font-bold ${
                        activity.status === 'ACTIVE' ? 'status-active glitch-text' :
                        activity.status === 'COMPLETE' ? 'status-complete' :
                        'status-idle'
                      }`}>
                        {activity.status === 'ACTIVE' ? '●●● RUNNING' :
                         activity.status === 'COMPLETE' ? '✓ COMPLETE' :
                         '○ STANDBY'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="data-value text-2xl text-gray-200">{activity.timeToday}</div>
                    <div className="text-sm text-gray-400 font-mono">of {activity.goal}</div>
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="space-y-2">
                  <div className="status-bar">
                    <div 
                      className="status-fill" 
                      style={{ width: `${Math.min(activity.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400 font-mono">
                      {activity.percentage}% of daily target
                    </div>
                    {activity.percentage >= 100 && (
                      <div className="text-sm font-mono font-bold text-green-400">
                        GOAL ACHIEVED!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Bottom Status Bar */}
      <div className="border-t-2 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div className="font-mono text-sm terminal-text">
            LIFE TRACKER - NEURAL INTERFACE v2.1.0
          </div>
          <div className="flex space-x-6">
            <div className="font-mono text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-400">ALERT: {isTracking ? '95' : '0'}</span>
            </div>
            <div className="font-mono text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-400">NERVOUS: 10</span>
            </div>
            <div className="font-mono text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span className="text-gray-400">STABLE: 50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}