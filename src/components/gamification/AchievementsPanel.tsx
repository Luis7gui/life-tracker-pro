/**
 * Achievements Panel Component
 * Displays user achievements with progress tracking
 */

import React, { useState, useEffect } from 'react';
import { gamificationService, AchievementDefinition, Achievement } from '../../services/api/GamificationService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AchievementsPanelProps {
  userId: string;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ userId = 'current-user' }) => {
  const [achievements, setAchievements] = useState<AchievementDefinition[]>([]);
  const [progress, setProgress] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await gamificationService.getUserAchievements(userId);
      if (response.success) {
        setAchievements(response.data.achievements);
        setProgress(response.data.progress);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string): string => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-300',
      uncommon: 'bg-green-100 text-green-800 border-green-300',
      rare: 'bg-blue-100 text-blue-800 border-blue-300',
      epic: 'bg-purple-100 text-purple-800 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityIcon = (rarity: string): string => {
    const icons = {
      common: '🥉',
      uncommon: '🥈',
      rare: '🥇',
      epic: '💎',
      legendary: '👑'
    };
    return icons[rarity as keyof typeof icons] || '🏆';
  };

  const getAchievementProgress = (achievementId: string): Achievement | null => {
    return progress.find(p => p.achievementId === achievementId) || null;
  };

  const categories = stats ? Object.keys(stats.byCategory) : [];
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Conquistas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
              Estatísticas de Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.unlockedCount}
                </div>
                <div className="text-sm text-gray-600">Desbloqueadas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalAchievements}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.completionPercentage)}%
                </div>
                <div className="text-sm text-gray-600">Completo</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalXPAvailable.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">XP Disponível</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">Todas</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory}>
              <div className="grid gap-4">
                {filteredAchievements.map((achievement) => {
                  const userProgress = getAchievementProgress(achievement.id);
                  const isUnlocked = userProgress?.isUnlocked || false;
                  const progressPercentage = userProgress?.progressPercentage || 0;
                  const currentValue = userProgress?.currentValue || 0;

                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isUnlocked 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Achievement Icon */}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                          isUnlocked ? 'bg-yellow-200' : 'bg-gray-200'
                        }`}>
                          {isUnlocked ? getRarityIcon(achievement.rarity) : '🔒'}
                        </div>

                        {/* Achievement Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className={`font-bold text-lg ${
                                isUnlocked ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {achievement.name}
                              </h3>
                              <p className={`text-sm ${
                                isUnlocked ? 'text-gray-700' : 'text-gray-500'
                              }`}>
                                {achievement.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getRarityColor(achievement.rarity)}>
                                {achievement.rarity}
                              </Badge>
                              <div className="text-sm font-semibold text-blue-600">
                                +{achievement.xpReward} XP
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {!isUnlocked && progressPercentage !== null && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Progresso</span>
                                <span>{Math.round(progressPercentage)}%</span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                              {userProgress && userProgress.targetValue && (
                                <div className="text-xs text-gray-500">
                                  {currentValue} / {userProgress.targetValue}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Unlocked Status */}
                          {isUnlocked && userProgress?.unlockedAt && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-green-600 font-semibold">
                                ✅ Desbloqueado
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(userProgress.unlockedAt).toLocaleDateString('pt-BR')}
                              </span>
                              {userProgress.repetitionCount > 0 && (
                                <span className="text-xs text-blue-600">
                                  ×{userProgress.repetitionCount + 1}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Secret Achievement */}
                          {achievement.isSecret && !isUnlocked && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                🔐 Conquista Secreta
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Rarity Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Raridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats.byRarity).map(([rarity, count]) => (
                <div key={rarity} className="text-center p-3 rounded-lg border">
                  <div className="text-xl mb-1">{getRarityIcon(rarity)}</div>
                  <div className="font-semibold">{count as number}</div>
                  <div className="text-xs text-gray-600 capitalize">{rarity}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AchievementsPanel;