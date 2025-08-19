/**
 * Category Manager Component
 * v0.5 - Dashboard integration for category management and ML training
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit3, Trash2, ToggleLeft, ToggleRight, 
  Target, Brain, Download, Upload, TestTube, Settings
} from 'lucide-react';
import { ActivityService } from '../../services/api/ActivityService';

interface CategoryRule {
  id: string;
  description: string;
  priority: number;
  category: string;
  appPatterns: string[];
  titlePatterns: string[];
  regexPatterns: string[];
  domainPatterns?: string[];
  productivityScore: number;
  enabled: boolean;
  tags?: string[];
}

interface CategoryStats {
  categories: any;
  machineLearning: {
    totalDataPoints: number;
    correctFeedback: number;
    incorrectFeedback: number;
    accuracy: number;
    userPreferencesCount: number;
  };
}

export const CategoryManager: React.FC = () => {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Form state for creating/editing rules
  const [newRule, setNewRule] = useState({
    description: '',
    category: 'Development',
    appPatterns: [''],
    titlePatterns: [''],
    regexPatterns: [''],
    domainPatterns: [''],
    productivityScore: 0.8,
    priority: 5,
    tags: ['']
  });

  // Test form state
  const [testForm, setTestForm] = useState({
    appName: '',
    windowTitle: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rulesResponse, statsResponse, typesResponse] = await Promise.all([
        ActivityService.getCategoryRules(true),
        ActivityService.getCategoryStats(),
        ActivityService.getCategoryTypes()
      ]);

      if (rulesResponse.success) setRules(rulesResponse.data);
      if (statsResponse.success) setStats(statsResponse.data);
      if (typesResponse.success) setCategoryTypes(typesResponse.data);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    try {
      const response = await ActivityService.searchCategoryRules(searchQuery);
      if (response.success) {
        setRules(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await ActivityService.toggleCategoryRule(ruleId);
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      await ActivityService.deleteCategoryRule(ruleId);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      // Filter out empty strings from arrays
      const ruleData = {
        ...newRule,
        appPatterns: newRule.appPatterns.filter(p => p.trim()),
        titlePatterns: newRule.titlePatterns.filter(p => p.trim()),
        regexPatterns: newRule.regexPatterns.filter(p => p.trim()),
        domainPatterns: newRule.domainPatterns.filter(p => p.trim()),
        tags: newRule.tags.filter(t => t.trim())
      };

      await ActivityService.createCategoryRule(ruleData);
      setShowCreateModal(false);
      resetNewRuleForm();
      await fetchData();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleTestCategorization = async () => {
    try {
      const response = await ActivityService.testCategorization({
        appName: testForm.appName,
        windowTitle: testForm.windowTitle || undefined
      });
      setTestResults(response);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handleProvideFeedback = async (
    appName: string,
    expectedCategory: string,
    isCorrect: boolean,
    windowTitle?: string
  ) => {
    try {
      await ActivityService.provideCategoryFeedback(appName, expectedCategory, isCorrect, windowTitle);
      await fetchData(); // Refresh stats
    } catch (error) {
      console.error('Failed to provide feedback:', error);
    }
  };

  const resetNewRuleForm = () => {
    setNewRule({
      description: '',
      category: 'Development',
      appPatterns: [''],
      titlePatterns: [''],
      regexPatterns: [''],
      domainPatterns: [''],
      productivityScore: 0.8,
      priority: 5,
      tags: ['']
    });
  };

  const addArrayField = (field: keyof typeof newRule) => {
    setNewRule({
      ...newRule,
      [field]: [...(newRule[field] as string[]), '']
    });
  };

  const updateArrayField = (field: keyof typeof newRule, index: number, value: string) => {
    const array = [...(newRule[field] as string[])];
    array[index] = value;
    setNewRule({ ...newRule, [field]: array });
  };

  const removeArrayField = (field: keyof typeof newRule, index: number) => {
    const array = (newRule[field] as string[]).filter((_, i) => i !== index);
    setNewRule({ ...newRule, [field]: array });
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchQuery || 
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.appPatterns.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || rule.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading category data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
            <p className="text-gray-600">Manage categorization rules and machine learning</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Categorization
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">Total Rules</div>
              <div className="text-2xl font-bold text-blue-800">
                {rules.length}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">ML Data Points</div>
              <div className="text-2xl font-bold text-green-800">
                {stats.machineLearning.totalDataPoints}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 mb-1">ML Accuracy</div>
              <div className="text-2xl font-bold text-purple-800">
                {Math.round(stats.machineLearning.accuracy * 100)}%
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 mb-1">User Preferences</div>
              <div className="text-2xl font-bold text-orange-800">
                {stats.machineLearning.userPreferencesCount}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categoryTypes.map(type => (
              <option key={type.type} value={type.type}>
                {type.icon} {type.type}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            Categorization Rules ({filteredRules.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredRules.map(rule => (
            <div key={rule.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-800">
                      {rule.description}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      categoryTypes.find(t => t.type === rule.category)?.color || 'bg-gray-100'
                    } text-white`}>
                      {rule.category}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Priority: {rule.priority}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Apps:</span> {rule.appPatterns.join(', ')}
                    </div>
                    {rule.titlePatterns.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Titles:</span> {rule.titlePatterns.join(', ')}
                      </div>
                    )}
                    {rule.domainPatterns && rule.domainPatterns.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Domains:</span> {rule.domainPatterns.join(', ')}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Productivity Score:</span> {Math.round(rule.productivityScore * 100)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`p-2 rounded-md ${rule.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    className="p-2 text-blue-600 rounded-md hover:bg-blue-50"
                    title="Edit rule"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-red-600 rounded-md hover:bg-red-50"
                    title="Delete rule"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Rule</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rule description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categoryTypes.map(type => (
                        <option key={type.type} value={type.type}>{type.type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <input
                      type="number"
                      value={newRule.priority}
                      onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Patterns
                    <button
                      type="button"
                      onClick={() => addArrayField('appPatterns')}
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-4 w-4 inline" />
                    </button>
                  </label>
                  {newRule.appPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={pattern}
                        onChange={(e) => updateArrayField('appPatterns', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., chrome, firefox"
                      />
                      {newRule.appPatterns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('appPatterns', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Score</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newRule.productivityScore}
                    onChange={(e) => setNewRule({ ...newRule, productivityScore: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    Current: {Math.round(newRule.productivityScore * 100)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewRuleForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Test Categorization</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
                  <input
                    type="text"
                    value={testForm.appName}
                    onChange={(e) => setTestForm({ ...testForm, appName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Google Chrome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Window Title (Optional)</label>
                  <input
                    type="text"
                    value={testForm.windowTitle}
                    onChange={(e) => setTestForm({ ...testForm, windowTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., GitHub - Dashboard"
                  />
                </div>

                <button
                  onClick={handleTestCategorization}
                  className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Test Categorization
                </button>

                {testResults && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Test Results</h4>
                    <div className="space-y-2">
                      <div><span className="font-medium">Category:</span> {testResults.result.category}</div>
                      <div><span className="font-medium">Confidence:</span> {Math.round(testResults.result.confidence * 100)}%</div>
                      <div><span className="font-medium">Productivity Score:</span> {Math.round(testResults.result.productivityScore * 100)}%</div>
                      <div><span className="font-medium">Match Type:</span> {testResults.result.matchType}</div>
                      {testResults.result.suggestions && testResults.result.suggestions.length > 0 && (
                        <div>
                          <span className="font-medium">Suggestions:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {testResults.result.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Was this categorization correct?</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleProvideFeedback(
                            testForm.appName,
                            testResults.result.category,
                            true,
                            testForm.windowTitle
                          )}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          ✓ Correct
                        </button>
                        <button
                          onClick={() => handleProvideFeedback(
                            testForm.appName,
                            testResults.result.category,
                            false,
                            testForm.windowTitle
                          )}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          ✗ Incorrect
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestResults(null);
                    setTestForm({ appName: '', windowTitle: '' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;