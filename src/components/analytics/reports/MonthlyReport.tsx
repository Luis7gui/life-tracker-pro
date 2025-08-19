/**
 * Life Tracker Pro - Monthly Report Component
 * Comprehensive monthly productivity report display
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  BarChart3,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle
} from 'lucide-react';
import { analyticsService, MonthlyReport as MonthlyReportType } from '../../../services/api/AnalyticsService';
import { useNotifications } from '../../../hooks/useNotifications';
import TimelineChart from '../charts/TimelineChart';
import ComparisonChart from '../charts/ComparisonChart';

interface MonthlyReportProps {
  monthStart?: Date;
  onExport?: (format: 'pdf' | 'excel') => void;
  className?: string;
}

export default function MonthlyReport({ 
  monthStart, 
  onExport,
  className = '' 
}: MonthlyReportProps) {
  const [report, setReport] = useState<MonthlyReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonthStart, setCurrentMonthStart] = useState(
    monthStart || getStartOfMonth(new Date())
  );
  const { error, success } = useNotifications();

  useEffect(() => {
    generateReport();
  }, [currentMonthStart]);

  function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  const generateReport = async () => {
    try {
      setLoading(true);
      const reportData = await analyticsService.generateMonthlyReport(currentMonthStart);
      setReport(reportData);
    } catch (err) {
      console.error('Failed to generate monthly report:', err);
      error('Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonthStart);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentMonthStart(newDate);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!report) return;
    
    try {
      const response = await fetch(`/api/analytics/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'monthly',
          reportData: report
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-report-${currentMonthStart.toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(`Monthly report exported as ${format.toUpperCase()}`);
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

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />;
      case 'down': return <TrendingDown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader>
          <CardTitle className="heading-3 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent-primary" />
            Monthly Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardContent className="text-center py-8">
          <div className="text-gray-400">No data available for this month</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-accent-primary" />
              <div>
                <CardTitle className="heading-3">Monthly Report</CardTitle>
                <p className="caption text-3 mt-1">{report.period.label}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="text-3 hover:text-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="text-3 hover:text-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={generateReport}
                className="text-3 hover:text-1"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExport('pdf')}
                className="text-accent-primary hover:text-accent-primary/80"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Overview */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="heading-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent-primary" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="heading-2 mono text-accent-primary">
                {formatDuration(report.summary.totalTime)}
              </div>
              <div className="caption text-2">Total Time</div>
            </div>
            
            <div className="text-center">
              <div className="heading-2 mono text-accent-secondary">
                {report.summary.totalSessions}
              </div>
              <div className="caption text-2">Sessions</div>
            </div>
            
            <div className="text-center">
              <div className="heading-2 mono text-accent-tertiary">
                {formatDuration(report.summary.avgWeeklyTime)}
              </div>
              <div className="caption text-2">Avg Weekly Time</div>
            </div>
            
            <div className="text-center">
              <div className={`heading-2 mono ${getProgressColor(report.summary.consistency)}`}>
                {report.summary.consistency.toFixed(1)}%
              </div>
              <div className="caption text-2">Consistency</div>
            </div>
          </div>

          {/* Trend Badge */}
          <div className="flex justify-center mt-6">
            <Badge 
              variant="secondary" 
              className={`${getTrendColor(report.summary.productivityTrend)} bg-surface-2 border-glass-border`}
            >
              {getTrendIcon(report.summary.productivityTrend)}
              <span className="ml-1">
                {report.summary.productivityTrend === 'up' ? 'Improving' : 
                 report.summary.productivityTrend === 'down' ? 'Declining' : 'Stable'} Trend
              </span>
            </Badge>
          </div>

          {/* Best Week */}
          {report.summary.bestWeek && (
            <div className="mt-4 p-3 glass-card border-glass-border rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="h-4 w-4 text-yellow-400" />
                <span className="body text-1 font-medium">Best Week</span>
              </div>
              <span className="caption text-accent-primary">{report.summary.bestWeek}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Achievement */}
      {report.goals && (
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="heading-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-accent-primary" />
              Goal Achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="body text-1 font-medium">Monthly Goals</div>
                  <div className="caption text-3">
                    {report.goals.achieved} of {report.goals.total} goals completed
                  </div>
                </div>
                <div className="text-right">
                  <div className={`heading-3 mono ${getProgressColor(report.goals.percentage)}`}>
                    {report.goals.percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <Progress 
                value={report.goals.percentage} 
                className="h-2"
              />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="caption">
                    {report.goals.achieved} Completed
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span className="caption">
                    {report.goals.total - report.goals.achieved} Remaining
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Timeline */}
      <TimelineChart
        metric="productivity"
        interval="week"
        height={300}
        showPredictions={false}
        showTrendLine={true}
        className="mb-6"
      />

      {/* Period Comparison */}
      <ComparisonChart
        metric="productivity"
        comparisonType="month"
        height={350}
        showPercentages={true}
        showTrends={true}
        categories={undefined}
        className="mb-6"
      />

      {/* Key Insights */}
      {report.insights && report.insights.length > 0 && (
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="heading-4">Monthly Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.insights.map((insight, index) => (
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

      {/* Next Month Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="heading-4">Next Month Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 glass-card border-glass-border rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-medium">
                    💡
                  </div>
                  <div className="body text-2">{recommendation}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="heading-4 mono text-1">
              {formatDuration(report.summary.totalTime)}
            </div>
            <div className="caption text-3">Total Active Time</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent-secondary/20 text-accent-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6" />
            </div>
            <div className="heading-4 mono text-1">
              {report.summary.totalSessions}
            </div>
            <div className="caption text-3">Total Sessions</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent-tertiary/20 text-accent-tertiary rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6" />
            </div>
            <div className={`heading-4 mono ${getProgressColor(report.summary.consistency)}`}>
              {report.summary.consistency.toFixed(1)}%
            </div>
            <div className="caption text-3">Consistency Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="body text-1 font-medium">Export Monthly Report</h4>
              <p className="caption text-3">Download this comprehensive monthly analysis</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                className="border-glass-border"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                className="border-glass-border"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}