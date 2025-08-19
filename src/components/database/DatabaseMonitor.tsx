/**
 * Database Monitor Component
 * v0.5 - Database performance monitoring and optimization
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, Activity, Zap, HardDrive, Clock, Users, 
  TrendingUp, Settings, Download, RefreshCw, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { ActivityService } from '../../services/api/ActivityService';

interface DatabaseStats {
  connectionPool: {
    used: number;
    free: number;
    pending: number;
    size: number;
  };
  performance: {
    avgQueryTime: number;
    totalQueries: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  storage: {
    databaseSizeBytes: number;
    tableStats: { [tableName: string]: { rows: number; sizeBytes: number } };
  };
}

interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  details: {
    responseTime: number;
    connectionPool: any;
    recentSlowQueries: number;
    uptime: number;
  };
}

export const DatabaseMonitor: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [queryPerformance, setQueryPerformance] = useState<any>(null);
  const [slowQueries, setSlowQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  useEffect(() => {
    fetchDatabaseData();
    const interval = setInterval(fetchDatabaseData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDatabaseData = async () => {
    try {
      const [statsResponse, healthResponse, perfResponse, slowQueriesResponse] = await Promise.all([
        ActivityService.getDatabaseStats().catch(err => ({ error: err.message })),
        ActivityService.getDatabaseHealth().catch(err => ({ status: 'unknown', error: err.message })),
        ActivityService.getQueryPerformance().catch(err => ({ error: err.message })),
        ActivityService.getSlowQueries(1000, 20).catch(err => ({ data: { summary: [], recentQueries: [] } }))
      ]);

      if (statsResponse.success) setStats(statsResponse.data);
      if (healthResponse.status) setHealth(healthResponse);
      if (perfResponse.success) setQueryPerformance(perfResponse.data);
      if (slowQueriesResponse.success) setSlowQueries(slowQueriesResponse.data.recentQueries || []);
    } catch (error) {
      console.error('Failed to fetch database data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    try {
      const response = await ActivityService.optimizeDatabase();
      if (response.success) {
        setOptimizationResult(response);
        await fetchDatabaseData(); // Refresh data after optimization
      }
    } catch (error) {
      console.error('Database optimization failed:', error);
      setOptimizationResult({ error: 'Optimization failed' });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await ActivityService.createDatabaseBackup();
      if (response.success) {
        alert(`Backup created successfully: ${response.backupPath}`);
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      alert('Backup creation failed');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await ActivityService.clearQueryCache();
      if (response.success) {
        alert(`Cleared ${response.clearedEntries} cache entries`);
        await fetchDatabaseData();
      }
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading database monitor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Database Monitor</h2>
              <p className="text-gray-600">Performance, health, and optimization</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {health?.status === 'healthy' ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Healthy</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">
                  {health?.status === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Optimize Database'}
          </button>
          
          <button
            onClick={handleBackup}
            disabled={isCreatingBackup}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isCreatingBackup ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
          </button>

          <button
            onClick={handleClearCache}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </button>

          <button
            onClick={fetchDatabaseData}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Optimization Result */}
      {optimizationResult && (
        <div className={`rounded-lg p-4 ${
          optimizationResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}>
          <h3 className={`font-medium ${
            optimizationResult.error ? 'text-red-800' : 'text-green-800'
          }`}>
            {optimizationResult.error ? 'Optimization Failed' : 'Optimization Completed'}
          </h3>
          <p className={`text-sm mt-1 ${
            optimizationResult.error ? 'text-red-700' : 'text-green-700'
          }`}>
            {optimizationResult.error || optimizationResult.message}
          </p>
          {optimizationResult.details && (
            <div className="mt-2 text-sm text-green-600">
              <ul className="list-disc list-inside">
                <li>Vacuum: {optimizationResult.details.vacuum}</li>
                <li>Analyze: {optimizationResult.details.analyze}</li>
                <li>Optimize: {optimizationResult.details.optimize}</li>
                <li>Cleaned records: {optimizationResult.details.cleanedPerformanceRecords}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connection Pool */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Connection Pool</h3>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Used:</span>
                <span className="font-medium">{stats.connectionPool.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Free:</span>
                <span className="font-medium">{stats.connectionPool.free}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="font-medium">{stats.connectionPool.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-medium">{stats.connectionPool.size}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(stats.connectionPool.used / stats.connectionPool.size) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.connectionPool.used / stats.connectionPool.size) * 100)}% utilized
              </p>
            </div>
          </div>

          {/* Query Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Query Performance</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Query Time:</span>
                <span className="font-medium">{stats.performance.avgQueryTime.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Queries:</span>
                <span className="font-medium">{stats.performance.totalQueries.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Slow Queries:</span>
                <span className={`font-medium ${stats.performance.slowQueries > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.performance.slowQueries}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cache Hit Rate:</span>
                <span className="font-medium">{stats.performance.cacheHitRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Storage</h3>
              <HardDrive className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Size:</span>
                <span className="font-medium">{formatBytes(stats.storage.databaseSizeBytes)}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.storage.tableStats).map(([tableName, tableInfo]) => (
                  <div key={tableName} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{tableName}:</span>
                    <span className="font-medium">{tableInfo.rows.toLocaleString()} rows</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health Details */}
          {health && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Health Status</h3>
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Time:</span>
                  <span className="font-medium">{health.details.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="font-medium">{formatUptime(health.details.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recent Slow Queries:</span>
                  <span className={`font-medium ${health.details.recentSlowQueries > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {health.details.recentSlowQueries}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Slow Queries */}
      {slowQueries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Recent Slow Queries</h3>
              <Clock className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Execution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows Affected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executed At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slowQueries.slice(0, 10).map((query, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {query.query_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {query.execution_time_ms}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {query.rows_affected}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(query.executed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Query Performance Chart Data */}
      {queryPerformance && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Query Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(queryPerformance.summary || {}).map(([queryType, stats]: [string, any]) => (
              <div key={queryType} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">{queryType}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Executions:</span>
                    <span className="font-medium">{stats.totalExecutions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Time:</span>
                    <span className="font-medium">{stats.avgTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. QPS:</span>
                    <span className="font-medium">{stats.estimatedQueriesPerSecond}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseMonitor;