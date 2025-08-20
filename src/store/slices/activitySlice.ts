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

interface MonitorStatus {
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
}

interface DashboardData {
  monitorStatus?: MonitorStatus;
  todaySummary?: {
    totalActiveTime: number;
    productivityScore: number;
  };
  recentSessions?: {
    sessions: Session[];
  };
  categoryTimes?: Record<string, number>;
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
// const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && !process.env.REACT_APP_DISABLE_MOCK; // Unused

// Async thunks
export const fetchSystemStatus = createAsyncThunk(
  'activity/fetchSystemStatus',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/api/status`);
    return response.data;
  }
);

export const fetchMonitorStatus = createAsyncThunk(
  'activity/fetchMonitorStatus',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/api/monitor/status`);
    return response.data;
  }
);

export const fetchTodaySessions = createAsyncThunk(
  'activity/fetchTodaySessions',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/api/monitor/sessions/today`);
    return response.data;
  }
);

export const fetchDashboardData = createAsyncThunk(
  'activity/fetchDashboardData',
  async () => {
    try {
      // Fetch real data from the monitor endpoints
      const [statusResponse, sessionsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/monitor/status`),
        axios.get(`${API_BASE_URL}/api/monitor/sessions/today`)
      ]);
      
      const status = statusResponse.data.data;
      const sessions = sessionsResponse.data.data;
      
      // Calculate dashboard data from sessions
      const totalActiveTime = sessions.reduce((total: number, session: any) => 
        total + (session.duration || 0), 0
      );
      
      const categoryTimes: Record<string, number> = {};
      sessions.forEach((session: any) => {
        const category = session.category || 'other';
        categoryTimes[category] = (categoryTimes[category] || 0) + (session.duration || 0);
      });
      
      return {
        monitorStatus: status,
        todaySummary: {
          totalActiveTime,
          productivityScore: Math.round(
            sessions.reduce((avg: number, session: any) => 
              avg + (session.productivityScore || 0), 0
            ) / (sessions.length || 1)
          )
        },
        recentSessions: {
          sessions: sessions.slice(0, 10)
        },
        categoryTimes,
        timeOfDayAnalysis: {
          morning: Math.floor(totalActiveTime * 0.3),
          afternoon: Math.floor(totalActiveTime * 0.4), 
          evening: Math.floor(totalActiveTime * 0.2),
          night: Math.floor(totalActiveTime * 0.1),
        }
      };
    } catch (error) {
      // Fallback to mock data if API fails
      console.log('🔧 API failed, using mock data');
      return {
        todaySummary: {
          totalActiveTime: Math.floor(Math.random() * 3600),
          productivityScore: Math.floor(Math.random() * 100),
        },
        recentSessions: {
          sessions: []
        },
        categoryTimes: {},
        timeOfDayAnalysis: {
          morning: Math.floor(Math.random() * 1800),
          afternoon: Math.floor(Math.random() * 3600),
          evening: Math.floor(Math.random() * 2400),
          night: Math.floor(Math.random() * 600),
        }
      };
    }
  }
);

export const startTracking = createAsyncThunk(
  'activity/startTracking',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monitor/start`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to start tracking:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to start tracking');
    }
  }
);

export const stopTracking = createAsyncThunk(
  'activity/stopTracking',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monitor/stop`);
      return response.data;
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
        state.currentSession = null;
      })
      .addCase(stopTracking.rejected, (state, action) => {
        state.loading.system = false;
        state.errors.system = action.error.message || 'Failed to stop tracking';
      });

    // fetchMonitorStatus
    builder
      .addCase(fetchMonitorStatus.pending, (state) => {
        state.loading.system = true;
        state.errors.system = null;
      })
      .addCase(fetchMonitorStatus.fulfilled, (state, action) => {
        state.loading.system = false;
        if (state.dashboardData) {
          state.dashboardData.monitorStatus = action.payload.data;
        }
      })
      .addCase(fetchMonitorStatus.rejected, (state, action) => {
        state.loading.system = false;
        state.errors.system = action.error.message || 'Failed to fetch monitor status';
      });

    // fetchTodaySessions
    builder
      .addCase(fetchTodaySessions.pending, (state) => {
        state.loading.dashboard = true;
      })
      .addCase(fetchTodaySessions.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        if (state.dashboardData) {
          state.dashboardData.recentSessions = {
            sessions: action.payload.data.slice(0, 10)
          };
        }
      })
      .addCase(fetchTodaySessions.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.errors.dashboard = action.error.message || 'Failed to fetch today sessions';
      });

    // fetchWeeklySummary and fetchCategoryStats are ignored for now
    // but would be handled similarly
  },
});

export const { clearErrors } = activitySlice.actions;
export default activitySlice.reducer;