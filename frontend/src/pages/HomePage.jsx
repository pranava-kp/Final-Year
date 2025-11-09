import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  ArrowRight,
  Sun,
  Moon,
  Zap
} from 'lucide-react';

const HomePage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} border-b shadow-sm`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Interview System
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome to the
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Interview System
              </span>
            </h1>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              A comprehensive platform for managing interview processes, creating evaluation rubrics,
              and reviewing candidate submissions with AI-powered assistance.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Link
              to="/admin/dashboard"
              className={`group p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isDark
                  ? 'bg-gray-800 border border-gray-700 hover:border-blue-500'
                  : 'bg-white border border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Admin Dashboard
              </h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Get an overview of system statistics, pending reviews, and manage all aspects of the interview system.
              </p>
              <div className="flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700">
                Access Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/admin/review-queue"
              className={`group p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isDark
                  ? 'bg-gray-800 border border-gray-700 hover:border-green-500'
                  : 'bg-white border border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Review Queue
              </h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Review and approve pending interview questions, manage submissions, and track evaluation progress.
              </p>
              <div className="flex items-center justify-center text-green-600 font-medium group-hover:text-green-700">
                View Queue <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/admin/rubrics"
              className={`group p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isDark
                  ? 'bg-gray-800 border border-gray-700 hover:border-purple-500'
                  : 'bg-white border border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Rubric Editor
              </h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Create and manage evaluation rubrics for different domains, customize scoring criteria and guidelines.
              </p>
              <div className="flex items-center justify-center text-purple-600 font-medium group-hover:text-purple-700">
                Manage Rubrics <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className={`p-8 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              System Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  12
                </div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Pending Reviews
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  8
                </div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Active Rubrics
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  1,245
                </div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Users
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
