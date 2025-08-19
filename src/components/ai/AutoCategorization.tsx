/**
 * Life Tracker Pro - Auto Categorization Component
 * Smart category prediction for activities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Brain, 
  Target, 
  Wand2, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { aiService, CategoryPrediction } from '../../services/api/AIService';
import { useNotifications } from '../../hooks/useNotifications';

interface AutoCategorizationProps {
  activity: string;
  onCategoryPredict?: (category: string, confidence: number) => void;
  onActivityChange?: (activity: string) => void;
  autoPredict?: boolean;
  className?: string;
}

export default function AutoCategorization({ 
  activity,
  onCategoryPredict,
  onActivityChange,
  autoPredict = false,
  className = '' 
}: AutoCategorizationProps) {
  const [inputActivity, setInputActivity] = useState(activity || '');
  const [prediction, setPrediction] = useState<CategoryPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastPredictedActivity, setLastPredictedActivity] = useState('');
  const { success, error } = useNotifications();

  useEffect(() => {
    setInputActivity(activity || '');
  }, [activity]);

  useEffect(() => {
    if (autoPredict && inputActivity && inputActivity !== lastPredictedActivity && inputActivity.length > 3) {
      const debounceTimer = setTimeout(() => {
        handlePredict();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [inputActivity, autoPredict, lastPredictedActivity]);

  const handlePredict = async () => {
    if (!inputActivity.trim()) {
      error('Please enter an activity description');
      return;
    }

    try {
      setLoading(true);
      const result = await aiService.predictCategory(inputActivity.trim());
      setPrediction(result);
      setLastPredictedActivity(inputActivity);
      
      if (onCategoryPredict) {
        onCategoryPredict(result.category, result.confidence);
      }
      
      if (result.confidence >= 0.8) {
        success(`High confidence prediction: ${result.category}`);
      }
    } catch (err) {
      console.error('Failed to predict category:', err);
      error('Failed to predict category');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputActivity(value);
    if (onActivityChange) {
      onActivityChange(value);
    }
    
    // Clear prediction if activity changed significantly
    if (prediction && value !== lastPredictedActivity) {
      setPrediction(null);
    }
  };

  const getConfidenceStatus = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-400', icon: CheckCircle };
    if (confidence >= 0.6) return { label: 'Medium', color: 'text-yellow-400', icon: Target };
    return { label: 'Low', color: 'text-orange-400', icon: AlertCircle };
  };

  const categoryIcons: { [key: string]: string } = {
    work: '💼',
    study: '📚',
    exercise: '💪',
    personal: '👤',
    creative: '🎨'
  };

  const categoryLabels: { [key: string]: string } = {
    work: 'Work',
    study: 'Study',
    exercise: 'Exercise',
    personal: 'Personal',
    creative: 'Creative'
  };

  return (
    <Card className={`glass-card border-glass-border ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="heading-3 flex items-center gap-3">
          <Brain className="h-6 w-6 text-accent-primary" />
          Smart Categorization
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Activity Input */}
        <div className="space-y-2">
          <Label htmlFor="activity-input" className="caption text-accent-primary">
            Activity Description
          </Label>
          <div className="flex gap-2">
            <Input
              id="activity-input"
              type="text"
              value={inputActivity}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Describe what you're working on..."
              className="glass-card border-glass-border body-medium text-1 placeholder:text-3"
              onKeyPress={(e) => e.key === 'Enter' && !autoPredict && handlePredict()}
            />
            {!autoPredict && (
              <Button
                onClick={handlePredict}
                disabled={loading || !inputActivity.trim()}
                className="modern-button modern-button-primary"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          {autoPredict && (
            <p className="caption text-3">
              🤖 Auto-prediction enabled - categories will be suggested as you type
            </p>
          )}
        </div>

        {/* Prediction Result */}
        {loading && (
          <div className="surface-1 border border-glass-border rounded-xl p-4">
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full mr-3"></div>
              <span className="caption text-2">Analyzing activity...</span>
            </div>
          </div>
        )}

        {prediction && !loading && (
          <div className="surface-1 border border-glass-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="body-medium text-1">Prediction Result</h3>
              <Badge 
                variant="secondary" 
                className={`${getConfidenceStatus(prediction.confidence).color} bg-surface-2 border-glass-border`}
              >
                {getConfidenceStatus(prediction.confidence).label} Confidence
              </Badge>
            </div>
            
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {categoryIcons[prediction.category] || '📁'}
                </div>
                <div className="heading-3 text-accent-primary mb-1">
                  {categoryLabels[prediction.category] || prediction.category}
                </div>
                <div className="caption text-2">
                  {Math.round(prediction.confidence * 100)}% confidence
                </div>
              </div>
            </div>
            
            {/* Confidence Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-2">Confidence Level</span>
                <span className="text-1 font-mono">{Math.round(prediction.confidence * 100)}%</span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-fill" 
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
            </div>
            
            {/* Reasoning */}
            {prediction.reasons && prediction.reasons.length > 0 && (
              <div className="pt-3 border-t border-glass-border">
                <h4 className="caption text-accent-primary mb-2">Why this category?</h4>
                <div className="space-y-1">
                  {prediction.reasons.map((reason, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-accent-primary rounded-full"></div>
                      <span className="caption text-2">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Low Confidence Warning */}
            {prediction.confidence < 0.6 && (
              <div className="bg-orange-400/10 border border-orange-400/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="caption font-medium">
                    Low confidence prediction - please verify the category manually
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {!prediction && !loading && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-4" />
            <h3 className="heading-4 mb-2">Smart Category Prediction</h3>
            <p className="body-small text-3 leading-relaxed">
              Describe your activity and our AI will suggest the most appropriate category based on your historical patterns and activity content.
            </p>
          </div>
        )}

        {/* Quick Examples */}
        <div className="pt-4 border-t border-glass-border">
          <h4 className="caption text-accent-primary mb-3">Example activities:</h4>
          <div className="grid grid-cols-1 gap-2">
            {[
              { text: "Working on React components", category: "work" },
              { text: "Reading TypeScript documentation", category: "study" },
              { text: "Morning workout at the gym", category: "exercise" },
              { text: "Designing app mockups", category: "creative" }
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => handleInputChange(example.text)}
                className="text-left p-2 rounded-lg border border-glass-border hover:bg-surface-1 transition-colors"
              >
                <div className="caption text-2">{example.text}</div>
                <div className="text-xs text-3 mt-1">
                  {categoryIcons[example.category]} {categoryLabels[example.category]}
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}