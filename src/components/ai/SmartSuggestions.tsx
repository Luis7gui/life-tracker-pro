/**
 * Life Tracker Pro - Smart Suggestions Component
 * Displays AI-powered suggestions for productivity optimization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Lightbulb, 
  Clock, 
  Target, 
  Coffee, 
  TrendingUp,
  RefreshCw,
  Brain,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { aiService, SmartSuggestion } from '../../services/api/AIService';
import { useNotifications } from '../../hooks/useNotifications';

interface SmartSuggestionsProps {
  currentActivity?: string;
  className?: string;
}

export default function SmartSuggestions({ currentActivity, className = '' }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const { success, error } = useNotifications();

  const loadSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiService.getSmartSuggestions(currentActivity);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      error('Failed to load AI suggestions');
    } finally {
      setLoading(false);
    }
  }, [currentActivity, error]);

  useEffect(() => {
    loadSuggestions();
  }, [currentActivity, loadSuggestions]);

  const handleRefresh = async () => {
    aiService.clearCache();
    await loadSuggestions();
    success('Suggestions refreshed');
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(Array.from(prev).concat(suggestionId)));
  };

  const handleAccept = (suggestion: SmartSuggestion) => {
    if (suggestion.type === 'category' && suggestion.metadata?.suggestedCategory) {
      // Emit event to parent component to apply category suggestion
      const event = new CustomEvent('applyCategorySuggestion', {
        detail: { category: suggestion.metadata.suggestedCategory }
      });
      window.dispatchEvent(event);
      success(`Applied category: ${suggestion.metadata.suggestedCategory}`);
    }
    
    handleDismiss(suggestion.id);
  };

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'category':
        return <Target className="h-5 w-5 text-accent-primary" />;
      case 'timing':
        return <Clock className="h-5 w-5 text-accent-secondary" />;
      case 'duration':
        return <TrendingUp className="h-5 w-5 text-accent-tertiary" />;
      case 'break':
        return <Coffee className="h-5 w-5 text-accent-quaternary" />;
      default:
        return <Lightbulb className="h-5 w-5 text-accent-primary" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    const level = aiService.getConfidenceLabel(confidence);
    const color = aiService.getConfidenceColor(confidence);
    
    return (
      <Badge variant="secondary" className={`${color} bg-surface-2 border-glass-border`}>
        {level} ({Math.round(confidence * 100)}%)
      </Badge>
    );
  };

  const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id));

  if (loading) {
    return (
      <Card className={`glass-card border-glass-border ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="heading-3 flex items-center gap-3">
            <Brain className="h-6 w-6 text-accent-primary" />
            Smart Suggestions
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
            Smart Suggestions
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
        {activeSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-4" />
            <h3 className="heading-4 mb-2">No suggestions right now</h3>
            <p className="body-small text-3">
              Keep using the tracker to get personalized AI suggestions
            </p>
          </div>
        ) : (
          activeSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="surface-1 border border-glass-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="body-medium text-1 mb-1">{suggestion.title}</h4>
                    <p className="caption text-2 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getConfidenceBadge(suggestion.confidence)}
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-3 border-glass-border">
                    {suggestion.type}
                  </Badge>
                  {suggestion.actionable && (
                    <Badge variant="outline" className="text-xs text-accent-primary border-accent-primary/30">
                      Actionable
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {suggestion.actionable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAccept(suggestion)}
                      className="text-accent-primary hover:text-accent-primary hover:bg-accent-primary/10 h-8 px-3"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="text-3 hover:text-1 h-8 px-3"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        
        {dismissedSuggestions.size > 0 && (
          <div className="pt-4 border-t border-glass-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissedSuggestions(new Set())}
              className="text-3 hover:text-1 text-xs"
            >
              Show {dismissedSuggestions.size} dismissed suggestion{dismissedSuggestions.size !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}