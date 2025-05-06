import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { fetchUsers } from './store/slices/userSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import NewClient from './pages/NewClient';
import NewCase from './pages/NewCase';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  // Check for authentication on initial load
  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser() as any);
      // Fetch users when app loads
      dispatch(fetchUsers() as any);
    }
  }, [dispatch, token]);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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
          path="/cases/new-case"
          element={isAuthenticated ? <Layout><NewCase /></Layout> : <Navigate to="/login" replace />}
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
          path="/clients/new-client"
          element={isAuthenticated ? <Layout><NewClient /></Layout> : <Navigate to="/login" replace />}
        />
        {/* Calendar functionality moved to Tasks page */}
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