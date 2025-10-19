import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Mic, Paperclip, X, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GeminiSidebar from '../components/GeminiSidebar';
import { useTheme } from '../contexts/ThemeContext';

const CandidateDashboardPage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setResumeText(e.target.value);
    // If user starts typing, remove the uploaded file
    if (resumeFile) {
      setResumeFile(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      // If user uploads a file, clear the text
      setResumeText('');
    }
  };

  const handleFileDismiss = () => {
    setResumeFile(null);
    // Reset file input so the same file can be re-uploaded
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const canSubmit = resumeText.trim() !== '' || resumeFile !== null;

  return (
    <div className={`flex min-h-screen ${isDark ? 'dark' : ''}`}>
      <GeminiSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center w-full px-4 pb-4 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto flex flex-col justify-between h-full">
            
            {/* Top Welcome Message */}
            <div className="pt-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 dark:from-slate-200 dark:via-slate-400 dark:to-slate-200 mb-4">
                  Hello, {user?.firstName || 'Candidate'}.
                </h1>
                <h2 className="text-4xl font-semibold text-slate-500 dark:text-slate-400">
                  Ready to start your interview?
                </h2>
              </motion.div>
            </div>
            
            {/* This space is intentionally left blank to push the input to the bottom */}

            {/* Bottom Input Bar */}
            <div className="mt-auto w-full pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {/* Uploaded File Preview */}
                {resumeFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 ml-2 flex"
                  >
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-2 flex items-center text-sm">
                       <FileText className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-300" />
                       <span className="text-slate-800 dark:text-white font-medium">{resumeFile.name}</span>
                       <button onClick={handleFileDismiss} className="ml-2 p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600">
                         <X className="w-4 h-4 text-slate-600 dark:text-slate-300"/>
                       </button>
                    </div>
                  </motion.div>
                )}

                {/* Main Input Area */}
                <div className="relative">
                  <textarea
                    rows="1"
                    value={resumeText}
                    onChange={handleTextChange}
                    disabled={!!resumeFile}
                    placeholder={resumeFile ? "File attached. Press Start to continue." : "Paste your resume, or upload a file to begin..."}
                    className="w-full pl-12 pr-24 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed no-scrollbar"
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                     {/* Paperclip icon for file upload, disappears when typing */}
                    {!resumeText && (
                        <>
                            <input
                                type="file"
                                id="resume-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                accept=".pdf,.doc,.docx,.txt"
                            />
                            <label htmlFor="resume-upload" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                                <Paperclip className="w-5 h-5" />
                            </label>
                        </>
                    )}
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      disabled={!canSubmit}
                      className="p-2 rounded-full bg-blue-500 text-white transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
               <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 px-4">
                This is an AI-powered interview system. Your responses and interactions will be recorded and analyzed.
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default CandidateDashboardPage;