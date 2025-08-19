/**
 * Life Tracker Pro - Activity Monitor Service
 * TypeScript implementation of cross-platform activity monitoring
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { ActivitySession, ActivitySessionData, ActivitySessionService, CategoryType } from '../models/ActivitySession';
import { categoryManager, CategoryResult } from '../models/CategoryManager';

export interface WindowInfo {
  applicationName: string;
  applicationPath?: string;
  windowTitle: string;
  processId: number;
  isFullscreen: boolean;
}

export interface MonitorConfig {
  sampleInterval: number; // in milliseconds
  idleThreshold: number; // in milliseconds
  trackWindowTitles: boolean;
  excludeApplications: string[];
  windowTitleMaxLength: number;
}

export interface MonitorStatus {
  isRunning: boolean;
  isIdle: boolean;
  hasActiveSession: boolean;
  currentSession?: {
    id?: number;
    application: string;
    startTime: string;
    duration: number;
    category?: string;
    productivityScore?: number;
  };
  lastActivityTime: number;
  timeSinceActivity: number;
  hostname: string;
  osName: string;
  config: MonitorConfig;
}

export class ActivityMonitor extends EventEmitter {
  private isRunning: boolean = false;
  private isIdle: boolean = false;
  private currentSession: ActivitySession | null = null;
  private lastActivityTime: number = Date.now();
  private lastWindowInfo: WindowInfo | null = null;
  
  private monitorInterval?: NodeJS.Timeout;
  private idleCheckInterval?: NodeJS.Timeout;
  
  private readonly config: MonitorConfig;
  private readonly sessionService: ActivitySessionService;
  private readonly hostname: string;
  private readonly osName: string;

  constructor(
    sessionService: ActivitySessionService,
    config: Partial<MonitorConfig> = {}
  ) {
    super();
    
    this.sessionService = sessionService;
    this.hostname = os.hostname();
    this.osName = os.platform();
    
    this.config = {
      sampleInterval: 2000, // 2 seconds
      idleThreshold: 300000, // 5 minutes
      trackWindowTitles: true,
      excludeApplications: [
        'keychain', '1password', 'bitwarden', 'lastpass', 'keepass',
        'system preferences', 'task manager', 'activity monitor'
      ],
      windowTitleMaxLength: 200,
      ...config
    };

    this.setupEventListeners();
  }

  /**
   * Start the activity monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Monitor is already running');
    }

    this.isRunning = true;
    this.lastActivityTime = Date.now();
    
    // Start monitoring intervals
    this.monitorInterval = setInterval(
      () => this.monitorLoop(), 
      this.config.sampleInterval
    );
    
    this.idleCheckInterval = setInterval(
      () => this.checkIdleState(), 
      5000 // Check idle every 5 seconds
    );

    this.emit('started');
    console.log('Activity Monitor started');
  }

  /**
   * Stop the activity monitoring
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear intervals
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }

    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = undefined;
    }

    // End current session
    if (this.currentSession) {
      await this.endCurrentSession();
    }

    this.emit('stopped');
    console.log('Activity Monitor stopped');
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    try {
      // Get current window info
      const currentWindow = await this.getCurrentWindowInfo();
      
      // Check if window has changed
      if (this.hasWindowChanged(currentWindow)) {
        await this.processWindowChange(currentWindow);
        this.lastWindowInfo = currentWindow;
      }

      // Update activity time if not idle
      if (!this.isIdle) {
        this.lastActivityTime = Date.now();
      }

    } catch (error) {
      console.error('Error in monitor loop:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check for idle state
   */
  private checkIdleState(): void {
    const currentTime = Date.now();
    const timeSinceActivity = currentTime - this.lastActivityTime;
    const shouldBeIdle = timeSinceActivity >= this.config.idleThreshold;

    if (shouldBeIdle !== this.isIdle) {
      this.isIdle = shouldBeIdle;

      if (this.isIdle) {
        this.emit('idle', { idleDuration: timeSinceActivity });
        this.endCurrentSession().catch(console.error);
      } else {
        this.emit('active', { idleDuration: timeSinceActivity });
      }
    }
  }

  /**
   * Get current window information
   */
  private async getCurrentWindowInfo(): Promise<WindowInfo | null> {
    try {
      const activeWin = await import('active-win');
      const result = await activeWin.default();
      
      if (!result) {
        return null;
      }

      return {
        applicationName: result.owner?.name || 'Unknown',
        applicationPath: result.owner?.path,
        windowTitle: result.title || '',
        processId: result.owner?.processId || 0,
        isFullscreen: false // Simplified - can be enhanced later
      };
    } catch (error) {
      console.error('Error getting window info:', error);
      // Fallback to basic info if active-win fails
      return {
        applicationName: 'System',
        applicationPath: undefined,
        windowTitle: 'Active',
        processId: process.pid,
        isFullscreen: false
      };
    }
  }

  /**
   * Check if window has changed
   */
  private hasWindowChanged(newWindow: WindowInfo | null): boolean {
    if (!this.lastWindowInfo && !newWindow) return false;
    if (!this.lastWindowInfo || !newWindow) return true;

    return (
      this.lastWindowInfo.applicationName !== newWindow.applicationName ||
      this.lastWindowInfo.windowTitle !== newWindow.windowTitle ||
      this.lastWindowInfo.processId !== newWindow.processId
    );
  }

  /**
   * Process window change
   */
  private async processWindowChange(newWindow: WindowInfo | null): Promise<void> {
    // End current session if it exists
    if (this.currentSession) {
      await this.endCurrentSession();
    }

    // Start new session if we have a valid window and not idle
    if (newWindow && !this.isIdle && !this.shouldExcludeApp(newWindow.applicationName)) {
      await this.startNewSession(newWindow);
    }
  }

  /**
   * Start a new activity session
   */
  private async startNewSession(windowInfo: WindowInfo): Promise<void> {
    try {
      // Categorize the activity
      const categorization = categoryManager.categorize(
        windowInfo.applicationName,
        this.config.trackWindowTitles ? windowInfo.windowTitle : undefined
      );

      // Sanitize window title
      const sanitizedTitle = this.config.trackWindowTitles 
        ? this.sanitizeWindowTitle(windowInfo.windowTitle)
        : undefined;

      // Create session data
      const sessionData: Omit<ActivitySessionData, 'id' | 'createdAt' | 'updatedAt'> = {
        startTime: new Date(),
        applicationName: windowInfo.applicationName,
        applicationPath: windowInfo.applicationPath,
        windowTitle: sanitizedTitle,
        category: categorization.category,
        productivityScore: categorization.productivityScore,
        isIdle: false,
        isActive: true,
        hostname: this.hostname,
        osName: this.osName
      };

      // Save to database
      this.currentSession = await this.sessionService.create(sessionData);

      this.emit('session:started', {
        session: this.currentSession,
        categorization
      });

      console.log(`New session started: ${windowInfo.applicationName} (${categorization.category})`);

    } catch (error) {
      console.error('Error starting new session:', error);
      this.emit('error', error);
    }
  }

  /**
   * End the current session
   */
  private async endCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const endTime = new Date();
      this.currentSession.endSession(endTime);

      // Update in database
      await this.sessionService.update(this.currentSession.id!, {
        endTime: this.currentSession.endTime,
        duration: this.currentSession.duration,
        updatedAt: new Date()
      });

      this.emit('session:ended', {
        session: this.currentSession
      });

      console.log(`Session ended: ${this.currentSession.applicationName} (${this.currentSession.calculatedDuration}s)`);

      this.currentSession = null;

    } catch (error) {
      console.error('Error ending current session:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check if application should be excluded
   */
  private shouldExcludeApp(appName: string): boolean {
    if (!appName) return true;

    const appNameLower = appName.toLowerCase();
    return this.config.excludeApplications.some(excluded => 
      appNameLower.includes(excluded.toLowerCase())
    );
  }

  /**
   * Sanitize window title for privacy and storage
   */
  private sanitizeWindowTitle(title: string): string {
    if (!title) return '';

    let sanitized = title;

    // Truncate if too long
    if (sanitized.length > this.config.windowTitleMaxLength) {
      sanitized = sanitized.substring(0, this.config.windowTitleMaxLength - 3) + '...';
    }

    // Remove sensitive patterns
    const sensitivePatterns = [
      // File paths
      /[A-Za-z]:\\[^\\]*\\/g,
      /\/[^\/]*\/[^\/]*\//g,
      // URLs
      /https?:\/\/[^\s]+/g,
      // Email addresses
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    ];

    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized.trim();
  }

  /**
   * Get current monitor status
   */
  getStatus(): MonitorStatus {
    const currentSession = this.currentSession;
    
    return {
      isRunning: this.isRunning,
      isIdle: this.isIdle,
      hasActiveSession: currentSession !== null,
      currentSession: currentSession ? {
        id: currentSession.id,
        application: currentSession.applicationName,
        startTime: currentSession.startTime.toISOString(),
        duration: currentSession.calculatedDuration,
        category: currentSession.category,
        productivityScore: currentSession.productivityScore
      } : undefined,
      lastActivityTime: this.lastActivityTime,
      timeSinceActivity: Date.now() - this.lastActivityTime,
      hostname: this.hostname,
      osName: this.osName,
      config: this.config
    };
  }

  /**
   * Force end current session (for testing/manual control)
   */
  async forceEndCurrentSession(): Promise<boolean> {
    if (this.currentSession) {
      await this.endCurrentSession();
      return true;
    }
    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitorConfig>): void {
    Object.assign(this.config, newConfig);
    this.emit('config:updated', this.config);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Handle process termination
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception in ActivityMonitor:', error);
      this.emit('error', error);
    });
  }

  /**
   * Get productivity statistics for a date range
   */
  async getProductivityStats(startDate: Date, endDate: Date) {
    return this.sessionService.getProductivityStats(startDate, endDate);
  }

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit: number = 20): Promise<ActivitySession[]> {
    return this.sessionService.getRecentSessions(limit);
  }

  /**
   * Get today's sessions
   */
  async getTodaySessions(): Promise<ActivitySession[]> {
    return this.sessionService.getTodaySessions();
  }
}

export default ActivityMonitor;