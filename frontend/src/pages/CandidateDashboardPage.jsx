import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Code, Book, Send, Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GeminiSidebar from '../components/GeminiSidebar'; // Import the new sidebar
import { useTheme } from '../contexts/ThemeContext';

const SuggestionCard = ({ title, description, icon: Icon }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="relative bg-slate-100 dark:bg-slate-800 p-4 rounded-xl cursor-pointer group overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
  >
    <div className="relative z-10">
      <Icon className="w-7 h-7 text-slate-500 dark:text-slate-400 mb-3" />
      <h3 className="text-md font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  </motion.div>
);

const CandidateDashboardPage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
                  How can I help you today?
                </h2>
              </motion.div>
            </div>
            
            {/* Suggestion Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }} 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8"
            >
              <SuggestionCard
                title="Start Interview"
                description="Begin your automated interview session."
                icon={Sparkles}
              />
              <SuggestionCard
                title="Practice Coding Challenge"
                description="Solve a sample coding problem."
                icon={Code}
              />
              <SuggestionCard
                title="Review Interview Topics"
                description="Get a list of topics for your role."
                icon={Book}
              />
              <SuggestionCard
                title="Ask a Question"
                description="Clarify something about the process."
                icon={Sparkles}
              />
            </motion.div>

            {/* Bottom Input Bar */}
            <div className="mt-auto w-full pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative"
              >
                <textarea
                  rows="1"
                  placeholder="Enter a prompt here"
                  className="w-full pl-6 pr-24 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-blue-500 dark:hover:bg-blue-500 text-slate-600 dark:text-slate-300 hover:text-white transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
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