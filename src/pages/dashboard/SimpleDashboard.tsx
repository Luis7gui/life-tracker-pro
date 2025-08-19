/**
 * Life Tracker Pro - Simple Dashboard v1.0
 * Focused on basic tracking, goals, and notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchDashboardData, 
  startTracking, 
  stopTracking
} from '../../store/slices/activitySlice';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Clock, 
  Target, 
  BarChart3,
  Settings,
  Bell,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { showErrorToast, handleApiError } from '../../utils/errorHandling';
import PomodoroTimer from '../../components/timer/PomodoroTimer';
import { FEATURES, APP_CONFIG } from '../../config/features';

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

interface DayReport {
  date: string;
  totalTime: number;
  categories: { [key: string]: number };
  productivity: number;
}

export default function SimpleDashboard() {
  const dispatch = useAppDispatch();
  const { dashboardData, loading } = useAppSelector(state => state.activity);

  // States
  const [isTracking, setIsTracking] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<'tracker' | 'goals' | 'pomodoro' | 'reports'>('tracker');
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

  // Temp state for editing goals
  const [editingGoals, setEditingGoals] = useState<{[key: string]: number}>({});

  // Weekly report (mock data)
  const [weekReport] = useState<DayReport[]>([
    { date: '2025-08-18', totalTime: 320, categories: { work: 180, study: 60, exercise: 45, personal: 35 }, productivity: 85 },
    { date: '2025-08-17', totalTime: 280, categories: { work: 160, study: 70, exercise: 30, personal: 20 }, productivity: 78 },
    { date: '2025-08-16', totalTime: 350, categories: { work: 200, study: 80, exercise: 40, personal: 30 }, productivity: 92 },
    { date: '2025-08-15', totalTime: 240, categories: { work: 140, study: 50, exercise: 30, personal: 20 }, productivity: 72 },
    { date: '2025-08-14', totalTime: 380, categories: { work: 220, study: 90, exercise: 45, personal: 25 }, productivity: 88 },
    { date: '2025-08-13', totalTime: 290, categories: { work: 170, study: 60, exercise: 35, personal: 25 }, productivity: 80 },
    { date: '2025-08-12', totalTime: 260, categories: { work: 150, study: 65, exercise: 25, personal: 20 }, productivity: 75 }
  ]);

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

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('🔔 Notificações Ativadas!', {
          description: 'Você receberá alertas quando atingir suas metas!'
        });
      } else {
        toast.error('❌ Notificações Negadas', {
          description: 'Para receber alertas, permita notificações no seu navegador.'
        });
      }
    }
  };

  const updateGoal = (category: string, newTarget: number) => {
    if (newTarget < 0 || newTarget > 720) return; // Max 12 hours
    
    setDailyGoals(prev => 
      prev.map(goal => 
        goal.category === category 
          ? { ...goal, targetMinutes: newTarget, completed: goal.currentMinutes >= newTarget }
          : goal
      )
    );
    
    toast.success('Meta Atualizada!', {
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
    toast.success('Metas Resetadas!', {
      description: 'Todas as metas voltaram aos valores padrão'
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

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const todayTotal = dailyGoals.reduce((sum, goal) => sum + goal.currentMinutes, 0);
  const completedGoals = dailyGoals.filter(g => g.completed).length;

  if (loading.dashboard && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Carregando...</h2>
          <p className="text-gray-600">Preparando seu workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{
      backgroundColor: '#0A0B0D',
      color: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px'
    }}>
        {/* Left Sidebar - Modern Cyberpunk Style */}
        <div style={{
          width: '80px',
          backgroundColor: '#1A1B23',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          padding: '16px 0'
        }}>
          {/* User Avatar */}
          <div style={{
            padding: '16px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#DC2626',
              border: '2px solid #1F2937',
              borderRadius: '4px',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '2px'
              }}></div>
            </div>
            <div style={{ 
              color: '#9CA3AF', 
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              CYBER_AI
            </div>
            <div style={{ 
              color: '#6B7280', 
              fontSize: '8px',
              marginTop: '2px'
            }}>
              v2.1.0
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'tracker', icon: '📊', label: 'STATS' },
              { key: 'goals', icon: '🎯', label: 'GOALS' },
              { key: 'pomodoro', icon: '⏰', label: 'TIMER' },
              { key: 'reports', icon: '👤', label: 'DATA' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key as any)}
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activeSection === item.key ? '#DC2626' : '#374151',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== item.key) {
                    e.currentTarget.style.backgroundColor = '#4B5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.key) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                title={item.label}
              >
                {item.icon}
              </button>
            ))}
          </div>
          
          {/* Bottom Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#374151',
                color: '#9CA3AF',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="CONFIG"
            >
              ⚙️
            </button>
            
            <button
              onClick={requestNotificationPermission}
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: notificationPermission === 'granted' ? '#DC2626' : '#374151',
                color: '#FFFFFF',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="ALERT"
            >
              🔔
            </button>
          </div>
          
          {/* Power Status */}
          <div style={{
            margin: '16px auto 0',
            padding: '8px',
            backgroundColor: '#0F172A',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '16px',
              backgroundColor: '#DC2626',
              borderRadius: '2px',
              margin: '0 auto 4px',
              position: 'relative',
              background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)'
            }}>
              <div style={{
                position: 'absolute',
                right: '-2px',
                top: '4px',
                width: '2px',
                height: '8px',
                backgroundColor: '#DC2626',
                borderRadius: '0 1px 1px 0'
              }}></div>
            </div>
            <div style={{ 
              color: '#9CA3AF', 
              fontSize: '8px',
              fontWeight: '600'
            }}>
              PWR: 74%
            </div>
            <div style={{ 
              color: '#6B7280', 
              fontSize: '7px'
            }}>
              STABLE
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '24px'
        }}>
          {activeSection === 'tracker' && (
            <>
              {/* Top Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                marginBottom: '32px'
              }}>
                {/* Today Card */}
                <div style={{
                  backgroundColor: '#1A1B23',
                  border: '1px solid #2D3748',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#3B82F6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      🕐
                    </div>
                    <div style={{
                      color: '#9CA3AF',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      TODAY
                    </div>
                  </div>
                  <div style={{
                    color: '#FFFFFF',
                    fontSize: '36px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {Math.floor(todayTotal / 60)}h {todayTotal % 60}m
                  </div>
                  <div style={{
                    color: '#6B7280',
                    fontSize: '12px'
                  }}>
                    TOTAL TIME
                  </div>
                </div>

                {/* Goals Card */}
                <div style={{
                  backgroundColor: '#1A1B23',
                  border: '1px solid #2D3748',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#10B981',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      🎯
                    </div>
                    <div style={{
                      color: '#9CA3AF',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      GOALS
                    </div>
                  </div>
                  <div style={{
                    color: '#FFFFFF',
                    fontSize: '36px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {completedGoals}/{dailyGoals.length}
                  </div>
                  <div style={{
                    color: '#6B7280',
                    fontSize: '12px'
                  }}>
                    COMPLETED
                  </div>
                </div>

                {/* Status Card */}
                <div style={{
                  backgroundColor: '#1A1B23',
                  border: '1px solid #2D3748',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: isTracking ? '#DC2626' : '#6B7280',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      🔴
                    </div>
                    <div style={{
                      color: '#9CA3AF',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      STATUS
                    </div>
                  </div>
                  <div style={{
                    color: '#FFFFFF',
                    fontSize: '24px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {isTracking ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                  <div style={{
                    color: '#6B7280',
                    fontSize: '12px'
                  }}>
                    {isTracking ? 'MONITORING' : 'STANDBY'}
                  </div>
                  {isTracking && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatDuration(sessionDuration)}
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Breakdown */}
              <div style={{
                backgroundColor: '#1A1B23',
                border: '1px solid #2D3748',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h2 style={{
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  margin: '0 0 24px 0'
                }}>
                  ACTIVITY BREAKDOWN
                </h2>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {dailyGoals.map((goal) => {
                    const category = categories.find(c => c.value === goal.category);
                    const progress = Math.min((goal.currentMinutes / goal.targetMinutes) * 100, 100);
                    const isRunning = isTracking && goal.category === 'work'; // Mock: assume work is currently running
                    
                    return (
                      <div key={goal.category} style={{
                        border: goal.completed ? '1px solid #10B981' : '1px solid #374151',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#0F172A'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              backgroundColor: category?.color || '#6B7280',
                              borderRadius: '4px',
                              marginRight: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              🏢
                            </div>
                            <div>
                              <div style={{
                                color: '#FFFFFF',
                                fontSize: '16px',
                                fontWeight: '600'
                              }}>
                                {category?.label.toUpperCase()}
                              </div>
                              {isRunning && (
                                <div style={{
                                  color: '#DC2626',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  marginTop: '2px'
                                }}>
                                  ••• RUNNING
                                </div>
                              )}
                              {goal.completed && (
                                <div style={{
                                  color: '#10B981',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  marginTop: '2px'
                                }}>
                                  ✓ COMPLETE
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              color: '#FFFFFF',
                              fontSize: '20px',
                              fontWeight: '600'
                            }}>
                              {Math.floor(goal.currentMinutes / 60)}h {goal.currentMinutes % 60}m
                            </div>
                            <div style={{
                              color: '#6B7280',
                              fontSize: '12px'
                            }}>
                              of {Math.floor(goal.targetMinutes / 60)}h {goal.targetMinutes % 60}m
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#374151',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            backgroundColor: goal.completed ? '#10B981' : isRunning ? '#DC2626' : '#6B7280',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        
                        <div style={{
                          marginTop: '8px',
                          color: '#9CA3AF',
                          fontSize: '12px'
                        }}>
                          {Math.round(progress)}% of daily target
                          {goal.completed && (
                            <span style={{
                              marginLeft: '16px',
                              color: '#10B981',
                              fontWeight: '600'
                            }}>
                              GOAL ACHIEVED! 🎉
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Control Button */}
                <div style={{
                  marginTop: '24px',
                  textAlign: 'center'
                }}>
                  {!isTracking ? (
                    <button
                      onClick={handleStartTracking}
                      style={{
                        padding: '12px 32px',
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      ► INIT_TRACKING
                    </button>
                  ) : (
                    <button
                      onClick={handleStopTracking}
                      style={{
                        padding: '12px 32px',
                        backgroundColor: '#374151',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      ■ STOP_TRACKING
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Placeholder for other sections */}
          {activeSection !== 'tracker' && (
            <div style={{
              backgroundColor: '#1A1B23',
              border: '1px solid #2D3748',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{
                color: '#6B7280',
                fontSize: '18px',
                marginBottom: '16px'
              }}>
                {activeSection.toUpperCase()} Section
              </div>
              <div style={{
                color: '#9CA3AF',
                fontSize: '14px'
              }}>
                This section is under development
              </div>
            </div>
          )}
        </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-gray-800 border-4 border-white max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-gray-600">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                CONFIGURAÇÕES
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-300 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center border-2 border-gray-500 hover:border-white"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Notification Settings */}
              <div className="border-2 border-gray-600 bg-gray-900 p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                  <Bell className="h-4 w-4" />
                  NOTIFICAÇÕES
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Notificações de Metas</p>
                      <p className="text-xs text-gray-400">Receber alerta quando completar uma meta diária</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={requestNotificationPermission}
                        className="px-3 py-1 bg-red-600 text-white text-sm border-2 border-white font-bold hover:bg-red-500"
                      >
                        {notificationPermission === 'granted' ? 'ATIVO' : 'ATIVAR'}
                      </button>
                      {notificationPermission === 'granted' && (
                        <button
                          onClick={() => {
                            new Notification('🧪 Teste de Notificação', {
                              body: 'As notificações estão funcionando perfeitamente!',
                              icon: '/favicon.ico'
                            });
                            toast.success('Teste enviado!', {
                              description: 'Verifique se a notificação apareceu no sistema'
                            });
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm border-2 border-white font-bold hover:bg-green-500"
                        >
                          TESTE
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Notificações de Pomodoro</p>
                      <p className="text-xs text-gray-400">Receber alerta quando terminar sessões do timer</p>
                    </div>
                    <span className="px-3 py-1 bg-gray-700 text-white text-sm border-2 border-gray-500 font-bold">
                      SEMPRE ATIVO
                    </span>
                  </div>
                </div>
              </div>

              {/* Goal Settings - Editable */}
              <div className="border-2 border-gray-600 bg-gray-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2 text-white">
                    <Target className="h-4 w-4" />
                    METAS DIÁRIAS (MINUTOS)
                  </h3>
                  <button
                    onClick={resetGoals}
                    className="text-xs px-2 py-1 bg-gray-700 text-gray-300 border-2 border-gray-500 font-bold hover:bg-gray-600 hover:border-gray-400"
                  >
                    RESET
                  </button>
                </div>
                
                <div className="space-y-3">
                  {dailyGoals.map(goal => {
                    const category = categories.find(c => c.value === goal.category);
                    const isEditing = editingGoals[goal.category] !== undefined;
                    
                    return (
                      <div key={goal.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: category?.color}}
                          />
                          <span className="text-sm font-medium">{category?.label}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                max="720"
                                value={editingGoals[goal.category]}
                                onChange={(e) => handleGoalEdit(goal.category, e.target.value)}
                                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveGoal(goal.category);
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500">min</span>
                              <button
                                onClick={() => saveGoal(goal.category)}
                                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingGoals(prev => {
                                  const updated = { ...prev };
                                  delete updated[goal.category];
                                  return updated;
                                })}
                                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                {goal.targetMinutes}m
                              </span>
                              <button
                                onClick={() => setEditingGoals(prev => ({ 
                                  ...prev, 
                                  [goal.category]: goal.targetMinutes 
                                }))}
                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Editar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Dica:</strong> Clique em "Editar" para personalizar suas metas diárias. 
                    As metas representam quanto tempo você quer dedicar a cada atividade por dia.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Máximo: 720 minutos (12 horas) por categoria
                  </p>
                </div>
              </div>

              {/* App Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Informações do App</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Versão:</span>
                    <span className="font-mono">{APP_CONFIG.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modo:</span>
                    <span className="font-mono">Simples</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status das Notificações:</span>
                    <span className={`font-mono ${
                      notificationPermission === 'granted' 
                        ? 'text-green-600' 
                        : notificationPermission === 'denied'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {notificationPermission === 'granted' 
                        ? 'Permitidas' 
                        : notificationPermission === 'denied'
                        ? 'Negadas'
                        : 'Não Solicitadas'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-900">Como usar:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Clique em "Iniciar Tracking Automático" para começar a rastrear</li>
                  <li>• Use o Timer Pomodoro para sessões de foco (independente do tracking)</li>
                  <li>• As metas diárias são atualizadas automaticamente</li>
                  <li>• Você receberá notificações quando atingir suas metas</li>
                  <li>• Acompanhe seu progresso na tabela semanal</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}