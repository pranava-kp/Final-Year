import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Wand2 } from 'lucide-react';

const JsonEditor = ({ value, onChange, placeholder = '{}', className = '' }) => {
  const { isDark } = useTheme();
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const lineNumbersRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    try {
      const formattedJson = value ? JSON.stringify(value, null, 2) : '';
      if (formattedJson !== jsonString) {
        setJsonString(formattedJson);
      }
      setIsValid(true);
      setError(null);
    } catch (err) {
      setJsonString(String(value));
      setError('Invalid initial JSON object provided.');
      setIsValid(false);
    }
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setJsonString(newValue);
    try {
      const parsed = JSON.parse(newValue);
      setIsValid(true);
      setError(null);
      onChange(parsed);
    } catch (err) {
      setIsValid(false);
      setError(err.message);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setIsValid(true);
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError(`Cannot format: ${err.message}`);
    }
  };

  const handleScroll = () => {
    if (lineNumbersRef.current && textAreaRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  const lineCount = jsonString.split('\n').length;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2 px-2">
        <div className="flex items-center gap-2">
          {isValid ? (
            <span className="flex items-center text-xs text-green-500">
              <CheckCircle className="w-4 h-4 mr-1" /> Valid JSON
            </span>
          ) : (
            <span className="flex items-center text-xs text-amber-500">
              <AlertTriangle className="w-4 h-4 mr-1" /> Invalid JSON
            </span>
          )}
        </div>
        <button
          onClick={formatJson}
          disabled={!isValid || !jsonString}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Wand2 className="w-4 h-4" /> Format
        </button>
      </div>

      <div className="flex h-96 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="p-3 text-right text-xs text-slate-400 dark:text-slate-500 font-mono select-none bg-slate-100 dark:bg-slate-800 overflow-y-hidden"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-relaxed h-6 pr-2">{i + 1}</div>
          ))}
        </div>
        
        {/* Text Area */}
        <textarea
          ref={textAreaRef}
          value={jsonString}
          onChange={handleChange}
          onScroll={handleScroll}
          className={`flex-1 p-3 font-mono text-sm bg-transparent resize-none focus:outline-none 
            dark:text-slate-200 text-slate-800 
            ${!isValid ? 'text-red-500' : ''}
          `}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-2"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JsonEditor;