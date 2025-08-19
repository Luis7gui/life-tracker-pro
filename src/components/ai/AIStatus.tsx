/**
 * Life Tracker Pro - AI Status Component
 * Displays AI service status and statistics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Brain, 
  Activity, 
  Database, 
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react';
import { aiService, AIStatus as AIStatusType } from '../../services/api/AIService';
import { useNotifications } from '../../hooks/useNotifications';

interface AIStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function AIStatus({ showDetails = false, className = '' }: AIStatusProps) {
  const [status, setStatus] = useState<AIStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const { success, error } = useNotifications();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await aiService.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load AI status:', err);
      error('Failed to load AI status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    aiService.clearCache();
    await loadStatus();
    success('AI status refreshed');
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      await aiService.retrain();
      await loadStatus();
      success('AI models retrained successfully');
    } catch (err) {
      error('Failed to retrain AI models');
    } finally {
      setRetraining(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'training':
        return <Activity className="h-5 w-5 text-yellow-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Brain className="h-5 w-5 text-accent-primary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'training':
        return 'Training';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'training':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'error':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      default:
        return 'text-accent-primary border-accent-primary/30 bg-accent-primary/10';
    }
  };

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Brain className="h-6 w-6 text-accent-primary" />
            AI Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Brain className="h-6 w-6 text-accent-primary" />
            AI Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="caption text-2">Failed to load AI status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = status.statistics;

  return (
    <Card className={`glass-card border-glass-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Brain className="h-6 w-6 text-accent-primary" />
            AI Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-3 hover:text-1"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetrain}
                disabled={retraining}
                className="text-accent-primary hover:text-accent-primary"
              >
                {retraining ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Retrain'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="surface-1 border border-glass-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="body-medium text-1">Service Status</h3>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(status.status)}`}
            >
              {getStatusIcon(status.status)}
              <span className="ml-2">{getStatusLabel(status.status)}</span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="heading-3 text-accent-primary mono">
                {stats.isInitialized ? 'YES' : 'NO'}
              </div>
              <div className="caption">Initialized</div>
            </div>
            
            <div className="text-center">
              <div className="heading-3 text-accent-secondary mono">
                {stats.insightsCount}
              </div>
              <div className="caption">Total Insights</div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="surface-1 border border-glass-border rounded-xl p-4">
          <h3 className="body-medium text-1 mb-3">Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {status.capabilities.map((capability) => (
              <Badge 
                key={capability}
                variant="secondary" 
                className="text-xs text-2 bg-surface-2 border-glass-border"
              >
                {capability.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {showDetails && (
          <>
            {/* Category Classifier Stats */}
            {stats.categoryClassifier && (
              <div className="surface-1 border border-glass-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-accent-primary" />
                  <h3 className="body-medium text-1">Category Classifier</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="heading-4 mono">
                      {stats.categoryClassifier.categoriesCount || 0}
                    </div>
                    <div className="caption">Categories</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="heading-4 mono">
                      {stats.categoryClassifier.totalSamples || 0}
                    </div>
                    <div className="caption">Training Samples</div>
                  </div>
                </div>
                
                {stats.categoryClassifier.isTraining && (
                  <div className="mt-3 pt-3 border-t border-glass-border">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Activity className="h-4 w-4 animate-pulse" />
                      <span className="caption">Training in progress...</span>
                    </div>
                    {stats.categoryClassifier.trainingProgress && (
                      <div className="mt-2">
                        <div className="progress-container">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${stats.categoryClassifier.trainingProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Productivity Predictor Stats */}
            {stats.productivityPredictor && (
              <div className="surface-1 border border-glass-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-accent-secondary" />
                  <h3 className="body-medium text-1">Productivity Predictor</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="heading-4 mono">
                      {stats.productivityPredictor.totalSessions || 0}
                    </div>
                    <div className="caption">Sessions</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="heading-4 mono">
                      {Math.round((stats.productivityPredictor.avgProductivity || 0) * 100)}%
                    </div>
                    <div className="caption">Avg Productivity</div>
                  </div>
                </div>
              </div>
            )}

            {/* Last Training */}
            {stats.lastTrainingDate && (
              <div className="surface-1 border border-glass-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-accent-tertiary" />
                  <h3 className="body-medium text-1">Last Training</h3>
                </div>
                <p className="caption text-2">
                  {new Date(stats.lastTrainingDate).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}