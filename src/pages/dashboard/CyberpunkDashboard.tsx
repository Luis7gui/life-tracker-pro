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
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default'
  );

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
      await dispatch(stopTracking()).unwrap();
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