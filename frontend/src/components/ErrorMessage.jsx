import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ErrorMessage = ({ message, onRetry, className = '' }) => {
  const { isDark } = useTheme();

  // Safely determine the message to display
  const displayMessage = typeof message === 'object' && message !== null
    ? message.message || JSON.stringify(message)
    : message;

  return (
    <div className={`p-4 mb-4 rounded-lg flex items-start gap-4 ${isDark ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'} ${className}`} role="alert">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <div>
        <span className="font-bold">An Error Occurred</span>
        <p className="text-sm">{displayMessage}</p>
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="mt-2 font-semibold underline text-sm hover:text-red-500"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;