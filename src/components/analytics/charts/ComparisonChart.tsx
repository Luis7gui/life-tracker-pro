/**
 * Life Tracker Pro - Comparison Chart Component
 * Interactive comparison visualization between different time periods
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { analyticsService } from '../../../services/api/AnalyticsService';
import { useNotifications } from '../../../hooks/useNotifications';

interface ComparisonData {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface ComparisonChartProps {
  metric?: 'productivity' | 'time' | 'sessions';
  comparisonType?: 'week' | 'month' | 'quarter' | 'custom';
  height?: number;
  showPercentages?: boolean;
  showTrends?: boolean;
  categories?: string[];
  className?: string;
}

export default function ComparisonChart({
  metric = 'productivity',
  comparisonType = 'week',
  height = 400,
  showPercentages = true,
  showTrends = true,
  categories,
  className = ''
}: ComparisonChartProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [selectedComparison, setSelectedComparison] = useState(comparisonType);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState('');
  const [previousPeriodLabel, setPreviousPeriodLabel] = useState('');
  const [overallTrend, setOverallTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const { error } = useNotifications();

  useEffect(() => {
    loadComparisonData();
  }, [selectedMetric, selectedComparison, categories]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges for comparison
      const { currentStart, currentEnd, previousStart, previousEnd, currentLabel, previousLabel } = 
        getComparisonDates(selectedComparison);

      setCurrentPeriodLabel(currentLabel);
      setPreviousPeriodLabel(previousLabel);

      // Get data for both periods
      const [currentData, previousData] = await Promise.all([
        analyticsService.getMetrics({
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          categories
        }),
        analyticsService.getMetrics({
          startDate: previousStart.toISOString(),
          endDate: previousEnd.toISOString(),
          categories
        })
      ]);

      // Process comparison data
      const comparisonData = processComparisonData(
        currentData.categories,
        previousData.categories,
        selectedMetric
      );

      setData(comparisonData);
      setOverallTrend(calculateOverallTrend(comparisonData));
    } catch (err) {
      console.error('Failed to load comparison data:', err);
      error('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const getComparisonDates = (type: string) => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
    let currentLabel: string, previousLabel: string;

    switch (type) {
      case 'week':
        // Current week vs previous week
        currentEnd = new Date(now);
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart);
        previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        currentLabel = 'This Week';
        previousLabel = 'Last Week';
        break;
        
      case 'month':
        // Current month vs previous month
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        currentLabel = 'This Month';
        previousLabel = 'Last Month';
        break;
        
      case 'quarter':
        // Current quarter vs previous quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        currentEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        previousStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
        currentLabel = `Q${currentQuarter + 1} ${now.getFullYear()}`;
        previousLabel = `Q${currentQuarter} ${now.getFullYear()}`;
        break;
        
      default:
        // Default to week
        currentEnd = new Date(now);
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart);
        previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        currentLabel = 'Current';
        previousLabel = 'Previous';
    }

    return { currentStart, currentEnd, previousStart, previousEnd, currentLabel, previousLabel };
  };

  const processComparisonData = (currentCats: any[], previousCats: any[], metric: string): ComparisonData[] => {
    const allCategories = new Set([
      ...currentCats.map(cat => cat.category),
      ...previousCats.map(cat => cat.category)
    ]);

    return Array.from(allCategories).map(category => {
      const currentCat = currentCats.find(cat => cat.category === category);
      const previousCat = previousCats.find(cat => cat.category === category);

      let currentValue = 0;
      let previousValue = 0;

      switch (metric) {
        case 'productivity':
          currentValue = currentCat?.productivityScore || 0;
          previousValue = previousCat?.productivityScore || 0;
          break;
        case 'time':
          currentValue = currentCat?.totalTime || 0;
          previousValue = previousCat?.totalTime || 0;
          break;
        case 'sessions':
          currentValue = currentCat?.sessionCount || 0;
          previousValue = previousCat?.sessionCount || 0;
          break;
      }

      const change = currentValue - previousValue;
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
      const trend: 'up' | 'down' | 'stable' = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

      return {
        category,
        current: currentValue,
        previous: previousValue,
        change,
        changePercent,
        trend
      };
    }).sort((a, b) => b.current - a.current); // Sort by current value descending
  };

  const calculateOverallTrend = (data: ComparisonData[]): 'up' | 'down' | 'stable' => {
    const totalCurrentSum = data.reduce((sum, item) => sum + item.current, 0);
    const totalPreviousSum = data.reduce((sum, item) => sum + item.previous, 0);
    const overallChange = totalCurrentSum - totalPreviousSum;
    
    if (Math.abs(overallChange) < 0.1) return 'stable';
    return overallChange > 0 ? 'up' : 'down';
  };

  const handleRefresh = async () => {
    analyticsService.clearCache();
    await loadComparisonData();
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
        return Math.round(value).toString();
      default:
        return value.toFixed(1);
    }
  };

  const formatChange = (change: number, isPercent: boolean = false): string => {
    if (isPercent) {
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
    return `${change > 0 ? '+' : ''}${formatValue(Math.abs(change))}`;
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

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '#10b981'; // Green
      case 'down': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card border-glass-border p-3 rounded-lg shadow-lg">
          <p className="body text-1 font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="caption text-accent-primary">{currentPeriodLabel}:</span>
              <span className="caption font-mono">{formatValue(data.current)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="caption text-accent-secondary">{previousPeriodLabel}:</span>
              <span className="caption font-mono">{formatValue(data.previous)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-glass-border pt-1">
              <span className="caption">Change:</span>
              <span 
                className={`caption font-mono ${
                  data.trend === 'up' ? 'text-green-400' : 
                  data.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}
              >
                {formatChange(data.change)} ({formatChange(data.changePercent, true)})
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map(item => ({
    ...item,
    category: item.category.length > 10 ? `${item.category.substring(0, 8)}...` : item.category
  }));

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-accent-primary" />
            Period Comparison
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
            Period Comparison
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${
                overallTrend === 'up' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                overallTrend === 'down' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}
            >
              {overallTrend === 'up' ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : overallTrend === 'down' ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : (
                <ArrowRight className="h-3 w-3 mr-1" />
              )}
              Overall {overallTrend === 'stable' ? 'Stable' : overallTrend === 'up' ? 'Improving' : 'Declining'}
            </Badge>
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
            <label className="caption text-accent-primary">Compare:</label>
            <Select value={selectedComparison} onValueChange={(value: any) => setSelectedComparison(value)}>
              <SelectTrigger className="w-32 glass-card border-glass-border text-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="week">Weeks</SelectItem>
                <SelectItem value="month">Months</SelectItem>
                <SelectItem value="quarter">Quarters</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Period Labels */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-primary rounded" />
            <span className="caption text-1">{currentPeriodLabel}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-3" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-secondary rounded" />
            <span className="caption text-1">{previousPeriodLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            
            <XAxis 
              dataKey="category"
              stroke="#9ca3af"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={formatValue}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{ color: '#9ca3af' }}
              iconType="rect"
            />

            <Bar 
              dataKey="current" 
              name={currentPeriodLabel}
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
            />
            
            <Bar 
              dataKey="previous" 
              name={previousPeriodLabel}
              fill="#6b7280"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Table */}
        {showTrends && data.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="body text-1 font-medium">Changes by Category</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.slice(0, 5).map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="caption text-2">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span 
                      className={`caption font-mono ${
                        item.trend === 'up' ? 'text-green-400' : 
                        item.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {formatChange(item.changePercent, true)}
                    </span>
                    {item.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    ) : item.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    ) : (
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}