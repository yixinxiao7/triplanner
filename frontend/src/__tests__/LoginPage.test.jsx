import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';

function renderLoginPage(authContextOverrides = {}) {
  const mockContextValue = {
    user: null,
    isAuthenticated: false,
    isAuthLoading: false,
    getAccessToken: vi.fn(() => null),
    setAccessToken: vi.fn(),
    handleAuthSuccess: vi.fn(),
    clearAuth: vi.fn(),
    initializeAuth: vi.fn(),
    ...authContextOverrides,
  };

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={mockContextValue}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders the TRIPLANNER brand', () => {
    renderLoginPage();
    expect(screen.getByText('TRIPLANNER')).toBeDefined();
  });

  it('renders the "sign in" title', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeDefined();
  });

  it('renders email and password inputs', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/EMAIL/i)).toBeDefined();
    expect(screen.getByLabelText(/PASSWORD/i)).toBeDefined();
  });

  it('renders the sign in submit button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('renders link to register page', () => {
    renderLoginPage();
    expect(screen.getByText(/register →/i)).toBeDefined();
  });

  it('shows email required error when submitting empty email', async () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('email is required')).toBeDefined();
    });
  });

  it('shows password required error when submitting empty password', async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/EMAIL/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('password is required')).toBeDefined();
    });
  });

  it('clears field error when user starts typing', async () => {
    renderLoginPage();
    // Trigger error
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('email is required')).toBeDefined();
    });
    // Start typing in email field
    fireEvent.change(screen.getByLabelText(/EMAIL/i), {
      target: { value: 'a' },
    });
    expect(screen.queryByText('email is required')).toBeNull();
  });

  it('has aria-label on the form', () => {
    renderLoginPage();
    expect(screen.getByRole('form', { name: /sign in form/i })).toBeDefined();
  });
});
