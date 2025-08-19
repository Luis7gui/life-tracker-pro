/**
 * Life Tracker Pro - Weekly Report Component
 * Comprehensive weekly productivity report display
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Target,
  BarChart3,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { analyticsService, WeeklyReport as WeeklyReportType } from '../../../services/api/AnalyticsService';
import { useNotifications } from '../../../hooks/useNotifications';
import TimelineChart from '../charts/TimelineChart';

interface WeeklyReportProps {
  weekStart?: Date;
  onExport?: (format: 'pdf' | 'excel') => void;
  className?: string;
}

export default function WeeklyReport({ 
  weekStart, 
  onExport,
  className = '' 
}: WeeklyReportProps) {
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    weekStart || getStartOfWeek(new Date())
  );
  const { error, success } = useNotifications();

  useEffect(() => {
    generateReport();
  }, [currentWeekStart]);

  function getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const generateReport = async () => {
    try {
      setLoading(true);
      const reportData = await analyticsService.generateWeeklyReport(currentWeekStart);
      setReport(reportData);
    } catch (err) {
      console.error('Failed to generate weekly report:', err);
      error('Failed to generate weekly report');
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!report) return;
    
    try {
      const response = await fetch(`/api/analytics/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'weekly',
          reportData: report
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly-report-${currentWeekStart.toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(`Weekly report exported as ${format.toUpperCase()}`);
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

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader>
          <CardTitle className="heading-3 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent-primary" />
            Weekly Report
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
          <div className="text-gray-400">No data available for this week</div>
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
                <CardTitle className="heading-3">Weekly Report</CardTitle>
                <p className="caption text-3 mt-1">{report.period.label}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="text-3 hover:text-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateWeek('next')}
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

      {/* Executive Summary */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="heading-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent-primary" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="heading-2 mono text-accent-primary">
                {formatDuration(report.summary.totalTime)}
              </div>
              <div className="caption text-2">Total Active Time</div>
            </div>
            
            <div className="text-center">
              <div className="heading-2 mono text-accent-secondary">
                {report.summary.totalSessions}
              </div>
              <div className="caption text-2">Sessions</div>
            </div>
            
            <div className="text-center">
              <div className={`heading-2 mono ${getProgressColor(report.summary.productivityScore)}`}>
                {report.summary.productivityScore.toFixed(1)}%
              </div>
              <div className="caption text-2">Avg Productivity</div>
            </div>
            
            <div className="text-center">
              <div className="heading-2 mono text-accent-quaternary">
                {formatDuration(report.summary.avgDailyTime)}
              </div>
              <div className="caption text-2">Daily Average</div>
            </div>
          </div>

          {/* Improvement Badge */}
          {report.summary.improvement !== 0 && (
            <div className="flex justify-center mt-4">
              <Badge 
                variant="secondary" 
                className={`${
                  report.summary.improvement > 0 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {report.summary.improvement > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(report.summary.improvement).toFixed(1)}% vs last week
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Timeline */}
      <TimelineChart
        metric="productivity"
        interval="day"
        height={300}
        showPredictions={false}
        showTrendLine={true}
        className="mb-6"
      />

      {/* Top Category */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="heading-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-primary" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 glass-card border-glass-border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-accent-primary/20 text-accent-primary border-accent-primary/30">
                  👑 Top Category
                </Badge>
                <div>
                  <div className="body text-1 font-medium">{report.summary.topCategory}</div>
                  <div className="caption text-3">Most productive category this week</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {report.insights && report.insights.length > 0 && (
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="heading-4">Key Insights</CardTitle>
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

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="heading-4">Recommendations</CardTitle>
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

      {/* Export Actions */}
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="body text-1 font-medium">Export Report</h4>
              <p className="caption text-3">Download this report for sharing or archiving</p>
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
        </CardContent>
      </Card>
    </div>
  );
}