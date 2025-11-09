// frontend/src/components/ReviewQueueItem.jsx
import React from 'react';
// Note: Your error message showed "@heroicons/react/24/solid", so we use that.
// If you see "XIcon", change it to "XMarkIcon"
import { CheckIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/solid'; 

const ReviewQueueItem = ({ item, onApprove, onReject, onEdit }) => {
  
  // Parse the data from the item prop, matching the backend/mock structure
  const questionData = item.candidate_question_json || {};
  const rawQuestion = questionData.raw_question || {};
  
  const conversationalText = questionData.conversational_text || 'No conversational text found.';
  const rawText = rawQuestion.text || 'No raw text found.';
  const domain = rawQuestion.domain || 'unknown';
  const difficulty = rawQuestion.difficulty || 'N/A';
  const idealAnswer = rawQuestion.ideal_answer_snippet || 'No ideal answer provided.';

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        {/* Left Side: Question Details */}
        <div className="flex-1 pr-4">
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
              {domain}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-full">
              Difficulty: {difficulty}
            </span>
          </div>
          
          {/* Conversational Text (what the user would see) */}
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {conversationalText}
          </p>
          
          {/* Raw Text (for admin context) */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            <strong>Raw Question:</strong> {rawText}
          </p>
          
          {/* Ideal Answer (for admin context) */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <strong>Ideal Answer:</strong> {idealAnswer}
          </p>
        </div>
        
        {/* Right Side: Action Buttons */}
        <div className="flex-shrink-0 flex space-x-2">
          <button
            onClick={onApprove}
            className="p-2 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-700"
            title="Approve"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-700"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onReject}
            className="p-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-full hover:bg-red-200 dark:hover:bg-red-700"
            title="Reject"
          >
            <XMarkIcon className="h-5 w-5" /> {/* Use XMarkIcon */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewQueueItem;