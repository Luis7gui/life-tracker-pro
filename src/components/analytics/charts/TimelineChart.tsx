/**
 * Life Tracker Pro - Timeline Chart Component
 * Interactive timeline visualization for productivity tracking
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { analyticsService, TimeSeriesData } from '../../../services/api/AnalyticsService';
import { useNotifications } from '../../../hooks/useNotifications';

interface TimelineChartProps {
  metric?: 'productivity' | 'time' | 'sessions';
  interval?: 'hour' | 'day' | 'week' | 'month';
  height?: number;
  showPredictions?: boolean;
  showTrendLine?: boolean;
  categories?: string[];
  className?: string;
}

export default function TimelineChart({
  metric = 'productivity',
  interval = 'day',
  height = 400,
  showPredictions = false,
  showTrendLine = true,
  categories,
  className = ''
}: TimelineChartProps) {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [predictions, setPredictions] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const { error } = useNotifications();

  useEffect(() => {
    loadData();
  }, [selectedMetric, selectedInterval, categories, dateRange]);

  useEffect(() => {
    if (showPredictions && selectedMetric === 'productivity') {
      loadPredictions();
    }
  }, [showPredictions, selectedMetric]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        categories
      };

      const timeSeries = await analyticsService.getTimeSeries(
        selectedMetric,
        selectedInterval,
        filters
      );

      setData(timeSeries);
    } catch (err) {
      console.error('Failed to load timeline data:', err);
      error('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    try {
      const predictionData = await analyticsService.getPredictions(7);
      setPredictions(predictionData.predictions.map(pred => ({
        date: pred.date,
        value: pred.value,
        metadata: { isPrediction: true }
      })));
    } catch (err) {
      console.error('Failed to load predictions:', err);
    }
  };

  const handleRefresh = async () => {
    analyticsService.clearCache();
    await loadData();
    if (showPredictions) {
      await loadPredictions();
    }
  };

  const formatXAxisLabel = (tickItem: any) => {
    const date = new Date(tickItem);
    
    switch (selectedInterval) {
      case 'hour':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  const formatYAxisLabel = (value: number) => {
    switch (selectedMetric) {
      case 'productivity':
        return `${value}%`;
      case 'time':
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return hours > 0 ? `${hours}h` : `${minutes}m`;
      case 'sessions':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getMetricLabel = () => {
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

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'productivity':
        return '#3b82f6'; // Blue
      case 'time':
        return '#10b981'; // Green
      case 'sessions':
        return '#f59e0b'; // Amber
      default:
        return '#6b7280'; // Gray
    }
  };

  const calculateTrend = () => {
    if (data.length < 2) return null;
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      isSignificant: Math.abs(change) > 5
    };
  };

  const trend = calculateTrend();
  const combinedData = [...data, ...predictions];
  const avgValue = data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0;

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-accent-primary" />
            Timeline Analysis
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
            <BarChart3 className="h-6 w-6 text-accent-primary" />
            Timeline Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {trend && (
              <Badge 
                variant="secondary" 
                className={`${trend.direction === 'up' ? 'text-green-400' : trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'} bg-surface-2 border-glass-border`}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : (
                  <BarChart3 className="h-3 w-3 mr-1" />
                )}
                {trend.change.toFixed(1)}%
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
            <label className="caption text-accent-primary">Interval:</label>
            <Select value={selectedInterval} onValueChange={(value: any) => setSelectedInterval(value)}>
              <SelectTrigger className="w-32 glass-card border-glass-border text-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="hour">Hourly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="heading-4 mono" style={{ color: getMetricColor() }}>
              {selectedMetric === 'productivity' ? `${avgValue.toFixed(1)}%` : 
               selectedMetric === 'time' ? analyticsService.formatDuration(avgValue) :
               Math.round(avgValue)}
            </div>
            <div className="caption">Average {getMetricLabel()}</div>
          </div>
          
          <div className="text-center">
            <div className="heading-4 mono text-accent-secondary">
              {data.length}
            </div>
            <div className="caption">Data Points</div>
          </div>
          
          {data.length > 0 && (
            <>
              <div className="text-center">
                <div className="heading-4 mono text-accent-tertiary">
                  {selectedMetric === 'productivity' ? `${Math.max(...data.map(d => d.value)).toFixed(1)}%` :
                   selectedMetric === 'time' ? analyticsService.formatDuration(Math.max(...data.map(d => d.value))) :
                   Math.max(...data.map(d => d.value))}
                </div>
                <div className="caption">Peak Value</div>
              </div>
              
              <div className="text-center">
                <div className="heading-4 mono text-accent-quaternary">
                  {selectedMetric === 'productivity' ? `${Math.min(...data.map(d => d.value)).toFixed(1)}%` :
                   selectedMetric === 'time' ? analyticsService.formatDuration(Math.min(...data.map(d => d.value))) :
                   Math.min(...data.map(d => d.value))}
                </div>
                <div className="caption">Low Value</div>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            
            <XAxis 
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              stroke="#9ca3af"
              fontSize={12}
            />
            
            <YAxis 
              tickFormatter={formatYAxisLabel}
              stroke="#9ca3af"
              fontSize={12}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}
              labelFormatter={(label) => formatXAxisLabel(label)}
              formatter={(value: any, name: string, props: any) => {
                const isPrediction = props.payload?.metadata?.isPrediction;
                return [
                  formatYAxisLabel(value),
                  isPrediction ? 'Predicted' : getMetricLabel()
                ];
              }}
            />

            {/* Main data area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={getMetricColor()}
              strokeWidth={2}
              fill="url(#colorMetric)"
              dot={{ fill: getMetricColor(), strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: getMetricColor(), strokeWidth: 2 }}
            />

            {/* Predictions area */}
            {showPredictions && predictions.length > 0 && (
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorPrediction)"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 2 }}
              />
            )}

            {/* Average line */}
            {showTrendLine && data.length > 0 && (
              <ReferenceLine 
                y={avgValue} 
                stroke="#f59e0b" 
                strokeDasharray="2 2" 
                label={{ value: "Average", position: "top" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getMetricColor() }}
            />
            <span className="caption text-2">{getMetricLabel()}</span>
          </div>
          
          {showPredictions && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-gray-500 opacity-60" />
              <span className="caption text-2">Predictions</span>
            </div>
          )}
          
          {showTrendLine && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-amber-500" style={{ borderStyle: 'dashed' }} />
              <span className="caption text-2">Average</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}