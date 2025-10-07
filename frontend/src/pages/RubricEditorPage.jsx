import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { rubricsApi, handleApiError } from '../services/adminApi';
import RubricCard from '../components/RubricCard';
import RubricEditor from '../components/RubricEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText } from 'lucide-react';

const RubricEditorPage = () => {
  const { isDark } = useTheme();
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRubric, setEditingRubric] = useState(null);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    searchTerm: '',
    domainFilter: 'all',
    statusFilter: 'all',
  });

  const loadRubrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rubricsApi.getRubrics();
      setRubrics(Array.isArray(data.rubrics) ? data.rubrics : []);
    } catch (err) {
      setError(handleApiError(err).error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRubrics();
  }, []);
  
  // Dynamically generate the list of unique domains from the loaded rubrics
  const availableDomains = useMemo(() => {
      const domains = new Set(rubrics.map(r => r.domain));
      return Array.from(domains);
  }, [rubrics]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredRubrics = useMemo(() => {
    return rubrics.filter(rubric => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const nameMatch = rubric.name.toLowerCase().includes(searchTermLower);
      const descriptionMatch = rubric.description.toLowerCase().includes(searchTermLower);
      const domainMatch = filters.domainFilter === 'all' || rubric.domain === filters.domainFilter;
      const statusMatch = filters.statusFilter === 'all' || (filters.statusFilter === 'active' ? rubric.is_active : !rubric.is_active);
      return (nameMatch || descriptionMatch) && domainMatch && statusMatch;
    });
  }, [rubrics, filters]);

  const handleCreateNew = () => {
    setEditingRubric(null);
    setShowEditor(true);
  };

  const handleEdit = (rubric) => {
    setEditingRubric(rubric);
    setShowEditor(true);
  };

  const handleSave = async (rubricData) => {
    setSaving(true);
    setError(null);
    try {
      if (editingRubric) {
        await rubricsApi.updateRubric(editingRubric.id, rubricData);
      } else {
        await rubricsApi.createRubric(rubricData);
      }
      setShowEditor(false);
      await loadRubrics();
    } catch (err) {
      setError(handleApiError(err).error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rubricId) => {
    if (window.confirm('Are you sure you want to delete this rubric?')) {
      try {
        await rubricsApi.deleteRubric(rubricId);
        await loadRubrics();
      } catch (err) {
        setError(handleApiError(err).error);
      }
    }
  };

  const handleToggleStatus = async (rubricId, isActive) => {
    try {
      await rubricsApi.updateRubric(rubricId, { is_active: isActive });
      await loadRubrics();
    } catch (err) {
      setError(handleApiError(err).error);
    }
  };

  if (showEditor) {
    return (
      <RubricEditor
        rubric={editingRubric}
        onSave={handleSave}
        onCancel={() => setShowEditor(false)}
        isLoading={saving}
        domains={availableDomains} // Pass the dynamically generated domains
      />
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-2">
              Evaluation Rubrics
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Create and manage evaluation criteria.
            </p>
          </div>
          <button onClick={handleCreateNew} className="flex items-center gap-2 py-3 px-5 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors">
            <Plus className="w-5 h-5" />
            Create New
          </button>
        </div>

        <div className="mb-8 p-6 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search rubrics..."
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent rounded-full pl-12 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <select name="domainFilter" value={filters.domainFilter} onChange={handleFilterChange} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              <option value="all">All Domains</option>
              {availableDomains.map(domain => (
                <option key={domain} value={domain}>{domain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
            <select name="statusFilter" value={filters.statusFilter} onChange={handleFilterChange} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              <option value="all">Any Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        {error && <ErrorMessage message={error} onRetry={loadRubrics} className="mb-6" />}

        {loading ? (
          <div className="w-full flex justify-center items-center h-64">
            <LoadingSpinner text="Loading rubrics..." />
          </div>
        ) : (
          <AnimatePresence>
            {filteredRubrics.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 rounded-2xl bg-slate-100 dark:bg-slate-800">
                <FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Rubrics Found</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Try adjusting your filters, or create a new rubric to get started.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRubrics.map(rubric => (
                  <RubricCard
                    key={rubric.id}
                    rubric={rubric}
                    onEdit={() => handleEdit(rubric)}
                    onDelete={() => handleDelete(rubric.id)}
                    onToggleStatus={() => handleToggleStatus(rubric.id, !rubric.is_active)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </main>
  );
};

export default RubricEditorPage;