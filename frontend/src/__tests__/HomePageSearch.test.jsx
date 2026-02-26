import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HomePage from '../pages/HomePage';

// ── Mock api module ──────────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    auth: {
      logout: vi.fn().mockResolvedValue({}),
    },
    trips: {
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    flights: { list: vi.fn() },
    stays: { list: vi.fn() },
    activities: { list: vi.fn() },
  },
  apiClient: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  configureApiAuth: vi.fn(),
  default: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { api } from '../utils/api';

const mockTrips = [
  {
    id: 'trip-001',
    name: 'Japan 2026',
    destinations: ['Tokyo', 'Osaka', 'Kyoto'],
    status: 'PLANNING',
    start_date: '2026-08-07',
    end_date: '2026-08-14',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
  {
    id: 'trip-002',
    name: 'California Road Trip',
    destinations: ['Los Angeles', 'San Francisco'],
    status: 'ONGOING',
    start_date: '2026-02-20',
    end_date: '2026-03-01',
    created_at: '2026-02-20T12:00:00.000Z',
    updated_at: '2026-02-20T12:00:00.000Z',
  },
];

const mockAuthContext = {
  user: { id: 'u1', name: 'Jane Doe', email: 'jane@test.com' },
  isAuthenticated: true,
  isAuthLoading: false,
  getAccessToken: vi.fn(() => 'mock-token'),
  setAccessToken: vi.fn(),
  handleAuthSuccess: vi.fn(),
  clearAuth: vi.fn(),
  initializeAuth: vi.fn(),
};

function renderHomePage(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={mockAuthContext}>
        <HomePage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('HomePage — Search/Filter/Sort (Sprint 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.trips.list.mockResolvedValue({
      data: { data: mockTrips, pagination: { page: 1, limit: 20, total: 2 } },
    });
  });

  // ── Toolbar Visibility ──────────────────────────────────────────────────────
  it('shows filter toolbar when trips exist', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    expect(screen.getByRole('search')).toBeDefined();
    expect(screen.getByLabelText('Search trips by name or destination')).toBeDefined();
    expect(screen.getByLabelText('Filter by status')).toBeDefined();
    expect(screen.getByLabelText('Sort trips')).toBeDefined();
  });

  it('does not show filter toolbar when user has zero trips', async () => {
    api.trips.list.mockResolvedValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0 } },
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('no trips yet')).toBeDefined();
    });

    expect(screen.queryByRole('search')).toBeNull();
  });

  // ── Search Input ────────────────────────────────────────────────────────────
  it('renders search input with correct placeholder', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    const searchInput = screen.getByLabelText('Search trips by name or destination');
    expect(searchInput.placeholder).toBe('search trips...');
  });

  it('calls API with search param when search input changes', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // Type in search — debounce will fire after 300ms
    const searchInput = screen.getByLabelText('Search trips by name or destination');
    fireEvent.change(searchInput, { target: { value: 'tokyo' } });

    // Wait for debounce + API call
    await waitFor(() => {
      const calls = api.trips.list.mock.calls;
      const hasSearchParam = calls.some((c) => c[0]?.search === 'tokyo');
      expect(hasSearchParam).toBe(true);
    }, { timeout: 2000 });
  });

  // ── Status Filter ───────────────────────────────────────────────────────────
  it('calls API with status param when status dropdown changes', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    const statusSelect = screen.getByLabelText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'PLANNING' } });

    await waitFor(() => {
      const calls = api.trips.list.mock.calls;
      const hasStatusParam = calls.some((c) => c[0]?.status === 'PLANNING');
      expect(hasStatusParam).toBe(true);
    });
  });

  // ── Sort Selector ───────────────────────────────────────────────────────────
  it('calls API with sort params when sort dropdown changes', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    const sortSelect = screen.getByLabelText('Sort trips');
    fireEvent.change(sortSelect, { target: { value: 'name:asc' } });

    await waitFor(() => {
      const calls = api.trips.list.mock.calls;
      const hasSortParam = calls.some((c) => c[0]?.sort_by === 'name' && c[0]?.sort_order === 'asc');
      expect(hasSortParam).toBe(true);
    });
  });

  // ── Clear Filters ───────────────────────────────────────────────────────────
  it('shows clear filters button when a non-default filter is active', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // No clear button initially
    expect(screen.queryByText('clear filters')).toBeNull();

    // Change status filter
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'PLANNING' } });

    // "clear filters" should appear
    await waitFor(() => {
      expect(screen.getByText('clear filters')).toBeDefined();
    });
  });

  // ── Empty Search Results ────────────────────────────────────────────────────
  it('shows empty search results when filters return zero trips', async () => {
    // First call returns trips, second (filtered) returns empty
    api.trips.list
      .mockResolvedValueOnce({
        data: { data: mockTrips, pagination: { page: 1, limit: 20, total: 2 } },
      })
      .mockResolvedValue({
        data: { data: [], pagination: { page: 1, limit: 20, total: 0 } },
      });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // Apply a status filter that returns empty
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'COMPLETED' } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'no trips found' })).toBeDefined();
    });

    // Should NOT show the "no trips yet" empty state
    expect(screen.queryByText('no trips yet')).toBeNull();
  });

  // ── Result Count ────────────────────────────────────────────────────────────
  it('shows "showing X trips" text when status filter is active and results exist', async () => {
    api.trips.list
      .mockResolvedValueOnce({
        data: { data: mockTrips, pagination: { page: 1, limit: 20, total: 2 } },
      })
      .mockResolvedValue({
        data: { data: [mockTrips[0]], pagination: { page: 1, limit: 20, total: 1 } },
      });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // No count when no filters
    expect(screen.queryByText(/showing/)).toBeNull();

    // Apply status filter
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'PLANNING' } });

    await waitFor(() => {
      expect(screen.getByText('showing 1 trip')).toBeDefined();
    });
  });

  // ── Error State with Retry ──────────────────────────────────────────────────
  it('shows error state when filtered API call fails', async () => {
    api.trips.list
      .mockResolvedValueOnce({
        data: { data: mockTrips, pagination: { page: 1, limit: 20, total: 2 } },
      })
      .mockRejectedValueOnce(new Error('Network error'));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // Change filter to trigger error
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'ONGOING' } });

    await waitFor(() => {
      expect(screen.getByText('could not load trips.')).toBeDefined();
    });

    expect(screen.getByText('try again')).toBeDefined();
  });

  // ── URL Param Initialization ────────────────────────────────────────────────
  it('initializes filter state from URL search params', async () => {
    renderHomePage(['/?search=japan&status=PLANNING&sort=name:asc']);

    await waitFor(() => {
      const calls = api.trips.list.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const firstCall = calls[0];
      expect(firstCall[0]).toEqual(expect.objectContaining({
        search: 'japan',
        status: 'PLANNING',
        sort_by: 'name',
        sort_order: 'asc',
      }));
    });
  });
});
