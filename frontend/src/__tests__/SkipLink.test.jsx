import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import App from '../App';

// Guard test for audit finding C-01 (see
// openspec/changes/fix-audit-critical-high/design.md, decision D5).
//
// Renders the full App on a public route (login — no auth gate, no
// Navbar) so the skip link and its target can be exercised without
// mocking authenticated data fetches.

function renderApp(path = '/login') {
  const mockContextValue = {
    user: null,
    isAuthenticated: false,
    isAuthLoading: false,
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    handleAuthSuccess: vi.fn(),
    clearAuth: vi.fn(),
    initializeAuth: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={mockContextValue}>
        <App />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Skip link (audit C-01)', () => {
  it('is present and is the first link in the document', () => {
    renderApp();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent(/skip to content/i);
    expect(links[0]).toHaveAttribute('href', '#main');
  });

  it('a target with id="main" exists and is programmatically focusable', () => {
    renderApp();
    const target = document.getElementById('main');
    expect(target).not.toBeNull();
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('activating the skip link moves focus to the main target, not merely scroll position', () => {
    renderApp();
    const skipLink = screen.getByRole('link', { name: /skip to content/i });
    const target = document.getElementById('main');

    fireEvent.click(skipLink);

    expect(document.activeElement).toBe(target);
  });

  it('renders on a second, distinct route as well', () => {
    renderApp('/register');
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent(/skip to content/i);
    const target = document.getElementById('main');
    expect(target).not.toBeNull();
  });
});
