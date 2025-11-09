import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Error Icon and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Access Denied
          </h2>
          <p className="mt-2 text-slate-600 font-medium">
            You don't have permission to access this page
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 p-8">
          {user && (
            <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Currently signed in as:</p>
                  <p className="text-slate-600">{user.email}</p>
                  <p className="text-xs text-slate-500 capitalize">Role: {user.role}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center mb-6">
            <p className="text-slate-600 leading-relaxed">
              This page requires administrator privileges. If you believe you should have access, 
              please contact your system administrator or try signing in with a different account.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home
            </Link>
            
            <button
              onClick={logout}
              className="w-full flex justify-center items-center py-3 px-6 border border-slate-300 rounded-xl shadow-sm text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

