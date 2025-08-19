import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface SystemStatus {
  status: string;
  version: string;
  uptime: number;
  isTrackingActive: boolean;
}

interface Session {
  id: string;
  activity: string;
  category: string;
  startTime: string;
  endTime?: string;
  duration: number;
  active: boolean;
}

interface DashboardData {
  todaySummary?: {
    totalActiveTime: number;
    productivityScore: number;
  };
  recentSessions?: {
    sessions: Session[];
  };
  timeOfDayAnalysis?: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

interface ActivityState {
  systemStatus: SystemStatus | null;
  dashboardData: DashboardData | null;
  currentSession: Session | null;
  errors: {
    dashboard: string | null;
    system: string | null;
  };
  loading: {
    dashboard: boolean;
    system: boolean;
  };
}

// Base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Development flag to use mock data when API endpoints are not ready
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && !process.env.REACT_APP_DISABLE_MOCK;

// Async thunks
export const fetchSystemStatus = createAsyncThunk(
  'activity/fetchSystemStatus',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/api/status`);
    return response.data;
  }
);

export const fetchDashboardData = createAsyncThunk(
  'activity/fetchDashboardData',
  async () => {
    if (USE_MOCK_DATA) {
      // Mock dashboard data for development when API endpoints are not ready
      console.log('🔧 Using mock data - API endpoints not implemented yet');
      return {
      todaySummary: {
        totalActiveTime: Math.floor(Math.random() * 3600), // Mock random active time
        productivityScore: Math.floor(Math.random() * 100), // Mock productivity score
      },
      recentSessions: {
        sessions: [
          {
            id: '1',
            activity: 'Working on React components',
            category: 'work',
            startTime: new Date().toISOString(),
            duration: 1800,
            active: false
          },
          {
            id: '2', 
            activity: 'Reading documentation',
            category: 'study',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            duration: 2400,
            active: false
          }
        ],
      },
      timeOfDayAnalysis: {
        morning: Math.floor(Math.random() * 1800),
        afternoon: Math.floor(Math.random() * 3600),
        evening: Math.floor(Math.random() * 2400),
        night: Math.floor(Math.random() * 600),
      },
    };
    } else {
      // Real API call when endpoints are implemented
      const response = await axios.get(`${API_BASE_URL}/api/dashboard`);
      return response.data;
    }
  }
);

export const startTracking = createAsyncThunk(
  'activity/startTracking',
  async (payload: { activity: string; category: string }, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        console.log('🔧 Using mock tracking - API endpoints not implemented yet');
        const newSession: Session = {
          id: Date.now().toString(),
          activity: payload.activity,
          category: payload.category,
          startTime: new Date().toISOString(),
          duration: 0,
          active: true,
        };
        return newSession;
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/monitor/start`, payload);
        return response.data;
      }
    } catch (error: any) {
      console.error('Failed to start tracking:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to start tracking');
    }
  }
);

export const stopTracking = createAsyncThunk(
  'activity/stopTracking',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentSession = state.activity.currentSession;
      
      if (USE_MOCK_DATA) {
        console.log('🔧 Using mock stop tracking - API endpoints not implemented yet');
        if (currentSession) {
          const endTime = new Date().toISOString();
          const duration = Math.floor((new Date().getTime() - new Date(currentSession.startTime).getTime()) / 1000);
          return {
            ...currentSession,
            endTime,
            duration,
            active: false,
          };
        }
        return null;
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/monitor/stop`);
        return response.data;
      }
    } catch (error: any) {
      console.error('Failed to stop tracking:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to stop tracking');
    }
  }
);

export const fetchWeeklySummary = createAsyncThunk(
  'activity/fetchWeeklySummary',
  async () => {
    // Mock weekly summary data
    return {
      totalHours: Math.floor(Math.random() * 40),
      avgProductivity: Math.floor(Math.random() * 100),
      topCategory: 'work',
    };
  }
);

export const fetchCategoryStats = createAsyncThunk(
  'activity/fetchCategoryStats',
  async () => {
    // Mock category statistics
    return {
      work: Math.floor(Math.random() * 10000),
      study: Math.floor(Math.random() * 5000),
      exercise: Math.floor(Math.random() * 3000),
      personal: Math.floor(Math.random() * 2000),
      creative: Math.floor(Math.random() * 2000),
    };
  }
);

// Initial state
const initialState: ActivityState = {
  systemStatus: null,
  dashboardData: null,
  currentSession: null,
  errors: {
    dashboard: null,
    system: null,
  },
  loading: {
    dashboard: false,
    system: false,
  },
};

// Slice
const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.errors.dashboard = null;
      state.errors.system = null;
    },
  },
  extraReducers: (builder) => {
    // fetchSystemStatus
    builder
      .addCase(fetchSystemStatus.pending, (state) => {
        state.loading.system = true;
        state.errors.system = null;
      })
      .addCase(fetchSystemStatus.fulfilled, (state, action) => {
        state.loading.system = false;
        state.systemStatus = action.payload;
      })
      .addCase(fetchSystemStatus.rejected, (state, action) => {
        state.loading.system = false;
        state.errors.system = action.error.message || 'Failed to fetch system status';
      });

    // fetchDashboardData
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading.dashboard = true;
        state.errors.dashboard = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.errors.dashboard = action.error.message || 'Failed to fetch dashboard data';
      });

    // startTracking
    builder
      .addCase(startTracking.pending, (state) => {
        state.loading.system = true;
        state.errors.system = null;
      })
      .addCase(startTracking.fulfilled, (state, action) => {
        state.loading.system = false;
        state.currentSession = action.payload;
      })
      .addCase(startTracking.rejected, (state, action) => {
        state.loading.system = false;
        state.errors.system = action.error.message || 'Failed to start tracking';
      });

    // stopTracking
    builder
      .addCase(stopTracking.pending, (state) => {
        state.loading.system = true;
        state.errors.system = null;
      })
      .addCase(stopTracking.fulfilled, (state, action) => {
        state.loading.system = false;
        if (action.payload) {
          // Add completed session to recent sessions if we have dashboard data
          if (state.dashboardData?.recentSessions) {
            state.dashboardData.recentSessions.sessions.unshift(action.payload);
            // Keep only last 10 sessions
            state.dashboardData.recentSessions.sessions = 
              state.dashboardData.recentSessions.sessions.slice(0, 10);
          }
        }
        state.currentSession = null;
      })
      .addCase(stopTracking.rejected, (state, action) => {
        state.loading.system = false;
        state.errors.system = action.error.message || 'Failed to stop tracking';
      });

    // fetchWeeklySummary and fetchCategoryStats are ignored for now
    // but would be handled similarly
  },
});

export const { clearErrors } = activitySlice.actions;
export default activitySlice.reducer;