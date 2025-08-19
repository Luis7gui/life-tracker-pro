/**
 * Life Tracker Pro - Activity Slice Tests
 * Tests for Redux activity slice
 */

import { configureStore } from '@reduxjs/toolkit';
import activityReducer, { 
  fetchDashboardData, 
  startTracking, 
  stopTracking,
  clearErrors 
} from './activitySlice';

// Mock axios
jest.mock('axios');

describe('Activity Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        activity: activityReducer
      }
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = (store.getState() as any).activity;
      expect(state.dashboardData).toBeNull();
      expect(state.systemStatus).toBeNull();
      expect(state.currentSession).toBeNull();
      expect(state.errors.dashboard).toBeNull();
      expect(state.errors.system).toBeNull();
      expect(state.loading.dashboard).toBe(false);
      expect(state.loading.system).toBe(false);
    });
  });

  describe('clearErrors action', () => {
    it('should clear all errors', () => {
      // First set some errors
      const stateWithErrors = {
        ...(store.getState() as any).activity,
        errors: {
          dashboard: 'Dashboard error',
          system: 'System error'
        }
      };

      store.dispatch(clearErrors());
      const state = (store.getState() as any).activity;
      expect(state.errors.dashboard).toBeNull();
      expect(state.errors.system).toBeNull();
    });
  });

  describe('async thunks', () => {
    describe('fetchDashboardData', () => {
      it('should set loading to true when pending', () => {
        store.dispatch(fetchDashboardData.pending('test', undefined));
        const state = (store.getState() as any).activity;
        expect(state.loading.dashboard).toBe(true);
        expect(state.errors.dashboard).toBeNull();
      });

      it('should set data when fulfilled', () => {
        const mockData = {
          todaySummary: { totalActiveTime: 3600, productivityScore: 85 },
          recentSessions: { sessions: [] },
          timeOfDayAnalysis: { morning: 1800, afternoon: 1200, evening: 600, night: 0 }
        };

        store.dispatch(fetchDashboardData.fulfilled(mockData, 'test', undefined));
        const state = (store.getState() as any).activity;
        expect(state.loading.dashboard).toBe(false);
        expect(state.dashboardData).toEqual(mockData);
      });

      it('should set error when rejected', () => {
        const error = new Error('Failed to fetch data');
        store.dispatch(fetchDashboardData.rejected(error, 'test', undefined));
        const state = (store.getState() as any).activity;
        expect(state.loading.dashboard).toBe(false);
        expect(state.errors.dashboard).toBe('Failed to fetch data');
      });
    });

    describe('startTracking', () => {
      it('should set loading to true when pending', () => {
        const payload = { activity: 'Test Activity', category: 'work' };
        store.dispatch(startTracking.pending('test', payload));
        const state = (store.getState() as any).activity;
        expect(state.loading.system).toBe(true);
        expect(state.errors.system).toBeNull();
      });

      it('should set current session when fulfilled', () => {
        const mockSession = {
          id: '123',
          activity: 'Test Activity',
          category: 'work',
          startTime: new Date().toISOString(),
          duration: 0,
          active: true
        };

        const payload = { activity: 'Test Activity', category: 'work' };
        store.dispatch(startTracking.fulfilled(mockSession, 'test', payload));
        const state = (store.getState() as any).activity;
        expect(state.loading.system).toBe(false);
        expect(state.currentSession).toEqual(mockSession);
      });
    });

    describe('stopTracking', () => {
      it('should clear current session when fulfilled', () => {
        const mockSession = {
          id: '123',
          activity: 'Test Activity',
          category: 'work',
          startTime: new Date().toISOString(),
          duration: 300,
          active: false
        };

        store.dispatch(stopTracking.fulfilled(mockSession, 'test', undefined));
        const state = (store.getState() as any).activity;
        expect(state.loading.system).toBe(false);
        expect(state.currentSession).toBeNull(); // stopTracking clears current session
      });
    });
  });
});