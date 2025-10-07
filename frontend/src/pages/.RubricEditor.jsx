import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { rubricsApi } from '../services/adminApi';
import RubricCard from '../components/RubricCard';
import RubricEditor from '../components/RubricEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Settings,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';

const RubricEditorPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const [rubrics, setRubrics] = useState([]);
  const [filteredRubrics, setFilteredRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRubric, setEditingRubric] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load rubrics
  const loadRubrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rubricsApi.getRubrics();
      // Handle both array response (from real API) and object response (from mock)
      const rubricsArray = Array.isArray(data) ? data : data.rubrics || [];
      setRubrics(rubricsArray);
      setFilteredRubrics(rubricsArray);
    } catch (err) {
      setError('Failed to load rubrics. Please try again.');
      console.error('Error loading rubrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter rubrics
  useEffect(() => {
    let filtered = rubrics;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(rubric =>
        rubric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rubric.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(rubric => rubric.domain === domainFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rubric => 
        statusFilter === 'active' ? rubric.is_active : !rubric.is_active
      );
    }

    setFilteredRubrics(filtered);
  }, [rubrics, searchTerm, domainFilter, statusFilter]);

  // Load rubrics on mount
  useEffect(() => {
    loadRubrics();
  }, []);

  // Handle create new rubric
  const handleCreateNew = () => {
    setEditingRubric(null);
    setShowEditor(true);
  };

  // Handle edit rubric
  const handleEdit = (rubric) => {
    setEditingRubric(rubric);
    setShowEditor(true);
  };

  // Handle save rubric
  const handleSave = async (rubricData) => {
    try {
      setSaving(true);
      setError(null);

      if (editingRubric) {
        // Update existing rubric
        const updated = await rubricsApi.update(editingRubric.id, rubricData);
        setRubrics(prev => prev.map(r => r.id === editingRubric.id ? updated : r));
      } else {
        // Create new rubric
        const created = await rubricsApi.create(rubricData);
        setRubrics(prev => [created, ...prev]);
      }

      setShowEditor(false);
      setEditingRubric(null);
    } catch (err) {
      setError(editingRubric ? 'Failed to update rubric.' : 'Failed to create rubric.');
      console.error('Error saving rubric:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete rubric
  const handleDelete = async (rubricId) => {
    try {
      setError(null);
      await rubricsApi.delete(rubricId);
      setRubrics(prev => prev.filter(r => r.id !== rubricId));
    } catch (err) {
      setError('Failed to delete rubric.');
      console.error('Error deleting rubric:', err);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (rubricId, newStatus) => {
    try {
      setError(null);
      const updated = await rubricsApi.update(rubricId, { is_active: newStatus });
      setRubrics(prev => prev.map(r => r.id === rubricId ? updated : r));
    } catch (err) {
      setError('Failed to update rubric status.');
      console.error('Error updating rubric status:', err);
    }
  };

  // Handle cancel editor
  const handleCancel = () => {
    setShowEditor(false);
    setEditingRubric(null);
  };

  const domains = [
    { value: 'all', label: 'All Domains' },
    { value: 'programming', label: 'Programming' },
    { value: 'system-design', label: 'System Design' },
    { value: 'databases', label: 'Databases' },
    { value: 'algorithms', label: 'Algorithms' },
    { value: 'data-structures', label: 'Data Structures' }
  ];

  if (showEditor) {
    return <RubricEditor rubric={editingRubric} onClose={handleCancel} onSave={handleSave} />;
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navigation Sidebar */}
      <div className={`w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-lg`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Interview System
            </span>
          </div>

          <nav className="space-y-2">
            <Link
              to="/admin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/rubrics"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
              }`}
            >
              <ClipboardList size={20} />
              <span>Rubric Editor</span>
            </Link>

            <Link
              to="/admin/interviews"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileText size={20} />
              <span>Interviews</span>
            </Link>

            <Link
              to="/admin/users"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Users size={20} />
              <span>Users</span>
            </Link>

            <Link
              to="/admin/settings"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Theme Toggle */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        <div className={`${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} min-h-screen`}>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              {error && <ErrorMessage message={error} />}
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Rubric Editor
                  </h1>
                  <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and manage evaluation rubrics for different domains
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    + Create New Rubric
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm mb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="search" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search rubrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="domain" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Domain
                  </label>
                  <select
                    id="domain"
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {domains.map(domain => (
                      <option key={domain.value} value={domain.value}>{domain.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rubrics.length}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Rubrics
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rubrics.filter(r => r.is_active).length}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Active
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">○</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rubrics.filter(r => !r.is_active).length}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Inactive
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {filteredRubrics.length}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Filtered Results
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <LoadingSpinner text="Loading rubrics..." />
            ) : filteredRubrics.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
                <div className={`w-12 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <ClipboardList className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                  No rubrics found
                </h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  {searchTerm || domainFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by creating your first rubric.'
                  }
                </p>
                {(!searchTerm && domainFilter === 'all' && statusFilter === 'all') && (
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Create New Rubric
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRubrics.map(rubric => (
                  <RubricCard
                    key={rubric.id}
                    rubric={rubric}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RubricEditorPage;
