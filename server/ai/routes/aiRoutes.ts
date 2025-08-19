/**
 * Life Tracker Pro - AI Routes
 * API endpoints for AI functionality
 */

import { Router, Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { ActivitySession } from '../../models/ActivitySession';
import { DatabaseManager } from '../../services/DatabaseManager';

const router = Router();
let aiService: AIService | null = null;

// Initialize AI Service
const initializeAI = async (): Promise<AIService> => {
  if (!aiService) {
    aiService = new AIService();
    
    try {
      // Load existing sessions for training
      const dbManager = DatabaseManager.getInstance();
      const sessions = await dbManager.getAllSessions();
      
      await aiService.initialize(sessions);
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
    }
  }
  
  return aiService;
};

// Middleware to ensure AI is initialized
const ensureAI = async (req: Request, res: Response, next: any) => {
  try {
    if (!aiService) {
      await initializeAI();
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize AI service',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route GET /api/ai/status
 * @desc Get AI service status and statistics
 */
router.get('/status', ensureAI, async (req: Request, res: Response) => {
  try {
    const stats = aiService!.getModelStatistics();
    
    res.json({
      success: true,
      data: {
        status: 'active',
        statistics: stats,
        capabilities: [
          'category_prediction',
          'productivity_prediction',
          'smart_suggestions',
          'pattern_analysis'
        ]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/ai/predict-category
 * @desc Predict category for an activity
 */
router.post('/predict-category', ensureAI, async (req: Request, res: Response) => {
  try {
    const { activity } = req.body;
    
    if (!activity || typeof activity !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Activity description is required'
      });
    }

    const prediction = await aiService!.predictCategory(activity);
    
    res.json({
      success: true,
      data: {
        prediction,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to predict category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/ai/predict-productivity
 * @desc Predict productivity for a category at current time
 */
router.post('/predict-productivity', ensureAI, async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    
    if (!category || typeof category !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    const prediction = await aiService!.predictProductivity(category);
    
    res.json({
      success: true,
      data: {
        prediction,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to predict productivity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/ai/suggestions
 * @desc Get smart suggestions based on current context
 */
router.get('/suggestions', ensureAI, async (req: Request, res: Response) => {
  try {
    const { activity } = req.query;
    
    const suggestions = await aiService!.getSmartSuggestions(
      activity as string | undefined
    );
    
    res.json({
      success: true,
      data: {
        suggestions,
        timestamp: new Date().toISOString(),
        count: suggestions.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/ai/insights
 * @desc Get AI-generated insights
 */
router.get('/insights', ensureAI, async (req: Request, res: Response) => {
  try {
    const insights = aiService!.getInsights();
    
    res.json({
      success: true,
      data: {
        insights,
        count: insights.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/ai/learn-session
 * @desc Learn from a completed session
 */
router.post('/learn-session', ensureAI, async (req: Request, res: Response) => {
  try {
    const sessionData = req.body;
    
    // Validate session data
    if (!sessionData.activity || !sessionData.category || !sessionData.startTime) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data'
      });
    }

    // Create ActivitySession object
    const session = new ActivitySession({
      id: sessionData.id || Date.now(),
      startTime: new Date(sessionData.startTime),
      endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(),
      duration: sessionData.duration || 0,
      applicationName: sessionData.appName || sessionData.applicationName || 'Unknown',
      windowTitle: sessionData.windowTitle,
      category: sessionData.category,
      productivityScore: sessionData.productivity,
      isIdle: false,
      isActive: false
    });

    await aiService!.learnFromSession(session);
    
    res.json({
      success: true,
      message: 'Session learned successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to learn from session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/ai/optimal-times
 * @desc Get optimal times for different categories
 */
router.get('/optimal-times', ensureAI, async (req: Request, res: Response) => {
  try {
    const categories = ['work', 'study', 'exercise', 'personal', 'creative'];
    const optimalTimes: any = {};
    
    // Get optimal times for each category
    for (const category of categories) {
      try {
        const stats = aiService!.getModelStatistics();
        
        // Get productivity insights for this category
        const insights = stats.productivityPredictor;
        
        if (insights.categoryBreakdown && insights.categoryBreakdown[category]) {
          optimalTimes[category] = insights.categoryBreakdown[category].optimalTime;
        } else {
          // Default fallback times
          const defaultTimes = {
            work: { startHour: 9, endHour: 11, avgProductivity: 0.5, confidence: 0 },
            study: { startHour: 14, endHour: 16, avgProductivity: 0.5, confidence: 0 },
            exercise: { startHour: 7, endHour: 9, avgProductivity: 0.5, confidence: 0 },
            personal: { startHour: 19, endHour: 21, avgProductivity: 0.5, confidence: 0 },
            creative: { startHour: 20, endHour: 22, avgProductivity: 0.5, confidence: 0 }
          };
          optimalTimes[category] = defaultTimes[category as keyof typeof defaultTimes];
        }
      } catch (error) {
        console.error(`Error getting optimal time for ${category}:`, error);
      }
    }
    
    res.json({
      success: true,
      data: {
        optimalTimes,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimal times',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/ai/export
 * @desc Export AI model data
 */
router.post('/export', ensureAI, async (req: Request, res: Response) => {
  try {
    const aiData = await aiService!.exportAIData();
    
    res.json({
      success: true,
      data: aiData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to export AI data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/ai/import
 * @desc Import AI model data
 */
router.post('/import', ensureAI, async (req: Request, res: Response) => {
  try {
    const { aiData } = req.body;
    
    if (!aiData) {
      return res.status(400).json({
        success: false,
        error: 'AI data is required'
      });
    }

    await aiService!.importAIData(aiData);
    
    res.json({
      success: true,
      message: 'AI data imported successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to import AI data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/ai/retrain
 * @desc Manually trigger model retraining
 */
router.post('/retrain', ensureAI, async (req: Request, res: Response) => {
  try {
    // Get fresh training data
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    // Reinitialize AI with fresh data
    await aiService!.initialize(sessions);
    
    res.json({
      success: true,
      message: 'AI models retrained successfully',
      timestamp: new Date().toISOString(),
      trainingData: {
        sessionsCount: sessions.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrain models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI Service Event Handlers
const setupAIEventHandlers = () => {
  if (!aiService) return;
  
  aiService.on('insightGenerated', (insight) => {
    // You could emit this to connected clients via WebSocket
    console.log('New AI insight:', insight.title);
  });
  
  aiService.on('trainingCompleted', (data) => {
    console.log('AI training completed:', data);
  });
  
  aiService.on('retrainingNeeded', () => {
    console.log('AI models need retraining');
    // Could trigger automatic retraining here
  });
};

// Initialize AI service when the module loads
initializeAI().then(() => {
  setupAIEventHandlers();
}).catch(error => {
  console.error('Failed to initialize AI service:', error);
});

export default router;