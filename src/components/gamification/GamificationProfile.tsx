/**
 * Gamification Profile Component
 * Main component displaying user's gamification status
 */

import React, { useState, useEffect } from 'react';
import { gamificationService, UserGamificationProfile } from '../../services/api/GamificationService';
import { gamificationNotifications } from '../../services/notifications/GamificationNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface GamificationProfileProps {
  userId: string;
  compact?: boolean;
}

const GamificationProfile: React.FC<GamificationProfileProps> = ({ 
  userId = 'current-user',
  compact = false 
}) => {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await gamificationService.getUserProfile(userId);
      if (response.success) {
        setProfile(response.data.profile);
      } else {
        setError('Falha ao carregar perfil de gamificação - Dados não encontrados');
      }
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Servidor offline - Modo demonstração ativo');
      } else {
        setError('Erro ao conectar com o servidor');
      }
      console.error('Error loading gamification profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerTestNotification = () => {
    gamificationNotifications.showAchievementNotification({
      id: 'test-achievement',
      name: 'Testador Mestre',
      description: 'Você testou o sistema de notificações!',
      rarity: 'epic',
      xpReward: 100,
      badgeColor: '#9b59b6'
    });
  };

  const triggerAllTestNotifications = () => {
    // Achievement
    setTimeout(() => {
      gamificationNotifications.showAchievementNotification({
        id: 'test-achievement-1',
        name: 'Primeira Conquista',
        description: 'Parabéns pela sua primeira conquista!',
        rarity: 'common',
        xpReward: 50,
        badgeColor: '#10b981'
      });
    }, 0);

    // Level Up
    setTimeout(() => {
      gamificationNotifications.showLevelUpNotification({
        newLevel: 2,
        title: 'Iniciante',
        xpGained: 150,
        unlockedFeatures: ['Badges básicos', 'Streaks diários']
      });
    }, 2000);

    // Streak
    setTimeout(() => {
      gamificationNotifications.showStreakMilestoneNotification({
        type: 'daily',
        count: 7,
        milestone: 'Semana Completa',
        reward: 100
      });
    }, 4000);

    // XP
    setTimeout(() => {
      gamificationNotifications.showXPNotification({
        amount: 75,
        source: 'Teste de Sistema',
        multiplier: 1.5
      });
    }, 6000);

    // Badge
    setTimeout(() => {
      gamificationNotifications.showBadgeNotification({
        id: 'test-badge',
        name: 'Testador Premium',
        rarity: 'rare',
        category: 'testing'
      });
    }, 8000);
  };

  if (loading) {
    return (
      <Card className={compact ? "w-full" : "max-w-4xl mx-auto"}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className={compact ? "w-full" : "max-w-4xl mx-auto"}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error || 'Erro ao conectar com o servidor'}</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={loadProfile} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={triggerTestNotification} variant="default">
                🧪 Testar Notificações
              </Button>
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Status: Modo offline</p>
              <p className="text-xs text-gray-500">
                As notificações funcionam independentemente da conexão com o servidor.
                Use o botão de teste para verificar o sistema de notificações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {profile?.levelInfo?.level || '?'}
              </div>
              <div>
                <p className="font-semibold text-sm">{profile?.levelInfo?.title || 'Carregando...'}</p>
                <p className="text-xs text-gray-600">
                  {profile?.totalXP?.toLocaleString() || '0'} XP
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">
                {profile?.stats?.currentActiveStreaks || '0'} streaks ativos
              </p>
              <p className="text-xs text-gray-600">
                {profile?.stats?.achievementsUnlocked || '0'}/{profile?.stats?.totalAchievements || '0'} conquistas
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progresso do Nível</span>
              <span>{profile?.levelInfo?.progressPercentage?.toFixed(1) || '0'}%</span>
            </div>
            <Progress value={profile?.levelInfo?.progressPercentage || 0} className="h-2" />
          </div>
          {!profile && (
            <div className="mt-2 flex justify-center">
              <Button size="sm" onClick={triggerTestNotification} variant="outline">
                🧪 Teste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Level and XP Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Perfil de Gamificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Level Info */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                  {profile.levelInfo.level}
                </div>
                <h3 className="text-xl font-bold">{profile.levelInfo.title}</h3>
                <p className="text-gray-600">
                  {profile.totalXP.toLocaleString()} XP Total
                </p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso para o próximo nível</span>
                  <span>{profile.levelInfo.progressPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={profile.levelInfo.progressPercentage} className="h-3" />
                <p className="text-xs text-gray-500 mt-1">
                  {(profile.levelInfo.xpForNextLevel - profile.levelInfo.currentXP).toLocaleString()} XP restantes
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.stats.currentActiveStreaks}
                </div>
                <div className="text-sm text-gray-600">Streaks Ativos</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {profile.stats.achievementsUnlocked}
                </div>
                <div className="text-sm text-gray-600">Conquistas</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {profile.stats.longestStreak}
                </div>
                <div className="text-sm text-gray-600">Maior Streak</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(profile.stats.averageProductivity)}%
                </div>
                <div className="text-sm text-gray-600">Produtividade</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Conquistas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.achievements
              .filter(achievement => achievement.isUnlocked)
              .slice(0, 6)
              .map((achievement) => (
                <div
                  key={achievement.achievementId}
                  className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏆</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {achievement.achievementId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Desbloqueado
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

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
            {profile.streaks.map((streak) => (
              <div
                key={streak.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <p className="font-semibold">
                      {streak.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">
                      {streak.currentCount} dias consecutivos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">
                    {streak.currentCount}
                  </div>
                  <div className="text-xs text-gray-500">
                    Máximo: {streak.maxCount}
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
          <CardTitle>🧪 Centro de Testes (Temporário)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={triggerTestNotification} variant="outline">
                Testar Conquista
              </Button>
              <Button 
                onClick={() => gamificationNotifications.showLevelUpNotification({
                  newLevel: 5,
                  title: 'Explorador',
                  xpGained: 250,
                  unlockedFeatures: ['Novos badges', 'Streaks avançados']
                })}
                variant="outline"
              >
                Testar Level Up
              </Button>
              <Button 
                onClick={() => gamificationNotifications.showStreakMilestoneNotification({
                  type: 'daily',
                  count: 7,
                  milestone: 'Semana Forte',
                  reward: 100
                })}
                variant="outline"
              >
                Testar Streak
              </Button>
              <Button 
                onClick={() => gamificationNotifications.showXPNotification({
                  amount: 50,
                  source: 'Sessão Produtiva',
                  multiplier: 1.5
                })}
                variant="outline"
              >
                Testar XP
              </Button>
              <Button 
                onClick={() => gamificationNotifications.showBadgeNotification({
                  id: 'test-badge-2',
                  name: 'Badge de Teste',
                  rarity: 'legendary',
                  category: 'testing'
                })}
                variant="outline"
              >
                Testar Badge
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <Button onClick={triggerAllTestNotifications} variant="default" className="w-full">
                🎆 Testar Todas as Notificações (Sequência Completa)
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Executa uma sequência de 5 notificações diferentes com intervalos de 2 segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationProfile;