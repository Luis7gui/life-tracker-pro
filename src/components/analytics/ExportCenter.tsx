/**
 * Life Tracker Pro - Export Center Component
 * Unified interface for exporting reports and charts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { 
  Download, 
  FileText, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { analyticsService } from '../../services/api/AnalyticsService';
import { useNotifications } from '../../hooks/useNotifications';

interface ExportJob {
  id: string;
  type: 'pdf' | 'excel' | 'chart';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  progress?: number;
  createdAt: Date;
  downloadUrl?: string;
}

interface ExportCenterProps {
  className?: string;
}

export default function ExportCenter({ className = '' }: ExportCenterProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'charts'>('reports');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [availableFormats, setAvailableFormats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Report options
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'professional'>('professional');
  
  // Chart options
  const [chartType, setChartType] = useState<'timeline' | 'category' | 'heatmap' | 'comparison' | 'trend' | 'dashboard'>('timeline');
  const [chartFormat, setChartFormat] = useState<'png' | 'svg' | 'pdf'>('png');
  const [chartSize, setChartSize] = useState<'small' | 'medium' | 'large' | 'presentation'>('medium');
  
  // Date range for custom reports
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  
  const { success, error } = useNotifications();

  useEffect(() => {
    loadAvailableFormats();
  }, []);

  const loadAvailableFormats = async () => {
    try {
      const response = await fetch('/api/analytics/export/formats');
      const data = await response.json();
      if (data.success) {
        setAvailableFormats(data.data);
      }
    } catch (err) {
      console.error('Failed to load export formats:', err);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // First, generate the report data
      let reportData;
      if (reportType === 'weekly') {
        reportData = await analyticsService.generateWeeklyReport(startDate);
      } else if (reportType === 'monthly') {
        reportData = await analyticsService.generateMonthlyReport(startDate);
      } else {
        reportData = await analyticsService.generateCustomReport(startDate, endDate);
      }

      // Create export job
      const jobId = `export_${Date.now()}`;
      const newJob: ExportJob = {
        id: jobId,
        type: reportFormat === 'pdf' ? 'pdf' : 'excel',
        format: reportFormat,
        status: 'processing',
        filename: `${reportType}-report.${reportFormat === 'pdf' ? 'pdf' : 'xlsx'}`,
        progress: 0,
        createdAt: new Date()
      };

      setExportJobs(prev => [newJob, ...prev]);

      // Submit export request
      const exportEndpoint = reportFormat === 'pdf' ? '/api/analytics/export/pdf' : '/api/analytics/export/excel';
      const exportOptions = {
        includeCharts,
        includeRawData,
        theme,
        ...(reportFormat === 'excel' && { includeSummary: true })
      };

      const response = await fetch(exportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          reportData,
          options: exportOptions,
          format: reportFormat === 'excel' ? 'xlsx' : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download URL
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Update job status
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', progress: 100, downloadUrl }
          : job
      ));

      // Auto-download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = newJob.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success(`${reportType} report exported successfully!`);
    } catch (err) {
      console.error('Export failed:', err);
      error('Failed to export report');
      
      // Update job status to failed
      setExportJobs(prev => prev.map(job => 
        job.status === 'processing' 
          ? { ...job, status: 'failed' }
          : job
      ));
    } finally {
      setLoading(false);
    }
  };

  const generateChart = async () => {
    try {
      setLoading(true);
      
      // Get chart data based on type
      let chartData;
      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      switch (chartType) {
        case 'timeline':
          chartData = await analyticsService.getTimeSeries('productivity', 'day', filters);
          break;
        case 'category':
          const metrics = await analyticsService.getMetrics(filters);
          chartData = metrics.categories;
          break;
        case 'heatmap':
          chartData = await analyticsService.getDistributions('daily');
          break;
        case 'trend':
          const trends = await analyticsService.getTrends(30);
          chartData = {
            trend: trends.productivityTrend,
            predictions: []
          };
          break;
        default:
          throw new Error('Unsupported chart type');
      }

      // Create export job
      const jobId = `chart_${Date.now()}`;
      const newJob: ExportJob = {
        id: jobId,
        type: 'chart',
        format: chartFormat,
        status: 'processing',
        filename: `${chartType}-chart.${chartFormat}`,
        progress: 0,
        createdAt: new Date()
      };

      setExportJobs(prev => [newJob, ...prev]);

      // Get chart size
      const sizes = {
        small: { width: 400, height: 300 },
        medium: { width: 800, height: 400 },
        large: { width: 1200, height: 600 },
        presentation: { width: 1920, height: 1080 }
      };

      const chartOptions = {
        ...sizes[chartSize],
        format: chartFormat,
        theme,
        title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
        showLegend: true,
        showGrid: true
      };

      // Submit export request
      const response = await fetch('/api/analytics/export/chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chartType,
          chartData,
          options: chartOptions
        })
      });

      if (!response.ok) {
        throw new Error('Chart export failed');
      }

      // Create download URL
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Update job status
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', progress: 100, downloadUrl }
          : job
      ));

      // Auto-download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = newJob.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success(`${chartType} chart exported successfully!`);
    } catch (err) {
      console.error('Chart export failed:', err);
      error('Failed to export chart');
      
      setExportJobs(prev => prev.map(job => 
        job.status === 'processing' 
          ? { ...job, status: 'failed' }
          : job
      ));
    } finally {
      setLoading(false);
    }
  };

  const downloadJob = (job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-400 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className={`glass-card border-glass-border ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="heading-3 flex items-center gap-3">
          <Download className="h-6 w-6 text-accent-primary" />
          Export Center
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Reports
          </Button>
          <Button
            variant={activeTab === 'charts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('charts')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Charts
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Report Type */}
              <div className="space-y-2">
                <label className="caption text-accent-primary">Report Type</label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger className="glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <label className="caption text-accent-primary">Format</label>
                <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
                  <SelectTrigger className="glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="excel">Excel Workbook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <label className="caption text-accent-primary">Theme</label>
                <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger className="glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <h4 className="body text-1 font-medium">Export Options</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={includeCharts}
                    onCheckedChange={setIncludeCharts}
                  />
                  <label className="caption">Include Charts</label>
                </div>
                
                {reportFormat === 'excel' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={includeRawData}
                      onCheckedChange={setIncludeRawData}
                    />
                    <label className="caption">Include Raw Data</label>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range for Custom Reports */}
            {reportType === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="caption text-accent-primary">Start Date</label>
                  <input
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 glass-card border-glass-border rounded-md text-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="caption text-accent-primary">End Date</label>
                  <input
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 glass-card border-glass-border rounded-md text-1"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={generateReport}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Chart Type */}
              <div className="space-y-2">
                <label className="caption text-accent-primary">Chart Type</label>
                <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                  <SelectTrigger className="glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="category">Category Distribution</SelectItem>
                    <SelectItem value="heatmap">Productivity Heatmap</SelectItem>
                    <SelectItem value="trend">Trend Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <label className="caption text-accent-primary">Format</label>
                <Select value={chartFormat} onValueChange={(value: any) => setChartFormat(value)}>
                  <SelectTrigger className="glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    <SelectItem value="png">PNG Image</SelectItem>
                    <SelectItem value="svg">SVG Vector</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <label className="caption text-accent-primary">Size</label>
                <Select value={chartSize} onValueChange={(value: any) => setChartSize(value)}>
                  <SelectTrigger className="glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    <SelectItem value="small">Small (400×300)</SelectItem>
                    <SelectItem value="medium">Medium (800×400)</SelectItem>
                    <SelectItem value="large">Large (1200×600)</SelectItem>
                    <SelectItem value="presentation">Presentation (1920×1080)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateChart}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating Chart...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Chart
                </>
              )}
            </Button>
          </div>
        )}

        {/* Export History */}
        {exportJobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="body text-1 font-medium">Recent Exports</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {exportJobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 glass-card border-glass-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="body text-1">{job.filename}</div>
                      <div className="caption text-3">
                        {job.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-surface-2 border-glass-border">
                      {job.type.toUpperCase()}
                    </Badge>
                    
                    {job.status === 'completed' && job.downloadUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadJob(job)}
                        className="text-accent-primary hover:text-accent-primary/80"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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