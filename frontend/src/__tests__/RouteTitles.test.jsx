import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { AuthContext } from '../context/AuthContext';
import App, { ROUTE_TITLES } from '../App';

// Guard test for audit finding C-02 (see
// openspec/changes/fix-audit-critical-high/design.md, decision D4, risk R6).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_SOURCE = readFileSync(path.join(__dirname, '..', 'App.jsx'), 'utf8');

function extractDeclaredRoutePaths(source) {
  const re = /<Route\s+path="([^"]+)"/g;
  const paths = [];
  let m;
  while ((m = re.exec(source))) {
    if (m[1] !== '*') paths.push(m[1]); // catch-all redirects, no title needed
  }
  return paths;
}

function renderAppAt(pathname) {
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
    <MemoryRouter initialEntries={[pathname]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={mockContextValue}>
        <App />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Route titles (audit C-02, design R6 guard)', () => {
  it('every <Route path="..."> in App.jsx (except the catch-all) has a ROUTE_TITLES entry', () => {
    const declaredPaths = extractDeclaredRoutePaths(APP_SOURCE);
    expect(declaredPaths.length).toBeGreaterThan(0);

    const titledPaths = new Set(ROUTE_TITLES.map((r) => r.path));
    const missing = declaredPaths.filter((p) => !titledPaths.has(p));

    expect(missing).toEqual([]);
  });

  it('every ROUTE_TITLES entry corresponds to a real declared route', () => {
    const declaredPaths = new Set(extractDeclaredRoutePaths(APP_SOURCE));
    const stale = ROUTE_TITLES.filter((r) => !declaredPaths.has(r.path));
    expect(stale).toEqual([]);
  });

  it('every route has a title distinct from every other route', () => {
    const titles = ROUTE_TITLES.map((r) => r.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('sets document.title on initial load of a public route', async () => {
    renderAppAt('/login');
    await waitFor(() => {
      expect(document.title).toContain('Sign In');
    });
  });

  it('sets a distinct title for a directly-loaded second route', async () => {
    renderAppAt('/register');
    await waitFor(() => {
      expect(document.title).toContain('Create Account');
    });
  });

  it('announces the route name via a polite live region', async () => {
    renderAppAt('/login');
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Sign In');
    });
  });

  it('a dynamic route (/trips/:id pattern) still resolves to a distinct static title', () => {
    const match = ROUTE_TITLES.find((r) => r.path === '/trips/:id');
    expect(match).toBeDefined();
    expect(match.title).not.toBe('Trips'); // distinct from the "/" list-of-trips title
  });

  it('the route-change announcement does not move keyboard focus', async () => {
    renderAppAt('/login');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Sign In');
    });
    // No element was focused by rendering/announcing the route — focus
    // sits on the document body (jsdom's default), not on the status
    // region or any other element the announcement effect might touch.
    expect(document.activeElement).toBe(document.body);
  });
});
