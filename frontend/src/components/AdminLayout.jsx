import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Menu,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// --- Reusable Sidebar Link Component ---
const SidebarLink = ({ to, icon: Icon, text, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      title={text}
      className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`} />
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="ml-3 font-medium text-sm whitespace-nowrap"
        >
          {text}
        </motion.span>
      )}
    </Link>
  );
};


// --- The Main Admin Layout Component ---
const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${isDark ? 'dark' : ''}`}>

      {/* --- Sidebar (Fixed Position) --- */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 h-screen flex flex-col p-4 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 shadow-xl shadow-slate-200/50 dark:shadow-none"
      >
        <div className="flex items-center justify-between mb-8 pl-1 h-10 shrink-0">
           {!isSidebarCollapsed && (
             <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
             >
               Admin<span className="font-light text-slate-800 dark:text-slate-200">Panel</span>
             </motion.span>
           )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          <SidebarLink to="/admin" icon={LayoutDashboard} text="Dashboard" isCollapsed={isSidebarCollapsed} />
          <SidebarLink to="/admin/review-queue" icon={ClipboardList} text="Review Queue" isCollapsed={isSidebarCollapsed} />
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center space-y-3 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              {!isSidebarCollapsed && <span className="ml-3 text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>

            {/* Sign Out */}
            <button
              onClick={logout}
              className={`flex items-center w-full p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
            </button>
        </div>
      </motion.div>

      {/* --- Main Content Area (Pushed by sidebar margin) --- */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isSidebarCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 min-h-screen"
      >
        {/* Use flex column to ensure full height content areas if needed */}
        <main className="p-6 h-full">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
};

export default AdminLayout;