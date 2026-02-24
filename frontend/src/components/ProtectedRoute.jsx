import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 * Shows nothing while the initial auth check is loading.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  // Wait for the initial auth check before deciding where to go
  if (isAuthLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <span className="spinner spinner--large" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
