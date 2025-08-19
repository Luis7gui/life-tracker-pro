/**
 * Gamification Notifications System
 * Handles in-app notifications for achievements, level-ups, streaks, etc.
 */

import { toast } from 'sonner';

export interface NotificationData {
  id: string;
  type: 'achievement' | 'level_up' | 'streak_milestone' | 'badge_earned' | 'xp_gained' | 'streak_warning';
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  duration?: number;
  sound?: boolean;
  celebration?: boolean;
}

export interface NotificationPreferences {
  enableNotifications: boolean;
  enableSounds: boolean;
  enableCelebrations: boolean;
  enablePushNotifications: boolean;
  achievementNotifications: boolean;
  streakNotifications: boolean;
  levelUpNotifications: boolean;
  xpNotifications: boolean;
}

class GamificationNotificationService {
  private preferences: NotificationPreferences = {
    enableNotifications: true,
    enableSounds: true,
    enableCelebrations: true,
    enablePushNotifications: false,
    achievementNotifications: true,
    streakNotifications: true,
    levelUpNotifications: true,
    xpNotifications: true,
  };

  private notificationQueue: NotificationData[] = [];
  private celebrationContainer: HTMLElement | null = null;

  constructor() {
    this.createCelebrationContainer();
    this.loadPreferences();
  }

  /**
   * Initialize celebration container
   */
  private createCelebrationContainer(): void {
    this.celebrationContainer = document.createElement('div');
    this.celebrationContainer.id = 'gamification-celebrations';
    this.celebrationContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(this.celebrationContainer);
  }

  /**
   * Load user notification preferences
   */
  private loadPreferences(): void {
    const saved = localStorage.getItem('gamification-notification-preferences');
    if (saved) {
      this.preferences = { ...this.preferences, ...JSON.parse(saved) };
    }
  }

  /**
   * Update notification preferences
   */
  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    localStorage.setItem('gamification-notification-preferences', JSON.stringify(this.preferences));
  }

  /**
   * Show achievement unlocked notification
   */
  showAchievementNotification(achievement: {
    id: string;
    name: string;
    description: string;
    rarity: string;
    xpReward: number;
    badgeColor: string;
  }): void {
    if (!this.preferences.enableNotifications || !this.preferences.achievementNotifications) return;

    const notification: NotificationData = {
      id: `achievement-${achievement.id}-${Date.now()}`,
      type: 'achievement',
      title: '🏆 Conquista Desbloqueada!',
      message: `${achievement.name} - ${achievement.description}`,
      data: achievement,
      timestamp: new Date(),
      priority: 'high',
      duration: 6000,
      sound: true,
      celebration: true
    };

    this.showNotification(notification);

    // Show custom achievement toast
    toast.success(`🏆 Conquista Desbloqueada! ${achievement.name} (+${achievement.xpReward} XP)`, {
      duration: 6000,
      style: {
        background: achievement.badgeColor,
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontWeight: 'bold',
      }
    });

    if (this.preferences.enableCelebrations) {
      this.triggerCelebration('achievement');
    }
  }

  /**
   * Show level up notification
   */
  showLevelUpNotification(levelData: {
    newLevel: number;
    title: string;
    xpGained: number;
    unlockedFeatures?: string[];
  }): void {
    if (!this.preferences.enableNotifications || !this.preferences.levelUpNotifications) return;

    const notification: NotificationData = {
      id: `levelup-${levelData.newLevel}-${Date.now()}`,
      type: 'level_up',
      title: '⬆️ Level Up!',
      message: `Parabéns! Você alcançou o nível ${levelData.newLevel} - ${levelData.title}`,
      data: levelData,
      timestamp: new Date(),
      priority: 'high',
      duration: 8000,
      sound: true,
      celebration: true
    };

    this.showNotification(notification);

    toast.success(`⬆️ LEVEL UP! Nível ${levelData.newLevel} - ${levelData.title} (+${levelData.xpGained} XP)`, {
      duration: 8000,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '16px',
        fontWeight: 'bold',
        fontSize: '16px',
      }
    });

    if (this.preferences.enableCelebrations) {
      this.triggerCelebration('levelup');
    }
  }

  /**
   * Show streak milestone notification
   */
  showStreakMilestoneNotification(streakData: {
    type: string;
    count: number;
    milestone: string;
    reward: number;
    badge?: string;
  }): void {
    if (!this.preferences.enableNotifications || !this.preferences.streakNotifications) return;

    const notification: NotificationData = {
      id: `streak-${streakData.type}-${streakData.count}-${Date.now()}`,
      type: 'streak_milestone',
      title: '🔥 Marco de Streak!',
      message: `${streakData.count} dias consecutivos - ${streakData.milestone}`,
      data: streakData,
      timestamp: new Date(),
      priority: 'high',
      duration: 5000,
      sound: true,
      celebration: true
    };

    this.showNotification(notification);

    toast.success(`🔥 Marco de Streak! ${streakData.count} dias - ${streakData.milestone} (+${streakData.reward} XP)`, {
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontWeight: 'bold',
      }
    });

    if (this.preferences.enableCelebrations) {
      this.triggerCelebration('streak');
    }
  }

  /**
   * Show streak warning notification
   */
  showStreakWarningNotification(streakData: {
    type: string;
    count: number;
    hoursLeft: number;
    canUseFreeze: boolean;
  }): void {
    if (!this.preferences.enableNotifications || !this.preferences.streakNotifications) return;

    const freezeText = streakData.canUseFreeze ? ' (💎 Freeze disponível)' : '';
    toast.warning(`⚠️ Streak em Risco! ${streakData.count} dias - ${streakData.hoursLeft}h restantes${freezeText}`, {
      duration: 8000,
      style: {
        background: 'linear-gradient(135deg, #ffa500 0%, #ff6b6b 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontWeight: 'bold',
      }
    });
  }

  /**
   * Show XP gained notification
   */
  showXPNotification(xpData: {
    amount: number;
    source: string;
    multiplier?: number;
  }): void {
    if (!this.preferences.enableNotifications || !this.preferences.xpNotifications) return;

    // Only show for significant XP gains (>= 25 XP)
    if (xpData.amount < 25) return;

    const multiplierText = xpData.multiplier && xpData.multiplier > 1 ? ` (x${xpData.multiplier})` : '';
    toast.info(`⚡ +${xpData.amount} XP${multiplierText} - ${xpData.source}`, {
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '10px',
        fontWeight: 'bold',
      }
    });
  }

  /**
   * Show badge earned notification
   */
  showBadgeNotification(badge: {
    id: string;
    name: string;
    rarity: string;
    category: string;
  }): void {
    if (!this.preferences.enableNotifications) return;

    toast.success(`🎖️ Badge Conquistado! ${badge.name} (Raridade: ${badge.rarity})`, {
      duration: 5000,
      style: {
        background: this.getRarityColor(badge.rarity),
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontWeight: 'bold',
      }
    });

    if (this.preferences.enableCelebrations) {
      this.triggerCelebration('badge');
    }
  }

  /**
   * Generic notification display
   */
  private showNotification(notification: NotificationData): void {
    this.notificationQueue.push(notification);

    if (this.preferences.enableSounds && notification.sound) {
      this.playNotificationSound(notification.type);
    }

    // Store in localStorage for persistence
    this.saveNotificationToHistory(notification);
  }

  /**
   * Trigger celebration animation
   */
  private triggerCelebration(type: string): void {
    if (!this.celebrationContainer || !this.preferences.enableCelebrations) return;

    // Create confetti/celebration animation
    const celebration = document.createElement('div');
    celebration.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 60px;
      animation: celebration-bounce 2s ease-out;
      pointer-events: none;
    `;

    const emojis = {
      achievement: '🎉',
      levelup: '🌟',
      streak: '🔥',
      badge: '🎖️'
    };

    celebration.textContent = emojis[type as keyof typeof emojis] || '✨';
    this.celebrationContainer.appendChild(celebration);

    // Add CSS animation if not exists
    if (!document.getElementById('celebration-styles')) {
      const style = document.createElement('style');
      style.id = 'celebration-styles';
      style.textContent = `
        @keyframes celebration-bounce {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.2) rotate(10deg); opacity: 1; }
          40% { transform: translate(-50%, -50%) scale(0.9) rotate(-5deg); opacity: 1; }
          60% { transform: translate(-50%, -50%) scale(1.1) rotate(3deg); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(0.95) rotate(-1deg); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0; }
        }
        .animate-enter { animation: slideIn 0.3s ease-out; }
        .animate-leave { animation: slideOut 0.3s ease-in; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove celebration after animation
    setTimeout(() => {
      if (this.celebrationContainer?.contains(celebration)) {
        this.celebrationContainer.removeChild(celebration);
      }
    }, 2000);
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(type: string): void {
    // Create audio context for web audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        achievement: [523, 659, 784], // C5, E5, G5
        level_up: [440, 554, 659, 784], // A4, C#5, E5, G5
        streak_milestone: [392, 523, 659], // G4, C5, E5
        badge_earned: [523, 659, 784], // C5, E5, G5
        xp_gained: [659], // E5
        streak_warning: [330, 392] // E4, G4
      };

      const notes = frequencies[type as keyof typeof frequencies] || [523];
      
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
        }, index * 100);
      });
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  }

  /**
   * Get color for rarity
   */
  private getRarityColor(rarity: string): string {
    const colors = {
      common: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
      uncommon: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      rare: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
      epic: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)',
      legendary: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  }

  /**
   * Save notification to history
   */
  private saveNotificationToHistory(notification: NotificationData): void {
    const history = JSON.parse(localStorage.getItem('gamification-notifications') || '[]');
    history.unshift(notification);
    
    // Keep only last 50 notifications
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('gamification-notifications', JSON.stringify(history));
  }

  /**
   * Get notification history
   */
  getNotificationHistory(): NotificationData[] {
    return JSON.parse(localStorage.getItem('gamification-notifications') || '[]');
  }

  /**
   * Clear notification history
   */
  clearNotificationHistory(): void {
    localStorage.removeItem('gamification-notifications');
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
}

export const gamificationNotifications = new GamificationNotificationService();
export default gamificationNotifications;