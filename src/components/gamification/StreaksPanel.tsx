/**
 * Streaks Panel Component
 * Displays and manages user streaks
 */

import React, { useState, useEffect } from 'react';
import { gamificationService, Streak } from '../../services/api/GamificationService';
import { gamificationNotifications } from '../../services/notifications/GamificationNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface StreaksPanelProps {
  userId: string;
}

const StreaksPanel: React.FC<StreaksPanelProps> = ({ userId = 'current-user' }) => {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreaks();
  }, [userId]);

  const loadStreaks = async () => {
    try {
      setLoading(true);
      const response = await gamificationService.getUserStreaks(userId);
      if (response.success) {
        setStreaks(response.data.streaks);
        setStats(response.data.stats);
        setMilestones(response.data.milestones);
      }
    } catch (error) {
      console.error('Error loading streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseFreeze = async (streakId: string) => {
    try {
      const response = await gamificationService.useStreakFreeze(userId, streakId);
      if (response.success) {
        // Reload streaks to get updated data
        loadStreaks();
        
        // Show notification
        gamificationNotifications.showStreakMilestoneNotification({
          type: 'freeze',
          count: 0,
          milestone: 'Freeze Usado',
          reward: 0
        });
      }
    } catch (error) {
      console.error('Error using streak freeze:', error);
    }
  };

  const getStreakIcon = (type: string): string => {
    const icons = {
      daily_general: '🔥',
      productivity: '⚡',
      daily_category: '🎯',
      weekly: '📅',
      custom: '⭐'
    };
    return icons[type as keyof typeof icons] || '🔥';
  };

  const getHealthColor = (status: string): string => {
    const colors = {
      excellent: 'text-green-600 bg-green-50',
      good: 'text-blue-600 bg-blue-50',
      warning: 'text-yellow-600 bg-yellow-50',
      critical: 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || colors.excellent;
  };

  const getHealthText = (status: string): string => {
    const texts = {
      excellent: 'Excelente',
      good: 'Bom',
      warning: 'Atenção',
      critical: 'Crítico'
    };
    return texts[status as keyof typeof texts] || 'Desconhecido';
  };

  const formatStreakType = (type: string, category?: string): string => {
    const types = {
      daily_general: 'Atividade Diária',
      productivity: 'Produtividade',
      daily_category: `${category || 'Categoria'} Diário`,
      weekly: 'Semanal',
      custom: 'Personalizado'
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Streaks...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Estatísticas de Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalActiveStreaks}
                </div>
                <div className="text-sm text-gray-600">Ativos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {stats.longestCurrentStreak}
                </div>
                <div className="text-sm text-gray-600">Maior Atual</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.longestEverStreak}
                </div>
                <div className="text-sm text-gray-600">Recorde</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalStreakDays}
                </div>
                <div className="text-sm text-gray-600">Total de Dias</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Streaks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Streaks Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {streaks.map((streak) => (
              <div
                key={streak.id}
                className="p-6 border-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {getStreakIcon(streak.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {formatStreakType(streak.type, streak.category)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Iniciado em {new Date(streak.startDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600">
                      {streak.currentCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      dias consecutivos
                    </div>
                  </div>
                </div>

                {/* Health Status */}
                {streak.health && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(streak.health.status)}`}>
                        {getHealthText(streak.health.status)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {streak.health.daysUntilBreak > 0 
                          ? `${streak.health.daysUntilBreak} dias restantes`
                          : 'Ação necessária hoje!'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        💎 {streak.health.freezesRemaining} freezes
                      </span>
                      {streak.health.status === 'critical' && streak.health.freezesRemaining > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseFreeze(streak.id)}
                          className="text-xs"
                        >
                          Usar Freeze
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress to Next Milestone */}
                {streak.nextMilestone && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Próximo marco: {streak.nextMilestone.name}
                      </span>
                      <span className="font-semibold">
                        {streak.currentCount}/{streak.nextMilestone.count}
                      </span>
                    </div>
                    <Progress 
                      value={(streak.currentCount / streak.nextMilestone.count) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      Recompensa: +{streak.nextMilestone.reward} XP
                      {streak.nextMilestone.badge && ` + Badge ${streak.nextMilestone.badge}`}
                    </div>
                  </div>
                )}

                {/* Multiplier */}
                {streak.multiplier && streak.multiplier > 1 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Multiplicador: {streak.multiplier}x XP
                    </Badge>
                  </div>
                )}

                {/* Streak History */}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <span>📈 Máximo: {streak.maxCount} dias</span>
                  <span>🕒 Última atividade: {new Date(streak.lastActiveDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}

            {streaks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔥</div>
                <p>Nenhum streak ativo no momento</p>
                <p className="text-sm">Complete uma atividade para começar!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Marcos de Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {milestone.count}
                  </div>
                  <div className="font-semibold text-sm mb-2">
                    {milestone.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    {milestone.description}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-green-600">
                      +{milestone.reward} XP
                    </div>
                    {milestone.badge && (
                      <Badge variant="outline" className="text-xs">
                        🎖️ {milestone.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Testar Notificações de Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => gamificationNotifications.showStreakMilestoneNotification({
                type: 'daily',
                count: 7,
                milestone: 'Semana Forte',
                reward: 100
              })}
              variant="outline"
              size="sm"
            >
              Marco Alcançado
            </Button>
            <Button 
              onClick={() => gamificationNotifications.showStreakWarningNotification({
                type: 'daily',
                count: 15,
                hoursLeft: 6,
                canUseFreeze: true
              })}
              variant="outline"
              size="sm"
            >
              Aviso de Risco
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreaksPanel;