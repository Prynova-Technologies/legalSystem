import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Import Layout
import Layout from './components/Layout/Layout';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Communications from './pages/Communications';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Import styles
import './App.css';

const App: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/cases"
          element={isAuthenticated ? <Layout><Cases /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/cases/:id"
          element={isAuthenticated ? <Layout><CaseDetail /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/clients"
          element={isAuthenticated ? <Layout><Clients /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/clients/:id"
          element={isAuthenticated ? <Layout><ClientDetail /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/calendar"
          element={isAuthenticated ? <Layout><Calendar /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/tasks"
          element={isAuthenticated ? <Layout><Tasks /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/documents"
          element={isAuthenticated ? <Layout><Documents /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/communications"
          element={isAuthenticated ? <Layout><Communications /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/billing"
          element={isAuthenticated ? <Layout><Billing /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/reports"
          element={isAuthenticated ? <Layout><Reports /></Layout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Layout><Settings /></Layout> : <Navigate to="/login" replace />}
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;