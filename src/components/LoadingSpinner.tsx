/**
 * Life Tracker Pro - Loading Spinner Component
 * Animated loading indicators with different variants
 */

import React, { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'dots' | 'bars';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`} />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={`${sizeClasses.sm} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
            <div className={`${sizeClasses.sm} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
            <div className={`${sizeClasses.sm} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1">
            <div className={`w-1 ${sizeClasses[size]} bg-blue-600 animate-pulse`} style={{ animationDelay: '0ms' }} />
            <div className={`w-1 ${sizeClasses[size]} bg-blue-600 animate-pulse`} style={{ animationDelay: '150ms' }} />
            <div className={`w-1 ${sizeClasses[size]} bg-blue-600 animate-pulse`} style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      default:
        return (
          <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`} />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {text && (
        <p className="mt-3 text-sm text-gray-600 text-center">{text}</p>
      )}
    </div>
  );
};

export default memo(LoadingSpinner);
