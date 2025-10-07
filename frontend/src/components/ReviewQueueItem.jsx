import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Edit2, Trash2 } from 'lucide-react';

const ReviewQueueItem = ({ item, onApprove, onReject, onEdit, onDelete }) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simplified handler that calls the prop functions directly
  const handleAction = async (actionCallback) => {
    setIsLoading(true);
    try {
      actionCallback(item.id);
    } catch (error) {
      console.error("Failed to perform action", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusPill = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDifficultyPill = (difficulty) => {
    const styles = {
      easy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      medium: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      hard: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[difficulty]}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };
  
  // Updated DetailRow to accept a custom className for the value
  const DetailRow = ({ label, value, valueClassName = '' }) => (
      <div className="grid grid-cols-3 gap-4 py-3">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
          <dd className={`col-span-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap ${valueClassName}`}>{value}</dd>
      </div>
  )

  // Format the evaluation criteria object for display
  const formatCriteria = (criteria) => {
    if (!criteria || typeof criteria !== 'object') return 'N/A';
    return Object.entries(criteria)
      .map(([key, value]) => `- ${key}:\n  ${value}`)
      .join('\n\n');
  };


  return (
    <motion.div
      layout
      className="bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Collapsed View */}
      <div 
        className="flex items-center p-4 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-white truncate">{item.question_text}</p>
          <div className="flex items-center gap-3 mt-2">
            {getStatusPill(item.status)}
            {getDifficultyPill(item.difficulty)}
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Domain: {item.domain}</span>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="ml-4">
            <ChevronDown className="w-5 h-5 text-slate-500" />
        </motion.div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-slate-200 dark:border-slate-700">
                <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                    <DetailRow 
                      label="Expected Answer" 
                      value={item.expected_answer}
                      valueClassName="font-mono"
                    />
                    <DetailRow 
                      label="Evaluation Criteria" 
                      value={formatCriteria(item.evaluation_criteria)}
                      valueClassName="font-mono"
                    />
                    <DetailRow label="Domain" value={item.domain} />
                    <DetailRow label="Submitted By" value={item.suggested_by || 'N/A'} />
                    <DetailRow label="Submission Date" value={new Date(item.created_at).toLocaleString()} />
                </dl>
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {item.status === 'pending' && (
                        <>
                        <button onClick={() => handleAction(onApprove)} className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors">
                            <Check className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleAction(onReject)} className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                            <X className="w-4 h-4" /> Reject
                        </button>
                        </>
                    )}
                    <button onClick={() => onEdit(item)} className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => handleAction(onDelete)} className="p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReviewQueueItem;