/**
 * Categories and Rules Management API Routes
 * v0.3 - Advanced Categorization System
 */

import { Router, Request, Response } from 'express';
import { categoryManager, CategoryRule, MachineLearningData, CategoryManager } from '../models/CategoryManager';
import { CategoryType } from '../models/ActivitySession';

const router = Router();

/**
 * GET /api/categories/rules
 * Get all categorization rules
 */
router.get('/rules', (req: Request, res: Response) => {
  try {
    const includeDisabled = req.query.includeDisabled === 'true';
    const rules = includeDisabled ? categoryManager.getAllRules() : categoryManager.getActiveRules();
    
    return res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    console.error('Error getting rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get categorization rules'
    });
  }
});

/**
 * GET /api/categories/rules/:id
 * Get a specific rule by ID
 */
router.get('/rules/:id', (req: Request, res: Response) => {
  try {
    const rule = categoryManager.getAllRules().find(r => r.id === req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    return res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error getting rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rule'
    });
  }
});

/**
 * POST /api/categories/rules
 * Create a new categorization rule
 */
router.post('/rules', (req: Request, res: Response) => {
  try {
    const {
      description,
      priority,
      category,
      appPatterns,
      titlePatterns,
      regexPatterns,
      domainPatterns,
      productivityScore,
      timeBasedRules,
      tags
    } = req.body;

    // Validation
    if (!description || !category || !appPatterns) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, category, appPatterns'
      });
    }

    if (!Object.values(CategoryType).includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category type'
      });
    }

    const ruleData = {
      description,
      priority: priority || 10,
      category,
      appPatterns: Array.isArray(appPatterns) ? appPatterns : [appPatterns],
      titlePatterns: titlePatterns || [],
      regexPatterns: regexPatterns || [],
      domainPatterns: domainPatterns || [],
      productivityScore: productivityScore || 0.5,
      timeBasedRules: timeBasedRules || [],
      enabled: true,
      tags: tags || []
    };

    const newRule = categoryManager.createCustomRule(ruleData);

    return res.json({
      success: true,
      data: newRule,
      message: 'Categorization rule created successfully'
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create categorization rule'
    });
  }
});

/**
 * PUT /api/categories/rules/:id
 * Update an existing categorization rule
 */
router.put('/rules/:id', (req: Request, res: Response) => {
  try {
    const ruleId = req.params.id;
    const updates = req.body;

    // Remove id from updates to prevent modification
    delete updates.id;

    const success = categoryManager.updateRule(ruleId, updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    const updatedRule = categoryManager.getAllRules().find(r => r.id === ruleId);

    return res.json({
      success: true,
      data: updatedRule,
      message: 'Rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update rule'
    });
  }
});

/**
 * DELETE /api/categories/rules/:id
 * Delete a categorization rule
 */
router.delete('/rules/:id', (req: Request, res: Response) => {
  try {
    const ruleId = req.params.id;
    const success = categoryManager.deleteRule(ruleId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    return res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete rule'
    });
  }
});

/**
 * PATCH /api/categories/rules/:id/toggle
 * Toggle rule enabled/disabled status
 */
router.patch('/rules/:id/toggle', (req: Request, res: Response) => {
  try {
    const ruleId = req.params.id;
    const success = categoryManager.toggleRule(ruleId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    const rule = categoryManager.getAllRules().find(r => r.id === ruleId);

    return res.json({
      success: true,
      data: rule,
      message: `Rule ${rule?.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle rule'
    });
  }
});

/**
 * POST /api/categories/test
 * Test categorization for given app name and window title
 */
router.post('/test', (req: Request, res: Response) => {
  try {
    const { appName, windowTitle } = req.body;

    if (!appName) {
      return res.status(400).json({
        success: false,
        error: 'appName is required'
      });
    }

    const testResult = categoryManager.testCategorization(appName, windowTitle);

    return res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing categorization:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test categorization'
    });
  }
});

/**
 * POST /api/categories/feedback
 * Provide feedback on categorization accuracy
 */
router.post('/feedback', (req: Request, res: Response) => {
  try {
    const { appName, windowTitle, expectedCategory, isCorrect } = req.body;

    if (!appName || !expectedCategory || typeof isCorrect !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: appName, expectedCategory, isCorrect'
      });
    }

    if (!Object.values(CategoryType).includes(expectedCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category type'
      });
    }

    categoryManager.addUserFeedback(appName, windowTitle, expectedCategory, isCorrect);

    return res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record feedback'
    });
  }
});

/**
 * GET /api/categories/stats
 * Get categorization statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const categoryStats = categoryManager.getCategoryStats();
    const mlStats = categoryManager.getMLStats();

    return res.json({
      success: true,
      data: {
        categories: categoryStats,
        machineLearning: mlStats
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get categorization statistics'
    });
  }
});

/**
 * GET /api/categories/search
 * Search rules by query
 */
router.get('/search', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const results = categoryManager.searchRules(query);

    return res.json({
      success: true,
      data: results,
      count: results.length,
      query
    });
  } catch (error) {
    console.error('Error searching rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search rules'
    });
  }
});

/**
 * GET /api/categories/:category/rules
 * Get rules for a specific category
 */
router.get('/:category/rules', (req: Request, res: Response) => {
  try {
    const category = req.params.category as CategoryType;

    if (!Object.values(CategoryType).includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category type'
      });
    }

    const rules = categoryManager.getRulesByCategory(category);

    return res.json({
      success: true,
      data: rules,
      count: rules.length,
      category
    });
  } catch (error) {
    console.error('Error getting category rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get category rules'
    });
  }
});

/**
 * POST /api/categories/export
 * Export all rules and ML data
 */
router.post('/export', (req: Request, res: Response) => {
  try {
    const exportData = categoryManager.exportRules();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="life-tracker-rules-${new Date().toISOString().split('T')[0]}.json"`);

    return res.send(exportData);
  } catch (error) {
    console.error('Error exporting rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export rules'
    });
  }
});

/**
 * POST /api/categories/import
 * Import rules and ML data
 */
router.post('/import', (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Import data must be a JSON string'
      });
    }

    const success = categoryManager.importRules(data);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to import rules - invalid data format'
      });
    }

    return res.json({
      success: true,
      message: 'Rules imported successfully'
    });
  } catch (error) {
    console.error('Error importing rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to import rules'
    });
  }
});

/**
 * GET /api/categories/types
 * Get all available category types with metadata
 */
router.get('/types', (req: Request, res: Response) => {
  try {
    const categoryTypes = Object.values(CategoryType).map(category => ({
      type: category,
      color: CategoryManager.getCategoryColor(category),
      icon: CategoryManager.getCategoryIcon(category),
      description: CategoryManager.getCategoryDescription(category)
    }));

    return res.json({
      success: true,
      data: categoryTypes
    });
  } catch (error) {
    console.error('Error getting category types:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get category types'
    });
  }
});

export default router;