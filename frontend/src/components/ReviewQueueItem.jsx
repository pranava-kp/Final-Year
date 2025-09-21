import React, { useState } from 'react';

const ReviewQueueItem = ({ item, onApprove, onReject, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return badges[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const handleReviewAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await onApprove(item.id, reviewNotes);
      } else if (action === 'reject') {
        await onReject(item.id, reviewNotes);
      }
      setShowReviewModal(false);
      setReviewNotes('');
      setReviewAction(null);
    } catch (error) {
      console.error('Review action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (action) => {
    setReviewAction(action);
    setShowReviewModal(true);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.question_text}
              </h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span className="font-medium">Domain: {item.domain}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(item.difficulty)}`}>
                  {item.difficulty}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                  {item.status}
                </span>
              </div>
            </div>
          </div>

          {/* Question Details */}
          <div className="mb-4">
            {item.expected_answer && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Expected Answer:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {showDetails ? item.expected_answer : `${item.expected_answer.substring(0, 150)}...`}
                </p>
              </div>
            )}
            
            {item.evaluation_criteria && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Evaluation Criteria:</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {typeof item.evaluation_criteria === 'object' ? (
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(item.evaluation_criteria, null, 2)}
                    </pre>
                  ) : (
                    <p>{item.evaluation_criteria}</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDetails ? 'Show Less' : 'Show More'}
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 mb-4 space-y-1">
            <div>Suggested by: {item.suggested_by || 'Unknown'}</div>
            <div>Created: {new Date(item.created_at).toLocaleDateString()}</div>
            {item.reviewed_at && (
              <div>Reviewed: {new Date(item.reviewed_at).toLocaleDateString()}</div>
            )}
            {item.review_notes && (
              <div className="mt-2">
                <span className="font-medium">Review Notes:</span> {item.review_notes}
              </div>
            )}
          </div>

          {/* Actions */}
          {item.status === 'pending' && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => openReviewModal('approve')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => openReviewModal('reject')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => onEdit(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Question
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to {reviewAction} this question? You can add optional review notes below.
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional review notes..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none"
              rows={3}
            />
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewAction(reviewAction)}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  reviewAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {loading ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewQueueItem;