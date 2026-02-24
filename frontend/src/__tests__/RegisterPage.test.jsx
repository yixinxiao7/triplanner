import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RegisterPage from '../pages/RegisterPage';

function renderRegisterPage(authContextOverrides = {}) {
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
    <MemoryRouter initialEntries={['/register']}>
      <AuthContext.Provider value={mockContextValue}>
        <RegisterPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  it('renders the TRIPLANNER brand', () => {
    renderRegisterPage();
    expect(screen.getByText('TRIPLANNER')).toBeDefined();
  });

  it('renders "create account" title', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeDefined();
  });

  it('renders name, email, and password inputs', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/NAME/i)).toBeDefined();
    expect(screen.getByLabelText(/EMAIL/i)).toBeDefined();
    expect(screen.getByLabelText(/PASSWORD/i)).toBeDefined();
  });

  it('shows "8 characters minimum" helper text', () => {
    renderRegisterPage();
    expect(screen.getByText('8 characters minimum')).toBeDefined();
  });

  it('renders link to login page', () => {
    renderRegisterPage();
    expect(screen.getByText(/sign in →/i)).toBeDefined();
  });

  it('shows name required error on empty submit', async () => {
    renderRegisterPage();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('name is required')).toBeDefined();
    });
  });

  it('shows password too short error on blur with short password', async () => {
    renderRegisterPage();
    const passwordInput = screen.getByLabelText(/PASSWORD/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('password must be at least 8 characters')).toBeDefined();
    });
  });

  it('has aria-label on the form', () => {
    renderRegisterPage();
    expect(screen.getByRole('form', { name: /create account form/i })).toBeDefined();
  });
});
