import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewQueueApi, handleApiError } from '../services/adminApi';
import ReviewQueueItem from '../components/ReviewQueueItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ReviewQueuePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    domain: 'all',
    difficulty: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Load review queue items
  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.domain !== 'all') params.domain = filters.domain;
      if (filters.difficulty !== 'all') params.difficulty = filters.difficulty;
      if (filters.search) params.search = filters.search;

      const data = await reviewQueueApi.getItems(params);
      setItems(data.items || []);
      setStats(data.stats || stats);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.error);
    } finally {
      setLoading(false);
    }
  };

  // Load items on component mount and filter changes
  useEffect(() => {
    loadItems();
  }, [filters]);

  // Handle approve action
  const handleApprove = async (itemId, reviewNotes) => {
    try {
      await reviewQueueApi.approveItem(itemId, reviewNotes);
      await loadItems(); // Refresh the list
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.error);
    }
  };

  // Handle reject action
  const handleReject = async (itemId, reviewNotes) => {
    try {
      await reviewQueueApi.rejectItem(itemId, reviewNotes);
      await loadItems(); // Refresh the list
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.error);
    }
  };

  // Handle edit action (placeholder for now)
  const handleEdit = (item) => {
    // TODO: Implement edit functionality
    console.log('Edit item:', item);
    alert('Edit functionality will be implemented in the next phase');
  };

  // Handle delete action
  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await reviewQueueApi.deleteItem(itemId);
      await loadItems(); // Refresh the list
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      domain: 'all',
      difficulty: 'all',
      search: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/admin" 
                className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Review Queue
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              {/* Removed user info and logout button */}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-slate-600 font-medium">Total Items</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-slate-600 font-medium">Pending Review</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-slate-600 font-medium">Approved</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-slate-600 font-medium">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/90"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl text-slate-900 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/90"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filters.domain}
              onChange={(e) => handleFilterChange('domain', e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl text-slate-900 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/90"
            >
              <option value="all">All Domains</option>
              <option value="programming">Programming</option>
              <option value="algorithms">Algorithms</option>
              <option value="data-structures">Data Structures</option>
              <option value="system-design">System Design</option>
              <option value="databases">Databases</option>
            </select>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl text-slate-900 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/90"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={loadItems}
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {loading && (
          <LoadingSpinner size="large" text="Loading review queue..." />
        )}

        {/* Items List */}
        {!loading && (
          <div className="space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="text-slate-400 text-6xl mb-6">📝</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">No items found</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  {Object.values(filters).some(f => f !== 'all' && f !== '') 
                    ? 'Try adjusting your filters to see more results.'
                    : 'The review queue is empty.'}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <ReviewQueueItem
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReviewQueuePage;