/**
 * Life Tracker Pro - Custom Report Component
 * Flexible custom period report builder and display
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  Calendar, 
  Settings,
  BarChart3,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  Clock,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { analyticsService } from '../../../services/api/AnalyticsService';
import { useNotifications } from '../../../hooks/useNotifications';
import TimelineChart from '../charts/TimelineChart';
import HeatmapChart from '../charts/HeatmapChart';
import ComparisonChart from '../charts/ComparisonChart';

interface CustomReportProps {
  onExport?: (format: 'pdf' | 'excel') => void;
  className?: string;
}

interface ReportConfig {
  title: string;
  startDate: Date;
  endDate: Date;
  categories: string[];
  metrics: string[];
  includeCharts: boolean;
  includeComparison: boolean;
  includeHeatmap: boolean;
  showDailyBreakdown: boolean;
  showCategoryAnalysis: boolean;
  showInsights: boolean;
}

export default function CustomReport({ 
  onExport,
  className = '' 
}: CustomReportProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [config, setConfig] = useState<ReportConfig>({
    title: 'Custom Analytics Report',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    categories: [],
    metrics: ['productivity', 'time', 'sessions'],
    includeCharts: true,
    includeComparison: false,
    includeHeatmap: true,
    showDailyBreakdown: true,
    showCategoryAnalysis: true,
    showInsights: true
  });
  
  const { error, success } = useNotifications();

  useEffect(() => {
    loadAvailableCategories();
  }, []);

  useEffect(() => {
    if (reportData) {
      generateReport();
    }
  }, [config]);

  const loadAvailableCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setAvailableCategories(data.categories.map((cat: any) => cat.name));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const filters = {
        startDate: config.startDate.toISOString(),
        endDate: config.endDate.toISOString(),
        categories: config.categories.length > 0 ? config.categories : undefined
      };

      // Generate comprehensive report data
      const [metrics, trends, timeSeries, distributions] = await Promise.all([
        analyticsService.getMetrics(filters),
        analyticsService.getTrends(30),
        analyticsService.getTimeSeries('productivity', 'day', filters),
        analyticsService.getDistributions('all')
      ]);

      const customReport = {
        title: config.title,
        period: {
          start: config.startDate,
          end: config.endDate,
          label: `${config.startDate.toLocaleDateString()} - ${config.endDate.toLocaleDateString()}`
        },
        summary: {
          totalTime: metrics.categories.reduce((total, cat) => total + cat.totalTime, 0),
          totalSessions: timeSeries.length,
          avgProductivity: metrics.overall.productivityScore || 0,
          dateRange: Math.ceil((config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        metrics,
        trends,
        timeSeries,
        distributions,
        categoryMetrics: metrics.categories,
        insights: generateInsights(metrics, trends),
        config
      };

      setReportData(customReport);
    } catch (err) {
      console.error('Failed to generate custom report:', err);
      error('Failed to generate custom report');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (metrics: any, trends: any): string[] => {
    const insights: string[] = [];
    
    if (metrics.overall.productivityScore > 75) {
      insights.push('Excellent productivity performance during this period');
    } else if (metrics.overall.productivityScore < 50) {
      insights.push('Productivity below average - consider reviewing work patterns');
    }
    
    if (trends.productivityTrend.direction === 'increasing') {
      insights.push('Positive productivity trend observed');
    } else if (trends.productivityTrend.direction === 'decreasing') {
      insights.push('Declining productivity trend - may need intervention');
    }
    
    const topCategory = metrics.categories?.[0];
    if (topCategory) {
      insights.push(`Most time spent in ${topCategory.category} category`);
    }
    
    return insights;
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!reportData) return;
    
    try {
      const response = await fetch(`/api/analytics/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'custom',
          reportData,
          options: {
            includeCharts: config.includeCharts,
            includeRawData: format === 'excel',
            theme: 'professional'
          }
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom-report-${config.startDate.toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(`Custom report exported as ${format.toUpperCase()}`);
      onExport?.(format);
    } catch (err) {
      error(`Failed to export ${format.toUpperCase()} report`);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getProgressColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Panel */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="heading-3 flex items-center gap-3">
            <Settings className="h-6 w-6 text-accent-primary" />
            Custom Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="caption text-accent-primary">Report Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 glass-card border-glass-border rounded-md text-1"
                placeholder="Enter report title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="caption text-accent-primary">Categories</label>
              <Select 
                value={config.categories.join(',')} 
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  categories: value ? value.split(',') : [] 
                }))}
              >
                <SelectTrigger className="glass-card border-glass-border">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="glass-card border-glass-border">
                  <SelectItem value="">All Categories</SelectItem>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="caption text-accent-primary">Start Date</label>
              <input
                type="date"
                value={config.startDate.toISOString().split('T')[0]}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 glass-card border-glass-border rounded-md text-1"
              />
            </div>
            <div className="space-y-2">
              <label className="caption text-accent-primary">End Date</label>
              <input
                type="date"
                value={config.endDate.toISOString().split('T')[0]}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 glass-card border-glass-border rounded-md text-1"
              />
            </div>
          </div>

          {/* Report Options */}
          <div>
            <h4 className="body text-1 font-medium mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-accent-primary" />
              Report Sections
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCharts: checked }))}
                />
                <label className="caption">Include Charts</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.includeHeatmap}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeHeatmap: checked }))}
                />
                <label className="caption">Heatmap Analysis</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.includeComparison}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeComparison: checked }))}
                />
                <label className="caption">Period Comparison</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.showDailyBreakdown}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showDailyBreakdown: checked }))}
                />
                <label className="caption">Daily Breakdown</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.showCategoryAnalysis}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showCategoryAnalysis: checked }))}
                />
                <label className="caption">Category Analysis</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.showInsights}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showInsights: checked }))}
                />
                <label className="caption">AI Insights</label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="px-8"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <>
          {/* Report Header */}
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="heading-3">{reportData.title}</CardTitle>
                  <p className="caption text-3 mt-1">{reportData.period.label}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    className="border-glass-border"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('excel')}
                    className="border-glass-border"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Statistics */}
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle className="heading-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-primary" />
                Report Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="heading-2 mono text-accent-primary">
                    {reportData.summary.dateRange}
                  </div>
                  <div className="caption text-2">Days Analyzed</div>
                </div>
                
                <div className="text-center">
                  <div className="heading-2 mono text-accent-secondary">
                    {formatDuration(reportData.summary.totalTime)}
                  </div>
                  <div className="caption text-2">Total Time</div>
                </div>
                
                <div className="text-center">
                  <div className="heading-2 mono text-accent-tertiary">
                    {reportData.summary.totalSessions}
                  </div>
                  <div className="caption text-2">Sessions</div>
                </div>
                
                <div className="text-center">
                  <div className={`heading-2 mono ${getProgressColor(reportData.summary.avgProductivity)}`}>
                    {reportData.summary.avgProductivity.toFixed(1)}%
                  </div>
                  <div className="caption text-2">Avg Productivity</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          {config.includeCharts && (
            <>
              <TimelineChart
                metric="productivity"
                interval="day"
                height={300}
                categories={config.categories.length > 0 ? config.categories : undefined}
              />
              
              {config.includeHeatmap && (
                <HeatmapChart
                  metric="productivity"
                  period="month"
                  height={300}
                  categories={config.categories.length > 0 ? config.categories : undefined}
                />
              )}
              
              {config.includeComparison && (
                <ComparisonChart
                  metric="productivity"
                  comparisonType="week"
                  height={350}
                  categories={config.categories.length > 0 ? config.categories : undefined}
                />
              )}
            </>
          )}

          {/* Category Analysis */}
          {config.showCategoryAnalysis && reportData.categoryMetrics && (
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="heading-4">Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.categoryMetrics.slice(0, 5).map((category: any, index: number) => (
                    <div key={category.category} className="flex items-center justify-between p-3 glass-card border-glass-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-surface-2 border-glass-border">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="body text-1 font-medium">{category.category}</div>
                          <div className="caption text-3">
                            {formatDuration(category.totalTime)} • {category.sessionCount} sessions
                          </div>
                        </div>
                      </div>
                      <div className={`body font-mono ${getProgressColor(category.productivityScore)}`}>
                        {category.productivityScore.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {config.showInsights && reportData.insights && reportData.insights.length > 0 && (
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="heading-4">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.insights.map((insight: string, index: number) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 glass-card border-glass-border rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="body text-2">{insight}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}