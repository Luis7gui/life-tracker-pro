/**
 * Life Tracker Pro - Heatmap Chart Component
 * Interactive heatmap visualization for time-of-day productivity patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  RefreshCw,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { analyticsService } from '../../../services/api/AnalyticsService';
import { useNotifications } from '../../../hooks/useNotifications';

interface HeatmapData {
  hour: number;
  day: number;
  dayName: string;
  value: number;
  sessions: number;
  category?: string;
}

interface HeatmapChartProps {
  metric?: 'productivity' | 'time' | 'sessions';
  period?: 'week' | 'month' | 'quarter';
  height?: number;
  categories?: string[];
  className?: string;
}

export default function HeatmapChart({
  metric = 'productivity',
  period = 'month',
  height = 400,
  categories,
  className = ''
}: HeatmapChartProps) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);
  const { error } = useNotifications();

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    loadData();
  }, [selectedMetric, selectedPeriod, categories]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }

      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        categories
      };

      // Get time series data for heatmap
      const timeSeries = await analyticsService.getTimeSeries(
        selectedMetric,
        'hour',
        filters
      );

      // Transform data for heatmap
      const heatmapData: HeatmapData[] = [];
      
      // Initialize grid with zeros
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmapData.push({
            hour,
            day,
            dayName: dayNames[day],
            value: 0,
            sessions: 0
          });
        }
      }

      // Fill with actual data
      timeSeries.forEach(point => {
        const date = new Date(point.date);
        const day = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const hour = date.getHours();
        
        const cellIndex = day * 24 + hour;
        if (cellIndex < heatmapData.length) {
          heatmapData[cellIndex].value += point.value;
          heatmapData[cellIndex].sessions += 1;
        }
      });

      // Calculate averages for cells with data
      heatmapData.forEach(cell => {
        if (cell.sessions > 0) {
          cell.value = cell.value / cell.sessions;
        }
      });

      setData(heatmapData);
    } catch (err) {
      console.error('Failed to load heatmap data:', err);
      error('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    analyticsService.clearCache();
    await loadData();
  };

  const getIntensityColor = (value: number, maxValue: number): string => {
    if (value === 0) return 'rgba(75, 85, 99, 0.1)'; // Very light gray for no data
    
    const intensity = Math.min(value / maxValue, 1);
    
    switch (selectedMetric) {
      case 'productivity':
        // Green gradient for productivity
        return `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`;
      case 'time':
        // Blue gradient for time
        return `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`;
      case 'sessions':
        // Purple gradient for sessions
        return `rgba(139, 92, 246, ${0.2 + intensity * 0.8})`;
      default:
        return `rgba(107, 114, 128, ${0.2 + intensity * 0.8})`;
    }
  };

  const formatValue = (value: number): string => {
    switch (selectedMetric) {
      case 'productivity':
        return `${value.toFixed(1)}%`;
      case 'time':
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      case 'sessions':
        return value.toString();
      default:
        return value.toFixed(1);
    }
  };

  const getMetricLabel = (): string => {
    switch (selectedMetric) {
      case 'productivity':
        return 'Productivity Score';
      case 'time':
        return 'Time Spent';
      case 'sessions':
        return 'Session Count';
      default:
        return 'Value';
    }
  };

  const getBestTimeSlot = (): { time: string; value: number } | null => {
    if (data.length === 0) return null;
    
    const maxCell = data.reduce((max, cell) => 
      cell.value > max.value ? cell : max
    );
    
    return {
      time: `${dayNames[maxCell.day]} ${maxCell.hour.toString().padStart(2, '0')}:00`,
      value: maxCell.value
    };
  };

  const getActivityPattern = (): string => {
    if (data.length === 0) return 'No data available';
    
    const morningAvg = data.filter(cell => cell.hour >= 6 && cell.hour < 12)
      .reduce((sum, cell) => sum + cell.value, 0) / 6;
    const afternoonAvg = data.filter(cell => cell.hour >= 12 && cell.hour < 18)
      .reduce((sum, cell) => sum + cell.value, 0) / 6;
    const eveningAvg = data.filter(cell => cell.hour >= 18 && cell.hour < 24)
      .reduce((sum, cell) => sum + cell.value, 0) / 6;
    
    const max = Math.max(morningAvg, afternoonAvg, eveningAvg);
    
    if (max === morningAvg) return 'Morning Person';
    if (max === afternoonAvg) return 'Afternoon Peak';
    return 'Evening Worker';
  };

  const maxValue = Math.max(...data.map(cell => cell.value));
  const bestTimeSlot = getBestTimeSlot();
  const activityPattern = getActivityPattern();

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent-primary" />
            Productivity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-glass-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent-primary" />
            Productivity Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            {bestTimeSlot && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                Peak: {bestTimeSlot.time}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-3 hover:text-1"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="caption text-accent-primary">Metric:</label>
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-40 glass-card border-glass-border text-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="time">Time Spent</SelectItem>
                <SelectItem value="sessions">Sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="caption text-accent-primary">Period:</label>
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32 glass-card border-glass-border text-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="heading-4 mono text-accent-primary">
              {formatValue(maxValue)}
            </div>
            <div className="caption">Peak {getMetricLabel()}</div>
          </div>
          
          <div className="text-center">
            <div className="heading-4 mono text-accent-secondary">
              {activityPattern}
            </div>
            <div className="caption">Activity Pattern</div>
          </div>
          
          <div className="text-center">
            <div className="heading-4 mono text-accent-tertiary">
              {data.filter(cell => cell.value > 0).length}
            </div>
            <div className="caption">Active Time Slots</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Hour Labels */}
          <div className="flex">
            <div className="w-12"></div> {/* Space for day labels */}
            <div className="flex-1 grid grid-cols-24 gap-px">
              {hours.map(hour => (
                <div key={hour} className="text-center">
                  <span className="caption text-3 text-xs">
                    {hour % 6 === 0 ? hour.toString().padStart(2, '0') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-px">
            {dayNames.map((dayName, dayIndex) => (
              <div key={dayName} className="flex items-center">
                {/* Day Label */}
                <div className="w-12 text-right pr-2">
                  <span className="caption text-accent-primary font-medium">{dayName}</span>
                </div>
                
                {/* Hour Cells */}
                <div className="flex-1 grid grid-cols-24 gap-px">
                  {hours.map(hour => {
                    const cellData = data.find(cell => cell.day === dayIndex && cell.hour === hour);
                    const value = cellData?.value || 0;
                    
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="relative h-6 rounded-sm border border-glass-border cursor-pointer transition-all hover:scale-110 hover:z-10"
                        style={{
                          backgroundColor: getIntensityColor(value, maxValue)
                        }}
                        onMouseEnter={() => setHoveredCell(cellData || null)}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Time Period Indicators */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-400" />
              <span className="caption text-2">6AM - 6PM</span>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-400" />
              <span className="caption text-2">6PM - 6AM</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="caption text-3">Less</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
                <div
                  key={intensity}
                  className="w-3 h-3 rounded-sm border border-glass-border"
                  style={{
                    backgroundColor: getIntensityColor(intensity * maxValue, maxValue)
                  }}
                />
              ))}
            </div>
            <span className="caption text-3">More</span>
          </div>

          {/* Hover Tooltip */}
          {hoveredCell && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 px-3 py-2 glass-card border-glass-border rounded-lg shadow-lg">
              <div className="text-center">
                <div className="body text-1 font-medium">
                  {hoveredCell.dayName} {hoveredCell.hour.toString().padStart(2, '0')}:00
                </div>
                <div className="caption text-accent-primary">
                  {formatValue(hoveredCell.value)}
                </div>
                {hoveredCell.sessions > 0 && (
                  <div className="caption text-3">
                    {hoveredCell.sessions} session(s)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}