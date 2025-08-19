import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import activityReducer from './slices/activitySlice';

// Configure store with reducers
export const store = configureStore({
  reducer: {
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
export const selectIsTracking = (state: RootState) => 
  state.activity.currentSession?.active || false;

export const selectCurrentActivity = (state: RootState) => 
  state.activity.currentSession?.activity || 'Unknown';

export const selectTotalActiveTime = (state: RootState) => 
  state.activity.dashboardData?.todaySummary?.totalActiveTime || 0;

export const selectProductivityScore = (state: RootState) => 
  state.activity.dashboardData?.todaySummary?.productivityScore || 0;

export const selectIsDashboardLoading = (state: RootState) => 
  state.activity.loading.dashboard;

export const selectDashboardError = (state: RootState) => 
  state.activity.errors.dashboard;

export const selectCurrentSession = (state: RootState) => 
  state.activity.currentSession;

export const selectTimeOfDayData = (state: RootState) => 
  state.activity.dashboardData?.timeOfDayAnalysis || null;

export const selectRecentSessions = (state: RootState) => 
  state.activity.dashboardData?.recentSessions?.sessions || [];

export const selectSystemStatus = (state: RootState) => 
  state.activity.systemStatus;
