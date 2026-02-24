import { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * AuthContext — provides user state, login, logout, and token management.
 *
 * Strategy (per API contract notes):
 * - Access token stored in-memory (React context state). NOT in localStorage.
 * - Refresh token is an httpOnly cookie managed by the server.
 * - On app init, we attempt a silent refresh to restore the session.
 * - Axios interceptor (in api.js) calls /auth/refresh on 401 then retries.
 */

// Export AuthContext so tests can use it directly with Context.Provider
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Access token stored in a ref so it's always the latest without re-renders
  const accessTokenRef = useRef(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // loading until initial check done

  /**
   * Called after successful login or register.
   * Stores the access token in the ref and saves user info to state.
   */
  const handleAuthSuccess = useCallback((userData, accessToken) => {
    accessTokenRef.current = accessToken;
    setUser(userData);
  }, []);

  /**
   * Expose a getter for the access token so the API client can read it.
   */
  const getAccessToken = useCallback(() => {
    return accessTokenRef.current;
  }, []);

  /**
   * Update the access token (called by axios interceptor after refresh).
   */
  const setAccessToken = useCallback((token) => {
    accessTokenRef.current = token;
  }, []);

  /**
   * Clears all auth state. Called after logout or on refresh failure.
   */
  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
  }, []);

  /**
   * Attempt a silent token refresh on initial app load.
   * This restores the session if the user has a valid refresh token cookie.
   * Called once from App.jsx on mount via useEffect.
   */
  const initializeAuth = useCallback(async (apiInstance) => {
    try {
      const response = await apiInstance.post('/auth/refresh');
      const { access_token } = response.data.data;
      // We don't have user data from refresh endpoint — fetch it separately
      // For Sprint 1 simplicity: decode the JWT payload to get basic user info
      // The refresh endpoint only returns a new access_token, not user data.
      // We'll store the token and set a minimal user object from token payload.
      accessTokenRef.current = access_token;
      // Decode the JWT payload (base64) to extract user info
      try {
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        setUser({
          id: payload.sub || payload.id,
          name: payload.name,
          email: payload.email,
        });
      } catch {
        // If decode fails, still mark as authenticated (token is valid)
        setUser({ id: null, name: 'User', email: '' });
      }
    } catch {
      // No valid refresh token — user needs to log in
      clearAuth();
    } finally {
      setIsAuthLoading(false);
    }
  }, [clearAuth]);

  const value = {
    user,
    isAuthLoading,
    getAccessToken,
    setAccessToken,
    handleAuthSuccess,
    clearAuth,
    initializeAuth,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
