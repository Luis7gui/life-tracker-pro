/**
 * Life Tracker Pro - Stat Card Component
 * Modern, reusable stat card with consistent styling
 */

import React, { memo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-blue-100',
  trend,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg border border-gray-200 p-6 
        transition-all duration-200 hover:shadow-xl
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={`p-3 ${iconBgColor} rounded-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
        )}
        {trend && (
          <div className={`text-sm font-medium px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      
      <p className="text-sm font-medium text-gray-700">{title}</p>
    </div>
  );
};

export default memo(StatCard);
