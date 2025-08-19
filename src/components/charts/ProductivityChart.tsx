/**
 * Life Tracker Pro - Productivity Chart Component
 * Time of day productivity visualization with earthen theme
 */

import React, { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ProductivityChartProps {
  data?: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  className?: string;
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({ data, className = '' }) => {
  const chartData = data ? [
    { time: '6-12h', label: 'Morning', value: Math.round((data.morning / 60) * 10) / 10 },
    { time: '12-18h', label: 'Afternoon', value: Math.round((data.afternoon / 60) * 10) / 10 },
    { time: '18-24h', label: 'Evening', value: Math.round((data.evening / 60) * 10) / 10 },
    { time: '0-6h', label: 'Night', value: Math.round((data.night / 60) * 10) / 10 },
  ] : [];

  if (!data || chartData.every(d => d.value === 0)) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-amber-600 font-mono">No productivity data yet</p>
          <p className="text-sm text-amber-700/70">Start tracking to see your patterns</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-64 w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#cc8844" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#cc8844" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a68b5b', fontSize: 12, fontFamily: 'monospace' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a68b5b', fontSize: 12, fontFamily: 'monospace' }}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#a68b5b' } }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(204, 136, 68, 0.1)" />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#cc8844"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#productivityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(ProductivityChart);