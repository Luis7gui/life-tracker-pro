/**
 * Life Tracker Pro - AI Insights Component
 * Displays AI-generated insights and patterns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  RefreshCw,
  Brain,
  Clock,
  BarChart3
} from 'lucide-react';
import { aiService, AIInsight } from '../../services/api/AIService';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface AIInsightsProps {
  maxInsights?: number;
  className?: string;
}

export default function AIInsights({ maxInsights = 10, className = '' }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useNotifications();

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiService.getInsights();
      setInsights(data.slice(0, maxInsights));
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }, [maxInsights, error]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleRefresh = async () => {
    aiService.clearCache();
    await loadInsights();
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'productivity':
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'pattern':
        return <BarChart3 className="h-5 w-5 text-blue-400" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-400" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      default:
        return <Target className="h-5 w-5 text-accent-primary" />;
    }
  };

  const getInsightTypeLabel = (type: AIInsight['type']) => {
    switch (type) {
      case 'productivity':
        return 'Productivity';
      case 'pattern':
        return 'Pattern';
      case 'recommendation':
        return 'Recommendation';
      case 'alert':
        return 'Alert';
      default:
        return 'Insight';
    }
  };

  const getInsightTypeColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'productivity':
        return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'pattern':
        return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'recommendation':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'alert':
        return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
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
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-glass-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Brain className="h-6 w-6 text-accent-primary" />
            AI Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-3 hover:text-1"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-4" />
            <h3 className="heading-4 mb-2">No insights yet</h3>
            <p className="body-small text-3">
              Keep using the tracker to generate AI-powered insights about your productivity patterns
            </p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className="surface-1 border border-glass-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="body-medium text-1">{insight.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getInsightTypeColor(insight.type)}`}
                      >
                        {getInsightTypeLabel(insight.type)}
                      </Badge>
                    </div>
                    <p className="caption text-2 leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs text-3 bg-surface-2 border-glass-border">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-3">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(insight.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {/* Additional Data Display */}
              {insight.data && (
                <div className="pt-3 border-t border-glass-border">
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-accent-primary hover:text-accent-primary/80 transition-colors">
                      View details
                    </summary>
                    <div className="mt-2 p-3 bg-surface-2 rounded-lg">
                      <pre className="text-xs text-2 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(insight.data, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
        
        {insights.length >= maxInsights && (
          <div className="text-center pt-4 border-t border-glass-border">
            <p className="caption text-3">
              Showing latest {maxInsights} insights
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}