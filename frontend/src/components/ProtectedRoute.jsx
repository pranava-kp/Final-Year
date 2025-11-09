// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  // 1. Show a loading state while user authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 2. If no user is logged in, redirect them to the sign-in page
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // 3. Check if the user's role is included in the allowedRoles array
  // If allowedRoles isn't provided, just being logged in is enough
  const isAuthorized = allowedRoles ? allowedRoles.includes(user.role) : true;

  // 4. If authorized, render the nested child route using <Outlet />.
  //    Otherwise, redirect them to the unauthorized page.
  return isAuthorized ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;