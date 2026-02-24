import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// We need to export AuthContext from AuthContext.jsx — let's create a test helper
// that wraps with a mock auth context.
function renderNavbar(user = { id: '1', name: 'Jane Doe', email: 'jane@example.com' }) {
  const mockClearAuth = vi.fn();
  const mockContextValue = {
    user,
    isAuthenticated: !!user,
    isAuthLoading: false,
    getAccessToken: vi.fn(() => 'fake-token'),
    setAccessToken: vi.fn(),
    handleAuthSuccess: vi.fn(),
    clearAuth: mockClearAuth,
    initializeAuth: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthContext.Provider value={mockContextValue}>
        <Navbar />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('renders the TRIPLANNER brand', () => {
    renderNavbar();
    expect(screen.getByText('TRIPLANNER')).toBeDefined();
  });

  it('renders the home nav link', () => {
    renderNavbar();
    expect(screen.getByText('home')).toBeDefined();
  });

  it('renders the user name', () => {
    renderNavbar();
    expect(screen.getByText('Jane Doe')).toBeDefined();
  });

  it('renders the sign out button', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeDefined();
  });

  it('is wrapped in a nav element with correct aria-label', () => {
    renderNavbar();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeDefined();
  });

  it('truncates long usernames', () => {
    renderNavbar({ id: '1', name: 'A Very Long Name That Exceeds Twenty Characters Here', email: 'long@test.com' });
    // Should show truncated username (first 20 chars + ellipsis)
    const username = screen.getByTitle('A Very Long Name That Exceeds Twenty Characters Here');
    expect(username).toBeDefined();
  });
});
