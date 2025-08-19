/**
 * Life Tracker Pro - Activity Session Model
 * TypeScript adaptation of v0.3 functionality with enhanced type safety
 */

import { Knex } from 'knex';

export interface ActivitySessionData {
  id?: number;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  applicationName: string;
  applicationPath?: string;
  windowTitle?: string;
  windowTitleHash?: string;
  category?: CategoryType;
  productivityScore?: number; // 0.0 to 1.0
  isIdle: boolean;
  isActive: boolean;
  hostname?: string;
  osName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CategoryType {
  DEVELOPMENT = 'Development',
  WORK = 'Work', 
  LEARNING = 'Learning',
  ENTERTAINMENT = 'Entertainment',
  UNCATEGORIZED = 'Uncategorized'
}

export class ActivitySession {
  public id?: number;
  public startTime: Date;
  public endTime?: Date;
  public duration?: number;
  public applicationName: string;
  public applicationPath?: string;
  public windowTitle?: string;
  public windowTitleHash?: string;
  public category?: CategoryType;
  public productivityScore?: number;
  public isIdle: boolean;
  public isActive: boolean;
  public hostname?: string;
  public osName?: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: ActivitySessionData) {
    this.id = data.id;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.duration = data.duration;
    this.applicationName = data.applicationName;
    this.applicationPath = data.applicationPath;
    this.windowTitle = data.windowTitle;
    this.windowTitleHash = data.windowTitleHash;
    this.category = data.category;
    this.productivityScore = data.productivityScore;
    this.isIdle = data.isIdle;
    this.isActive = data.isActive;
    this.hostname = data.hostname;
    this.osName = data.osName;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Check if this session is still ongoing (no end time)
   */
  get isOngoing(): boolean {
    return this.endTime === undefined || this.endTime === null;
  }

  /**
   * Calculate duration in seconds, handling ongoing sessions
   */
  get calculatedDuration(): number {
    if (this.duration !== undefined) {
      return this.duration;
    }

    if (!this.startTime) {
      return 0;
    }

    const endTime = this.endTime || new Date();
    return Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);
  }

  /**
   * Compatibility getter for productivity (alias for productivityScore)
   */
  get productivity(): number | undefined {
    return this.productivityScore;
  }

  /**
   * Compatibility setter for productivity (alias for productivityScore)
   */
  set productivity(value: number | undefined) {
    this.productivityScore = value;
  }

  /**
   * Compatibility getter for activity (alias for applicationName)
   */
  get activity(): string {
    return this.applicationName;
  }

  /**
   * Compatibility setter for activity (alias for applicationName)
   */
  set activity(value: string) {
    this.applicationName = value;
  }

  /**
   * End the session and calculate duration
   */
  endSession(endTime?: Date): void {
    const sessionEndTime = endTime || new Date();
    this.endTime = sessionEndTime;
    this.duration = Math.floor((sessionEndTime.getTime() - this.startTime.getTime()) / 1000);
    this.updatedAt = new Date();
  }

  /**
   * Convert to database format
   */
  toDbFormat(): any {
    return {
      id: this.id,
      start_time: this.startTime,
      end_time: this.endTime,
      duration_seconds: this.duration,
      application_name: this.applicationName,
      application_path: this.applicationPath,
      window_title: this.windowTitle,
      window_title_hash: this.windowTitleHash,
      category: this.category,
      productivity_score: this.productivityScore,
      is_idle: this.isIdle,
      is_active: this.isActive,
      hostname: this.hostname,
      os_name: this.osName,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Create from database row
   */
  static fromDbRow(row: any): ActivitySession {
    return new ActivitySession({
      id: row.id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration_seconds,
      applicationName: row.application_name,
      applicationPath: row.application_path,
      windowTitle: row.window_title,
      windowTitleHash: row.window_title_hash,
      category: row.category as CategoryType,
      productivityScore: row.productivity_score,
      isIdle: Boolean(row.is_idle),
      isActive: Boolean(row.is_active),
      hostname: row.hostname,
      osName: row.os_name,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    });
  }
}

/**
 * Database service for ActivitySession operations
 */
export class ActivitySessionService {
  constructor(private db: Knex) {}

  /**
   * Create a new activity session
   */
  async create(sessionData: Omit<ActivitySessionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivitySession> {
    const now = new Date();
    const session = new ActivitySession({
      ...sessionData,
      createdAt: now,
      updatedAt: now
    });

    const [insertedId] = await this.db('activity_sessions')
      .insert(session.toDbFormat())
      .returning('id');

    session.id = typeof insertedId === 'object' ? insertedId.id : insertedId;
    return session;
  }

  /**
   * Update an existing session
   */
  async update(id: number, updates: Partial<ActivitySessionData>): Promise<ActivitySession | null> {
    const updatedData = {
      ...updates,
      updated_at: new Date()
    };

    await this.db('activity_sessions')
      .where('id', id)
      .update(updatedData);

    return this.findById(id);
  }

  /**
   * Find session by ID
   */
  async findById(id: number): Promise<ActivitySession | null> {
    const row = await this.db('activity_sessions')
      .where('id', id)
      .first();

    return row ? ActivitySession.fromDbRow(row) : null;
  }

  /**
   * Get current active session (ongoing)
   */
  async getCurrentSession(): Promise<ActivitySession | null> {
    const row = await this.db('activity_sessions')
      .whereNull('end_time')
      .andWhere('is_active', true)
      .orderBy('start_time', 'desc')
      .first();

    return row ? ActivitySession.fromDbRow(row) : null;
  }

  /**
   * Get sessions for today
   */
  async getTodaySessions(): Promise<ActivitySession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rows = await this.db('activity_sessions')
      .where('start_time', '>=', today)
      .andWhere('start_time', '<', tomorrow)
      .orderBy('start_time', 'asc');

    return rows.map(row => ActivitySession.fromDbRow(row));
  }

  /**
   * Get recent sessions with limit
   */
  async getRecentSessions(limit: number = 20): Promise<ActivitySession[]> {
    const rows = await this.db('activity_sessions')
      .whereNotNull('duration_seconds')
      .orderBy('start_time', 'desc')
      .limit(limit);

    return rows.map(row => ActivitySession.fromDbRow(row));
  }

  /**
   * Get sessions by date range
   */
  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<ActivitySession[]> {
    const rows = await this.db('activity_sessions')
      .where('start_time', '>=', startDate)
      .andWhere('start_time', '<=', endDate)
      .orderBy('start_time', 'asc');

    return rows.map(row => ActivitySession.fromDbRow(row));
  }

  /**
   * End current session
   */
  async endCurrentSession(): Promise<void> {
    const currentSession = await this.getCurrentSession();
    if (currentSession) {
      currentSession.endSession();
      await this.update(currentSession.id!, {
        endTime: currentSession.endTime,
        duration: currentSession.duration,
        updatedAt: new Date()
      });
    }
  }

  /**
   * Get productivity statistics
   */
  async getProductivityStats(startDate: Date, endDate: Date): Promise<{
    totalTime: number;
    averageProductivity: number;
    sessionCount: number;
    categoryBreakdown: { [key: string]: number };
  }> {
    const sessions = await this.getSessionsByDateRange(startDate, endDate);
    
    const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const sessionCount = sessions.length;
    
    let totalProductivity = 0;
    const categoryBreakdown: { [key: string]: number } = {};

    sessions.forEach(session => {
      if (session.productivityScore) {
        totalProductivity += session.productivityScore;
      }
      
      const category = session.category || CategoryType.UNCATEGORIZED;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (session.duration || 0);
    });

    return {
      totalTime,
      averageProductivity: sessionCount > 0 ? totalProductivity / sessionCount : 0,
      sessionCount,
      categoryBreakdown
    };
  }
}

export default ActivitySession;