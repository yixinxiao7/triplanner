import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import { api } from '../utils/api';

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
    <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

  it('shows rate limit banner with minutes on 429 response', async () => {
    // Mock the login API to return 429 with Retry-After header
    vi.spyOn(api.auth, 'login').mockRejectedValueOnce({
      response: {
        status: 429,
        headers: { 'retry-after': '840' },
        data: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
      },
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/PASSWORD/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many login attempts/i)).toBeDefined();
      expect(screen.getByText(/14 minutes/i)).toBeDefined();
    });

    // Should NOT show generic error
    expect(screen.queryByText('something went wrong')).toBeNull();
    expect(screen.queryByText('incorrect email or password')).toBeNull();

    vi.restoreAllMocks();
  });

  it('shows rate limit banner with fallback when no Retry-After header', async () => {
    vi.spyOn(api.auth, 'login').mockRejectedValueOnce({
      response: {
        status: 429,
        headers: {},
        data: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
      },
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/PASSWORD/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many login attempts/i)).toBeDefined();
      expect(screen.getByText(/15 minutes/i)).toBeDefined();
    });

    vi.restoreAllMocks();
  });

  // ── Sprint 4 T-059: Submit button disabled during rate limit lockout ──
  it('disables submit button when rate limit (429) is active', async () => {
    vi.spyOn(api.auth, 'login').mockRejectedValueOnce({
      response: {
        status: 429,
        headers: { 'retry-after': '840' },
        data: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
      },
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/PASSWORD/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many login attempts/i)).toBeDefined();
    });

    // Submit button should be disabled and show "please wait…"
    const submitBtn = screen.getByRole('button', { name: /please wait/i });
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.getAttribute('aria-disabled')).toBe('true');

    vi.restoreAllMocks();
  });

  it('shows "please wait\u2026" text on submit button during rate limit lockout', async () => {
    vi.spyOn(api.auth, 'login').mockRejectedValueOnce({
      response: {
        status: 429,
        headers: { 'retry-after': '120' },
        data: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
      },
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/PASSWORD/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('please wait\u2026')).toBeDefined();
    });

    // "sign in" text should NOT be shown
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull();

    vi.restoreAllMocks();
  });
});
