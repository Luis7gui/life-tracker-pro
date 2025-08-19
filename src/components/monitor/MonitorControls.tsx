/**
 * Monitor Controls Component
 * v0.5 - Dashboard integration for activity monitoring
 */

import React, { useState, useEffect } from 'react';
import { Play, Square, Settings, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { ActivityService } from '../../services/api/ActivityService';

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
  config: {
    sampleInterval: number;
    idleThreshold: number;
    trackWindowTitles: boolean;
    excludeApplications: string[];
  };
}

export const MonitorControls: React.FC = () => {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    sampleInterval: 2000,
    idleThreshold: 300000,
    trackWindowTitles: true,
    excludeApplications: [] as string[]
  });

  useEffect(() => {
    fetchMonitorStatus();
    const interval = setInterval(fetchMonitorStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitorStatus = async () => {
    try {
      const response = await ActivityService.getMonitorStatus();
      if (response.success) {
        setStatus(response.data);
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to fetch monitor status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await ActivityService.startMonitor();
      await fetchMonitorStatus();
    } catch (error) {
      console.error('Failed to start monitor:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await ActivityService.stopMonitor();
      await fetchMonitorStatus();
    } catch (error) {
      console.error('Failed to stop monitor:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleForceEndSession = async () => {
    try {
      await ActivityService.forceEndCurrentSession();
      await fetchMonitorStatus();
    } catch (error) {
      console.error('Failed to force end session:', error);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await ActivityService.updateMonitorConfig(config);
      await fetchMonitorStatus();
      setShowConfig(false);
    } catch (error) {
      console.error('Failed to update monitor config:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimeSinceActivity = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading monitor status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Activity Monitor</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            title="Monitor Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          {status?.isRunning ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Running</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Stopped</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Display */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className={`text-lg font-semibold ${status.isRunning ? 'text-green-600' : 'text-red-600'}`}>
              {status.isRunning ? 'Active' : 'Inactive'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">User State</div>
            <div className={`text-lg font-semibold ${status.isIdle ? 'text-orange-600' : 'text-green-600'}`}>
              {status.isIdle ? 'Idle' : 'Active'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Device</div>
            <div className="text-lg font-semibold text-gray-800">
              {status.hostname}
            </div>
            <div className="text-sm text-gray-500">{status.osName}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Last Activity</div>
            <div className="text-lg font-semibold text-gray-800">
              {formatTimeSinceActivity(status.timeSinceActivity)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Sample Rate</div>
            <div className="text-lg font-semibold text-gray-800">
              {status.config.sampleInterval / 1000}s
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Idle Threshold</div>
            <div className="text-lg font-semibold text-gray-800">
              {status.config.idleThreshold / 60000}min
            </div>
          </div>
        </div>
      )}

      {/* Current Session */}
      {status?.currentSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Current Session</h3>
              <div className="text-sm text-blue-700 mt-1">
                <span className="font-medium">{status.currentSession.application}</span>
                {status.currentSession.category && (
                  <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">
                    {status.currentSession.category}
                  </span>
                )}
              </div>
              <div className="text-sm text-blue-600 mt-2">
                Duration: {formatDuration(status.currentSession.duration)}
                {status.currentSession.productivityScore && (
                  <span className="ml-4">
                    Productivity: {Math.round(status.currentSession.productivityScore * 100)}%
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleForceEndSession}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-3">
        {!status?.isRunning ? (
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? 'Starting...' : 'Start Monitor'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isStopping}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="h-4 w-4 mr-2" />
            {isStopping ? 'Stopping...' : 'Stop Monitor'}
          </button>
        )}
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Monitor Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Interval (seconds)
              </label>
              <input
                type="number"
                value={config.sampleInterval / 1000}
                onChange={(e) => setConfig({
                  ...config,
                  sampleInterval: Number(e.target.value) * 1000
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idle Threshold (minutes)
              </label>
              <input
                type="number"
                value={config.idleThreshold / 60000}
                onChange={(e) => setConfig({
                  ...config,
                  idleThreshold: Number(e.target.value) * 60000
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.trackWindowTitles}
                  onChange={(e) => setConfig({
                    ...config,
                    trackWindowTitles: e.target.checked
                  })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Track window titles for better categorization</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Config
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorControls;