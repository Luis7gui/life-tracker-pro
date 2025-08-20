/**
 * Life Tracker Pro - Server Entry Point (Merged Version)
 * Express server with TypeScript, security, performance, database, and activity monitoring
 */

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import { Knex, knex } from 'knex';
import { ActivitySessionService } from './models/ActivitySession';
import ActivityMonitor from './services/ActivityMonitor';
import createApiRoutes from './routes/api';
import monitorRoutes from './routes/monitor';
import categoriesRoutes from './routes/categories';
import databaseRoutes, { setDatabaseManager } from './routes/database';
import DatabaseManager from './services/DatabaseManager';

// Configuration interface
interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  dbPath: string;
  corsOrigin: string[];
}

class LifeTrackerServer {
  private app: express.Application;
  private server?: any;
  private dbManager?: DatabaseManager;
  private activityMonitor?: ActivityMonitor;
  private sessionService?: ActivitySessionService;
  
  private config: ServerConfig;

  constructor() {
    this.app = express();
    this.config = this.loadConfig();
    this.setupMiddleware();
  }

  /**
   * Load server configuration
   */
  private loadConfig(): ServerConfig {
    return {
      port: parseInt(process.env.PORT || '8000', 10),
      host: process.env.HOST || '127.0.0.1',
      nodeEnv: process.env.NODE_ENV || 'development',
      dbPath: process.env.DB_PATH || './database/life_tracker.db',
      corsOrigin: process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',') : 
        ['http://localhost:3000', 'http://127.0.0.1:3000']
    };
  }

  /**
   * Setup Express middleware (preserving your security and performance setup)
   */
  private setupMiddleware(): void {
    // Security middleware (from your original setup)
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));

    // Performance middleware (from your original setup)
    this.app.use(compression());

    // CORS (enhanced from your setup)
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing (from your original setup, enhanced)
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files (for serving the frontend in production)
    if (this.config.nodeEnv === 'production') {
      const staticPath = path.join(__dirname, '../dist/client');
      this.app.use(express.static(staticPath));
    }

    // Request logging (enhanced)
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  /**
   * Initialize optimized database connection
   */
  private async initializeDatabase(): Promise<void> {
    console.log('🚀 Initializing optimized database manager...');
    
    this.dbManager = new DatabaseManager({
      connection: {
        filename: this.config.dbPath
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000
      }
    });

    await this.dbManager.initialize();
    
    // Set up database routes
    setDatabaseManager(this.dbManager);
    
    console.log('✅ Optimized database manager ready');
  }

  /**
   * Initialize activity monitoring service
   */
  private initializeActivityMonitor(): void {
    console.log('Initializing activity monitor...');
    
    if (!this.dbManager) {
      throw new Error('Database manager must be initialized before activity monitor');
    }

    const db = this.dbManager.getRawConnection();
    this.sessionService = new ActivitySessionService(db);
    
    this.activityMonitor = new ActivityMonitor(this.sessionService, {
      sampleInterval: 2000, // 2 seconds
      idleThreshold: 300000, // 5 minutes
      trackWindowTitles: true,
      excludeApplications: [
        'keychain', '1password', 'bitwarden', 'lastpass', 'keepass'
      ]
    });

    // Setup event listeners
    this.activityMonitor.on('started', () => {
      console.log('Activity monitor started');
    });

    this.activityMonitor.on('stopped', () => {
      console.log('Activity monitor stopped');
    });

    this.activityMonitor.on('session:started', (data) => {
      console.log(`New session: ${data.session.applicationName} (${data.categorization.category})`);
    });

    this.activityMonitor.on('session:ended', (data) => {
      const duration = Math.round(data.session.calculatedDuration);
      console.log(`Session ended: ${data.session.applicationName} (${duration}s)`);
    });

    this.activityMonitor.on('error', (error) => {
      console.error('Activity monitor error:', error);
    });

    console.log('Activity monitor initialized');
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    if (!this.dbManager || !this.activityMonitor || !this.sessionService) {
      throw new Error('Dependencies must be initialized before setting up routes');
    }

    const db = this.dbManager.getRawConnection();

    // API routes (new functionality)
    const apiRoutes = createApiRoutes({
      db: db,
      activityMonitor: this.activityMonitor,
      sessionService: this.sessionService
    });

    this.app.use('/api', apiRoutes);
    this.app.use('/api/monitor', monitorRoutes);
    this.app.use('/api/categories', categoriesRoutes);
    this.app.use('/api/database', databaseRoutes);

    // Health check (enhanced from your original)
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '0.4.0',
        environment: this.config.nodeEnv,
        database: this.dbManager ? 'optimized' : 'disconnected',
        monitor: this.activityMonitor?.getStatus().isRunning ? 'running' : 'stopped'
      });
    });

    // Root endpoint (enhanced from your original)
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Life Tracker Pro API Server',
        version: '0.4.0',
        environment: this.config.nodeEnv,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          status: '/api/status',
          currentSession: '/api/current-session',
          todaySummary: '/api/today-summary',
          timeAnalysis: '/api/time-of-day-analysis',
          recentSessions: '/api/recent-sessions',
          monitorStart: 'POST /api/monitor/start',
          monitorStop: 'POST /api/monitor/stop',
          categoriesRules: 'GET /api/categories/rules',
          categoriesTest: 'POST /api/categories/test',
          categoriesFeedback: 'POST /api/categories/feedback',
          categoriesStats: 'GET /api/categories/stats',
          databaseStats: 'GET /api/database/stats',
          databaseHealth: 'GET /api/database/health',
          databaseOptimize: 'POST /api/database/optimize',
          databaseBackup: 'POST /api/database/backup'
        },
        docs: 'Visit the endpoints above for API functionality'
      });
    });

    // Serve frontend in production
    if (this.config.nodeEnv === 'production') {
      this.app.get('*', (req, res) => {
        const indexPath = path.join(__dirname, '../dist/client/index.html');
        res.sendFile(indexPath);
      });
    }

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: [
          'GET /',
          'GET /api/health', 
          'GET /api/status',
          'POST /api/monitor/start',
          'POST /api/monitor/stop'
        ]
      });
    });

    // Global error handler (enhanced)
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: this.config.nodeEnv === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      console.log('Starting Life Tracker Pro Server...');
      console.log(`Environment: ${this.config.nodeEnv}`);
      console.log(`Database: ${this.config.dbPath}`);

      // Initialize components
      await this.initializeDatabase();
      this.initializeActivityMonitor();
      this.setupRoutes();

      // Start server
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        console.log('');
        console.log('🎯 Life Tracker Pro Server Started Successfully!');
        console.log(`📍 Server: http://${this.config.host}:${this.config.port}`);
        console.log(`🗄️  Database: ${this.config.dbPath}`);
        console.log(`🔍 Monitor: Ready to start`);
        console.log(`🛡️  Security: Helmet enabled`);
        console.log(`⚡ Performance: Compression enabled`);
        console.log('');
        console.log('Available endpoints:');
        console.log(`  GET  /`);
        console.log(`  GET  /api/health`);
        console.log(`  GET  /api/status`);
        console.log(`  POST /api/monitor/start`);
        console.log(`  POST /api/monitor/stop`);
        console.log('');
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    console.log('Shutting down Life Tracker Pro Server...');

    try {
      // Stop activity monitor
      if (this.activityMonitor) {
        await this.activityMonitor.stop();
      }

      // Close optimized database connection
      if (this.dbManager) {
        await this.dbManager.close();
      }

      // Close server
      if (this.server) {
        this.server.close(() => {
          console.log('Server closed successfully');
        });
      }

    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdownHandler = (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      this.stop().then(() => {
        process.exit(0);
      }).catch((error) => {
        console.error('Shutdown error:', error);
        process.exit(1);
      });
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.stop().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.stop().then(() => process.exit(1));
    });
  }

  /**
   * Get server instance (for testing)
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get activity monitor instance
   */
  getActivityMonitor(): ActivityMonitor | undefined {
    return this.activityMonitor;
  }
}

// Create and export server instance
const server = new LifeTrackerServer();

// Start server if this file is run directly
if (require.main === module) {
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;
export { LifeTrackerServer };//restart
