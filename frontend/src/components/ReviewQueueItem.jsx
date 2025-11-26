// frontend/src/components/ReviewQueueItem.jsx
import React from "react";
import { CheckIcon, XMarkIcon, PencilIcon } from "@heroicons/react/24/solid";

const ReviewQueueItem = ({ item, onApprove, onReject, onEdit }) => {
  // Parse the data from the item prop
  const questionData = item.candidate_question_json || {};
  const rawQuestion = questionData.raw_question || {};

  const conversationalText =
    questionData.conversational_text || "No conversational text found.";
  const rawText = rawQuestion.text || "No raw text found.";
  const domain = rawQuestion.domain || "unknown";
  const difficulty = rawQuestion.difficulty || "N/A";
  const idealAnswer =
    rawQuestion.ideal_answer_snippet || "No ideal answer provided.";

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-500/30">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        {/* Left Side: Question Details */}
        <div className="flex-1 space-y-4 w-full">
          {/* Header Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-blue-100 dark:border-blue-800">
              {domain}
            </span>
            <span
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                difficulty.toLowerCase() === "hard"
                  ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                  : difficulty.toLowerCase() === "medium"
                  ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                  : "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
              }`}
            >
              {difficulty}
            </span>
          </div>

          {/* Main Conversational Text */}
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
              {conversationalText}
            </h3>
          </div>

          {/* Technical Details Context Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Raw Question Data
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 inline-block w-full">
                {rawText}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target Answer Snippet
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                "{idealAnswer}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-row md:flex-col gap-2 shrink-0">
          <button
            onClick={onApprove}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-green-600 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/30 dark:hover:border-green-800 rounded-xl transition-all shadow-sm hover:shadow group/btn"
            title="Approve Question"
          >
            <CheckIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
          </button>

          <button
            onClick={onEdit}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-900/30 dark:hover:border-amber-800 rounded-xl transition-all shadow-sm hover:shadow group/btn"
            title="Edit Details"
          >
            <PencilIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
          </button>

          <button
            onClick={onReject}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:border-red-800 rounded-xl transition-all shadow-sm hover:shadow group/btn"
            title="Reject Question"
          >
            <XMarkIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewQueueItem;
