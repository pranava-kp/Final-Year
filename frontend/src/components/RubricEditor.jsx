import React, { useState, useEffect } from 'react';
import JsonEditor from './JsonEditor';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { newRubricTemplate } from '../data/mockRubrics';

const RubricEditor = ({ rubric, onSave, onCancel, isLoading = false, domains = [] }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: 'programming',
    is_active: true,
    criteria: {}
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (rubric) {
      setFormData({
        name: rubric.name || '',
        description: rubric.description || '',
        domain: rubric.domain || 'programming',
        is_active: rubric.is_active !== undefined ? rubric.is_active : true,
        criteria: rubric.criteria || {}
      });
    } else {
      setFormData({
        name: '',
        description: '',
        domain: 'programming',
        is_active: true,
        criteria: newRubricTemplate.criteria
      });
    }
    setErrors({});
  }, [rubric]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Rubric name is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    
    try {
        const criteria = formData.criteria;
        if (typeof criteria !== 'object' || criteria === null || Object.keys(criteria).length === 0) {
            newErrors.criteria = 'Criteria must be a non-empty JSON object.';
        } else {
            const totalWeight = Object.values(criteria).reduce((sum, crit) => sum + (Number(crit.weight) || 0), 0);
            if (Math.abs(totalWeight - 1.0) > 0.001) {
                newErrors.criteria = `Total weight of all criteria must be 1.0 (current sum: ${totalWeight.toFixed(2)}).`;
            }
        }
    } catch (e) {
        newErrors.criteria = 'Criteria is not a valid JSON object.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCriteriaChange = (newCriteria) => {
    setFormData(prev => ({ ...prev, criteria: newCriteria }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };
  
  const FormInput = ({ label, name, value, onChange, error, placeholder }) => (
      <div>
          <label htmlFor={name} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
          <input
              type="text"
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className={`w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 rounded-full px-5 py-3 focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'}`}
          />
          {error && <p className="mt-2 text-xs text-red-500 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{error}</p>}
      </div>
  );

  const FormTextarea = ({ label, name, value, onChange, error, placeholder }) => (
       <div>
          <label htmlFor={name} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
          <textarea
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              rows={3}
              className={`w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 transition resize-none ${error ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'}`}
          />
          {error && <p className="mt-2 text-xs text-red-500 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{error}</p>}
      </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-4xl m-4 h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{rubric ? 'Edit Rubric' : 'Create New Rubric'}</h2>
            <p className="text-slate-500 dark:text-slate-400">Fill in the details below to define the evaluation criteria.</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Rubric Name" name="name" value={formData.name} onChange={handleInputChange} error={errors.name} placeholder="e.g., Senior Python Developer" />
                
                <div>
                    <label htmlFor="domain" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Domain</label>
                    <select id="domain" name="domain" value={formData.domain} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-transparent rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        {domains.map(d => <option key={d} value={d}>{d.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                </div>
            </div>
          
            <FormTextarea label="Description" name="description" value={formData.description} onChange={handleInputChange} error={errors.description} placeholder="A brief description of what this rubric evaluates." />

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Evaluation Criteria (JSON)</label>
                <JsonEditor value={formData.criteria} onChange={handleCriteriaChange} />
                {errors.criteria && <p className="mt-2 text-xs text-red-500 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.criteria}</p>}
            </div>
        </form>

        {/* Footer */}
        <footer className="flex justify-between items-center p-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Set as Active
                </label>
            </div>
            <div className="flex items-center space-x-4">
                <button type="button" onClick={onCancel} disabled={isLoading} className="py-2 px-5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                    Cancel
                </button>
                <button type="submit" onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2 py-2 px-5 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50">
                    <Save className="w-4 h-4"/>
                    {isLoading ? 'Saving...' : 'Save Rubric'}
                </button>
            </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default RubricEditor;