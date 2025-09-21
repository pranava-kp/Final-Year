import React, { useState } from 'react';

const RubricCard = ({ rubric, onEdit, onDelete, onToggleStatus }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDomainBadge = (domain) => {
    const badges = {
      programming: 'bg-blue-100 text-blue-800',
      'system-design': 'bg-purple-100 text-purple-800',
      databases: 'bg-green-100 text-green-800',
      algorithms: 'bg-orange-100 text-orange-800',
      'data-structures': 'bg-indigo-100 text-indigo-800'
    };
    return badges[domain] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const calculateTotalWeight = () => {
    if (!rubric.criteria) return 0;
    return Object.values(rubric.criteria).reduce((sum, criterion) => {
      return sum + (criterion.weight || 0);
    }, 0);
  };

  const getCriteriaCount = () => {
    return rubric.criteria ? Object.keys(rubric.criteria).length : 0;
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the rubric "${rubric.name}"?`)) {
      onDelete(rubric.id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {rubric.name}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {rubric.description}
            </p>
            <div className="flex items-center space-x-3 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDomainBadge(rubric.domain)}`}>
                {rubric.domain}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(rubric.is_active)}`}>
                {rubric.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Rubric Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{getCriteriaCount()}</div>
            <div className="text-xs text-gray-600">Criteria</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${
              Math.abs(calculateTotalWeight() - 1.0) < 0.001 ? 'text-green-600' : 'text-red-600'
            }`}>
              {calculateTotalWeight().toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Total Weight</div>
          </div>
        </div>

        {/* Criteria Preview */}
        {showDetails && rubric.criteria && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria:</h4>
            <div className="space-y-2">
              {Object.entries(rubric.criteria).map(([key, criterion]) => (
                <div key={key} className="text-sm bg-gray-50 p-2 rounded">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">{key}</span>
                    <span className="text-gray-600">Weight: {criterion.weight}</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">{criterion.description}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Levels: {criterion.levels ? Object.keys(criterion.levels).length : 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div>Created by: {rubric.created_by}</div>
          <div>Created: {new Date(rubric.created_at).toLocaleDateString()}</div>
          {rubric.updated_at !== rubric.created_at && (
            <div>Updated: {new Date(rubric.updated_at).toLocaleDateString()}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onEdit(rubric)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleStatus(rubric.id, !rubric.is_active)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              rubric.is_active 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {rubric.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default RubricCard;