import React, { useState, useEffect } from 'react';
import JsonEditor from './JsonEditor';
import { newRubricTemplate } from '../data/mockRubrics';

const RubricEditor = ({ rubric, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: 'programming',
    is_active: true,
    criteria: {}
  });
  const [errors, setErrors] = useState({});

  // Initialize form data
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.criteria || Object.keys(formData.criteria).length === 0) {
      newErrors.criteria = 'At least one criterion is required';
    } else {
      // Validate criteria structure
      try {
        const totalWeight = Object.values(formData.criteria).reduce((sum, criterion) => {
          if (!criterion.weight || typeof criterion.weight !== 'number') {
            throw new Error('All criteria must have a numeric weight');
          }
          if (!criterion.description) {
            throw new Error('All criteria must have a description');
          }
          if (!criterion.levels || Object.keys(criterion.levels).length === 0) {
            throw new Error('All criteria must have at least one level');
          }
          return sum + criterion.weight;
        }, 0);

        if (Math.abs(totalWeight - 1.0) > 0.001) {
          newErrors.criteria = `Total weight must equal 1.0 (currently ${totalWeight.toFixed(3)})`;
        }
      } catch (error) {
        newErrors.criteria = error.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle criteria JSON change
  const handleCriteriaChange = (newCriteria) => {
    setFormData(prev => ({
      ...prev,
      criteria: newCriteria
    }));
    // Clear criteria error
    if (errors.criteria) {
      setErrors(prev => ({
        ...prev,
        criteria: undefined
      }));
    }
  };

  // Load template
  const loadTemplate = () => {
    if (confirm('This will replace your current criteria. Continue?')) {
      setFormData(prev => ({
        ...prev,
        criteria: newRubricTemplate.criteria
      }));
    }
  };

  const domains = [
    { value: 'programming', label: 'Programming' },
    { value: 'system-design', label: 'System Design' },
    { value: 'databases', label: 'Databases' },
    { value: 'algorithms', label: 'Algorithms' },
    { value: 'data-structures', label: 'Data Structures' }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {rubric ? 'Edit Rubric' : 'Create New Rubric'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.name 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter rubric name"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain *
              </label>
              <select
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {domains.map(domain => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.description 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Describe what this rubric evaluates"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active (available for use in evaluations)
            </label>
          </div>

          {/* Criteria Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Criteria * (JSON Format)
              </label>
              <button
                type="button"
                onClick={loadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Load Template
              </button>
            </div>
            
            <JsonEditor
              value={formData.criteria}
              onChange={handleCriteriaChange}
              placeholder={JSON.stringify(newRubricTemplate.criteria, null, 2)}
              className="mb-2"
            />
            
            {errors.criteria && (
              <p className="text-red-600 text-sm">{errors.criteria}</p>
            )}

            <div className="text-xs text-gray-500 mt-2">
              <p><strong>Criteria Structure:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Each criterion must have: description, weight (number), and levels</li>
                <li>Total weight of all criteria must equal 1.0</li>
                <li>Each level should have: description and score (number)</li>
                <li>Use the template as a starting point</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (rubric ? 'Update Rubric' : 'Create Rubric')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RubricEditor;