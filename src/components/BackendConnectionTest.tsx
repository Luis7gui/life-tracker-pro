/**
 * Life Tracker Pro - Backend Connection Test
 * Component to test and verify backend connectivity
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSystemStatus, fetchDashboardData } from '../store/slices/activitySlice';

const BackendConnectionTest: React.FC = () => {
  const dispatch = useAppDispatch();
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const systemStatus = useAppSelector(state => state.activity.systemStatus);
  const dashboardData = useAppSelector(state => state.activity.dashboardData);
  const errors = useAppSelector(state => state.activity.errors);

  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    setErrorMessage('');
    
    try {
      // Test 1: System Status
      console.log('🔍 Testing backend connection...');
      await dispatch(fetchSystemStatus()).unwrap();
      
      // Test 2: Dashboard Data
      await dispatch(fetchDashboardData()).unwrap();
      
      setConnectionStatus('connected');
      console.log('✅ Backend connected successfully!');
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Connection failed');
      console.error('❌ Backend connection failed:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing': return 'text-yellow-600';
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing': return '🔄';
      case 'connected': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">🔌 Backend Connection Status</h2>
      
      {/* Connection Status */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{getStatusIcon()}</span>
        <div>
          <p className={`font-semibold ${getStatusColor()}`}>
            {connectionStatus === 'testing' && 'Testing Connection...'}
            {connectionStatus === 'connected' && 'Backend Connected!'}
            {connectionStatus === 'error' && 'Connection Failed'}
          </p>
          {errorMessage && (
            <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
          )}
        </div>
        <button
          onClick={testConnection}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🔄 Test Again
        </button>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium text-gray-700 mb-2">🖥️ Frontend</h3>
          <p className="text-sm text-gray-600">http://localhost:3000</p>
          <p className="text-sm text-green-600">✅ Running</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium text-gray-700 mb-2">🔗 Backend API</h3>
          <p className="text-sm text-gray-600">http://localhost:8000</p>
          <p className={`text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
            {connectionStatus === 'connected' ? '✅ Connected' : '❌ Not Connected'}
          </p>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="mt-4 bg-green-50 p-4 rounded">
          <h3 className="font-medium text-green-700 mb-2">📊 System Status</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Status: <span className="font-medium">{systemStatus.status}</span></div>
            <div>Version: <span className="font-medium">{systemStatus.version}</span></div>
            <div>Uptime: <span className="font-medium">{Math.round(systemStatus.uptime / 60)}m</span></div>
            <div>Active: <span className="font-medium">{systemStatus.isTrackingActive ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      )}

      {/* Dashboard Data Preview */}
      {dashboardData && (
        <div className="mt-4 bg-blue-50 p-4 rounded">
          <h3 className="font-medium text-blue-700 mb-2">📈 Data Preview</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-gray-600">Today's Time</p>
              <p className="font-medium">
                {Math.floor((dashboardData.todaySummary?.totalActiveTime || 0) / 3600)}h{' '}
                {Math.floor(((dashboardData.todaySummary?.totalActiveTime || 0) % 3600) / 60)}m
              </p>
            </div>
            <div>
              <p className="text-gray-600">Productivity</p>
              <p className="font-medium">{dashboardData.todaySummary?.productivityScore || 0}%</p>
            </div>
            <div>
              <p className="text-gray-600">Sessions</p>
              <p className="font-medium">{dashboardData.recentSessions?.sessions.length || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {(errors.dashboard || errors.system) && (
        <div className="mt-4 bg-red-50 p-4 rounded">
          <h3 className="font-medium text-red-700 mb-2">⚠️ Error Details</h3>
          {errors.dashboard && (
            <p className="text-sm text-red-600 mb-1">Dashboard: {errors.dashboard}</p>
          )}
          {errors.system && (
            <p className="text-sm text-red-600">System: {errors.system}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BackendConnectionTest;