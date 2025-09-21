import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import RubricEditorPage from './pages/RubricEditorPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          <Routes>
            {/* Admin Routes - now public */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/review-queue" element={<ReviewQueuePage />} />
            <Route path="/admin/rubrics" element={<RubricEditorPage />} />
            
            {/* Default route - redirect to admin dashboard */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
