import React, { useState, useEffect } from 'react';
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

  // Daily Goals (can be customized later)
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(
    categories.map(cat => ({
      category: cat.value,
      targetMinutes: cat.targetMinutes,
      currentMinutes: Math.floor(Math.random() * cat.targetMinutes), // Mock data
      completed: false
    }))
  );

  // Load data on mount
  useEffect(() => {
    dispatch(fetchDashboardData());
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
      await dispatch(startTracking({
        activity: 'Tracking Automático',
        category: 'general'
      })).unwrap();
      
      setIsTracking(true);
      setSessionDuration(0);
      toast.success('🚀 Tracking Iniciado!', {
        description: 'Sistema de rastreamento automático ativado'
      });
      
    } catch (error: any) {
      showErrorToast('Erro ao Iniciar', handleApiError(error));
    }
  };

  const handleStopTracking = async () => {
    try {
      const result = await dispatch(stopTracking()).unwrap();
      setIsTracking(false);
      
      const duration = Math.floor(sessionDuration / 60);
      if (duration > 0) {
        // Update daily goal progress (distributed across categories based on activity detection)
        const primaryCategory = 'work'; // Default to work category for automatic tracking
        setDailyGoals(prev => 
          prev.map(goal => 
            goal.category === primaryCategory 
              ? { ...goal, currentMinutes: goal.currentMinutes + duration }
              : goal
          )
        );
      }
      
      toast.success('⏹️ Sessão Finalizada!', {
        description: `Duração: ${formatDuration(sessionDuration)}`
      });
      setSessionDuration(0);
      dispatch(fetchDashboardData());
      
    } catch (error: any) {
      showErrorToast('Erro ao Parar', handleApiError(error));
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
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">GOAL SYSTEM</h2>
              <p className="font-mono text-gray-400">Neural pathway optimization in progress...</p>
            </div>
          </div>
        );
      case 'timer':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">TIMER MODULE</h2>
              <p className="font-mono text-gray-400">Temporal tracking interface offline...</p>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">DATA ARCHIVE</h2>
              <p className="font-mono text-gray-400">Accessing neural memory banks...</p>
            </div>
          </div>
        );
      case 'config':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">SYSTEM CONFIG</h2>
              <p className="font-mono text-gray-400">Interface parameters loading...</p>
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