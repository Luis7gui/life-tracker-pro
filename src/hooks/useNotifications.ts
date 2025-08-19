/**
 * Life Tracker Pro - Notifications Hook
 * Centralized notification management with queue system
 */

import { useState, useCallback } from 'react';
import { NotificationType } from '../components/Notification';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationItem = {
      id,
      type,
      title,
      message,
      duration
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (duration && duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('success', title, message, duration);
  }, [addNotification]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('warning', title, message, duration);
  }, [addNotification]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('error', title, message, duration);
  }, [addNotification]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('info', title, message, duration);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    warning,
    error,
    info
  };
};
