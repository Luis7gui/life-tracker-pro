/**
 * Life Tracker Pro - Analytics Routes
 * API endpoints for advanced analytics functionality
 */

import { Router, Request, Response } from 'express';
import { ReportEngine } from '../engines/ReportEngine';
import { MetricsCalculator } from '../engines/MetricsCalculator';
import { TrendAnalyzer } from '../engines/TrendAnalyzer';
import { DataAggregator } from '../engines/DataAggregator';
import { DatabaseManager } from '../../services/DatabaseManager';
import { PDFExporter } from '../exporters/PDFExporter';
import { ExcelExporter } from '../exporters/ExcelExporter';
import { ChartExporter } from '../exporters/ChartExporter';

const router = Router();

// Middleware for error handling
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => 
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

/**
 * @route GET /api/analytics/metrics
 * @desc Get comprehensive productivity metrics
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, categories } = req.query;
    
    const dbManager = DatabaseManager.getInstance();
    let sessions = await dbManager.getAllSessions();
    
    // Apply date filters
    if (startDate) {
      const start = new Date(startDate as string);
      sessions = sessions.filter(s => s.startTime >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate as string);
      sessions = sessions.filter(s => s.startTime <= end);
    }
    
    // Apply category filters
    if (categories) {
      const categoryList = (categories as string).split(',');
      sessions = sessions.filter(s => categoryList.includes(s.category || 'uncategorized'));
    }
    
    const metrics = MetricsCalculator.calculateProductivityMetrics(sessions);
    const categoryMetrics = MetricsCalculator.calculateCategoryMetrics(sessions);
    const timeSlotMetrics = MetricsCalculator.calculateTimeSlotMetrics(sessions);
    
    res.json({
      success: true,
      data: {
        overall: metrics,
        categories: categoryMetrics,
        timeSlots: timeSlotMetrics,
        period: {
          start: startDate || 'all-time',
          end: endDate || 'now',
          totalSessions: sessions.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/trends
 * @desc Analyze productivity trends and patterns
 */
router.get('/trends', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { days = '30', category } = req.query;
    const analysisWindow = parseInt(days as string);
    
    const dbManager = DatabaseManager.getInstance();
    let sessions = await dbManager.getAllSessions();
    
    // Filter by category if specified
    if (category && category !== 'all') {
      sessions = sessions.filter(s => s.category === category);
    }
    
    // Filter to analysis window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - analysisWindow);
    sessions = sessions.filter(s => s.startTime >= cutoffDate);
    
    const productivityTrend = TrendAnalyzer.analyzeProductivityTrend(sessions, analysisWindow);
    const categoryTrends = TrendAnalyzer.analyzeCategoryTrends(sessions, analysisWindow);
    const patterns = TrendAnalyzer.detectProductivityPatterns(sessions);
    const cycles = TrendAnalyzer.detectPerformanceCycles(sessions);
    
    res.json({
      success: true,
      data: {
        productivityTrend,
        categoryTrends,
        patterns,
        cycles,
        analysisWindow: analysisWindow,
        totalSessions: sessions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/aggregations
 * @desc Get aggregated data with various groupings
 */
router.get('/aggregations', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      period = 'week', 
      groupBy = 'day',
      startDate,
      endDate,
      categories,
      minDuration,
      minProductivity
    } = req.query;
    
    const dbManager = DatabaseManager.getInstance();
    let sessions = await dbManager.getAllSessions();
    
    // Build filters
    const filters: any = {};
    
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    if (categories) {
      filters.categories = (categories as string).split(',');
    }
    
    if (minDuration) {
      filters.minDuration = parseInt(minDuration as string);
    }
    
    if (minProductivity) {
      filters.minProductivity = parseInt(minProductivity as string);
    }
    
    // Create custom aggregation
    const aggregation = DataAggregator.createCustomAggregation(
      sessions,
      filters,
      groupBy as any
    );
    
    // Also get period-based aggregation
    const periodAggregation = DataAggregator.aggregateByPeriod(
      sessions,
      period as any,
      filters.dateRange?.start,
      filters.dateRange?.end
    );
    
    res.json({
      success: true,
      data: {
        custom: aggregation,
        byPeriod: periodAggregation,
        filters,
        totalSessions: sessions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create aggregations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/time-series
 * @desc Get time series data for charts
 */
router.get('/time-series', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      metric = 'productivity',
      interval = 'day',
      startDate,
      endDate,
      categories 
    } = req.query;
    
    const dbManager = DatabaseManager.getInstance();
    let sessions = await dbManager.getAllSessions();
    
    // Apply filters
    if (categories) {
      const categoryList = (categories as string).split(',');
      sessions = sessions.filter(s => categoryList.includes(s.category || 'uncategorized'));
    }
    
    const timeSeries = DataAggregator.createTimeSeries(
      sessions,
      metric as any,
      interval as any,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: {
        timeSeries,
        metric,
        interval,
        totalPoints: timeSeries.length,
        period: {
          start: startDate || timeSeries[0]?.date,
          end: endDate || timeSeries[timeSeries.length - 1]?.date
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate time series',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/distributions
 * @desc Get various data distributions
 */
router.get('/distributions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { type = 'all' } = req.query;
    
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    const distributions: any = {};
    
    if (type === 'all' || type === 'productivity') {
      distributions.productivity = DataAggregator.calculateProductivityDistribution(sessions);
    }
    
    if (type === 'all' || type === 'sessionLength') {
      distributions.sessionLength = DataAggregator.calculateSessionLengthDistribution(sessions);
    }
    
    if (type === 'all' || type === 'daily') {
      distributions.daily = DataAggregator.calculateDailyPatterns(sessions);
    }
    
    if (type === 'all' || type === 'category') {
      distributions.category = DataAggregator.aggregateByCategory(sessions);
    }
    
    res.json({
      success: true,
      data: distributions,
      totalSessions: sessions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate distributions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/reports/weekly
 * @desc Generate weekly report
 */
router.post('/reports/weekly', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { weekStart } = req.body;
    
    if (!weekStart) {
      return res.status(400).json({
        success: false,
        error: 'Week start date is required'
      });
    }
    
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    const startDate = new Date(weekStart);
    const report = await ReportEngine.generateWeeklyReport(sessions, startDate);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate weekly report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/reports/monthly
 * @desc Generate monthly report
 */
router.post('/reports/monthly', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { monthStart } = req.body;
    
    if (!monthStart) {
      return res.status(400).json({
        success: false,
        error: 'Month start date is required'
      });
    }
    
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    const startDate = new Date(monthStart);
    const report = await ReportEngine.generateMonthlyReport(sessions, startDate);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate monthly report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/reports/custom
 * @desc Generate custom report
 */
router.post('/reports/custom', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, filters = {}, title } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }
    
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const report = await ReportEngine.generateCustomReport(
      sessions,
      start,
      end,
      filters,
      title
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/reports/comparison
 * @desc Generate comparison report between periods
 */
router.post('/reports/comparison', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      currentStart, 
      currentEnd, 
      previousStart, 
      previousEnd,
      currentLabel,
      previousLabel 
    } = req.body;
    
    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
      return res.status(400).json({
        success: false,
        error: 'All period dates are required'
      });
    }
    
    const dbManager = DatabaseManager.getInstance();
    const allSessions = await dbManager.getAllSessions();
    
    // Filter sessions for each period
    const currentSessions = allSessions.filter(s => {
      const date = s.startTime;
      return date >= new Date(currentStart) && date <= new Date(currentEnd);
    });
    
    const previousSessions = allSessions.filter(s => {
      const date = s.startTime;
      return date >= new Date(previousStart) && date <= new Date(previousEnd);
    });
    
    const report = await ReportEngine.generateComparisonReport(
      currentSessions,
      previousSessions,
      currentLabel || 'Current Period',
      previousLabel || 'Previous Period'
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate comparison report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/predictions
 * @desc Get productivity predictions
 */
router.get('/predictions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { daysAhead = '7' } = req.query;
    const days = parseInt(daysAhead as string);
    
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    // Get recent sessions for prediction
    const recentSessions = sessions.slice(-30); // Last 30 sessions
    
    const prediction = TrendAnalyzer.predictProductivityTrend(recentSessions, days);
    
    res.json({
      success: true,
      data: {
        prediction,
        basedOnSessions: recentSessions.length,
        daysAhead: days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/seasonality
 * @desc Analyze seasonal patterns
 */
router.get('/seasonality', asyncHandler(async (req: Request, res: Response) => {
  try {
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    // Need at least 3 months of data for meaningful seasonal analysis
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentSessions = sessions.filter(s => s.startTime >= threeMonthsAgo);
    
    const seasonalPatterns = TrendAnalyzer.analyzeSeasonalPatterns(recentSessions);
    
    res.json({
      success: true,
      data: {
        patterns: seasonalPatterns,
        analysisStart: threeMonthsAgo,
        sessionsAnalyzed: recentSessions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze seasonality',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/summary
 * @desc Get comprehensive analytics summary
 */
router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    const dbManager = DatabaseManager.getInstance();
    const sessions = await dbManager.getAllSessions();
    
    // Filter sessions based on period
    const cutoffDate = new Date();
    switch (period) {
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }
    
    const periodSessions = sessions.filter(s => s.startTime >= cutoffDate);
    
    // Calculate comprehensive summary
    const metrics = MetricsCalculator.calculateProductivityMetrics(periodSessions);
    const categoryMetrics = MetricsCalculator.calculateCategoryMetrics(periodSessions);
    const trends = TrendAnalyzer.analyzeProductivityTrend(periodSessions);
    const aggregatedData = DataAggregator.aggregateByPeriod(periodSessions, 'day');
    
    res.json({
      success: true,
      data: {
        period,
        metrics,
        categoryMetrics,
        trends,
        dailyData: aggregatedData,
        sessionCount: periodSessions.length,
        dateRange: {
          start: cutoffDate,
          end: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/export/pdf
 * @desc Export report as PDF
 */
router.post('/export/pdf', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { reportType = 'weekly', reportData, options = {} } = req.body;
    
    let pdfBuffer: Buffer;
    
    switch (reportType) {
      case 'weekly':
        pdfBuffer = await PDFExporter.generateWeeklyReport(reportData);
        break;
      case 'monthly':
        pdfBuffer = await PDFExporter.generateMonthlyReport(reportData);
        break;
      case 'custom':
        pdfBuffer = await PDFExporter.generateCustomReport(reportData, options);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/export/excel
 * @desc Export report as Excel
 */
router.post('/export/excel', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { reportType = 'weekly', reportData, format = 'xlsx' } = req.body;
    
    let excelBuffer: Buffer;
    
    switch (reportType) {
      case 'weekly':
        excelBuffer = await ExcelExporter.generateWeeklyExcel(reportData);
        break;
      case 'monthly':
        excelBuffer = await ExcelExporter.generateMonthlyExcel(reportData);
        break;
      case 'csv':
        excelBuffer = await ExcelExporter.generateCSV(reportData, 'sessions');
        break;
      default:
        const options = {
          includeCharts: true,
          includeRawData: true,
          includeSummary: true,
          includeComparisons: false,
          format: format as 'xlsx' | 'csv'
        };
        excelBuffer = await ExcelExporter.generateWorkbook(reportData, options);
    }
    
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const mimeType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.${extension}"`);
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export Excel',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route POST /api/analytics/export/chart
 * @desc Export chart as image
 */
router.post('/export/chart', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      chartType, 
      chartData, 
      options = {
        width: 800,
        height: 400,
        format: 'png',
        theme: 'professional'
      } 
    } = req.body;
    
    let chartBuffer: Buffer;
    
    switch (chartType) {
      case 'timeline':
        chartBuffer = await ChartExporter.generateTimelineChart(chartData, options);
        break;
      case 'category':
        chartBuffer = await ChartExporter.generateCategoryChart(chartData, options);
        break;
      case 'heatmap':
        chartBuffer = await ChartExporter.generateHeatmapChart(chartData, options);
        break;
      case 'comparison':
        chartBuffer = await ChartExporter.generateComparisonChart(
          chartData.current, 
          chartData.previous, 
          options
        );
        break;
      case 'trend':
        chartBuffer = await ChartExporter.generateTrendChart(
          chartData.trend, 
          chartData.predictions, 
          options
        );
        break;
      case 'dashboard':
        chartBuffer = await ChartExporter.generateDashboardChart(chartData, options);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid chart type'
        });
    }
    
    const format = options.format || 'png';
    const mimeTypes = {
      png: 'image/png',
      svg: 'image/svg+xml',
      pdf: 'application/pdf'
    };
    
    res.setHeader('Content-Type', mimeTypes[format as keyof typeof mimeTypes] || 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="chart.${format}"`);
    res.send(chartBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export chart',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route GET /api/analytics/export/formats
 * @desc Get available export formats and options
 */
router.get('/export/formats', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      reports: {
        pdf: {
          name: 'PDF Report',
          description: 'Professional PDF report with charts and insights',
          formats: ['weekly', 'monthly', 'custom'],
          options: ['includeCharts', 'includeMetrics', 'includeInsights', 'theme']
        },
        excel: {
          name: 'Excel Workbook',
          description: 'Multi-sheet Excel workbook with raw data and charts',
          formats: ['xlsx', 'csv'],
          options: ['includeCharts', 'includeRawData', 'includeSummary']
        }
      },
      charts: {
        formats: ['png', 'svg', 'pdf'],
        types: ['timeline', 'category', 'heatmap', 'comparison', 'trend', 'dashboard'],
        themes: ['light', 'dark', 'professional'],
        sizes: [
          { name: 'Small', width: 400, height: 300 },
          { name: 'Medium', width: 800, height: 400 },
          { name: 'Large', width: 1200, height: 600 },
          { name: 'Presentation', width: 1920, height: 1080 }
        ]
      }
    }
  });
}));

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('Analytics API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal analytics error',
    message: error.message
  });
});

export default router;