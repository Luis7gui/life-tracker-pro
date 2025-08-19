import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Calendar } from './components/ui/calendar';
import { toast } from 'sonner@2.0.3';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  Clock, 
  Target, 
  TrendingUp,
  Monitor,
  Briefcase,
  BookOpen,
  User,
  Palette,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  PieChart,
  CheckCircle,
  Settings2,
  Bell,
  Flame,
  Calendar as CalendarIcon,
  BarChart3,
  Trophy,
  Award,
  Zap,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  History,
  Sparkles,
  Star,
  Skull
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface ActivitySession {
  id: string;
  category: string;
  application: string;
  duration: number;
  startTime: Date;
  endTime?: Date;
  productivity: 'high' | 'medium' | 'low';
}

interface DayPeriodStats {
  period: string;
  emoji: string;
  hours: string;
  activities: number;
  productivity: number;
}

interface DailyGoal {
  category: string;
  targetMinutes: number;
  currentMinutes: number;
  completed: boolean;
}

interface WeeklyGoalHistory {
  week: string;
  goalsCompleted: number;
  totalGoals: number;
  completionRate: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string;
  streakDates: string[];
}

interface ProductivityReport {
  date: string;
  totalMinutes: number;
  productivity: number;
  goalsCompleted: number;
  categories: {
    [key: string]: number;
  };
}

// Mystic Tarot Categories with esoteric symbols
const categories = [
  { 
    value: 'work', 
    label: 'Work', 
    symbol: '⚜️', 
    tarotCard: 'The Magician',
    icon: Briefcase, 
    color: 'bg-purple-600', 
    chartColor: '#9d4edd',
    mysticalColor: 'from-purple-500 to-violet-600'
  },
  { 
    value: 'study', 
    label: 'Study', 
    symbol: '📜', 
    tarotCard: 'The Hermit',
    icon: BookOpen, 
    color: 'bg-emerald-600', 
    chartColor: '#00f5ff',
    mysticalColor: 'from-cyan-400 to-blue-500'
  },
  { 
    value: 'exercise', 
    label: 'Exercise', 
    symbol: '⚡', 
    tarotCard: 'Strength',
    icon: Activity, 
    color: 'bg-orange-600', 
    chartColor: '#ff006e',
    mysticalColor: 'from-pink-500 to-red-500'
  },
  { 
    value: 'personal', 
    label: 'Personal', 
    symbol: '🌙', 
    tarotCard: 'The Moon',
    icon: User, 
    color: 'bg-indigo-600', 
    chartColor: '#7209b7',
    mysticalColor: 'from-indigo-500 to-purple-600'
  },
  { 
    value: 'creative', 
    label: 'Creative', 
    symbol: '✨', 
    tarotCard: 'The Star',
    icon: Palette, 
    color: 'bg-pink-600', 
    chartColor: '#39ff14',
    mysticalColor: 'from-green-400 to-emerald-500'
  }
];

const dayPeriods: DayPeriodStats[] = [
  { period: 'Dawn', emoji: '🌅', hours: '06:00 - 12:00', activities: 12, productivity: 85 },
  { period: 'Zenith', emoji: '☀️', hours: '12:00 - 18:00', activities: 8, productivity: 72 },
  { period: 'Twilight', emoji: '🌙', hours: '18:00 - 00:00', activities: 5, productivity: 45 },
  { period: 'Void', emoji: '🕳️', hours: '00:00 - 06:00', activities: 2, productivity: 20 }
];

// ASCII Art for header
const asciiArt = `
    ╔══════════════════════════════╗
    ║     MYSTIC ACTIVITY CODEX    ║
    ╚══════════════════════════════╝
`;

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<ActivitySession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [showConnectionTest, setShowConnectionTest] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([
    { category: 'work', targetMinutes: 240, currentMinutes: 185, completed: false },
    { category: 'study', targetMinutes: 120, currentMinutes: 95, completed: false },
    { category: 'exercise', targetMinutes: 90, currentMinutes: 20, completed: false },
    { category: 'personal', targetMinutes: 60, currentMinutes: 15, completed: false },
    { category: 'creative', targetMinutes: 60, currentMinutes: 30, completed: false }
  ]);

  // Mock data para histórico de metas semanais
  const [weeklyHistory] = useState<WeeklyGoalHistory[]>([
    { week: 'Week I', goalsCompleted: 28, totalGoals: 35, completionRate: 80 },
    { week: 'Week II', goalsCompleted: 32, totalGoals: 35, completionRate: 91 },
    { week: 'Week III', goalsCompleted: 25, totalGoals: 35, completionRate: 71 },
    { week: 'Week IV', goalsCompleted: 35, totalGoals: 35, completionRate: 100 },
    { week: 'Week V', goalsCompleted: 30, totalGoals: 35, completionRate: 86 },
    { week: 'Week VI', goalsCompleted: 33, totalGoals: 35, completionRate: 94 },
    { week: 'Current', goalsCompleted: 18, totalGoals: 35, completionRate: 51 }
  ]);

  // Mock data para streaks
  const [streakData] = useState<StreakData>({
    currentStreak: 12,
    longestStreak: 25,
    lastStreakDate: '2024-08-12',
    streakDates: [
      '2024-08-01', '2024-08-02', '2024-08-03', '2024-08-05', '2024-08-06',
      '2024-08-07', '2024-08-08', '2024-08-09', '2024-08-10', '2024-08-11', '2024-08-12'
    ]
  });

  // Mock data para relatórios de produtividade
  const [productivityReports] = useState<ProductivityReport[]>([
    {
      date: '2024-08-05',
      totalMinutes: 420,
      productivity: 85,
      goalsCompleted: 4,
      categories: { work: 180, study: 120, exercise: 90, personal: 30 }
    },
    {
      date: '2024-08-06',
      totalMinutes: 390,
      productivity: 78,
      goalsCompleted: 3,
      categories: { work: 200, study: 90, exercise: 60, personal: 40 }
    },
    {
      date: '2024-08-07',
      totalMinutes: 460,
      productivity: 92,
      goalsCompleted: 5,
      categories: { work: 220, study: 140, exercise: 70, personal: 30 }
    },
    {
      date: '2024-08-08',
      totalMinutes: 380,
      productivity: 74,
      goalsCompleted: 3,
      categories: { work: 160, study: 110, exercise: 80, personal: 30 }
    },
    {
      date: '2024-08-09',
      totalMinutes: 440,
      productivity: 88,
      goalsCompleted: 4,
      categories: { work: 190, study: 130, exercise: 90, personal: 30 }
    },
    {
      date: '2024-08-10',
      totalMinutes: 410,
      productivity: 82,
      goalsCompleted: 4,
      categories: { work: 170, study: 120, exercise: 85, personal: 35 }
    },
    {
      date: '2024-08-11',
      totalMinutes: 450,
      productivity: 89,
      goalsCompleted: 5,
      categories: { work: 200, study: 135, exercise: 80, personal: 35 }
    }
  ]);

  // Mock data para demonstração
  const stats = {
    totalTime: '6h 45m',
    activeApps: 12,
    productivity: 78,
    sessionsToday: 24
  };

  // Dados para gráfico de distribuição por categoria
  const categoryDistribution = categories.map(cat => {
    const goal = dailyGoals.find(g => g.category === cat.value);
    return {
      name: `${cat.symbol} ${cat.label}`,
      value: goal?.currentMinutes || 0,
      color: cat.chartColor,
      category: cat.value
    };
  });

  // Simulação de sessões recentes com novas categorias
  const recentSessions: ActivitySession[] = [
    {
      id: '1',
      category: 'work',
      application: 'Terminal.exe',
      duration: 3600,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      productivity: 'high'
    },
    {
      id: '2',
      category: 'study',
      application: 'CodeAcademy',
      duration: 2700,
      startTime: new Date(Date.now() - 4500000),
      endTime: new Date(Date.now() - 1800000),
      productivity: 'high'
    },
    {
      id: '3',
      category: 'creative',
      application: 'Blender.exe',
      duration: 1800,
      startTime: new Date(Date.now() - 6300000),
      endTime: new Date(Date.now() - 4500000),
      productivity: 'medium'
    },
    {
      id: '4',
      category: 'exercise',
      application: 'FitnessApp.exe',
      duration: 1200,
      startTime: new Date(Date.now() - 7500000),
      endTime: new Date(Date.now() - 6300000),
      productivity: 'high'
    },
    {
      id: '5',
      category: 'personal',
      application: 'Discord.exe',
      duration: 900,
      startTime: new Date(Date.now() - 8400000),
      endTime: new Date(Date.now() - 7500000),
      productivity: 'low'
    }
  ];

  // Timer para sessão atual
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        setSessionDuration(prev => {
          const newDuration = prev + 1;
          // Atualizar meta atual quando sessão está ativa
          setDailyGoals(goals => goals.map(goal => {
            if (goal.category === currentSession.category) {
              const newMinutes = goal.currentMinutes + (1 / 60);
              const wasCompleted = goal.completed;
              const isNowCompleted = newMinutes >= goal.targetMinutes;
              
              // Notificação mística quando meta é completada
              if (!wasCompleted && isNowCompleted) {
                const categoryInfo = getCategoryInfo(goal.category);
                toast.success(`🔮 Prophecy Fulfilled!`, {
                  description: `The cards reveal ${categoryInfo.tarotCard} has blessed your ${formatMinutes(goal.targetMinutes)} ${categoryInfo.label} ritual!`
                });
              }
              
              return {
                ...goal,
                currentMinutes: newMinutes,
                completed: isNowCompleted
              };
            }
            return goal;
          }));
          return newDuration;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  // Auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isTracking) {
      interval = setInterval(() => {
        handleRefresh();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, isTracking]);

  const handleStartTracking = () => {
    const newSession: ActivitySession = {
      id: Date.now().toString(),
      category: selectedCategory,
      application: 'Active_Process.exe',
      duration: 0,
      startTime: new Date(),
      productivity: 'medium'
    };
    setCurrentSession(newSession);
    setIsTracking(true);
    setSessionDuration(0);
  };

  const handleStopTracking = () => {
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        endTime: new Date(),
        duration: sessionDuration
      };
      setSessions(prev => [completedSession, ...prev]);
    }
    setIsTracking(false);
    setCurrentSession(null);
    setSessionDuration(0);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
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

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getCategoryInfo = (categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  const getProductivityColor = (productivity: string) => {
    switch (productivity) {
      case 'high': return 'text-green-400 border-green-400 glow-effect';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const updateDailyGoal = (category: string, targetMinutes: number) => {
    setDailyGoals(goals => goals.map(goal => 
      goal.category === category 
        ? { ...goal, targetMinutes, completed: goal.currentMinutes >= targetMinutes }
        : goal
    ));
  };

  const resetDailyGoals = () => {
    setDailyGoals(goals => goals.map(goal => ({ 
      ...goal, 
      currentMinutes: 0, 
      completed: false 
    })));
    toast.success('🔮 The cosmic energies have been reset!');
  };

  const isStreakDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return streakData.streakDates.includes(dateString);
  };

  const calculateWeeklyAverage = () => {
    const totalCompletion = weeklyHistory.reduce((sum, week) => sum + week.completionRate, 0);
    return Math.round(totalCompletion / weeklyHistory.length);
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 20) return '🔥';
    if (streak >= 10) return '⚡';
    if (streak >= 5) return '✨';
    return '💫';
  };

  const getProductivityTrend = () => {
    const last7Days = productivityReports.slice(-7);
    const first3 = last7Days.slice(0, 3).reduce((sum, day) => sum + day.productivity, 0) / 3;
    const last3 = last7Days.slice(-3).reduce((sum, day) => sum + day.productivity, 0) / 3;
    
    if (last3 > first3 + 5) return { trend: 'up', change: Math.round(last3 - first3) };
    if (last3 < first3 - 5) return { trend: 'down', change: Math.round(first3 - last3) };
    return { trend: 'stable', change: Math.round(Math.abs(last3 - first3)) };
  };

  const productivityTrend = getProductivityTrend();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 space-y-6">
      {/* Mystic Header with ASCII Art */}
      <div className="mystic-card mystic-border rounded-lg p-6 relative overflow-hidden">
        <div className="ascii-art mb-4">{asciiArt}</div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary glow-effect" />
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                ⚡ ACTIVITY.EXE ⚡
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse glow-effect' : 'bg-gray-600'}`} />
              <span className="text-sm text-muted-foreground font-mono">
                {isTracking ? '>>> TRACKING_ACTIVE' : '>>> SYSTEM_IDLE'}
              </span>
            </div>

            {/* Mystical Streak indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30 glow-effect">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400 font-mono">
                {streakData.currentStreak} DAYS {getStreakEmoji(streakData.currentStreak)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Mystical Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className="gap-2 border border-purple-500/30 glow-effect"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDarkMode ? 'LIGHT_MODE' : 'DARK_MODE'}
            </Button>

            {/* Connection Oracle */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectionTest(!showConnectionTest)}
                className="text-muted-foreground border border-purple-500/20"
              >
                {showConnectionTest ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                ORACLE_STATUS
              </Button>
            </div>

            {/* Refresh Ritual */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 border-purple-500/30 glow-effect"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              SYNC_MATRIX
            </Button>

            {/* Tracking Spells */}
            <div className="flex items-center gap-2">
              {!isTracking ? (
                <Button onClick={handleStartTracking} className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 glow-effect">
                  <Play className="h-4 w-4" />
                  CAST_SPELL
                </Button>
              ) : (
                <Button onClick={handleStopTracking} variant="destructive" className="gap-2 glow-effect">
                  <Square className="h-4 w-4" />
                  BREAK_RITUAL
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Oracle Connection Test */}
        {showConnectionTest && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-md border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-400 glow-effect" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm font-mono">
                  {isConnected ? '>>> ORACLE_CONNECTED :: DIVINATION_READY' : '>>> CONNECTION_SEVERED :: REALM_OFFLINE'}
                </span>
              </div>
              {!isConnected && (
                <Button size="sm" variant="outline" className="border-purple-500/30">
                  RECONNECT
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mystical Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="mystic-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">⏰ TOTAL_TIME</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.totalTime}</div>
            <p className="text-xs text-muted-foreground font-mono">
              +20.1% since yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="mystic-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">🔥 STREAK_COUNT</CardTitle>
            <Flame className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">{streakData.currentStreak} days</div>
            <p className="text-xs text-muted-foreground font-mono">
              Record: {streakData.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card className="mystic-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">📊 EFFICIENCY</CardTitle>
            {productivityTrend.trend === 'up' ? (
              <ArrowUp className="h-4 w-4 text-green-400 glow-effect" />
            ) : productivityTrend.trend === 'down' ? (
              <ArrowDown className="h-4 w-4 text-red-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-purple-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.productivity}%</div>
            <p className="text-xs text-muted-foreground font-mono">
              {productivityTrend.trend === 'up' ? '+' : productivityTrend.trend === 'down' ? '-' : '±'}{productivityTrend.change}% this_week
            </p>
          </CardContent>
        </Card>

        <Card className="mystic-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">📈 WEEKLY_AVG</CardTitle>
            <BarChart3 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">{calculateWeeklyAverage()}%</div>
            <p className="text-xs text-muted-foreground font-mono">
              goals_completed
            </p>
          </CardContent>
        </Card>

        <Card className="mystic-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">🎯 RITUALS_TODAY</CardTitle>
            <Target className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">{dailyGoals.filter(g => g.completed).length}/{dailyGoals.length}</div>
            <p className="text-xs text-muted-foreground font-mono">
              prophecies_fulfilled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mystical Goals Overview */}
      <Card className="mystic-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono">
              <Target className="h-5 w-5 text-purple-400" />
              🔮 DAILY_PROPHECIES
            </CardTitle>
            <CardDescription className="font-mono">
              Channel your energy across the mystical realms
            </CardDescription>
          </div>
          <Button onClick={resetDailyGoals} variant="outline" size="sm" className="border-purple-500/30 glow-effect font-mono">
            RESET_MATRIX
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {dailyGoals.map((goal) => {
              const categoryInfo = getCategoryInfo(goal.category);
              const Icon = categoryInfo.icon;
              const progress = Math.min((goal.currentMinutes / goal.targetMinutes) * 100, 100);
              
              return (
                <div key={goal.category} className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-gradient-to-r ${categoryInfo.mysticalColor} text-white glow-effect`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium font-mono tarot-symbol">
                      {categoryInfo.symbol} {categoryInfo.label}
                    </span>
                    {goal.completed && <CheckCircle className="h-4 w-4 text-green-400 glow-effect" />}
                  </div>
                  <Progress value={progress} className="h-2 bg-purple-900/30" />
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatMinutes(goal.currentMinutes)} / {formatMinutes(goal.targetMinutes)}
                  </div>
                  <div className="text-xs text-purple-400 font-mono">
                    {categoryInfo.tarotCard}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Ritual Session */}
      {isTracking && currentSession && (
        <Card className="mystic-card border-green-500/30 bg-gradient-to-r from-green-900/20 to-emerald-900/20 glow-effect">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-mono">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse glow-effect" />
              ⚡ ACTIVE_RITUAL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground font-mono">
                  {getCategoryInfo(selectedCategory).symbol} {getCategoryInfo(selectedCategory).label}.exe
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  Initiated: {currentSession.startTime.toLocaleTimeString()}
                </p>
                <p className="text-xs text-purple-400 font-mono">
                  Channeling: {getCategoryInfo(selectedCategory).tarotCard}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground font-mono glow-effect">{formatDuration(sessionDuration)}</p>
                <p className="text-sm text-muted-foreground font-mono">ELAPSED_TIME</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mystical Category Selection */}
      <Card className="mystic-card">
        <CardHeader>
          <CardTitle className="font-mono">⚜️ SELECT_RITUAL_TYPE</CardTitle>
          <CardDescription className="font-mono">
            Choose your path through the digital astral plane
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-purple-900/20 border-purple-500/30 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-purple-500/30">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <SelectItem key={category.value} value={category.value} className="font-mono">
                    <div className="flex items-center gap-2">
                      <span className="tarot-symbol">{category.symbol}</span>
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                      <span className="text-xs text-purple-400">({category.tarotCard})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Content Tabs with Mystical Styling */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
          <TabsTrigger value="sessions" className="font-mono">Sessions</TabsTrigger>
          <TabsTrigger value="analytics" className="font-mono">Analytics</TabsTrigger>
          <TabsTrigger value="goals" className="font-mono">Prophecies</TabsTrigger>
          <TabsTrigger value="history" className="font-mono">Chronicles</TabsTrigger>
          <TabsTrigger value="periods" className="font-mono">Cycles</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="mystic-card">
            <CardHeader>
              <CardTitle className="font-mono">📜 RECENT_EXECUTIONS</CardTitle>
              <CardDescription className="font-mono">
                Your latest digital transmutations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSessions.map((session, index) => {
                  const categoryInfo = getCategoryInfo(session.category);
                  const Icon = categoryInfo.icon;
                  
                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-purple-500/30 rounded-lg bg-gradient-to-r from-purple-900/10 to-pink-900/10">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md bg-gradient-to-r ${categoryInfo.mysticalColor} text-white glow-effect`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground font-mono">{session.application}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {categoryInfo.symbol} {categoryInfo.label} • {session.startTime.toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-purple-400 font-mono">{categoryInfo.tarotCard}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground font-mono">{formatDuration(session.duration)}</p>
                        <Badge variant="outline" className={`${getProductivityColor(session.productivity)} font-mono`}>
                          {session.productivity}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="mystic-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <PieChart className="h-5 w-5 text-purple-400" />
                  🌌 ENERGY_DISTRIBUTION
                </CardTitle>
                <CardDescription className="font-mono">
                  How your cosmic energy flows today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsPieChart data={categoryDistribution} cx="50%" cy="50%" outerRadius={80}>
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPieChart>
                      <Tooltip 
                        formatter={(value: number) => [formatMinutes(value), 'Energy']}
                        labelStyle={{ color: '#e8e3f3', fontFamily: 'monospace' }}
                        contentStyle={{ 
                          backgroundColor: '#1a1625',
                          border: '1px solid rgba(157, 78, 221, 0.3)',
                          borderRadius: '8px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="mystic-card">
              <CardHeader>
                <CardTitle className="font-mono">⚖️ PROPHECY_vs_REALITY</CardTitle>
                <CardDescription className="font-mono">
                  How your manifestations compare to your intentions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyGoals.map(goal => ({
                      name: getCategoryInfo(goal.category).symbol,
                      current: goal.currentMinutes,
                      target: goal.targetMinutes,
                      color: getCategoryInfo(goal.category).chartColor
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(157, 78, 221, 0.3)" />
                      <XAxis dataKey="name" stroke="#a084ca" style={{ fontFamily: 'monospace' }} />
                      <YAxis stroke="#a084ca" style={{ fontFamily: 'monospace' }} />
                      <Tooltip 
                        formatter={(value: number) => [formatMinutes(value), 'Energy']}
                        labelStyle={{ color: '#e8e3f3', fontFamily: 'monospace' }}
                        contentStyle={{ 
                          backgroundColor: '#1a1625',
                          border: '1px solid rgba(157, 78, 221, 0.3)',
                          borderRadius: '8px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="current" fill="#9d4edd" name="Current Energy" />
                      <Bar dataKey="target" fill="#7209b7" name="Target Energy" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card className="mystic-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono">
                <Settings2 className="h-5 w-5 text-purple-400" />
                🔮 CONFIGURE_PROPHECIES
              </CardTitle>
              <CardDescription className="font-mono">
                Set your daily intentions for each mystical realm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map((category) => {
                const Icon = category.icon;
                const currentGoal = dailyGoals.find(g => g.category === category.value);
                
                return (
                  <div key={category.value} className="flex items-center gap-4 p-4 border border-purple-500/30 rounded-lg bg-gradient-to-r from-purple-900/10 to-pink-900/10">
                    <div className={`p-2 rounded-md bg-gradient-to-r ${category.mysticalColor} text-white glow-effect`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-medium font-mono tarot-symbol">
                        {category.symbol} {category.label}
                      </Label>
                      <p className="text-xs text-purple-400 font-mono">{category.tarotCard}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          min="0"
                          max="1440"
                          value={Math.floor((currentGoal?.targetMinutes || 0) / 60)}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 0;
                            updateDailyGoal(category.value, hours * 60);
                          }}
                          className="w-20 bg-purple-900/20 border-purple-500/30 font-mono"
                        />
                        <span className="text-sm text-muted-foreground font-mono">hours</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={Math.floor((currentGoal?.targetMinutes || 0) % 60)}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 0;
                            const hours = Math.floor((currentGoal?.targetMinutes || 0) / 60);
                            updateDailyGoal(category.value, hours * 60 + minutes);
                          }}
                          className="w-20 bg-purple-900/20 border-purple-500/30 font-mono"
                        />
                        <span className="text-sm text-muted-foreground font-mono">minutes</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground font-mono">
                        Current: {formatMinutes(currentGoal?.currentMinutes || 0)}
                      </p>
                      <div className="flex items-center gap-1">
                        {currentGoal?.completed && <CheckCircle className="h-4 w-4 text-green-400 glow-effect" />}
                        <span className="text-xs text-muted-foreground font-mono">
                          {currentGoal?.completed ? 'PROPHECY_FULFILLED' : 'RITUAL_ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Mystical Streak Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="mystic-card glow-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Flame className="h-5 w-5 text-orange-400" />
                  🔥 CURRENT_STREAK
                </CardTitle>
                <CardDescription className="font-mono">Consecutive days of mystical achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-orange-400 font-mono glow-effect">
                    {streakData.currentStreak} {getStreakEmoji(streakData.currentStreak)}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">days_of_power</p>
                  <Badge variant="outline" className="text-orange-400 border-orange-400 font-mono">
                    Record: {streakData.longestStreak} days
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="mystic-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  🏆 ACHIEVEMENTS
                </CardTitle>
                <CardDescription className="font-mono">Mystical milestones unlocked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-mono">First week of enlightenment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-mono">Streak of spiritual awakening</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-mono">Perfect harmony achieved</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mystic-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <CalendarIcon className="h-5 w-5 text-purple-400" />
                  📅 COSMIC_CALENDAR
                </CardTitle>
                <CardDescription className="font-mono">Visualize your mystical journey</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    streak: (date) => isStreakDate(date)
                  }}
                  modifiersStyles={{
                    streak: { 
                      backgroundColor: '#9d4edd',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 0 10px rgba(157, 78, 221, 0.5)'
                    }
                  }}
                  className="rounded-md border border-purple-500/30 bg-purple-900/10 font-mono"
                />
              </CardContent>
            </Card>
          </div>

          {/* Rest of history content with mystical styling... */}
          <Card className="mystic-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono">
                <History className="h-5 w-5 text-purple-400" />
                📊 WEEKLY_CHRONICLES
              </CardTitle>
              <CardDescription className="font-mono">
                The saga of your mystical achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(157, 78, 221, 0.3)" />
                    <XAxis dataKey="week" stroke="#a084ca" style={{ fontFamily: 'monospace' }} />
                    <YAxis stroke="#a084ca" style={{ fontFamily: 'monospace' }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'completionRate' ? `${value}%` : value, 
                        name === 'completionRate' ? 'Completion Rate' : 
                        name === 'goalsCompleted' ? 'Goals Completed' : 'Total Goals'
                      ]}
                      labelStyle={{ color: '#e8e3f3', fontFamily: 'monospace' }}
                      contentStyle={{ 
                        backgroundColor: '#1a1625',
                        border: '1px solid rgba(157, 78, 221, 0.3)',
                        borderRadius: '8px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#9d4edd" 
                      fill="#9d4edd" 
                      fillOpacity={0.3}
                      name="Completion Rate (%)"
                    />
                    <Bar dataKey="goalsCompleted" fill="#7209b7" name="Goals Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card className="mystic-card">
            <CardHeader>
              <CardTitle className="font-mono">🌍 TEMPORAL_ANALYSIS</CardTitle>
              <CardDescription className="font-mono">
                Your energy flows through the cosmic cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayPeriods.map((period, index) => (
                  <div key={index} className="p-4 border border-purple-500/30 rounded-lg space-y-3 bg-gradient-to-r from-purple-900/10 to-pink-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{period.emoji}</span>
                        <div>
                          <h3 className="font-medium text-foreground font-mono">{period.period}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{period.hours}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground font-mono">{period.activities} rituals</p>
                        <p className="text-sm text-muted-foreground font-mono">{period.productivity}% efficiency</p>
                      </div>
                    </div>
                    <Progress value={period.productivity} className="h-2 bg-purple-900/30" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mystical Settings */}
      <Card className="mystic-card">
        <CardHeader>
          <CardTitle className="font-mono">⚙️ SYSTEM_CONFIGURATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground font-mono">AUTO_SYNC_MATRIX</p>
              <p className="text-sm text-muted-foreground font-mono">
                Update cosmic data every 30 seconds
              </p>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          
          <Separator className="bg-purple-500/30" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground font-mono">ORACLE_VISIBILITY</p>
              <p className="text-sm text-muted-foreground font-mono">
                Display connection status to the mystical realm
              </p>
            </div>
            <Switch checked={showConnectionTest} onCheckedChange={setShowConnectionTest} />
          </div>

          <Separator className="bg-purple-500/30" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground font-mono">COSMIC_THEME</p>
              <p className="text-sm text-muted-foreground font-mono">
                Toggle between light and dark energy
              </p>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}