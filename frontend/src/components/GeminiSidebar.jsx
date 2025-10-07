import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Plus,
  HelpCircle,
  Activity,
  Settings,
  Sun,
  Moon,
  User,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NavItem = ({ icon: Icon, text }) => (
  <a
    href="#"
    className="flex items-center p-3 rounded-full transition-colors duration-200 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
  >
    <Icon className="w-6 h-6 shrink-0" />
    <span className="ml-4 whitespace-nowrap">{text}</span>
  </a>
);

const GeminiSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <motion.div
      animate={{ width: isCollapsed ? '5.5rem' : '18rem' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen p-4 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* --- Top Section --- */}
      <div className="flex items-center mb-6 pl-2 h-12">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6 text-slate-800 dark:text-white" />
        </button>
      </div>

      <a
        href="#"
        className={`flex items-center p-3 mb-6 rounded-full transition-all duration-300 ${
          isCollapsed
            ? 'justify-center bg-slate-200 dark:bg-slate-700 w-12 h-12 self-center'
            : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <Plus className="w-5 h-5 text-slate-800 dark:text-white shrink-0" />
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="ml-3 font-semibold text-sm text-slate-800 dark:text-white whitespace-nowrap"
          >
            New Session
          </motion.span>
        )}
      </a>

      {/* --- Middle Section (Recent Chats) --- */}
      <nav className="flex-1 space-y-2 overflow-hidden">
        <AnimatePresence>
            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 text-xs font-semibold text-slate-500 uppercase"
                >
                Recent
                </motion.span>
            )}
        </AnimatePresence>
        {/* Placeholder for recent chats */}
      </nav>

      {/* --- Bottom Section --- */}
      <div className="mt-auto">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <NavItem icon={HelpCircle} text="Help" />
              <NavItem icon={Activity} text="Activity" />
              <NavItem icon={Settings} text="Settings" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- User/Theme/Logout Controls --- */}
        <div className={`flex flex-col items-center space-y-2 pt-4 ${isCollapsed ? 'my-2' : ''}`}>
             <div className="flex items-center justify-center space-x-2">
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-white">
                    <User size={20} />
                </div>
             </div>
            
             <motion.div
                className="flex justify-center"
                animate={{ width: isCollapsed ? '3rem' : 'auto' }}
             >
                <button
                    onClick={logout}
                    className={`font-semibold py-2 flex items-center justify-center transition-all duration-300 ${
                    isDark
                        ? 'bg-slate-700 hover:bg-red-500 text-white'
                        : 'bg-red-300 hover:bg-red-500 text-white'
                    } ${isCollapsed ? 'w-12 h-8 rounded-full' : 'px-4 rounded-full' }`}
                >
                    <LogOut className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-2'}`} />
                    {!isCollapsed && (
                        <motion.span
                           initial={{opacity: 0}}
                           animate={{opacity: 1}}
                           transition={{delay: 0.2}}
                           className="whitespace-nowrap"
                        >
                            Sign Out
                        </motion.span>
                    )}
                </button>
             </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default GeminiSidebar;