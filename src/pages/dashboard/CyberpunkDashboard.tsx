import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchDashboardData, 
  startTracking, 
  stopTracking
} from '../../store/slices/activitySlice';
import { toast } from 'sonner';
import { showErrorToast, handleApiError } from '../../utils/errorHandling';
import { CyberSidebar } from '../../components/cyberpunk/CyberSidebar';
import { ActivityTracker } from '../../components/cyberpunk/ActivityTracker';
import { DitheredBackground } from '../../components/cyberpunk/DitheredBackground';
import { APP_CONFIG } from '../../config/features';

// Categories for tracking
const categories = [
  { value: 'work', label: 'Trabalho', color: '#3b82f6', targetMinutes: APP_CONFIG.default_goals.work },
  { value: 'study', label: 'Estudo', color: '#10b981', targetMinutes: APP_CONFIG.default_goals.study },
  { value: 'exercise', label: 'Exercício', color: '#f59e0b', targetMinutes: APP_CONFIG.default_goals.exercise },
  { value: 'personal', label: 'Pessoal', color: '#8b5cf6', targetMinutes: APP_CONFIG.default_goals.personal },
  { value: 'entertainment', label: 'Entretenimento', color: '#ef4444', targetMinutes: APP_CONFIG.default_goals.entertainment }
];

// Backend and frontend now use the same categories, no mapping needed

interface DailyGoal {
  category: string;
  targetMinutes: number;
  currentMinutes: number;
  completed: boolean;
}

export default function CyberpunkDashboard() {
  const dispatch = useAppDispatch();
  const { dashboardData, loading } = useAppSelector(state => state.activity);

  // States
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isTracking, setIsTracking] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default'
  );

  // Daily Goals (can be customized later)
  // Load goals from localStorage or use defaults
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => {
    const savedGoals = localStorage.getItem('lifeTracker_dailyGoals');
    if (savedGoals) {
      try {
        return JSON.parse(savedGoals);
      } catch {
        console.warn('Failed to parse saved goals, using defaults');
      }
    }
    return categories.map(cat => ({
      category: cat.value,
      targetMinutes: cat.targetMinutes,
      currentMinutes: 0, // Start with 0, will be updated from backend
      completed: false
    }));
  });

  // Edit mode states for goals
  const [editingGoals, setEditingGoals] = useState<{[key: string]: number}>({});
  const [editingApps, setEditingApps] = useState<{[key: string]: string[]}>({});
  
  // Apps associated with each category
  // Category app mappings (load from localStorage or use defaults)
  const [categoryApps, setCategoryApps] = useState<{[key: string]: string[]}>(() => {
    const savedApps = localStorage.getItem('lifeTracker_categoryApps');
    if (savedApps) {
      try {
        return JSON.parse(savedApps);
      } catch {
        console.warn('Failed to parse saved apps, using defaults');
      }
    }
    return {
      work: ['Visual Studio Code', 'Slack', 'Microsoft Teams', 'Notion', 'Figma'],
      study: ['Coursera', 'Khan Academy', 'Duolingo', 'Udemy', 'YouTube'],
      exercise: ['Strava', 'Nike Run Club', 'MyFitnessPal', 'Fitbit', 'Apple Health'],
      personal: ['WhatsApp', 'Instagram', 'Facebook', 'Twitter', 'TikTok'],
      entertainment: ['Netflix', 'Spotify', 'YouTube', 'Steam', 'Twitch']
    };
  });

  // Pomodoro Timer States
  const [timerMode, setTimerMode] = useState<'work' | 'shortBreak' | 'longBreak' | 'custom'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomodoroSession, setPomodoroSession] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [customTime, setCustomTime] = useState(25);
  const [timerPhase, setTimerPhase] = useState<'focus' | 'break' | 'idle'>('idle');
  const [intensityLevel, setIntensityLevel] = useState<'normal' | 'intense' | 'extreme'>('normal');

  // Data Analytics States
  // const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  // const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate realistic data for the last 30 days
  const generateAnalyticsData = () => {
    const days = 30;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic work patterns
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isWorkday = !isWeekend;
      
      // Base productivity influenced by day type
      const baseProductivity = isWorkday ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;
      
      // Generate category data with realistic patterns
      const workTime = isWorkday ? 180 + Math.random() * 120 : Math.random() * 60;
      const studyTime = 30 + Math.random() * 90;
      const exerciseTime = isWorkday ? 20 + Math.random() * 40 : 30 + Math.random() * 60;
      const personalTime = 45 + Math.random() * 90;
      const entertainmentTime = isWeekend ? 120 + Math.random() * 180 : 60 + Math.random() * 120;
      
      const totalTime = workTime + studyTime + exerciseTime + personalTime + entertainmentTime;
      
      data.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dayOfWeek: date.getDay(),
        isWeekend,
        categories: {
          work: Math.round(workTime),
          study: Math.round(studyTime),
          exercise: Math.round(exerciseTime),
          personal: Math.round(personalTime),
          entertainment: Math.round(entertainmentTime)
        },
        totalTime: Math.round(totalTime),
        productivity: Math.round(baseProductivity * 100),
        focusScore: Math.round((workTime + studyTime) / totalTime * 100),
        wellnessScore: Math.round((exerciseTime + personalTime) / totalTime * 100),
        pomodoroSessions: Math.round(workTime / 25) + Math.round(Math.random() * 3),
        interruptions: Math.round(Math.random() * 8),
        deepWorkTime: Math.round(workTime * (0.6 + Math.random() * 0.3)),
        burnoutRisk: Math.round((workTime / 480) * 100) // Risk based on work hours
      });
    }
    
    return data;
  };

  const [analyticsData] = useState(() => generateAnalyticsData());
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Real-time data from backend (fallback to mock if not available)
  const getRealTimeData = () => {
    if (dashboardData) {
      return {
        insights: {
          productivityScore: dashboardData.todaySummary?.productivityScore || 78.5,
          goalsAchieved: dailyGoals.filter(g => g.completed).length,
          totalGoals: dailyGoals.length,
          focusScore: dashboardData.todaySummary?.totalActiveTime ? (dashboardData.todaySummary.totalActiveTime / 60) : 125.8,
          trendDirection: 'up' as 'up' | 'down' | 'stable',
          trendPercentage: 12,
          recommendations: {
            strengths: [
              'Consistent daily tracking habits',
              'High engagement with the system',
              'Regular goal monitoring'
            ],
            improvements: [
              'Set more challenging targets',
              'Track additional activities',
              'Review analytics more frequently'
            ],
            actionPlan: 'Your tracking data shows good consistency. Consider expanding to more categories and setting weekly challenges to maintain momentum.'
          },
          weeklyStats: {
            totalHours: dashboardData.todaySummary?.totalActiveTime ? Math.round(dashboardData.todaySummary.totalActiveTime / 3600 * 7) : 42.5,
            mostProductiveDay: 'Today',
            averageSessionLength: dashboardData.recentSessions?.sessions?.length ? 
              Math.round(dashboardData.recentSessions.sessions.reduce((acc, s) => acc + s.duration, 0) / dashboardData.recentSessions.sessions.length / 60) : 85
          }
        },
        categoryData: {
          work: dailyGoals.find(g => g.category === 'work')?.currentMinutes || 0,
          study: dailyGoals.find(g => g.category === 'study')?.currentMinutes || 0,
          exercise: dailyGoals.find(g => g.category === 'exercise')?.currentMinutes || 0,
          personal: dailyGoals.find(g => g.category === 'personal')?.currentMinutes || 0,
          entertainment: dailyGoals.find(g => g.category === 'entertainment')?.currentMinutes || 0
        },
        weeklyData: dashboardData.timeOfDayAnalysis ? [
          { day: 'Morning', value: Math.round(dashboardData.timeOfDayAnalysis.morning / 60) },
          { day: 'Afternoon', value: Math.round(dashboardData.timeOfDayAnalysis.afternoon / 60) },
          { day: 'Evening', value: Math.round(dashboardData.timeOfDayAnalysis.evening / 60) },
          { day: 'Night', value: Math.round(dashboardData.timeOfDayAnalysis.night / 60) },
          { day: 'Today', value: Math.round((dashboardData.todaySummary?.totalActiveTime || 0) / 60) },
          { day: 'Avg', value: 75 },
          { day: 'Peak', value: 95 }
        ] : [
          { day: 'Mon', value: 85 }, { day: 'Tue', value: 92 }, { day: 'Wed', value: 78 },
          { day: 'Thu', value: 88 }, { day: 'Fri', value: 95 }, { day: 'Sat', value: 65 }, { day: 'Sun', value: 70 }
        ]
      };
    }
    
    // Fallback mock data
    return {
      insights: {
        productivityScore: 78.5,
        goalsAchieved: 4, totalGoals: 5, focusScore: 125.8,
        trendDirection: 'up' as 'up' | 'down' | 'stable', trendPercentage: 12,
        recommendations: {
          strengths: ['Consistent morning productivity patterns', 'High focus during deep work sessions', 'Good work-break balance'],
          improvements: ['Reduce afternoon interruptions', 'Optimize meeting scheduling', 'Increase hydration breaks'],
          actionPlan: 'Based on your patterns, focus your most important tasks between 9-11 AM when your productivity peaks.'
        },
        weeklyStats: { totalHours: 42.5, mostProductiveDay: 'Tuesday', averageSessionLength: 85 }
      },
      categoryData: { work: 480, study: 180, exercise: 90, personal: 120, entertainment: 60 },
      weeklyData: [
        { day: 'Mon', value: 85 }, { day: 'Tue', value: 92 }, { day: 'Wed', value: 78 },
        { day: 'Thu', value: 88 }, { day: 'Fri', value: 95 }, { day: 'Sat', value: 65 }, { day: 'Sun', value: 70 }
      ]
    };
  };

  const mockData = getRealTimeData();

  // Calculate insights and trends
  /* 
  const getAnalyticsInsights = () => {
    const lastWeek = analyticsData.slice(-7);
    const previousWeek = analyticsData.slice(-14, -7);
    
    const avgProductivity = lastWeek.reduce((sum, day) => sum + day.productivity, 0) / 7;
    const avgPrevProductivity = previousWeek.reduce((sum, day) => sum + day.productivity, 0) / 7;
    const productivityTrend = avgProductivity - avgPrevProductivity;
    
    const avgFocusScore = lastWeek.reduce((sum, day) => sum + day.focusScore, 0) / 7;
    const avgBurnoutRisk = lastWeek.reduce((sum, day) => sum + day.burnoutRisk, 0) / 7;
    
    const totalPomodoroSessions = lastWeek.reduce((sum, day) => sum + day.pomodoroSessions, 0);
    const avgInterruptions = lastWeek.reduce((sum, day) => sum + day.interruptions, 0) / 7;
    
    // Find best and worst days
    const bestDay = lastWeek.reduce((best, day) => day.productivity > best.productivity ? day : best);
    const worstDay = lastWeek.reduce((worst, day) => day.productivity < worst.productivity ? day : worst);
    
    // Category analysis
    const categoryTotals = lastWeek.reduce((totals, day) => {
      Object.keys(day.categories).forEach(cat => {
        totals[cat] = (totals[cat] || 0) + (day.categories as Record<string, number>)[cat];
      });
      return totals;
    }, {} as Record<string, number>);
    
    return {
      productivity: {
        current: Math.round(avgProductivity),
        trend: Math.round(productivityTrend),
        isImproving: productivityTrend > 0
      },
      focusScore: Math.round(avgFocusScore),
      burnoutRisk: Math.round(avgBurnoutRisk),
      pomodoroSessions: totalPomodoroSessions,
      avgInterruptions: Math.round(avgInterruptions),
      bestDay: bestDay.day,
      worstDay: worstDay.day,
      categoryTotals,
      weeklyGoalCompletion: Math.round(avgProductivity * 1.2),
      aiRecommendations: generateAIRecommendations(avgProductivity, avgFocusScore, avgBurnoutRisk, avgInterruptions)
    };
  };
  */

  /* const generateAIRecommendations = (productivity: number, focus: number, burnout: number, interruptions: number) => {
    const recommendations = [];
    
    if (productivity < 60) {
      recommendations.push({
        type: 'warning',
        title: 'PRODUCTIVITY OPTIMIZATION',
        message: 'Neural efficiency below optimal threshold. Consider implementing time-blocking protocols.',
        action: 'Increase focus sessions by 25%'
      });
    }
    
    if (focus < 50) {
      recommendations.push({
        type: 'alert',
        title: 'FOCUS ENHANCEMENT REQUIRED',
        message: 'Attention spans fragmented. Deploy deep work algorithms immediately.',
        action: 'Use 45-minute focus blocks'
      });
    }
    
    if (burnout > 70) {
      recommendations.push({
        type: 'critical',
        title: 'BURNOUT RISK DETECTED',
        message: 'Neural pathways showing stress signatures. Recovery protocols recommended.',
        action: 'Reduce work load by 20%'
      });
    }
    
    if (interruptions > 5) {
      recommendations.push({
        type: 'info',
        title: 'DISTRACTION COUNTERMEASURES',
        message: 'External interference detected. Activate focus shield protocols.',
        action: 'Enable do-not-disturb mode'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'OPTIMAL PERFORMANCE',
        message: 'Neural networks operating at peak efficiency. Maintain current protocols.',
        action: 'Continue current workflow'
      });
    }
    
    return recommendations;
  };
  */

  // Timer configurations - wrapped in useMemo to prevent useCallback dependency changes
  const timerConfigs = useMemo(() => ({
    work: { time: 25 * 60, label: 'FOCUS SESSION', emoji: '🎯', color: '#dc2626' },
    shortBreak: { time: 5 * 60, label: 'SHORT BREAK', emoji: '☕', color: '#10b981' },
    longBreak: { time: 15 * 60, label: 'LONG BREAK', emoji: '🌟', color: '#3b82f6' },
    custom: { time: customTime * 60, label: 'CUSTOM MODE', emoji: '⚡', color: '#8b5cf6' }
  }), [customTime]);

  // Load data on mount and check tracking status
  useEffect(() => {
    dispatch(fetchDashboardData()).then((action: any) => {
      if (action.payload?.monitorStatus) {
        const monitorStatus = action.payload.monitorStatus;
        setIsTracking(monitorStatus.isRunning);
        
        // If monitor is running, start the session timer from current session duration
        if (monitorStatus.isRunning && monitorStatus.currentSession) {
          setSessionDuration(monitorStatus.currentSession.duration || 0);
        }
      }
      
      // Update daily goals with real session data
      if (action.payload?.categoryTimes) {
        const categoryTimes = action.payload.categoryTimes;
        setDailyGoals(prev => 
          prev.map(goal => {
            const categoryTimeInMinutes = Math.floor(((categoryTimes[goal.category] as number) || 0) / 60);
            return {
              ...goal,
              currentMinutes: categoryTimeInMinutes,
              completed: categoryTimeInMinutes >= goal.targetMinutes
            };
          })
        );
      }
    });
  }, [dispatch]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTracking) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else if (!isTracking && sessionDuration !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, sessionDuration]);

  // Check for goal completions and send notifications
  useEffect(() => {
    dailyGoals.forEach(goal => {
      if (goal.currentMinutes >= goal.targetMinutes && !goal.completed) {
        // Send notification when goal is reached
        sendGoalNotification(goal);
        setDailyGoals(prev => 
          prev.map(g => 
            g.category === goal.category 
              ? { ...g, completed: true }
              : g
          )
        );
      }
    });
  }, [dailyGoals]);

  // Timer Functions (defined before useEffect)
  const handleTimerComplete = React.useCallback(() => {
    toast.success('⚡ SESSÃO COMPLETA!', {
      description: 'Sistema neural sincronizado com sucesso!'
    });

    // Send system notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚡ SESSÃO COMPLETA', {
        body: `${timerConfigs[timerMode].label} finalizada! Sistema neural recarregado.`,
        icon: '/favicon.ico',
        tag: 'timer-complete',
        requireInteraction: true
      });
    }

    // Auto-switch to next phase if enabled
    if (timerMode === 'work') {
      setTotalSessions(prev => prev + 1);
      // Switch to break after work session
      // const nextMode = pomodoroSession % 4 === 0 ? 'longBreak' : 'shortBreak';
      setPomodoroSession(prev => prev + 1);
    }
  }, [timerMode, timerConfigs]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer finished
            setIsTimerRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft, handleTimerComplete]);

  // Update timer phase based on mode and state
  useEffect(() => {
    if (timerMode === 'work') {
      setTimerPhase(isTimerRunning ? 'focus' : 'idle');
    } else {
      setTimerPhase(isTimerRunning ? 'break' : 'idle');
    }
  }, [timerMode, isTimerRunning]);

  const sendGoalNotification = (goal: DailyGoal) => {
    const category = categories.find(c => c.value === goal.category);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎯 Meta Atingida!', {
        body: `Você completou sua meta diária de ${category?.label}: ${goal.targetMinutes} minutos!`,
        icon: '/favicon.ico'
      });
    }
    toast.success('🎯 Meta Atingida!', {
      description: `${category?.label}: ${goal.targetMinutes} minutos completados!`
    });
  };

  const handleStartTracking = async () => {
    try {
      await dispatch(startTracking()).unwrap();
      
      setIsTracking(true);
      setSessionDuration(0);
      toast.success('🚀 Tracking Contínuo Iniciado!', {
        description: 'Sistema detectará automaticamente suas atividades e categorizará por aplicação'
      });
      
    } catch (error: any) {
      showErrorToast('Erro ao Iniciar', handleApiError(error));
    }
  };

  const handleStopTracking = async () => {
    try {
      await dispatch(stopTracking()).unwrap();
      setIsTracking(false);
      
      toast.success('⏹️ Tracking Contínuo Interrompido!', {
        description: 'O sistema categorizou automaticamente suas atividades'
      });
      
      setSessionDuration(0);
      
      // Refresh dashboard data to get the latest categorized sessions
      dispatch(fetchDashboardData()).then((action: any) => {
        if (action.payload?.categoryTimes) {
          // Update daily goals based on actual categorized time from sessions
          const categoryTimes = action.payload.categoryTimes;
          
          setDailyGoals(prev => 
            prev.map(goal => {
              const categoryTimeInMinutes = Math.floor(((categoryTimes[goal.category] as number) || 0) / 60);
              return {
                ...goal,
                currentMinutes: categoryTimeInMinutes,
                completed: categoryTimeInMinutes >= goal.targetMinutes
              };
            })
          );
          
          // Show breakdown of detected activities
          const detectedCategories = Object.entries(categoryTimes)
            .filter(([_, time]) => (time as number) > 60) // Only show categories with more than 1 minute
            .map(([category, seconds]) => {
              const minutes = Math.floor((seconds as number) / 60);
              const categoryData = categories.find(c => c.value === category);
              return `${categoryData?.label || category}: ${minutes}m`;
            })
            .join(', ');
          
          if (detectedCategories) {
            toast.success('📊 Atividades Detectadas!', {
              description: detectedCategories,
              duration: 8000
            });
          }
        }
      });
      
    } catch (error: any) {
      showErrorToast('Erro ao Parar', handleApiError(error));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('🔔 Notificações Ativadas!', {
          description: 'Sistema de alertas neural online!'
        });
      } else {
        toast.error('❌ Acesso Negado', {
          description: 'Permissão de notificação requerida para alertas do sistema.'
        });
      }
    } else {
      toast.error('⚠️ Incompatível', {
        description: 'Este navegador não suporta notificações.'
      });
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🤖 TESTE DO SISTEMA NEURAL', {
        body: 'Interface cyberpunk operacional. Todos os sistemas funcionando.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification'
      });
      toast.success('📡 Teste Enviado!', {
        description: 'Verificação de sistema neural transmitida.'
      });
    } else {
      toast.warning('🔒 Acesso Requerido', {
        description: 'Ative as notificações primeiro para testar o sistema.'
      });
    }
  };

  const updateGoal = (category: string, newTarget: number) => {
    if (newTarget < 0 || newTarget > 720) return; // Max 12 hours
    
    const updatedGoals = dailyGoals.map(goal => 
      goal.category === category 
        ? { ...goal, targetMinutes: newTarget, completed: goal.currentMinutes >= newTarget }
        : goal
    );
    
    setDailyGoals(updatedGoals);
    // Save to localStorage
    localStorage.setItem('lifeTracker_dailyGoals', JSON.stringify(updatedGoals));
    
    toast.success('🎯 Meta Atualizada!', {
      description: `${categories.find(c => c.value === category)?.label}: ${newTarget} minutos`
    });
  };

  const handleGoalEdit = (category: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditingGoals(prev => ({ ...prev, [category]: numValue }));
  };

  const saveGoal = (category: string) => {
    const newValue = editingGoals[category];
    if (newValue !== undefined && newValue >= 0 && newValue <= 720) {
      updateGoal(category, newValue);
      setEditingGoals(prev => {
        const updated = { ...prev };
        delete updated[category];
        return updated;
      });
    }
  };

  const addApp = (category: string, appName: string) => {
    if (appName.trim() && !categoryApps[category]?.includes(appName.trim())) {
      const updatedApps = {
        ...categoryApps,
        [category]: [...(categoryApps[category] || []), appName.trim()]
      };
      setCategoryApps(updatedApps);
      // Save to localStorage
      localStorage.setItem('lifeTracker_categoryApps', JSON.stringify(updatedApps));
      
      toast.success('📱 App Adicionado!', {
        description: `${appName} → ${categories.find(c => c.value === category)?.label}`
      });
    }
  };

  const removeApp = (category: string, appName: string) => {
    const updatedApps = {
      ...categoryApps,
      [category]: categoryApps[category]?.filter(app => app !== appName) || []
    };
    setCategoryApps(updatedApps);
    // Save to localStorage
    localStorage.setItem('lifeTracker_categoryApps', JSON.stringify(updatedApps));
    
    toast.success('🗑️ App Removido!', {
      description: `${appName} removido da categoria`
    });
  };

  const resetGoals = () => {
    setDailyGoals(
      categories.map(cat => ({
        category: cat.value,
        targetMinutes: cat.targetMinutes,
        currentMinutes: Math.floor(Math.random() * cat.targetMinutes),
        completed: false
      }))
    );
    setEditingGoals({});
    toast.success('🔄 Metas Resetadas!', {
      description: 'Todas as metas voltaram aos valores padrão'
    });
  };


  const switchTimerMode = (mode: 'work' | 'shortBreak' | 'longBreak' | 'custom') => {
    setTimerMode(mode);
    const config = timerConfigs[mode];
    setTimeLeft(config.time);
    setIsTimerRunning(false);
    
    toast.info('🔄 Mode Switched!', {
      description: `Now in ${config.label} mode`
    });
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    playTimerSound('start');
    
    toast.success('▶️ Timer Started!', {
      description: `${timerConfigs[timerMode].label} mode activated`
    });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    playTimerSound('pause');
    
    toast.info('⏸️ Timer Paused', {
      description: 'Neural interface suspended'
    });
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerConfigs[timerMode].time);
    playTimerSound('reset');
    
    toast.info('🔄 Timer Reset', {
      description: 'Neural pathways recalibrated'
    });
  };

  const setCustomTimer = (minutes: number) => {
    setCustomTime(minutes);
    if (timerMode === 'custom') {
      setTimeLeft(minutes * 60);
    }
  };

  // Sound effects using Web Audio API
  const playTimerSound = (type: 'start' | 'pause' | 'reset' | 'complete' | 'tick') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different actions
      const frequencies = {
        start: [440, 554], // A4 to C#5
        pause: [329, 261], // E4 to C4
        reset: [523, 440, 349], // C5 to A4 to F4
        complete: [523, 659, 783, 1046], // C5-E5-G5-C6 (victory chord)
        tick: [800] // High tick
      };
      
      const freq = frequencies[type];
      let time = audioContext.currentTime;
      
      freq.forEach((f, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(f, time);
        osc.type = 'square'; // Cyberpunk square wave
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (type === 'complete' ? 0.5 : 0.1));
        
        osc.start(time);
        osc.stop(time + (type === 'complete' ? 0.5 : 0.1));
        
        time += (type === 'complete' ? 0.15 : 0.05);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatTimerTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerProgress = () => {
    const totalTime = timerConfigs[timerMode].time;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Data visualization components for charts
  const renderMiniChart = (data: number[], color: string, label: string) => {
    const max = Math.max(...data);
    const height = 60;
    const width = 200;
    
    return (
      <div className="relative">
        <div className="text-xs font-mono text-gray-400 mb-2">{label}</div>
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              y1={height * ratio}
              x2={width}
              y2={height * ratio}
              stroke="rgba(75, 85, 99, 0.3)"
              strokeWidth={ratio === 0 || ratio === 1 ? 1 : 0.5}
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth={2}
            points={data.map((value, index) => 
              `${(index / (data.length - 1)) * width},${height - (value / max) * height}`
            ).join(' ')}
            style={{
              filter: `drop-shadow(0 0 4px ${color})`
            }}
          />
          
          {/* Data points */}
          {data.map((value, index) => (
            <circle
              key={index}
              cx={(index / (data.length - 1)) * width}
              cy={height - (value / max) * height}
              r={2}
              fill={color}
              className="animate-pulse"
            />
          ))}
        </svg>
      </div>
    );
  };

  const renderProductivityHeatmap = () => {
    const weekData = analyticsData.slice(-7);
    const maxProductivity = Math.max(...weekData.map(d => d.productivity));
    
    return (
      <div className="space-y-2">
        <div className="text-xs font-mono text-gray-400 mb-3">PRODUCTIVITY HEATMAP</div>
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((day, index) => {
            const intensity = day.productivity / maxProductivity;
            const opacity = 0.3 + (intensity * 0.7);
            
            return (
              <div
                key={index}
                className="relative group"
              >
                <div
                  className="w-8 h-8 border border-gray-600 flex items-center justify-center text-xs font-mono cursor-pointer transition-all hover:scale-110"
                  style={{
                    backgroundColor: `rgba(220, 38, 38, ${opacity})`,
                    boxShadow: intensity > 0.7 ? '0 0 8px rgba(220, 38, 38, 0.5)' : 'none'
                  }}
                >
                  {day.day}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 p-2 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                  <div className="text-cyan-400">{day.day}</div>
                  <div>Prod: {day.productivity}%</div>
                  <div>Focus: {day.focusScore}%</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between text-xs font-mono text-gray-500 mt-2">
          <span>Low</span>
          <span>Productivity</span>
          <span>High</span>
        </div>
      </div>
    );
  };

  const renderCategoryDistribution = () => {
    const categoryTotals = mockData.categoryData;
    const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    
    const categoryColors = {
      work: '#dc2626',
      study: '#10b981',
      exercise: '#f59e0b',
      personal: '#8b5cf6',
      entertainment: '#ef4444'
    };
    
    let currentAngle = 0;
    const radius = 50;
    const centerX = 60;
    const centerY = 60;
    
    return (
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width={120} height={120}>
            {/* Background circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="rgba(75, 85, 99, 0.3)"
              strokeWidth={2}
            />
            
            {/* Category segments */}
            {Object.entries(categoryTotals).map(([category, value]) => {
              const percentage = (value as number) / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
              const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
              const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
              const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${startX} ${startY}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z'
              ].join(' ');
              
              currentAngle += angle;
              
              return (
                <path
                  key={category}
                  d={pathData}
                  fill={categoryColors[category as keyof typeof categoryColors]}
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth={1}
                  opacity={0.8}
                  style={{
                    filter: `drop-shadow(0 0 4px ${categoryColors[category as keyof typeof categoryColors]})`
                  }}
                />
              );
            })}
            
            {/* Center circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={20}
              fill="rgba(0, 0, 0, 0.8)"
              stroke="rgba(75, 85, 99, 0.5)"
              strokeWidth={2}
            />
            
            <text
              x={centerX}
              y={centerY + 4}
              textAnchor="middle"
              className="fill-gray-200 text-xs font-mono"
            >
              {Math.round(total/60)}h
            </text>
          </svg>
        </div>
        
        <div className="space-y-2">
          {Object.entries(categoryTotals).map(([category, value]) => {
            const percentage = Math.round(((value as number) / total) * 100);
            const categoryData = categories.find(c => c.value === category);
            
            return (
              <div key={category} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                ></div>
                <div className="font-mono text-xs text-gray-200 min-w-[80px]">
                  {categoryData?.label}
                </div>
                <div className="font-mono text-xs text-gray-400">
                  {Math.round((value as number)/60)}h ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <ActivityTracker
            dailyGoals={dailyGoals}
            isTracking={isTracking}
            sessionDuration={sessionDuration}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
            formatDuration={formatDuration}
            dashboardData={dashboardData}
          />
        );
      case 'goals':
        return (
          <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 cyber-interface overflow-y-auto">
            {/* Header */}
            <div className="border-b-2 border-gray-700 p-6 bg-gradient-to-r from-gray-900 to-gray-800">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h1 className="font-mono text-xl font-bold terminal-text mb-2">
                    GOAL SYSTEM: &gt;&gt; NEURAL PATHWAY OPTIMIZATION
                  </h1>
                  <p className="font-mono text-sm text-gray-400">
                    &gt; Configure daily targets and application mapping protocols.
                  </p>
                </div>
                <div className="text-right">
                  <button 
                    onClick={resetGoals}
                    className="cyber-button text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      RESET TARGETS
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
              {/* Goals Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-blue-400">🎯</div>
                    <div className="text-xs font-mono text-gray-400">TARGETS</div>
                  </div>
                  <div className="data-value text-3xl mb-1">{dailyGoals.length}</div>
                  <div className="text-sm text-gray-400 font-mono">CATEGORIES</div>
                </div>
                
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-green-400">✓</div>
                    <div className="text-xs font-mono text-gray-400">COMPLETE</div>
                  </div>
                  <div className="data-value text-3xl mb-1 text-green-400">
                    {dailyGoals.filter(g => g.completed).length}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">ACHIEVED</div>
                </div>

                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-cyan-400">📱</div>
                    <div className="text-xs font-mono text-gray-400">APPS</div>
                  </div>
                  <div className="data-value text-3xl mb-1 text-cyan-400">
                    {Object.values(categoryApps).flat().length}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">MAPPED</div>
                </div>
              </div>

              {/* Goals Configuration */}
              <div className="space-y-4">
                <h2 className="font-mono text-lg font-bold text-gray-200 mb-4">TARGET CONFIGURATION</h2>
                
                {dailyGoals.map(goal => {
                  const category = categories.find(c => c.value === goal.category);
                  const isEditingGoal = editingGoals[goal.category] !== undefined;
                  const isEditingApp = editingApps[goal.category] !== undefined;
                  const progress = Math.min((goal.currentMinutes / goal.targetMinutes) * 100, 100);
                  
                  return (
                    <div key={goal.category} className="cyber-card p-6 scanlines">
                      {/* Goal Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 border-2 border-gray-600 flex items-center justify-center rounded-sm"
                            style={{ backgroundColor: category?.color + '20', borderColor: category?.color }}
                          >
                            <span className="text-2xl">
                              {goal.category === 'work' ? '💼' :
                               goal.category === 'study' ? '📚' :
                               goal.category === 'exercise' ? '💪' :
                               goal.category === 'personal' ? '👤' :
                               '🎮'}
                            </span>
                          </div>
                          <div>
                            <div className="font-mono font-bold text-lg text-gray-200">
                              {category?.label.toUpperCase()}
                            </div>
                            <div className={`text-sm font-mono font-bold ${
                              goal.completed ? 'status-complete' : isTracking ? 'status-active' : 'status-idle'
                            }`}>
                              {goal.completed ? '✓ TARGET ACHIEVED' : isTracking ? '● RUNNING' : '○ STANDBY'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="data-value text-xl text-gray-200">
                            {Math.floor(goal.currentMinutes / 60)}h {goal.currentMinutes % 60}m
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            of {Math.floor(goal.targetMinutes / 60)}h {goal.targetMinutes % 60}m
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="status-bar">
                          <div 
                            className="status-fill" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-400 font-mono">
                            {Math.round(progress)}% of daily target
                          </div>
                          {goal.completed && (
                            <div className="text-sm font-mono font-bold text-green-400">
                              NEURAL PATHWAY OPTIMIZED!
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Goal Time Editor */}
                      <div className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-mono text-sm font-bold text-cyan-400">TIME TARGET</div>
                          {!isEditingGoal && (
                            <button
                              onClick={() => setEditingGoals(prev => ({ 
                                ...prev, 
                                [goal.category]: goal.targetMinutes 
                              }))}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 font-mono"
                            >
                              EDIT
                            </button>
                          )}
                        </div>
                        
                        {isEditingGoal ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max="720"
                              value={editingGoals[goal.category]}
                              onChange={(e) => handleGoalEdit(goal.category, e.target.value)}
                              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono"
                              placeholder="Minutes per day"
                            />
                            <span className="text-sm text-gray-400 font-mono">MIN/DAY</span>
                            <button
                              onClick={() => saveGoal(goal.category)}
                              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-mono text-xs"
                            >
                              ✓ SAVE
                            </button>
                            <button
                              onClick={() => setEditingGoals(prev => {
                                const updated = { ...prev };
                                delete updated[goal.category];
                                return updated;
                              })}
                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500 font-mono text-xs"
                            >
                              ✕ CANCEL
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono text-lg text-gray-200">
                            {goal.targetMinutes} minutes/day ({Math.floor(goal.targetMinutes/60)}h {goal.targetMinutes%60}m)
                          </div>
                        )}
                      </div>

                      {/* Apps Manager */}
                      <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-mono text-sm font-bold text-cyan-400">MAPPED APPLICATIONS</div>
                          <div className="font-mono text-xs text-gray-400">
                            {categoryApps[goal.category]?.length || 0} APPS
                          </div>
                        </div>
                        
                        {/* App List */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {categoryApps[goal.category]?.map((app, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded font-mono text-xs"
                            >
                              <span className="text-gray-200">{app}</span>
                              <button
                                onClick={() => removeApp(goal.category, app)}
                                className="text-red-400 hover:text-red-300 ml-1"
                              >
                                ✕
                              </button>
                            </div>
                          )) || (
                            <div className="text-gray-500 font-mono text-sm italic">
                              No applications mapped yet
                            </div>
                          )}
                        </div>

                        {/* Add App */}
                        {isEditingApp ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingApps[goal.category]?.[0] || ''}
                              onChange={(e) => setEditingApps(prev => ({
                                ...prev,
                                [goal.category]: [e.target.value]
                              }))}
                              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
                              placeholder="Application name"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const appName = editingApps[goal.category]?.[0];
                                  if (appName) {
                                    addApp(goal.category, appName);
                                    setEditingApps(prev => {
                                      const updated = { ...prev };
                                      delete updated[goal.category];
                                      return updated;
                                    });
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const appName = editingApps[goal.category]?.[0];
                                if (appName) {
                                  addApp(goal.category, appName);
                                  setEditingApps(prev => {
                                    const updated = { ...prev };
                                    delete updated[goal.category];
                                    return updated;
                                  });
                                }
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-mono text-xs"
                            >
                              + ADD
                            </button>
                            <button
                              onClick={() => setEditingApps(prev => {
                                const updated = { ...prev };
                                delete updated[goal.category];
                                return updated;
                              })}
                              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 font-mono text-xs"
                            >
                              CANCEL
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingApps(prev => ({
                              ...prev,
                              [goal.category]: ['']
                            }))}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-mono text-xs"
                          >
                            + ADD APPLICATION
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="border-t-2 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-4">
              <div className="flex justify-between items-center">
                <div className="font-mono text-sm terminal-text">
                  GOAL MODULE - NEURAL OPTIMIZATION v2.1.0
                </div>
                <div className="flex space-x-6">
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-green-400">TARGETS: {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length}</span>
                  </div>
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-blue-400">APPS: {Object.values(categoryApps).flat().length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'timer':
        return (
          <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 cyber-interface overflow-y-auto relative">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Pulse effect when timer is running */}
              {isTimerRunning && (
                <div className={`absolute inset-0 animate-pulse ${
                  timerPhase === 'focus' ? 'bg-red-500/5' : 'bg-green-500/5'
                }`}></div>
              )}
              
              {/* Intensity rings */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute border rounded-full ${
                      isTimerRunning ? 'animate-ping' : 'opacity-20'
                    } ${timerPhase === 'focus' ? 'border-red-500/30' : 'border-green-500/30'}`}
                    style={{
                      width: `${200 + i * 100}px`,
                      height: `${200 + i * 100}px`,
                      left: `${-100 - i * 50}px`,
                      top: `${-100 - i * 50}px`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '3s'
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="border-b-2 border-gray-700 p-6 bg-gradient-to-r from-gray-900 to-gray-800 relative z-10">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h1 className="font-mono text-xl font-bold terminal-text mb-2">
                    NEURAL TIMER: &gt;&gt; POMODORO PROTOCOL
                  </h1>
                  <p className="font-mono text-sm text-gray-400">
                    &gt; Temporal focus optimization system active.
                  </p>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-sm font-bold ${
                    timerPhase === 'focus' ? 'status-active' : 
                    timerPhase === 'break' ? 'status-complete' : 'status-idle'
                  }`}>
                    {timerPhase === 'focus' ? '🎯 FOCUS MODE' :
                     timerPhase === 'break' ? '☕ BREAK MODE' :
                     '○ STANDBY'}
                  </div>
                  <div className="font-mono text-xs text-gray-400 mt-1">
                    SESSION #{pomodoroSession}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6 relative z-10">
              {/* Timer Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-blue-400">⏱️</div>
                    <div className="text-xs font-mono text-gray-400">SESSION</div>
                  </div>
                  <div className="data-value text-2xl mb-1">{pomodoroSession}</div>
                  <div className="text-sm text-gray-400 font-mono">CURRENT</div>
                </div>
                
                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-green-400">✓</div>
                    <div className="text-xs font-mono text-gray-400">TOTAL</div>
                  </div>
                  <div className="data-value text-2xl mb-1">{totalSessions}</div>
                  <div className="text-sm text-gray-400 font-mono">COMPLETED</div>
                </div>

                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-purple-400">⚡</div>
                    <div className="text-xs font-mono text-gray-400">MODE</div>
                  </div>
                  <div className="data-value text-lg mb-1">{timerConfigs[timerMode].emoji}</div>
                  <div className="text-xs text-gray-400 font-mono">{timerConfigs[timerMode].label}</div>
                </div>

                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-cyan-400">🔥</div>
                    <div className="text-xs font-mono text-gray-400">INTENSITY</div>
                  </div>
                  <div className="data-value text-lg mb-1">{intensityLevel.toUpperCase()}</div>
                  <div className="text-xs text-gray-400 font-mono">LEVEL</div>
                </div>
              </div>

              {/* Main Timer Display */}
              <div className="cyber-card p-8 text-center relative overflow-hidden">
                {/* Timer Circle */}
                <div className="relative mx-auto mb-8" style={{ width: '300px', height: '300px' }}>
                  {/* Background Circle */}
                  <svg className="absolute inset-0 transform -rotate-90" width="300" height="300">
                    <circle
                      cx="150"
                      cy="150"
                      r="140"
                      fill="none"
                      stroke="rgba(75, 85, 99, 0.3)"
                      strokeWidth="8"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="150"
                      cy="150"
                      r="140"
                      fill="none"
                      stroke={timerConfigs[timerMode].color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 140}`}
                      strokeDashoffset={`${2 * Math.PI * 140 * (1 - getTimerProgress() / 100)}`}
                      className="transition-all duration-1000 ease-linear"
                      style={{
                        filter: isTimerRunning ? 'drop-shadow(0 0 20px currentColor)' : 'none'
                      }}
                    />
                  </svg>
                  
                  {/* Timer Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`font-mono text-6xl font-bold mb-4 ${
                      isTimerRunning ? 'glitch-text' : ''
                    }`} style={{ color: timerConfigs[timerMode].color }}>
                      {formatTimerTime(timeLeft)}
                    </div>
                    <div className="font-mono text-lg text-gray-400 mb-2">
                      {timerConfigs[timerMode].label}
                    </div>
                    <div className="font-mono text-sm text-gray-500">
                      {Math.round(getTimerProgress())}% COMPLETE
                    </div>
                    
                    {/* Pulse indicator */}
                    {isTimerRunning && (
                      <div className="absolute bottom-8">
                        <div className="w-4 h-4 rounded-full animate-pulse"
                             style={{ backgroundColor: timerConfigs[timerMode].color }}>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center gap-4 mb-6">
                  {!isTimerRunning ? (
                    <button
                      onClick={startTimer}
                      className="cyber-button px-8 py-3 text-lg"
                      style={{ borderColor: timerConfigs[timerMode].color }}
                    >
                      <span className="flex items-center gap-2">
                        ▶️ START NEURAL SYNC
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="cyber-button px-8 py-3 text-lg border-yellow-500"
                    >
                      <span className="flex items-center gap-2">
                        ⏸️ PAUSE SYNC
                      </span>
                    </button>
                  )}
                  
                  <button
                    onClick={resetTimer}
                    className="cyber-button px-6 py-3 border-gray-500"
                  >
                    🔄 RESET
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="text-center">
                  <div className="font-mono text-sm text-gray-400 mb-3">QUICK ACTIONS</div>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIntensityLevel(
                        intensityLevel === 'normal' ? 'intense' : 
                        intensityLevel === 'intense' ? 'extreme' : 'normal'
                      )}
                      className="cyber-button px-4 py-2 text-xs"
                    >
                      🔥 INTENSITY: {intensityLevel.toUpperCase()}
                    </button>
                    
                    <button
                      onClick={() => playTimerSound('tick')}
                      className="cyber-button px-4 py-2 text-xs"
                    >
                      🔊 TEST SOUND
                    </button>
                  </div>
                </div>
              </div>

              {/* Timer Mode Selector */}
              <div className="cyber-card p-6">
                <h3 className="font-mono text-lg font-bold text-gray-200 mb-4">MODE SELECTION</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {(Object.keys(timerConfigs) as Array<keyof typeof timerConfigs>).map(mode => {
                    const config = timerConfigs[mode];
                    const isActive = timerMode === mode;
                    
                    return (
                      <button
                        key={mode}
                        onClick={() => switchTimerMode(mode)}
                        disabled={isTimerRunning}
                        className={`cyber-button p-4 text-center ${
                          isActive ? 'active' : ''
                        } ${isTimerRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          borderColor: isActive ? config.color : undefined
                        }}
                      >
                        <div className="text-2xl mb-2">{config.emoji}</div>
                        <div className="font-mono text-sm font-bold">{config.label}</div>
                        <div className="font-mono text-xs text-gray-400 mt-1">
                          {mode === 'custom' ? `${customTime}m` : `${config.time / 60}m`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Timer Settings */}
                {timerMode === 'custom' && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-gray-400">CUSTOM TIME:</span>
                      <input
                        type="range"
                        min="1"
                        max="120"
                        value={customTime}
                        onChange={(e) => setCustomTimer(parseInt(e.target.value))}
                        disabled={isTimerRunning}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm text-gray-200 min-w-[60px]">
                        {customTime}m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="border-t-2 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-4 relative z-10">
              <div className="flex justify-between items-center">
                <div className="font-mono text-sm terminal-text">
                  TIMER MODULE - NEURAL SYNC v2.1.0
                </div>
                <div className="flex space-x-6">
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className={`w-2 h-2 ${isTimerRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} rounded-full`}></span>
                    <span className={isTimerRunning ? 'text-red-400' : 'text-gray-400'}>
                      SYNC: {isTimerRunning ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-blue-400">SESSIONS: {totalSessions}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 cyber-interface overflow-y-auto">
            {/* Header */}
            <div className="border-b-2 border-gray-700 p-6 bg-gradient-to-r from-gray-900 to-gray-800">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h1 className="font-mono text-xl font-bold terminal-text mb-2">
                    DATA ANALYTICS: &gt;&gt; NEURAL PATTERN ANALYSIS
                  </h1>
                  <p className="font-mono text-sm text-gray-400">
                    &gt; Analyzing behavioral patterns and productivity metrics.<br/>
                    &gt; AI-powered insights engine active.
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-gray-400 mb-3">
                    ANALYSIS: COMPLETE
                  </div>
                  <button 
                    onClick={() => setAnalyticsPeriod(analyticsPeriod === 'daily' ? 'weekly' : 
                                                     analyticsPeriod === 'weekly' ? 'monthly' : 'daily')}
                    className="cyber-button text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                      {analyticsPeriod.toUpperCase()} VIEW
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-blue-400">📊</div>
                    <div className="text-xs font-mono text-gray-400">PRODUCTIVITY</div>
                  </div>
                  <div className="data-value text-3xl mb-1 text-blue-400">
                    {Math.round(mockData.insights.productivityScore)}%
                  </div>
                  <div className="text-sm text-gray-400 font-mono">EFFICIENCY</div>
                </div>
                
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-green-400">🎯</div>
                    <div className="text-xs font-mono text-gray-400">GOALS</div>
                  </div>
                  <div className="data-value text-3xl mb-1 text-green-400">
                    {mockData.insights.goalsAchieved}/{mockData.insights.totalGoals}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">ACHIEVED</div>
                </div>

                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-purple-400">⚡</div>
                    <div className="text-xs font-mono text-gray-400">FOCUS</div>
                  </div>
                  <div className="data-value text-3xl mb-1 text-purple-400">
                    {Math.round(mockData.insights.focusScore)}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">MINUTES</div>
                </div>

                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 text-red-400">📈</div>
                    <div className="text-xs font-mono text-gray-400">TREND</div>
                  </div>
                  <div className={`data-value text-3xl mb-1 ${
                    mockData.insights.trendDirection === 'up' ? 'text-green-400' : 
                    mockData.insights.trendDirection === 'down' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {mockData.insights.trendDirection === 'up' ? '↗' : 
                     mockData.insights.trendDirection === 'down' ? '↘' : '→'}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">{mockData.insights.trendPercentage}%</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity Chart */}
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-lg font-bold text-gray-200">WEEKLY PATTERN</h3>
                    <div className="text-xs font-mono text-gray-400">LAST 7 DAYS</div>
                  </div>
                  {renderMiniChart(mockData.weeklyData.map(d => d.value), '#3b82f6', 'Weekly Productivity')}
                </div>

                {/* Category Distribution */}
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-lg font-bold text-gray-200">CATEGORY BREAKDOWN</h3>
                    <div className="text-xs font-mono text-gray-400">CURRENT PERIOD</div>
                  </div>
                  {renderCategoryDistribution()}
                </div>
              </div>

              {/* Productivity Heatmap */}
              <div className="cyber-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-lg font-bold text-gray-200">PRODUCTIVITY HEATMAP</h3>
                  <div className="text-xs font-mono text-gray-400">30 DAYS</div>
                </div>
                {renderProductivityHeatmap()}
              </div>

              {/* AI Recommendations */}
              <div className="cyber-card p-6 border-2 border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-lg font-bold text-cyan-400">🤖 AI INSIGHTS</h3>
                  <div className="text-xs font-mono text-gray-400">NEURAL ANALYSIS</div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                      <div className="font-mono text-sm font-bold text-green-400 mb-2">✓ STRENGTHS</div>
                      <ul className="space-y-1">
                        {mockData.insights.recommendations.strengths.map((strength, i) => (
                          <li key={i} className="font-mono text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                      <div className="font-mono text-sm font-bold text-yellow-400 mb-2">⚠ IMPROVEMENTS</div>
                      <ul className="space-y-1">
                        {mockData.insights.recommendations.improvements.map((improvement, i) => (
                          <li key={i} className="font-mono text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-yellow-400 mt-1">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700/50 rounded">
                    <div className="font-mono text-sm font-bold text-cyan-400 mb-2">🎯 PERSONALIZED ACTION PLAN</div>
                    <div className="font-mono text-xs text-gray-300 leading-relaxed">
                      {mockData.insights.recommendations.actionPlan}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Summary */}
              <div className="cyber-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-lg font-bold text-gray-200">WEEKLY PERFORMANCE</h3>
                  <div className="text-xs font-mono text-gray-400">SUMMARY</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="data-value text-2xl text-blue-400 mb-2">
                      {Math.round(mockData.insights.weeklyStats.totalHours)}h
                    </div>
                    <div className="font-mono text-sm text-gray-400">TOTAL TIME</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="data-value text-2xl text-green-400 mb-2">
                      {mockData.insights.weeklyStats.mostProductiveDay}
                    </div>
                    <div className="font-mono text-sm text-gray-400">BEST DAY</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="data-value text-2xl text-purple-400 mb-2">
                      {mockData.insights.weeklyStats.averageSessionLength}m
                    </div>
                    <div className="font-mono text-sm text-gray-400">AVG SESSION</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'config':
        return (
          <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 cyber-interface overflow-y-auto">
            {/* Header */}
            <div className="border-b-2 border-gray-700 p-6 bg-gradient-to-r from-gray-900 to-gray-800">
              <h1 className="font-mono text-xl font-bold terminal-text mb-2">
                SYSTEM CONFIG: &gt;&gt; NEURAL INTERFACE SETTINGS
              </h1>
              <p className="font-mono text-sm text-gray-400">
                &gt; Configure system parameters and notification protocols.
              </p>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
              {/* Notification Settings */}
              <div className="cyber-card p-6">
                <h2 className="font-mono text-lg font-bold text-gray-200 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-gray-600 flex items-center justify-center bg-gray-800 rounded-sm">
                    🔔
                  </div>
                  NOTIFICATION PROTOCOLS
                </h2>
                
                <div className="space-y-4">
                  {/* Permission Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded">
                    <div>
                      <div className="font-mono font-bold text-gray-200">SYSTEM STATUS</div>
                      <div className={`text-sm font-mono mt-1 ${
                        notificationPermission === 'granted' ? 'status-complete' :
                        notificationPermission === 'denied' ? 'text-red-400' :
                        'status-idle'
                      }`}>
                        {notificationPermission === 'granted' ? '✓ ACTIVE' :
                         notificationPermission === 'denied' ? '✗ DENIED' :
                         '○ STANDBY'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="data-value text-xl text-gray-200">
                        {notificationPermission === 'granted' ? 'ONLINE' :
                         notificationPermission === 'denied' ? 'BLOCKED' :
                         'OFFLINE'}
                      </div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={requestNotificationPermission}
                      className={`cyber-button p-4 text-center ${
                        notificationPermission === 'granted' ? 'active' : ''
                      }`}
                      disabled={notificationPermission === 'granted'}
                    >
                      <div className="font-mono font-bold text-sm">
                        {notificationPermission === 'granted' ? '✓ AUTHORIZED' : '⚡ ENABLE ALERTS'}
                      </div>
                      <div className="font-mono text-xs text-gray-400 mt-1">
                        {notificationPermission === 'granted' 
                          ? 'System neural interface active' 
                          : 'Activate notification protocols'}
                      </div>
                    </button>

                    <button
                      onClick={testNotification}
                      className="cyber-button p-4 text-center"
                      disabled={notificationPermission !== 'granted'}
                    >
                      <div className="font-mono font-bold text-sm">🧪 TEST NEURAL LINK</div>
                      <div className="font-mono text-xs text-gray-400 mt-1">
                        Verify system communication
                      </div>
                    </button>
                  </div>

                  {/* Status Info */}
                  <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="font-mono text-sm text-gray-300">
                      <div className="mb-2">
                        <span className="text-cyan-400">STATUS:</span> Neural interface 
                        {notificationPermission === 'granted' ? ' synchronized' : ' requires authorization'}
                      </div>
                      <div className="mb-2">
                        <span className="text-cyan-400">PROTOCOL:</span> Browser notification API v2.1
                      </div>
                      <div>
                        <span className="text-cyan-400">SECURITY:</span> Encrypted transmission enabled
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="cyber-card p-6">
                <h2 className="font-mono text-lg font-bold text-gray-200 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-gray-600 flex items-center justify-center bg-gray-800 rounded-sm">
                    ⚙️
                  </div>
                  SYSTEM INFORMATION
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="font-mono text-sm">
                      <div className="text-cyan-400 mb-1">VERSION</div>
                      <div className="text-gray-200">Life Tracker v2.1.0</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="font-mono text-sm">
                      <div className="text-cyan-400 mb-1">INTERFACE</div>
                      <div className="text-gray-200">Cyberpunk Neural UI</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="font-mono text-sm">
                      <div className="text-cyan-400 mb-1">DATABASE</div>
                      <div className="text-gray-200">SQLite Optimized</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900 border border-gray-700 rounded">
                    <div className="font-mono text-sm">
                      <div className="text-cyan-400 mb-1">STATUS</div>
                      <div className="text-green-400">OPERATIONAL</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="border-t-2 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-4">
              <div className="flex justify-between items-center">
                <div className="font-mono text-sm terminal-text">
                  CONFIG MODULE - NEURAL SETTINGS v2.1.0
                </div>
                <div className="flex space-x-6">
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className={`w-2 h-2 ${notificationPermission === 'granted' ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`}></span>
                    <span className={notificationPermission === 'granted' ? 'text-green-400' : 'text-red-400'}>
                      NOTIFY: {notificationPermission === 'granted' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-blue-400">CONFIG: LOADED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'alert':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center border-red-500 border-2">
              <h2 className="font-mono text-xl font-bold text-red-500 glitch-text mb-4">ALERT SYSTEM</h2>
              <p className="font-mono text-red-400">WARNING: System anomaly detected...</p>
            </div>
          </div>
        );
      default:
        return (
          <ActivityTracker
            dailyGoals={dailyGoals}
            isTracking={isTracking}
            sessionDuration={sessionDuration}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
            formatDuration={formatDuration}
            dashboardData={dashboardData}
          />
        );
    }
  };

  if (loading.dashboard && !dashboardData) {
    return (
      <div className="size-full bg-black text-white relative overflow-hidden flex items-center justify-center">
        <DitheredBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin h-16 w-16 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold font-mono terminal-text mb-2">INITIALIZING...</h2>
          <p className="text-gray-400 font-mono">Booting neural interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <DitheredBackground />
      
      {/* Main Interface */}
      <div className="relative z-10 h-full flex">
        <CyberSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        {renderMainContent()}
      </div>
    </div>
  );
}