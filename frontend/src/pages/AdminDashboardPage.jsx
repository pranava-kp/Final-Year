import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import {
  ClipboardList,
  FileText,
  Users,
  BarChart3,
  CheckCircle,
  Activity,
  Bell,
  TrendingUp,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

const StatCard = ({ title, value, icon: Icon, change, changeType }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700"
  >
    <div className="flex justify-between items-start">
      <div className="flex items-center">
        <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg mr-4">
          <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>
      </div>
      {change && (
        <div className={`flex items-center text-xs font-semibold ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
          <TrendingUp className="w-4 h-4 mr-1" />
          {change}
        </div>
      )}
    </div>
  </motion.div>
);

const ActionCard = ({ title, description, link, icon: Icon, buttonText, count, countLabel }) => (
    <motion.div
        whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
        className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
    >
        <div className="flex items-start mb-4">
            <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-xl mr-4">
                <Icon className="w-8 h-8 text-blue-500" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </div>
        </div>

        {count !== undefined && (
            <div className="my-4 p-3 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{countLabel}</span>
                <span className="font-bold text-blue-500 dark:text-blue-400 text-lg">{count}</span>
            </div>
        )}
        
        <Link
            to={link}
            className="mt-auto block w-full text-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
        >
            {buttonText}
        </Link>
    </motion.div>
);

const AdminDashboardPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingReviews: 12,
    activeRubrics: 8,
    totalUsers: 1245,
    approvedToday: 7,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center h-[calc(100vh-theme_header_height)]">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Welcome back, {user?.firstName || 'Admin'}.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <ActionCard
                title="Review Queue"
                description="Approve or reject pending interview questions."
                link="/admin/review-queue"
                icon={ClipboardList}
                buttonText="View Queue"
                count={stats.pendingReviews}
                countLabel="Pending Reviews"
            />
            <ActionCard
                title="Evaluation Rubrics"
                description="Create, view, and manage evaluation criteria."
                link="/admin/rubrics"
                icon={FileText}
                buttonText="Manage Rubrics"
                count={stats.activeRubrics}
                countLabel="Active Rubrics"
            />
        </div>

        {/* System Overview */}
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-slate-500" />
                System Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers.toLocaleString()} 
                    icon={Users}
                    change="+23% growth"
                    changeType="increase"
                />
                <StatCard 
                    title="Approved Today" 
                    value={stats.approvedToday} 
                    icon={CheckCircle}
                />
                <StatCard 
                    title="System Health" 
                    value="Optimal" 
                    icon={Activity}
                />
            </div>
        </div>

      </motion.div>
    </main>
  );
};

export default AdminDashboardPage;