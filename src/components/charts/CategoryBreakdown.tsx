/**
 * Life Tracker Pro - Category Breakdown Chart
 * Pie chart showing time distribution by category with earthen theme
 */

import React, { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryBreakdownProps {
  data?: CategoryData[];
  className?: string;
}

const EARTHEN_COLORS = [
  '#cc8844', // Primary earthen orange
  '#b8860b', // Dark goldenrod
  '#cd853f', // Peru
  '#daa520', // Goldenrod
  '#a0522d', // Sienna
  '#8b4513', // Saddle brown
];

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data = [], className = '' }) => {
  // Add colors to data if not provided
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || EARTHEN_COLORS[index % EARTHEN_COLORS.length]
  }));

  if (!data.length || data.every(d => d.value === 0)) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-amber-600 font-mono">No category data</p>
          <p className="text-sm text-amber-700/70">Activities will appear here</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-amber-950/90 border border-amber-600/30 rounded px-3 py-2 shadow-lg">
          <p className="text-amber-200 font-mono text-sm">
            {data.name}: {Math.round((data.value / 60) * 10) / 10}m
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-mono text-amber-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`h-64 w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(CategoryBreakdown);