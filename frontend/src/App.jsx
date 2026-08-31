import { Routes, Route, Navigate, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { configureApiAuth, apiClient } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TripDetailsPage from './pages/TripDetailsPage';

// Lazy-loaded edit pages — only fetched when the user navigates to them
const FlightsEditPage = lazy(() => import('./pages/FlightsEditPage'));
const StaysEditPage = lazy(() => import('./pages/StaysEditPage'));
const ActivitiesEditPage = lazy(() => import('./pages/ActivitiesEditPage'));
const LandTravelEditPage = lazy(() => import('./pages/LandTravelEditPage'));
const ImportReviewPage = lazy(() => import('./pages/ImportReviewPage'));

/**
 * ROUTE_TITLES — one entry per route declared below (audit C-02).
 * Drives both `document.title` and the route-change live-region
 * announcement, so a route reached by direct URL load gets the same
 * title as one reached by in-app navigation. Order doesn't matter for
 * matching: every pattern is matched with `end: true`, so `/trips/:id`
 * cannot accidentally match a deeper path like `/trips/:id/edit/flights`.
 *
 * Dynamic routes (e.g. /trips/:id) get a static title rather than an
 * interpolated trip name — see design.md Open Questions.
 *
 * Exported so tests can assert every <Route> in this file has an entry
 * (design R6) without hand-maintaining a duplicate expected-routes list.
 */
export const ROUTE_TITLES = [
  { path: '/login', title: 'Sign In' },
  { path: '/register', title: 'Create Account' },
  { path: '/', title: 'Trips' },
  { path: '/trips/import/review', title: 'Import Trip' },
  { path: '/trips/:id', title: 'Trip Details' },
  { path: '/trips/:id/edit/flights', title: 'Edit Flights' },
  { path: '/trips/:id/edit/stays', title: 'Edit Stays' },
  { path: '/trips/:id/edit/activities', title: 'Edit Activities' },
  { path: '/trips/:id/land-travel/edit', title: 'Edit Land Travel' },
];

function getRouteTitle(pathname) {
  const match = ROUTE_TITLES.find(({ path }) => matchPath({ path, end: true }, pathname));
  return match ? match.title : 'Triplanner';
}

/**
 * AppRoutes — separated from App so it can use React Router hooks (useNavigate).
 */
function AppRoutes() {
  const { getAccessToken, setAccessToken, clearAuth, initializeAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [routeAnnouncement, setRouteAnnouncement] = useState('');

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

  // Route title + screen-reader announcement (audit C-02). Runs on every
  // pathname change, including the very first render, so a directly-loaded
  // URL gets the correct title without waiting for in-app navigation.
  // Setting document.title and this component's own state never moves
  // keyboard focus, satisfying the "announcement does not steal focus"
  // requirement.
  useEffect(() => {
    const title = getRouteTitle(location.pathname);
    document.title = `${title} · triplanner`;
    setRouteAnnouncement(title);
  }, [location.pathname]);

  return (
    <>
      {/* Skip link — first focusable element on every route (audit C-01).
          Placed as a sibling before <Routes> so it precedes each page's
          own Navbar/main in DOM order regardless of how that page is
          structured internally. Focuses #main explicitly on activation
          rather than relying only on native fragment-navigation focus
          behavior, which is inconsistent across browser engines. */}
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          const target = document.getElementById('main');
          if (target) {
            e.preventDefault();
            target.focus();
            target.scrollIntoView?.();
          }
        }}
      >
        Skip to content
      </a>

      {/* Route-change announcement for screen readers (audit C-02).
          Text-only update — never calls .focus(), so keyboard focus is
          unaffected by navigation. */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {routeAnnouncement}
      </div>

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
        path="/trips/import/review"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <ImportReviewPage />
            </Suspense>
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
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}
