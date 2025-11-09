import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Global Styles and Context Providers
import './index.css'; // Using the new index.css for Tailwind
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Import Page Components
import App from './App.jsx'; // The main landing page
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
// import HomePage from './pages/HomePage.jsx'; // For logged-in candidates
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import ReviewQueuePage from './pages/ReviewQueuePage.jsx';
import RubricEditorPage from './pages/RubricEditorPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import CandidateDashboardPage from './pages/CandidateDashboardPage.jsx';

// Import the Protected Route Component
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<App />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* --- User-Specific Home Route --- */}
            {/* This could also be protected if you want to ensure only candidates see it */}
            <Route path="/home" element={<CandidateDashboardPage />} />
            
            {/* --- Protected Admin Routes --- */}
            {/* This wrapper ensures only users with the 'admin' role can access the nested routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/" element={<AdminLayout />}> {/* Use AdminLayout as the parent route */}
                <Route index element={<AdminDashboardPage />} /> {/* The default route for /admin */}
                <Route path="review-queue" element={<ReviewQueuePage />} />
                <Route path="rubrics" element={<RubricEditorPage />} />
                {/* Add other admin routes here, e.g., <Route path="users" element={<UsersPage />} /> */}
              </Route>
            </Route>

            {/* Optional: Add a 404 Not Found route here */}
            
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

