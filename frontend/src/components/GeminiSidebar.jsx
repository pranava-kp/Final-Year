import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Cpu,
  User,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const GeminiSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  return (
    <motion.div
      animate={{ width: isCollapsed ? '80px' : '280px' }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
      className="relative flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 shadow-xl shadow-slate-200/20 dark:shadow-none"
    >
      {/* --- Header Section --- */}
      <div className="flex items-center h-20 px-4 border-b border-slate-100 dark:border-slate-800/50">
         <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            
            {/* Expanded: Full Logo */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
                    <Cpu size={20} />
                  </div>
                  <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">
                    InterviewPrep
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all ${isCollapsed ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
            >
              {isCollapsed ? <Cpu size={24} /> : <ChevronLeft size={20} />}
            </button>
         </div>
      </div>

      {/* --- Spacer --- */}
      <div className="flex-1" />

      {/* --- Footer Section --- */}
      <div className="p-4 space-y-4">
        
        {/* Real User Profile Card */}
        <div className={`flex items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              {user?.firstName ? user.firstName[0].toUpperCase() : <User size={20} />}
           </div>
           
           <AnimatePresence>
             {!isCollapsed && (
               <motion.div
                 initial={{ opacity: 0, width: 0 }}
                 animate={{ opacity: 1, width: 'auto' }}
                 exit={{ opacity: 0, width: 0 }}
                 className="ml-3 overflow-hidden whitespace-nowrap"
               >
                 <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                   {user?.firstName || 'Candidate'}
                 </p>
                 <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                   {user?.email || 'User'}
                 </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200 dark:bg-slate-800 mx-2" />

        {/* Controls */}
        <div className="space-y-1">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 ${isCollapsed ? 'justify-center' : ''}`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDark ? (
                    <Sun size={20} className="group-hover:text-amber-500 transition-colors" />
                ) : (
                    <Moon size={20} className="group-hover:text-indigo-500 transition-colors" />
                )}
                {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium">
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                )}
            </button>

            {/* Sign Out */}
            <button
                onClick={logout}
                className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${isCollapsed ? 'justify-center' : ''}`}
                title="Sign Out"
            >
                <LogOut size={20} className="transition-colors" />
                {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium">
                        Sign Out
                    </span>
                )}
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export default GeminiSidebar;