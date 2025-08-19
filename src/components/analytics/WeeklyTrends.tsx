/**
 * Life Tracker Pro - Weekly Trends Component
 * Analytics view showing weekly productivity patterns
 */

import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface WeeklyData {
  day: string;
  productivity: number;
  sessions: number;
  totalTime: number;
}

interface WeeklyTrendsProps {
  data?: WeeklyData[];
  className?: string;
}

const WeeklyTrends: React.FC<WeeklyTrendsProps> = ({ data = [], className = '' }) => {
  const mockData = [
    { day: 'Mon', productivity: 75, sessions: 8, totalTime: 240 },
    { day: 'Tue', productivity: 82, sessions: 6, totalTime: 180 },
    { day: 'Wed', productivity: 68, sessions: 10, totalTime: 300 },
    { day: 'Thu', productivity: 91, sessions: 7, totalTime: 210 },
    { day: 'Fri', productivity: 64, sessions: 9, totalTime: 270 },
    { day: 'Sat', productivity: 45, sessions: 3, totalTime: 90 },
    { day: 'Sun', productivity: 38, sessions: 2, totalTime: 60 },
  ];

  const chartData = data.length > 0 ? data : mockData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-amber-950/90 border border-amber-600/30 rounded px-3 py-2 shadow-lg">
          <p className="text-amber-200 font-mono text-sm font-bold">{label}</p>
          <p className="text-amber-300 font-mono text-xs">
            Productivity: {data.productivity}%
          </p>
          <p className="text-amber-300 font-mono text-xs">
            Sessions: {data.sessions}
          </p>
          <p className="text-amber-300 font-mono text-xs">
            Time: {Math.round(data.totalTime / 60)}h {data.totalTime % 60}m
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`h-64 w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#cc8844" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#b8860b" stopOpacity={0.7}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(204, 136, 68, 0.1)" />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a68b5b', fontSize: 12, fontFamily: 'monospace' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a68b5b', fontSize: 12, fontFamily: 'monospace' }}
            label={{ value: 'Productivity %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#a68b5b' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="productivity" 
            fill="url(#barGradient)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(WeeklyTrends);