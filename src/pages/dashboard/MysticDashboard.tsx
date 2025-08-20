/**
 * Life Tracker Pro - OVERLOAD Dashboard
 * Advanced cyberpunk dashboard with OVERLOAD aesthetic
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchDashboardData, 
  startTracking, 
  stopTracking,
  fetchWeeklySummary,
  fetchCategoryStats 
} from '../../store/slices/activitySlice';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  Clock, 
  Target, 
  BarChart3,
  ArrowUp,
  Briefcase,
  BookOpen,
  User,
  Palette,
  TrendingUp,
  Scroll,
  Monitor,
  Check,
  Flame,
  RotateCcw,
  Eye,
  Moon,
  Settings,
  Database,
  Brain,
  Activity as ActivityIcon,
  Trophy,
  Zap
} from 'lucide-react';
import ProductivityChart from '../../components/charts/ProductivityChart';
import CategoryBreakdown from '../../components/charts/CategoryBreakdown';
import WeeklyTrends from '../../components/analytics/WeeklyTrends';
import Chronicles from '../../components/chronicles/Chronicles';
import { useNotifications } from '../../hooks/useNotifications';
import BackendConnectionTest from '../../components/BackendConnectionTest';
import { showErrorToast, handleApiError } from '../../utils/errorHandling';
import MonitorControls from '../../components/monitor/MonitorControls';
import CategoryManager from '../../components/categories/CategoryManager';
import DatabaseMonitor from '../../components/database/DatabaseMonitor';
import ProductivityInsights from '../../components/ai/ProductivityInsights';
import AIInsights from '../../components/ai/AIInsights';
import AIStatus from '../../components/ai/AIStatus';
import { aiService } from '../../services/api/AIService';
import AnalyticsReports from '../../components/analytics/reports/AnalyticsReports';
import TimelineChart from '../../components/analytics/charts/TimelineChart';
import HeatmapChart from '../../components/analytics/charts/HeatmapChart';
import ComparisonChart from '../../components/analytics/charts/ComparisonChart';
import ExportCenter from '../../components/analytics/ExportCenter';
import GamificationProfile from '../../components/gamification/GamificationProfile';
import AchievementsPanel from '../../components/gamification/AchievementsPanel';
import StreaksPanel from '../../components/gamification/StreaksPanel';
import NotificationsCenter from '../../components/gamification/NotificationsCenter';
import PomodoroTimer from '../../components/timer/PomodoroTimer';

// OVERLOAD Categories
const categories = [
  { 
    value: 'work', 
    label: 'Work', 
    symbol: Briefcase, 
    tarotCard: 'The Magician',
    icon: Briefcase, 
    color: 'bg-amber-700', 
    chartColor: '#9d4edd',
    mysticalColor: 'from-amber-700 to-yellow-800'
  },
  { 
    value: 'study', 
    label: 'Study', 
    symbol: BookOpen, 
    tarotCard: 'The Hermit',
    icon: BookOpen, 
    color: 'bg-emerald-600', 
    chartColor: '#00f5ff',
    mysticalColor: 'from-orange-600 to-amber-700'
  },
  { 
    value: 'exercise', 
    label: 'Exercise', 
    symbol: Activity, 
    tarotCard: 'Strength',
    icon: Activity, 
    color: 'bg-orange-600', 
    chartColor: '#ff006e',
    mysticalColor: 'from-amber-600 to-orange-700'
  },
  { 
    value: 'personal', 
    label: 'Personal', 
    symbol: User, 
    tarotCard: 'The Moon',
    icon: User, 
    color: 'bg-indigo-600', 
    chartColor: '#7209b7',
    mysticalColor: 'from-yellow-700 to-amber-800'
  },
  { 
    value: 'creative', 
    label: 'Creative', 
    symbol: Palette, 
    tarotCard: 'The Star',
    icon: Palette, 
    color: 'bg-orange-700', 
    chartColor: '#39ff14',
    mysticalColor: 'from-green-400 to-emerald-500'
  }
];

interface DailyGoal {
  category: string;
  targetMinutes: number;
  currentMinutes: number;
  completed: boolean;
}

export default function MysticDashboard() {
  const dispatch = useAppDispatch();
  const { 
    dashboardData, 
    loading
  } = useAppSelector(state => state.activity);

  // Notifications hook
  const { success } = useNotifications();

  // Local state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [dailyGoals] = useState<DailyGoal[]>([
    { category: 'work', targetMinutes: 240, currentMinutes: 185, completed: false },
    { category: 'study', targetMinutes: 120, currentMinutes: 95, completed: false },
    { category: 'exercise', targetMinutes: 90, currentMinutes: 20, completed: false },
    { category: 'personal', targetMinutes: 60, currentMinutes: 15, completed: false },
    { category: 'creative', targetMinutes: 60, currentMinutes: 30, completed: false }
  ]);

  // Enhanced dashboard data with v0.3+ features
  const [enhancedData, setEnhancedData] = useState<any>(null);
  
  // AI Integration state
  const [showAIFeatures, setShowAIFeatures] = useState(true);

  // Load initial data
  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchWeeklySummary());
    dispatch(fetchCategoryStats());
    
    // Load enhanced v0.3+ data
    loadEnhancedData();
  }, [dispatch]);


  const loadEnhancedData = async () => {
    try {
      // Use the enhanced ActivityService methods
      const [dashboardData] = await Promise.all([
        import('../../services/api/ActivityService').then(service => 
          service.ActivityService.getDashboardData()
        )
      ]);
      
      setEnhancedData(dashboardData);
    } catch (error) {
      console.error('Failed to load enhanced dashboard data:', error);
    }
  };

  const handleStartTracking = async () => {
    try {
      // Start automatic tracking without requiring category or description
      await dispatch(startTracking()).unwrap();
      
      setIsTracking(true);
      setSessionDuration(0);
      
      success('Tracking Iniciado!', 'Sistema de rastreamento automático ativado');
      
    } catch (error: any) {
      showErrorToast('Falha ao Iniciar', handleApiError(error));
    }
  };

  const handleStopTracking = async () => {
    try {
      const result = await dispatch(stopTracking()).unwrap();
      setIsTracking(false);
      setSessionDuration(0);
      
      if (result) {
        const duration = formatDuration(result.duration);
        success('OVERLOAD Complete!', `Neural session concluded after ${duration}`);
        
        // Let AI learn from this session
        if (showAIFeatures && result) {
          try {
            await aiService.learnFromSession({
              id: result.id || Date.now(),
              activity: result.activity || 'Unknown Activity',
              category: result.category || 'personal',
              startTime: result.startTime || new Date().toISOString(),
              endTime: result.endTime || new Date().toISOString(),
              duration: result.duration || 0,
              productivity: result.productivity || 75,
              isActive: false
            });
          } catch (aiError) {
            console.error('Failed to teach AI from session:', aiError);
          }
        }
      }
      
      dispatch(fetchDashboardData());
    } catch (error: any) {
      showErrorToast('Stop Failed', handleApiError(error));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardData()).unwrap(),
        dispatch(fetchWeeklySummary()).unwrap(),
        dispatch(fetchCategoryStats()).unwrap(),
        loadEnhancedData() // Refresh enhanced v0.3+ data
      ]);
      success('Matrix Synced', 'Neural data updated successfully');
    } catch (error: any) {
      showErrorToast('Sync Failed', handleApiError(error));
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getCategoryInfo = useCallback((categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  }, []);

  // Enhanced stats calculation with v0.3+ data
  const stats = useMemo(() => {
    const baseStats = {
      totalTime: dashboardData?.todaySummary?.totalActiveTime 
        ? formatDuration(dashboardData.todaySummary.totalActiveTime) 
        : '0m',
      productivity: dashboardData?.todaySummary?.productivityScore || 0,
      sessionsToday: dashboardData?.recentSessions?.sessions.length || 0
    };

    // Enhanced stats from v0.3+ features
    if (enhancedData) {
      return {
        ...baseStats,
        totalTime: enhancedData.todaySummary?.totalActiveTime 
          ? formatDuration(enhancedData.todaySummary.totalActiveTime) 
          : baseStats.totalTime,
        productivity: enhancedData.todaySummary?.productivityScore || baseStats.productivity,
        sessionsToday: enhancedData.todayMonitorSessions?.data?.length || baseStats.sessionsToday,
        monitorStatus: enhancedData.monitorStatus?.isRunning ? 'Active' : 'Inactive',
        dbHealth: enhancedData.databaseHealth?.status || 'unknown',
        mlAccuracy: enhancedData.categoryStats?.machineLearning?.accuracy || 0
      };
    }

    return baseStats;
  }, [dashboardData, enhancedData]);

  // Loading state
  if (loading.dashboard && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="heading-2 text-gradient mb-2">Initializing</h2>
          <p className="body-medium text-2">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8 animate-fade-in">
      {/* Premium Apple-inspired Header */}
      <div className="glass-card p-8 text-center animate-fade-in">
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <h1 className="heading-display text-gradient">Life Tracker Pro</h1>
            <Flame className="h-10 w-10 text-accent-primary" />
          </div>
          
          <div className="status-indicator mx-auto">
            <span className={isTracking ? 'status-active' : 'status-inactive'}>
              {isTracking ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="flex justify-center gap-4">
            {!isTracking ? (
              <button 
                onClick={handleStartTracking} 
                className="modern-button modern-button-primary"
              >
                <Play className="h-5 w-5" />
                Iniciar Tracking Automático
              </button>
            ) : (
              <button 
                onClick={handleStopTracking} 
                className="modern-button modern-button-secondary"
              >
                <Square className="h-5 w-5" />
                Parar Tracking
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="modern-button modern-button-secondary"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync Data
            </button>
          </div>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card">
          <Clock className="h-8 w-8 mx-auto mb-3 text-accent-primary" />
          <div className="stats-value">{stats.totalTime}</div>
          <div className="stats-label">Total Time</div>
        </div>

        <div className="stats-card">
          <ArrowUp className="h-8 w-8 mx-auto mb-3 text-accent-secondary" />
          <div className="stats-value">{stats.productivity}%</div>
          <div className="stats-label">Efficiency</div>
        </div>

        <div className="stats-card">
          <Target className="h-8 w-8 mx-auto mb-3 text-accent-tertiary" />
          <div className="stats-value">{dailyGoals.filter(g => g.completed).length}/{dailyGoals.length}</div>
          <div className="stats-label">Goals</div>
        </div>

        <div className="stats-card">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 text-accent-quaternary" />
          <div className="stats-value">{stats.sessionsToday}</div>
          <div className="stats-label">Sessions</div>
        </div>
      </div>

      {/* Gamification Quick View */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h2 className="heading-3 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-accent-primary" />
            Gamification Status
          </h2>
        </div>
        <GamificationProfile userId="current-user" compact={true} />
      </div>

      {/* Active Session */}
      {isTracking && (
        <div className="glass-card p-6 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="heading-3 text-accent-primary">Active Session</h3>
                <p className="body-small">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="heading-2 mono">{formatDuration(sessionDuration)}</div>
              <div className="caption">Elapsed Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Pomodoro Timer */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="heading-3 flex items-center gap-3">
            <Clock className="h-6 w-6 text-accent-primary" />
            Timer Pomodoro
          </h2>
          <p className="caption text-3 mt-2">
            Use o timer Pomodoro para sessões de foco. O tracking automático funciona independentemente.
          </p>
        </div>
        <PomodoroTimer compact={false} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="modern-tabs">
          <TabsTrigger value="gamification" className="modern-tab">
            <Trophy className="h-4 w-4" />
            Gamification
          </TabsTrigger>
          <TabsTrigger value="ai" className="modern-tab">
            <Brain className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="monitor" className="modern-tab">
            <ActivityIcon className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="sessions" className="modern-tab">
            <Monitor className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="modern-tab">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="categories" className="modern-tab">
            <Target className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="database" className="modern-tab">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="goals" className="modern-tab">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="chronicles" className="modern-tab">
            <Scroll className="h-4 w-4" />
            Chronicles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gamification">
          <div className="space-y-6">
            {/* Gamification Dashboard - Nested Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="modern-tabs">
                <TabsTrigger value="profile" className="modern-tab">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="achievements" className="modern-tab">
                  <Trophy className="h-4 w-4" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="streaks" className="modern-tab">
                  <Flame className="h-4 w-4" />
                  Streaks
                </TabsTrigger>
                <TabsTrigger value="notifications" className="modern-tab">
                  <Zap className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <GamificationProfile userId="current-user" compact={false} />
              </TabsContent>

              <TabsContent value="achievements">
                <AchievementsPanel userId="current-user" />
              </TabsContent>

              <TabsContent value="streaks">
                <StreaksPanel userId="current-user" />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationsCenter />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-6">
            {/* AI Status and Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIStatus showDetails={true} />
              <ProductivityInsights 
                selectedCategory={'general'}
                onCategoryChange={() => {}}
              />
            </div>
            
            {/* AI Insights Full Width */}
            <AIInsights maxInsights={8} />
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <MonitorControls />
        </TabsContent>

        <TabsContent value="sessions">
          <div className="glass-card p-8">
            <div className="mb-6">
              <h2 className="heading-2 flex items-center gap-3">
                <Monitor className="h-6 w-6 text-accent-primary" />
                Sessions
              </h2>
            </div>
            <div className="text-center py-12">
              <Monitor className="h-16 w-16 mx-auto mb-6 text-4" />
              <h3 className="heading-3 mb-2">No Sessions Yet</h3>
              <p className="body-medium text-3">Start tracking to see your sessions appear here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-8">
            {/* Analytics Overview Header */}
            <div className="glass-card p-6">
              <div className="mb-6">
                <h2 className="heading-2 flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-accent-primary" />
                  Advanced Analytics
                </h2>
                <p className="caption text-3 mt-2">
                  Comprehensive productivity insights and data visualization
                </p>
              </div>
            </div>

            {/* Analytics Dashboard - Nested Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="modern-tabs">
                <TabsTrigger value="overview" className="modern-tab">
                  <TrendingUp className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="timeline" className="modern-tab">
                  <Clock className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="modern-tab">
                  <Target className="h-4 w-4" />
                  Heatmap
                </TabsTrigger>
                <TabsTrigger value="comparison" className="modern-tab">
                  <BarChart3 className="h-4 w-4" />
                  Comparison
                </TabsTrigger>
                <TabsTrigger value="reports" className="modern-tab">
                  <Scroll className="h-4 w-4" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="export" className="modern-tab">
                  <RefreshCw className="h-4 w-4" />
                  Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-card p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-accent-primary" />
                      <div className="heading-3 mono text-1">{stats.totalTime}</div>
                      <div className="caption text-3">Today's Time</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-accent-secondary" />
                      <div className="heading-3 mono text-1">{stats.productivity}%</div>
                      <div className="caption text-3">Productivity</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-accent-tertiary" />
                      <div className="heading-3 mono text-1">{stats.sessionsToday}</div>
                      <div className="caption text-3">Sessions</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-accent-quaternary" />
                      <div className="heading-3 mono text-1">
                        {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length}
                      </div>
                      <div className="caption text-3">Goals</div>
                    </div>
                  </div>

                  {/* Legacy Charts for Backward Compatibility */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                      <div className="mb-4">
                        <h3 className="heading-3 flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-accent-primary" />
                          Time of Day Analysis
                        </h3>
                      </div>
                      <ProductivityChart data={dashboardData?.timeOfDayAnalysis} />
                    </div>

                    <div className="glass-card p-6">
                      <div className="mb-4">
                        <h3 className="heading-3 flex items-center gap-3">
                          <Target className="h-5 w-5 text-accent-secondary" />
                          Category Breakdown
                        </h3>
                      </div>
                      <CategoryBreakdown 
                        data={categories.map(cat => ({
                          name: cat.label,
                          value: Math.random() * 120, // Mock data - replace with real data
                          color: cat.chartColor
                        }))}
                      />
                    </div>
                  </div>

                  {/* Weekly Trends */}
                  <div className="glass-card p-6">
                    <div className="mb-4">
                      <h3 className="heading-3 flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-accent-tertiary" />
                        Weekly Trends
                      </h3>
                    </div>
                    <WeeklyTrends />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <TimelineChart
                  metric="productivity"
                  interval="day"
                  height={400}
                  showPredictions={true}
                  showTrendLine={true}
                />
              </TabsContent>

              <TabsContent value="heatmap">
                <HeatmapChart
                  metric="productivity"
                  period="month"
                  height={400}
                />
              </TabsContent>

              <TabsContent value="comparison">
                <ComparisonChart
                  metric="productivity"
                  comparisonType="week"
                  height={400}
                  showPercentages={true}
                  showTrends={true}
                />
              </TabsContent>

              <TabsContent value="reports">
                <AnalyticsReports defaultReport="weekly" />
              </TabsContent>

              <TabsContent value="export">
                <ExportCenter />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseMonitor />
        </TabsContent>

        <TabsContent value="goals">
          <div className="glass-card p-6">
            <div className="mb-6">
              <h2 className="heading-2 flex items-center gap-3">
                <Target className="h-6 w-6 text-accent-primary" />
                Daily Goals
              </h2>
              <p className="caption text-3 mt-2">
                Defina quanto tempo por dia você quer dedicar a cada tipo de atividade. 
                O sistema de tracking automático irá categorizar suas atividades automaticamente.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyGoals.map((goal) => {
                const categoryInfo = getCategoryInfo(goal.category);
                const progress = Math.min((goal.currentMinutes / goal.targetMinutes) * 100, 100);
                
                return (
                  <div key={goal.category} className="glass-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {React.createElement(categoryInfo.symbol, { className: "h-5 w-5 text-accent-primary" })}
                        <span className="body-medium text-1">{categoryInfo.label}</span>
                      </div>
                      {goal.completed && <Check className="h-5 w-5 text-success" />}
                    </div>
                    
                    <div className="progress-container">
                      <div 
                        className="progress-fill" 
                        style={{width: `${progress}%`}}
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="heading-3 mono">{Math.floor(goal.currentMinutes)}m</div>
                      <div className="caption">of {goal.targetMinutes}m target</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chronicles">
          <Chronicles 
            productivityData={{
              // Mock data - replace with real data from dashboard
              '2025-08-15': { sessions: 5, minutes: 240, productivity: 85 },
              '2025-08-14': { sessions: 3, minutes: 180, productivity: 72 },
              '2025-08-13': { sessions: 7, minutes: 320, productivity: 92 },
              '2025-08-12': { sessions: 2, minutes: 120, productivity: 60 },
              '2025-08-11': { sessions: 4, minutes: 200, productivity: 78 },
              '2025-08-10': { sessions: 6, minutes: 280, productivity: 88 },
              '2025-08-09': { sessions: 3, minutes: 150, productivity: 65 },
              '2025-08-08': { sessions: 8, minutes: 360, productivity: 95 },
              '2025-08-07': { sessions: 4, minutes: 220, productivity: 80 },
              '2025-08-06': { sessions: 5, minutes: 250, productivity: 83 },
              '2025-08-05': { sessions: 2, minutes: 90, productivity: 55 },
              '2025-08-04': { sessions: 6, minutes: 300, productivity: 87 },
              '2025-08-03': { sessions: 3, minutes: 170, productivity: 70 }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* System Settings */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="heading-2 flex items-center gap-3">
            <Settings className="h-6 w-6 text-accent-primary" />
            Settings
          </h2>
        </div>
        <div className="space-y-4">
          <div className="surface-1 p-4 rounded-xl border border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="h-5 w-5 text-accent-primary" />
              <div>
                <p className="body-medium text-1">AI Assistant</p>
                <p className="caption text-3">Enable smart suggestions and auto-categorization</p>
              </div>
            </div>
            <Switch checked={showAIFeatures} onCheckedChange={setShowAIFeatures} />
          </div>
          
          <div className="surface-1 p-4 rounded-xl border border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RotateCcw className="h-5 w-5 text-accent-secondary" />
              <div>
                <p className="body-medium text-1">Auto Sync</p>
                <p className="caption text-3">Refresh data every 30 seconds</p>
              </div>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          
          <div className="surface-1 p-4 rounded-xl border border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Eye className="h-5 w-5 text-accent-secondary" />
              <div>
                <p className="body-medium text-1">Connection Status</p>
                <p className="caption text-3">Show connection test panel</p>
              </div>
            </div>
            <Switch checked={showConnectionTest} onCheckedChange={setShowConnectionTest} />
          </div>
          
          <div className="surface-1 p-4 rounded-xl border border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Moon className="h-5 w-5 text-accent-tertiary" />
              <div>
                <p className="body-medium text-1">Dark Mode</p>
                <p className="caption text-3">Toggle interface theme</p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
          </div>
        </div>
        
        {/* Connection Test */}
        {showConnectionTest && (
          <div className="mt-6 pt-6 border-t border-glass-border">
            <BackendConnectionTest />
          </div>
        )}
      </div>
    </div>
  );
}