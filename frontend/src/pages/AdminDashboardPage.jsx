import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Users,
  ArrowRight
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { adminStatsApi } from "../services/adminApi";

const DashboardHeader = ({ user }) => {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  if (hour >= 17) greeting = "Good evening";

  return (
    <div className="mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {date}
          </p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            {greeting}, <span className="text-blue-600 dark:text-blue-400">{user?.firstName || 'Admin'}</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>System Operational</span>
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon: Icon, trend }) => (
  <div className="flex items-center space-x-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{value}</h3>
        {trend && <span className="text-xs font-semibold text-green-500">{trend}</span>}
      </div>
    </div>
  </div>
);

const ReviewQueueCard = ({ pendingCount }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl h-full"
  >
    <div className="absolute top-0 right-0 p-8 opacity-10">
      <ClipboardList size={120} />
    </div>
    
    <div className="relative p-8 flex flex-col h-full justify-between gap-6">
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm border border-white/10">
            Priority Action
          </span>
        </div>
        <h2 className="text-3xl font-bold mb-2">Review Queue</h2>
        <p className="text-blue-100 max-w-md text-lg">
          You have candidates waiting for question approval. Reviewing them ensures the interview process continues smoothly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex flex-col">
          <span className="text-5xl font-bold">{pendingCount}</span>
          <span className="text-blue-200 text-sm">Pending Questions</span>
        </div>
        
        <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
        
        <Link 
          to="/admin/review-queue" 
          className="group flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-colors"
        >
          <span>Process Queue</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  </motion.div>
);

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await adminStatsApi.getStats();
        setStats({
          pendingReviews: data.pending_reviews,
          totalUsers: data.total_users,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col justify-center items-center h-[calc(100vh-100px)]">
        <LoadingSpinner />
        <p className="mt-4 text-slate-400 animate-pulse">Synchronizing dashboard...</p>
      </div>
    );
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DashboardHeader user={user} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <ReviewQueueCard pendingCount={stats.pendingReviews} />
          </div>

          <div className="flex flex-col gap-4">
             {/* Updated Label */}
             <QuickStat 
              label="Total Users" 
              value={stats.totalUsers.toLocaleString()} 
              icon={Users}
            />
          </div>

        </div>
      </motion.div>
    </main>
  );
};

export default AdminDashboardPage;