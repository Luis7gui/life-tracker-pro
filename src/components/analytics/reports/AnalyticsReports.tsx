/**
 * Life Tracker Pro - Analytics Reports Component
 * Main component for all analytics reports with navigation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  FileText, 
  Calendar,
  Settings,
  TrendingUp,
  Download,
  BarChart3
} from 'lucide-react';
import WeeklyReport from './WeeklyReport';
import MonthlyReport from './MonthlyReport';
import CustomReport from './CustomReport';
import ExportCenter from '../ExportCenter';
import { useNotifications } from '../../../hooks/useNotifications';

type ReportType = 'weekly' | 'monthly' | 'custom' | 'export';

interface AnalyticsReportsProps {
  defaultReport?: ReportType;
  className?: string;
}

export default function AnalyticsReports({ 
  defaultReport = 'weekly',
  className = '' 
}: AnalyticsReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>(defaultReport);
  const [exportCount, setExportCount] = useState(0);
  const { success } = useNotifications();

  const handleExport = (format: 'pdf' | 'excel') => {
    setExportCount(prev => prev + 1);
    success(`Report exported successfully as ${format.toUpperCase()}`);
  };

  const reportTabs = [
    {
      id: 'weekly' as ReportType,
      label: 'Weekly',
      icon: Calendar,
      description: 'Weekly productivity analysis and insights',
      color: 'text-accent-primary'
    },
    {
      id: 'monthly' as ReportType,
      label: 'Monthly',
      icon: TrendingUp,
      description: 'Comprehensive monthly performance review',
      color: 'text-accent-secondary'
    },
    {
      id: 'custom' as ReportType,
      label: 'Custom',
      icon: Settings,
      description: 'Build custom reports for any time period',
      color: 'text-accent-tertiary'
    },
    {
      id: 'export' as ReportType,
      label: 'Export Center',
      icon: Download,
      description: 'Export reports and charts in multiple formats',
      color: 'text-accent-quaternary'
    }
  ];

  const renderReport = () => {
    switch (activeReport) {
      case 'weekly':
        return <WeeklyReport onExport={handleExport} />;
      case 'monthly':
        return <MonthlyReport onExport={handleExport} />;
      case 'custom':
        return <CustomReport onExport={handleExport} />;
      case 'export':
        return <ExportCenter />;
      default:
        return <WeeklyReport onExport={handleExport} />;
    }
  };

  const activeTab = reportTabs.find(tab => tab.id === activeReport);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-accent-primary" />
              <div>
                <CardTitle className="heading-3">Analytics Reports</CardTitle>
                <p className="caption text-3 mt-1">
                  Comprehensive productivity insights and data exports
                </p>
              </div>
            </div>
            
            {exportCount > 0 && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                {exportCount} export{exportCount !== 1 ? 's' : ''} completed
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeReport === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveReport(tab.id)}
                  className={`h-auto p-4 flex flex-col items-start gap-2 ${
                    isActive 
                      ? 'bg-accent-primary/10 border-accent-primary/30' 
                      : 'hover:bg-surface-2/50'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-accent-primary' : tab.color}`} />
                    <span className="body font-medium">{tab.label}</span>
                  </div>
                  <p className="caption text-left text-3">{tab.description}</p>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Report Content */}
      <div className="min-h-[600px]">
        {renderReport()}
      </div>

      {/* Quick Actions */}
      {activeReport !== 'export' && (
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="body text-1 font-medium">Quick Actions</h4>
                <p className="caption text-3">
                  Common actions for {activeTab?.label.toLowerCase()} reports
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveReport('export')}
                  className="border-glass-border"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Center
                </Button>
                
                {activeReport === 'weekly' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveReport('monthly')}
                    className="border-glass-border"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Monthly
                  </Button>
                )}
                
                {activeReport === 'monthly' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveReport('custom')}
                    className="border-glass-border"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Custom Report
                  </Button>
                )}
                
                {activeReport === 'custom' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveReport('weekly')}
                    className="border-glass-border"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Back to Weekly
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="heading-4 mono text-1">Weekly</div>
            <div className="caption text-3">Performance tracking</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent-secondary/20 text-accent-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="heading-4 mono text-1">Monthly</div>
            <div className="caption text-3">Trend analysis</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent-tertiary/20 text-accent-tertiary rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="heading-4 mono text-1">Custom</div>
            <div className="caption text-3">Flexible reporting</div>
          </CardContent>
        </Card>
      </div>

      {/* Tips and Help */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="heading-4">Report Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="body text-1 font-medium">Weekly Reports</h5>
              <ul className="space-y-1 caption text-3">
                <li>• Best for short-term tracking and weekly goals</li>
                <li>• Shows daily patterns and immediate feedback</li>
                <li>• Perfect for regular team updates</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="body text-1 font-medium">Monthly Reports</h5>
              <ul className="space-y-1 caption text-3">
                <li>• Comprehensive performance analysis</li>
                <li>• Trend identification and goal tracking</li>
                <li>• Ideal for management reviews</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="body text-1 font-medium">Custom Reports</h5>
              <ul className="space-y-1 caption text-3">
                <li>• Flexible date ranges and filters</li>
                <li>• Choose specific metrics and visualizations</li>
                <li>• Perfect for project-specific analysis</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="body text-1 font-medium">Export Options</h5>
              <ul className="space-y-1 caption text-3">
                <li>• PDF for presentations and sharing</li>
                <li>• Excel for data analysis and manipulation</li>
                <li>• Charts as images for documents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}