/**
 * Life Tracker Pro - Notification Component
 * Toast-style notifications with different types and auto-dismiss
 */

import React, { useState, useEffect } from 'react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '✅',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: '⚠️',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '❌',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'ℹ️',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: '💬',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        ${styles.bg} ${styles.border} border rounded-lg shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${className}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{styles.icon}</span>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${styles.titleColor}`}>
              {title}
            </h3>
            {message && (
              <p className={`mt-1 text-sm ${styles.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex ${styles.messageColor} hover:${styles.titleColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
