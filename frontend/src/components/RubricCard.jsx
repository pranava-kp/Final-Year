import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Edit2, Trash2, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';

const RubricCard = ({ rubric, onEdit, onDelete, onToggleStatus }) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const getDomainPill = (domain) => {
    const styles = {
      programming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'system-design': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      databases: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      algorithms: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      'data-structures': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[domain] || 'bg-slate-100 dark:bg-slate-700'}`}>
        {domain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const DetailRow = ({ label, value }) => (
    <div className="py-3 grid grid-cols-3 gap-4">
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="col-span-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">{value}</dd>
    </div>
  );
  
  const formatCriteria = (criteria) => {
    if (!criteria || typeof criteria !== 'object') return 'N/A';
    return Object.entries(criteria)
      .map(([key, value]) => `[${key}] - Weight: ${value.weight}\n${value.description}`)
      .join('\n\n');
  };

  return (
    <motion.div
      layout
      className="bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
    >
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    {rubric.is_active ? 
                        <CheckCircle className="w-5 h-5 text-green-500" /> : 
                        <XCircle className="w-5 h-5 text-slate-500" /> 
                    }
                    {getDomainPill(rubric.domain)}
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{rubric.name}</h3>
            </div>
             <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                </motion.div>
            </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{rubric.description}</p>
        
        {/* Expanded Details */}
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <dl className="divide-y divide-slate-200 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700">
                       <DetailRow label="Criteria" value={formatCriteria(rubric.criteria)} />
                       <DetailRow label="Created By" value={rubric.created_by} />
                       <DetailRow label="Last Updated" value={new Date(rubric.updated_at).toLocaleString()} />
                    </dl>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <button
          onClick={() => onToggleStatus(rubric.id, !rubric.is_active)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
        >
          {rubric.is_active ? 
            <><ToggleRight className="w-5 h-5 text-green-500" /> Active</> : 
            <><ToggleLeft className="w-5 h-5" /> Inactive</>
          }
        </button>
        <div className="flex items-center space-x-2">
            <button onClick={() => onEdit(rubric)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(rubric.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RubricCard;