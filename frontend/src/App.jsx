import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { configureApiAuth, apiClient } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TripDetailsPage from './pages/TripDetailsPage';
import FlightsEditPage from './pages/FlightsEditPage';
import StaysEditPage from './pages/StaysEditPage';
import ActivitiesEditPage from './pages/ActivitiesEditPage';
import { useNavigate } from 'react-router-dom';

/**
 * AppRoutes — separated from App so it can use React Router hooks (useNavigate).
 */
function AppRoutes() {
  const { getAccessToken, setAccessToken, clearAuth, initializeAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wire up the API client with the auth context callbacks
    configureApiAuth({
      getToken: getAccessToken,
      setToken: setAccessToken,
      onUnauthorized: () => {
        clearAuth();
        navigate('/login', { replace: true });
      },
    });

    // Attempt silent refresh to restore session on app load
    initializeAuth(apiClient);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      {/* Auth pages — public, redirect authenticated users to / */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected pages */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:id"
        element={
          <ProtectedRoute>
            <TripDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:id/edit/flights"
        element={
          <ProtectedRoute>
            <FlightsEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:id/edit/stays"
        element={
          <ProtectedRoute>
            <StaysEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:id/edit/activities"
        element={
          <ProtectedRoute>
            <ActivitiesEditPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
