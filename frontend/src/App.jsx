import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { configureApiAuth, apiClient } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TripDetailsPage from './pages/TripDetailsPage';
import { useNavigate } from 'react-router-dom';

// Lazy-loaded edit pages — only fetched when the user navigates to them
const FlightsEditPage = lazy(() => import('./pages/FlightsEditPage'));
const StaysEditPage = lazy(() => import('./pages/StaysEditPage'));
const ActivitiesEditPage = lazy(() => import('./pages/ActivitiesEditPage'));
const LandTravelEditPage = lazy(() => import('./pages/LandTravelEditPage'));

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
            <Suspense fallback={null}>
              <FlightsEditPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:id/edit/stays"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <StaysEditPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:id/edit/activities"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <ActivitiesEditPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:id/land-travel/edit"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <LandTravelEditPage />
            </Suspense>
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
