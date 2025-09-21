import React, { useState, useEffect } from 'react';

const JsonEditor = ({ value, onChange, placeholder = '{}', className = '' }) => {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(true);

  // Initialize JSON string from value
  useEffect(() => {
    if (value) {
      try {
        setJsonString(JSON.stringify(value, null, 2));
        setError(null);
        setIsValid(true);
      } catch (err) {
        setError('Invalid JSON object');
        setIsValid(false);
      }
    } else {
      setJsonString(placeholder);
    }
  }, [value, placeholder]);

  // Handle text change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setJsonString(newValue);

    // Validate JSON
    try {
      const parsed = JSON.parse(newValue);
      setError(null);
      setIsValid(true);
      onChange(parsed);
    } catch (err) {
      setError(err.message);
      setIsValid(false);
      // Still call onChange with the string for real-time editing
      onChange(newValue);
    }
  };

  // Format JSON
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setError(null);
      setIsValid(true);
      onChange(parsed);
    } catch (err) {
      setError('Cannot format invalid JSON');
    }
  };

  // Minify JSON
  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const minified = JSON.stringify(parsed);
      setJsonString(minified);
      setError(null);
      setIsValid(true);
      onChange(parsed);
    } catch (err) {
      setError('Cannot minify invalid JSON');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={formatJson}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Format
          </button>
          <button
            type="button"
            onClick={minifyJson}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Minify
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {isValid ? (
            <span className="text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Valid JSON
            </span>
          ) : (
            <span className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Invalid JSON
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          value={jsonString}
          onChange={handleChange}
          className={`w-full h-96 p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 ${
            isValid 
              ? 'border-gray-300 focus:ring-blue-500' 
              : 'border-red-300 focus:ring-red-500 bg-red-50'
          }`}
          placeholder={placeholder}
          spellCheck={false}
        />
        
        {/* Line numbers (simple implementation) */}
        <div className="absolute left-2 top-4 text-xs text-gray-400 font-mono pointer-events-none select-none">
          {jsonString.split('\n').map((_, index) => (
            <div key={index} className="leading-5">
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          <strong>JSON Error:</strong> {error}
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500">
        <p>
          <strong>Tip:</strong> Use the Format button to properly indent your JSON. 
          The editor will validate your JSON in real-time.
        </p>
      </div>
    </div>
  );
};

export default JsonEditor;