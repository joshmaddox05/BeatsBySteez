import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginPage from './pages/LoginPage';
import CoachDashboard from './pages/CoachDashboard';
import CheerleaderDashboard from './pages/CheerleaderDashboard';
import ParentDashboard from './pages/ParentDashboard';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole } = useApp();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect if already logged in
const PublicRoute = ({ children }) => {
  const { currentUser, userRole } = useApp();

  if (currentUser) {
    const redirectPath = {
      coach: '/coach',
      cheerleader: '/cheerleader',
      parent: '/parent'
    }[userRole] || '/';

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRoles={['coach']}>
            <CoachDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cheerleader"
        element={
          <ProtectedRoute allowedRoles={['cheerleader']}>
            <CheerleaderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
