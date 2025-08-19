/**
 * Notifications Center Component
 * Displays and manages gamification notifications
 */

import React, { useState, useEffect } from 'react';
import { gamificationNotifications, NotificationData, NotificationPreferences } from '../../services/notifications/GamificationNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableNotifications: true,
    enableSounds: true,
    enableCelebrations: true,
    enablePushNotifications: false,
    achievementNotifications: true,
    streakNotifications: true,
    levelUpNotifications: true,
    xpNotifications: true,
  });

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, []);

  const loadNotifications = () => {
    const history = gamificationNotifications.getNotificationHistory();
    setNotifications(history);
  };

  const loadPreferences = () => {
    const prefs = gamificationNotifications.getPreferences();
    setPreferences(prefs);
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    gamificationNotifications.updatePreferences(newPreferences);
  };

  const clearHistory = () => {
    gamificationNotifications.clearNotificationHistory();
    setNotifications([]);
  };

  const getNotificationIcon = (type: string): string => {
    const icons = {
      achievement: '🏆',
      level_up: '⬆️',
      streak_milestone: '🔥',
      badge_earned: '🎖️',
      xp_gained: '⚡',
      streak_warning: '⚠️'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      high: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Notificações Gerais</label>
                  <p className="text-sm text-gray-600">Ativar/desativar todas as notificações</p>
                </div>
                <Switch
                  checked={preferences.enableNotifications}
                  onCheckedChange={(checked) => updatePreference('enableNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Sons</label>
                  <p className="text-sm text-gray-600">Reproduzir sons nas notificações</p>
                </div>
                <Switch
                  checked={preferences.enableSounds}
                  onCheckedChange={(checked) => updatePreference('enableSounds', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Celebrações</label>
                  <p className="text-sm text-gray-600">Animações de celebração</p>
                </div>
                <Switch
                  checked={preferences.enableCelebrations}
                  onCheckedChange={(checked) => updatePreference('enableCelebrations', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Push Notifications</label>
                  <p className="text-sm text-gray-600">Notificações do navegador</p>
                </div>
                <Switch
                  checked={preferences.enablePushNotifications}
                  onCheckedChange={(checked) => updatePreference('enablePushNotifications', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Conquistas</label>
                  <p className="text-sm text-gray-600">Notificar conquistas desbloqueadas</p>
                </div>
                <Switch
                  checked={preferences.achievementNotifications}
                  onCheckedChange={(checked) => updatePreference('achievementNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Streaks</label>
                  <p className="text-sm text-gray-600">Marcos e avisos de streak</p>
                </div>
                <Switch
                  checked={preferences.streakNotifications}
                  onCheckedChange={(checked) => updatePreference('streakNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Level Up</label>
                  <p className="text-sm text-gray-600">Notificar mudanças de nível</p>
                </div>
                <Switch
                  checked={preferences.levelUpNotifications}
                  onCheckedChange={(checked) => updatePreference('levelUpNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">XP Ganho</label>
                  <p className="text-sm text-gray-600">Notificar ganho de XP</p>
                </div>
                <Switch
                  checked={preferences.xpNotifications}
                  onCheckedChange={(checked) => updatePreference('xpNotifications', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Testar Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Button
              onClick={() => gamificationNotifications.showAchievementNotification({
                id: 'test-achievement',
                name: 'Testador Pro',
                description: 'Você testou as notificações!',
                rarity: 'epic',
                xpReward: 100,
                badgeColor: '#9b59b6'
              })}
              variant="outline"
              size="sm"
            >
              🏆 Conquista
            </Button>

            <Button
              onClick={() => gamificationNotifications.showLevelUpNotification({
                newLevel: 5,
                title: 'Explorador',
                xpGained: 250
              })}
              variant="outline"
              size="sm"
            >
              ⬆️ Level Up
            </Button>

            <Button
              onClick={() => gamificationNotifications.showStreakMilestoneNotification({
                type: 'daily',
                count: 10,
                milestone: 'Dedicado',
                reward: 150
              })}
              variant="outline"
              size="sm"
            >
              🔥 Streak
            </Button>

            <Button
              onClick={() => gamificationNotifications.showBadgeNotification({
                id: 'test-badge',
                name: 'Badge Teste',
                rarity: 'rare',
                category: 'testing'
              })}
              variant="outline"
              size="sm"
            >
              🎖️ Badge
            </Button>

            <Button
              onClick={() => gamificationNotifications.showXPNotification({
                amount: 75,
                source: 'Sessão Produtiva',
                multiplier: 1.5
              })}
              variant="outline"
              size="sm"
            >
              ⚡ XP
            </Button>

            <Button
              onClick={() => gamificationNotifications.showStreakWarningNotification({
                type: 'daily',
                count: 15,
                hoursLeft: 8,
                canUseFreeze: true
              })}
              variant="outline"
              size="sm"
            >
              ⚠️ Aviso
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              Histórico de Notificações
            </CardTitle>
            <Button
              onClick={clearHistory}
              variant="outline"
              size="sm"
              disabled={notifications.length === 0}
            >
              Limpar Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>Nenhuma notificação no histórico</p>
                <p className="text-sm">Teste as notificações acima!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50"
                >
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp.toString())}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    {notification.data && Object.keys(notification.data).length > 0 && (
                      <div className="text-xs text-gray-500">
                        {notification.type === 'achievement' && notification.data.xpReward && (
                          <span>+{notification.data.xpReward} XP</span>
                        )}
                        {notification.type === 'level_up' && notification.data.newLevel && (
                          <span>Nível {notification.data.newLevel}</span>
                        )}
                        {notification.type === 'streak_milestone' && notification.data.reward && (
                          <span>+{notification.data.reward} XP</span>
                        )}
                        {notification.type === 'xp_gained' && notification.data.amount && (
                          <span>+{notification.data.amount} XP</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsCenter;