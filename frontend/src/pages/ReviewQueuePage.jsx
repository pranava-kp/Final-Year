import React, { useState, useEffect } from 'react';
import { reviewQueueApi, handleApiError } from '../services/adminApi';
import ReviewQueueItem from '../components/ReviewQueueItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Inbox } from 'lucide-react';

const ReviewQueuePage = () => {
  const { isDark } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
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
        const result = await reviewQueueApi.getItems(filters);
        setItems(result.items || []);
        setStats(result.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
        setError(handleApiError(err).error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    const debouncedLoad = setTimeout(() => {
        loadItems();
    }, 300);
    return () => clearTimeout(debouncedLoad);
  }, [filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Callback for when an item's status is updated in a child component
  const handleItemUpdate = () => {
    loadItems();
  };

  const FilterSelect = ({ name, value, onChange, options, placeholder }) => (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    >
      <option value="all">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
    </select>
  );

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-2">
            Review Queue
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Approve, reject, and manage submitted questions. ({stats.pending} pending)
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 p-6 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Search..."
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent rounded-full pl-12 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>
                <FilterSelect name="status" value={filters.status} onChange={handleFilterChange} options={['pending', 'approved', 'rejected']} placeholder="Any Status" />
                <FilterSelect name="difficulty" value={filters.difficulty} onChange={handleFilterChange} options={['easy', 'medium', 'hard']} placeholder="Any Difficulty" />
            </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={loadItems} className="mb-6" />}

        {/* Content */}
        {loading ? (
            <div className="w-full flex justify-center items-center h-64">
                <LoadingSpinner text="Fetching queue items..." />
            </div>
        ) : (
          <AnimatePresence>
            {items.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 rounded-2xl bg-slate-100 dark:bg-slate-800"
                >
                    <Inbox className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">The Queue is Empty</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Try adjusting your filters or check back later.
                    </p>
                </motion.div>
            ) : (
              <motion.div className="space-y-4">
                {items.map((item) => (
                  <ReviewQueueItem
                    key={item.id}
                    item={item}
                    onApprove={handleItemUpdate}
                    onReject={handleItemUpdate}
                    onEdit={() => { /* Your edit logic here */ }}
                    onDelete={handleItemUpdate}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </main>
  );
};

export default ReviewQueuePage;