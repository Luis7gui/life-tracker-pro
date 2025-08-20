/**
 * Life Tracker Pro - Productivity Insights Component
 * Displays AI-powered productivity predictions and insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import { aiService, ProductivityPrediction, OptimalTimeSlot } from '../../services/api/AIService';
import { useNotifications } from '../../hooks/useNotifications';

interface ProductivityInsightsProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  className?: string;
}

const categories = [
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'study', label: 'Study', icon: '📚' },
  { value: 'exercise', label: 'Exercise', icon: '💪' },
  { value: 'personal', label: 'Personal', icon: '👤' },
  { value: 'creative', label: 'Creative', icon: '🎨' }
];

export default function ProductivityInsights({ 
  selectedCategory = 'work', 
  onCategoryChange,
  className = '' 
}: ProductivityInsightsProps) {
  const [prediction, setPrediction] = useState<ProductivityPrediction | null>(null);
  const [optimalTimes, setOptimalTimes] = useState<{ [category: string]: OptimalTimeSlot }>({});
  const [loading, setLoading] = useState(true);
  const { error } = useNotifications();

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const [predictionData, optimalData] = await Promise.all([
        aiService.predictProductivity(selectedCategory),
        aiService.getOptimalTimes()
      ]);
      
      setPrediction(predictionData);
      setOptimalTimes(optimalData);
    } catch (err) {
      console.error('Failed to load productivity insights:', err);
      error('Failed to load productivity insights');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, error]);

  useEffect(() => {
    loadInsights();
  }, [selectedCategory, loadInsights]);

  const handleRefresh = async () => {
    aiService.clearCache();
    await loadInsights();
  };

  const getProductivityStatus = (productivity: number) => {
    if (productivity >= 0.8) return { label: 'Excellent', color: 'text-green-400', icon: CheckCircle };
    if (productivity >= 0.6) return { label: 'Good', color: 'text-blue-400', icon: TrendingUp };
    if (productivity >= 0.4) return { label: 'Moderate', color: 'text-yellow-400', icon: Clock };
    return { label: 'Low', color: 'text-orange-400', icon: AlertCircle };
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  const currentTime = new Date().getHours();
  const currentCategory = categories.find(c => c.value === selectedCategory);
  const optimalTime = optimalTimes[selectedCategory];

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-accent-primary" />
            Productivity Insights
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

  const status = prediction ? getProductivityStatus(prediction.expectedProductivity) : null;

  return (
    <Card className={`glass-card border-glass-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="heading-3 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-accent-primary" />
            Productivity Insights
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
      
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="caption text-accent-primary">Category</label>
          <Select 
            value={selectedCategory} 
            onValueChange={onCategoryChange}
          >
            <SelectTrigger className="glass-card border-glass-border text-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-glass-border">
              {categories.map((category) => (
                <SelectItem 
                  key={category.value} 
                  value={category.value}
                  className="text-1 hover:surface-1"
                >
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Prediction */}
        {prediction && (
          <div className="surface-1 border border-glass-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="body-medium text-1">Right Now</h3>
              <Badge 
                variant="secondary" 
                className={`${status?.color} bg-surface-2 border-glass-border`}
              >
                {status?.label}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {status && React.createElement(status.icon, { 
                    className: `h-8 w-8 ${status.color}` 
                  })}
                </div>
                <div className="heading-3 mono">
                  {aiService.formatProductivity(prediction.expectedProductivity)}
                </div>
                <div className="caption">Expected Productivity</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-accent-secondary" />
                </div>
                <div className="heading-3 mono">
                  {Math.round(prediction.confidence * 100)}%
                </div>
                <div className="caption">Confidence</div>
              </div>
            </div>
            
            {prediction.recommendation && (
              <div className="pt-3 border-t border-glass-border">
                <p className="caption text-2 leading-relaxed">
                  💡 {prediction.recommendation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Optimal Time */}
        {optimalTime && optimalTime.confidence > 0.3 && (
          <div className="surface-1 border border-glass-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="body-medium text-1 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-tertiary" />
                Optimal Time
              </h3>
              <Badge variant="outline" className="text-xs text-3 border-glass-border">
                {Math.round(optimalTime.confidence * 100)}% confidence
              </Badge>
            </div>
            
            <div className="text-center py-2">
              <div className="heading-3 text-accent-tertiary mb-1">
                {formatTime(optimalTime.startHour)} - {formatTime(optimalTime.endHour)}
              </div>
              <div className="caption text-2">
                Peak {currentCategory?.label} hours
              </div>
              <div className="caption text-3 mt-1">
                Avg productivity: {aiService.formatProductivity(optimalTime.avgProductivity)}
              </div>
            </div>
            
            {Math.abs(currentTime - optimalTime.startHour) <= 1 && (
              <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-accent-primary">
                  <Activity className="h-4 w-4" />
                  <span className="caption font-medium">
                    You're in your optimal productivity window!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Productivity Factors */}
        {prediction && (
          <div className="surface-1 border border-glass-border rounded-xl p-4 space-y-3">
            <h3 className="body-medium text-1">Productivity Factors</h3>
            
            <div className="space-y-3">
              {Object.entries(prediction.factors).map(([factor, value]) => {
                const percentage = Math.round(value * 100);
                const factorLabels: { [key: string]: string } = {
                  timeOfDay: 'Time of Day',
                  dayOfWeek: 'Day of Week',
                  category: 'Category Fit',
                  historical: 'Historical Pattern'
                };
                
                return (
                  <div key={factor} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-2">{factorLabels[factor]}</span>
                      <span className="text-1 font-mono">{percentage}%</span>
                    </div>
                    <div className="progress-container h-1.5">
                      <div 
                        className="progress-fill h-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}