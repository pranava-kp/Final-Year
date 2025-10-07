import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Menu,
  Sun,
  Moon,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// --- Reusable Sidebar Link Component (Styled for new aesthetic) ---
const SidebarLink = ({ to, icon: Icon, text, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      title={text}
      className={`flex items-center p-3 rounded-full transition-colors duration-200 ${isActive
        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
    >
      <Icon className="w-6 h-6 shrink-0" />
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="ml-4 whitespace-nowrap"
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

  const getHeaderTitle = (pathname) => {
    if (pathname.startsWith('/admin/review-queue')) return { title: 'Review Queue', subtitle: 'Manage pending interview questions' };
    if (pathname.startsWith('/admin/rubrics')) return { title: 'Rubric Editor', subtitle: 'Create and manage evaluation rubrics' };
    if (pathname.startsWith('/admin/users')) return { title: 'User Management', subtitle: 'View and manage system users' };
    return { title: 'Dashboard', subtitle: 'Overview of the interview system' };
  };

  const { title, subtitle } = getHeaderTitle(location.pathname);

  return (
    <div className={`flex min-h-screen bg-white dark:bg-slate-900 ${isDark ? 'dark' : ''}`}>

      {/* --- Sidebar --- */}
      <motion.div
        animate={{ width: isSidebarCollapsed ? '5.5rem' : '18rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative flex flex-col h-screen p-4 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center mb-6 pl-2 h-12">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-slate-800 dark:text-white" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink to="/admin" icon={LayoutDashboard} text="Dashboard" isCollapsed={isSidebarCollapsed} />
          <SidebarLink to="/admin/review-queue" icon={ClipboardList} text="Review Queue" isCollapsed={isSidebarCollapsed} />
          <SidebarLink to="/admin/rubrics" icon={FileText} text="Rubrics" isCollapsed={isSidebarCollapsed} />
          <SidebarLink to="/admin/users" icon={Users} text="Users" isCollapsed={isSidebarCollapsed} />
        </nav>

        <div className="mt-auto flex flex-col items-center space-y-2">
          <div className="mt-auto flex flex-col items-center space-y-3">
            {/* --- Dark mode + User (side-by-side) --- */}
            <div className="flex items-center justify-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center transition-all duration-300 ${isSidebarCollapsed
                  ? 'w-8 h-8 rounded-full'
                  : 'px-3 py-2 rounded-full'
                  } bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                <AnimatePresence>
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="ml-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User Icon */}
              <div
                className={`flex items-center justify-center transition-all duration-300 ${isSidebarCollapsed
                  ? 'w-8 h-8 rounded-full ml-[5px]'
                  : 'px-3 py-2 rounded-full ml-[5px]'
                  } bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600`}
              >
                <UserIcon size={18} />
                <AnimatePresence>
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="ml-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      Profile
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* --- Sign Out Button --- */}
            <button
              onClick={logout}
              className={`w-full font-semibold py-2 flex items-center justify-center transition-colors rounded-full ${isDark
                ? 'bg-slate-700 hover:bg-red-500 text-white'
                : 'bg-red-300 hover:bg-red-500 text-white'
                }`}
            >
              <LogOut className="shrink-0 w-5 h-5" />
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-2 text-sm overflow-hidden whitespace-nowrap"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

        </div>
      </motion.div>
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
        <Outlet />
      </main>
    </div>
    // </div>
  );
};

export default AdminLayout;