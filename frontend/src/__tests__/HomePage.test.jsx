import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HomePage from '../pages/HomePage';

// ── Mock api module (Navbar calls api.auth.logout) ──────────────────────────
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

// ── Mock useNavigate ─────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Import api after vi.mock (gets the mocked version) ──────────────────────
import { api } from '../utils/api';

// ── Shared mock data ─────────────────────────────────────────────────────────
const mockTrips = [
  {
    id: 'trip-001',
    name: 'Japan 2026',
    destinations: ['Tokyo', 'Osaka', 'Kyoto'],
    status: 'PLANNING',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
  {
    id: 'trip-002',
    name: 'California Road Trip',
    destinations: ['Los Angeles', 'San Francisco'],
    status: 'ONGOING',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

// Extended mock trips set used in status filter tests (T-208)
const mockTripsAllStatuses = [
  ...mockTrips,
  {
    id: 'trip-003',
    name: 'Europe 2025',
    destinations: ['Paris', 'Rome'],
    status: 'COMPLETED',
    created_at: '2025-06-01T12:00:00.000Z',
    updated_at: '2025-06-30T12:00:00.000Z',
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

function renderHomePage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={mockAuthContext}>
        <HomePage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty trips list
    api.trips.list.mockResolvedValue({ data: { data: [] } });
    api.trips.create.mockResolvedValue({
      data: {
        data: {
          id: 'new-trip-001',
          name: 'New Trip',
          destinations: [],
          status: 'PLANNING',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      },
    });
    api.trips.delete.mockResolvedValue({ status: 204 });
  });

  // ── 1. Trip list renders from API ──────────────────────────────────────────
  it('renders trip cards when the API returns trips', async () => {
    api.trips.list.mockResolvedValue({ data: { data: mockTrips } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });
    expect(screen.getByText('California Road Trip')).toBeDefined();
  });

  it('calls api.trips.list on mount', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(api.trips.list).toHaveBeenCalledTimes(1);
    });
  });

  // ── 2. Skeleton loading shown during fetch ──────────────────────────────────
  it('shows skeleton cards while trips are loading', () => {
    // Never-resolving promise keeps the component in loading state
    api.trips.list.mockReturnValue(new Promise(() => {}));

    const { container } = renderHomePage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ── 3. Empty state rendered when trips=[] ───────────────────────────────────
  it('shows empty state when no trips exist', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [] } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('no trips yet')).toBeDefined();
    });
    expect(screen.getByText('start planning your first adventure.')).toBeDefined();
  });

  it('shows error state when trips API fails', async () => {
    api.trips.list.mockRejectedValue(new Error('Network error'));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('could not load trips.')).toBeDefined();
    });
    expect(screen.getByText('check your connection and try again.')).toBeDefined();
  });

  it('shows retry button on load error that re-fetches trips', async () => {
    api.trips.list
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { data: mockTrips } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });
  });

  // ── 4. Create modal opens on button click ───────────────────────────────────
  it('opens create trip modal when "+ new trip" button is clicked', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ new trip/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  it('opens create trip modal from empty state CTA button', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('no trips yet')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /plan your first trip/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  // ── 5. Create modal submits and navigates to /trips/:id on success ──────────
  it('navigates to new trip page after successful creation', async () => {
    const newTrip = {
      id: 'new-trip-001',
      name: 'Europe 2026',
      destinations: ['Paris', 'Rome'],
      status: 'PLANNING',
      created_at: '2026-02-24T12:00:00.000Z',
      updated_at: '2026-02-24T12:00:00.000Z',
    };
    api.trips.create.mockResolvedValue({ data: { data: newTrip } });

    renderHomePage();

    // Wait for empty state so we know page is loaded
    await waitFor(() => {
      expect(screen.getByText('no trips yet')).toBeDefined();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ new trip/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    // Fill in form
    fireEvent.change(screen.getByLabelText(/TRIP NAME/i), {
      target: { value: 'Europe 2026' },
    });

    // Destinations now uses DestinationChipInput (Sprint 3 T-046)
    // Input aria-label is "New destination" (Spec 18.3.10); "+" button has aria-label="Add destination" (Spec 18.2)
    const destInput = screen.getByLabelText(/new destination/i);
    fireEvent.change(destInput, { target: { value: 'Paris' } });
    fireEvent.keyDown(destInput, { key: 'Enter' });
    fireEvent.change(destInput, { target: { value: 'Rome' } });
    fireEvent.keyDown(destInput, { key: 'Enter' });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create trip/i }));

    await waitFor(() => {
      expect(api.trips.create).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/trips/new-trip-001');
    });
  });

  // ── 6. Delete confirmation replaces card content ────────────────────────────
  it('shows inline delete confirmation when trash button is clicked', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [mockTrips[0]] } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // Click trash button
    const deleteBtn = screen.getByRole('button', { name: /delete trip: Japan 2026/i });
    fireEvent.click(deleteBtn);

    // Card content replaced with confirmation
    expect(screen.getByText('delete this trip?')).toBeDefined();
    expect(screen.getByText('yes, delete')).toBeDefined();
    expect(screen.getByText('cancel')).toBeDefined();
    // Original trip name is hidden
    expect(screen.queryByText('Japan 2026')).toBeNull();
  });

  it('restores card content when cancel is clicked in delete confirmation', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [mockTrips[0]] } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete trip: Japan 2026/i }));
    expect(screen.getByText('delete this trip?')).toBeDefined();

    fireEvent.click(screen.getByText('cancel'));

    expect(screen.getByText('Japan 2026')).toBeDefined();
  });

  // ── 7. Delete API call removes card from DOM ────────────────────────────────
  it('removes trip card from DOM after confirming delete', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [mockTrips[0]] } });
    api.trips.delete.mockResolvedValue({ status: 204 });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    // Click delete and confirm
    fireEvent.click(screen.getByRole('button', { name: /delete trip: Japan 2026/i }));
    fireEvent.click(screen.getByText('yes, delete'));

    await waitFor(() => {
      expect(screen.queryByText('Japan 2026')).toBeNull();
    });

    expect(api.trips.delete).toHaveBeenCalledWith('trip-001');
  });

  // ── 8. Toast shown on API error (delete failure) ────────────────────────────
  it('shows toast notification when delete API fails', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [mockTrips[0]] } });
    api.trips.delete.mockRejectedValue(new Error('Server error'));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete trip: Japan 2026/i }));
    fireEvent.click(screen.getByText('yes, delete'));

    await waitFor(() => {
      expect(screen.getByText('could not delete trip. please try again.')).toBeDefined();
    });
  });

  it('toast shows on API error and card is restored', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [mockTrips[0]] } });
    api.trips.delete.mockRejectedValue(new Error('Server error'));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete trip: Japan 2026/i }));
    fireEvent.click(screen.getByText('yes, delete'));

    await waitFor(() => {
      // Toast shown
      expect(screen.getByText('could not delete trip. please try again.')).toBeDefined();
    });

    // Card restored (trip name visible again after error)
    await waitFor(() => {
      expect(screen.getByText('Japan 2026')).toBeDefined();
    });
  });

  // ── T-208: StatusFilterTabs integration tests ─────────────────────────────
  // Tests A–G from T-208 task definition (Spec 21 — Sprint 24)
  // Filter logic: filteredTrips = activeFilter === "ALL" ? trips : trips.filter(t => t.status === activeFilter)

  describe('StatusFilterTabs — status filter pills', () => {
    // ── A: All trips shown when filter = "ALL" (default) ────────────────────
    it('(A) shows all trips when filter is "All" (default)', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTripsAllStatuses } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Japan 2026')).toBeDefined();
      });
      expect(screen.getByText('California Road Trip')).toBeDefined();
      expect(screen.getByText('Europe 2025')).toBeDefined();
    });

    // ── B: "PLANNING" filter shows only PLANNING trips ──────────────────────
    it('(B) shows only PLANNING trips when Planning pill is clicked', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTripsAllStatuses } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Japan 2026')).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /^planning$/i }));

      // PLANNING trip visible
      expect(screen.getByText('Japan 2026')).toBeDefined();
      // Other trips hidden
      expect(screen.queryByText('California Road Trip')).toBeNull();
      expect(screen.queryByText('Europe 2025')).toBeNull();
    });

    // ── C: "ONGOING" filter shows only ONGOING trips ─────────────────────────
    it('(C) shows only ONGOING trips when Ongoing pill is clicked', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTripsAllStatuses } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('California Road Trip')).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /^ongoing$/i }));

      expect(screen.getByText('California Road Trip')).toBeDefined();
      expect(screen.queryByText('Japan 2026')).toBeNull();
      expect(screen.queryByText('Europe 2025')).toBeNull();
    });

    // ── D: "COMPLETED" filter shows only COMPLETED trips ────────────────────
    it('(D) shows only COMPLETED trips when Completed pill is clicked', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTripsAllStatuses } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Europe 2025')).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /^completed$/i }));

      expect(screen.getByText('Europe 2025')).toBeDefined();
      expect(screen.queryByText('Japan 2026')).toBeNull();
      expect(screen.queryByText('California Road Trip')).toBeNull();
    });

    // ── E: Empty filtered state shown when no matching trips ─────────────────
    it('(E) shows empty filtered state message when filter matches no trips', async () => {
      // Only PLANNING and ONGOING trips — no COMPLETED
      api.trips.list.mockResolvedValue({ data: { data: mockTrips } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Japan 2026')).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /^completed$/i }));

      // Empty filtered state message
      await waitFor(() => {
        expect(screen.getByText('No Completed trips yet.')).toBeDefined();
      });
      // Global empty state NOT shown (trips.length > 0)
      expect(screen.queryByText('no trips yet')).toBeNull();
    });

    it('(E) empty filtered state shows correct label for each filter', async () => {
      // Only COMPLETED trips — no PLANNING or ONGOING
      api.trips.list.mockResolvedValue({
        data: {
          data: [{
            id: 'trip-003',
            name: 'Europe 2025',
            destinations: ['Paris'],
            status: 'COMPLETED',
            created_at: '2025-06-01T12:00:00.000Z',
            updated_at: '2025-06-30T12:00:00.000Z',
          }],
        },
      });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Europe 2025')).toBeDefined();
      });

      // Filter by PLANNING — no PLANNING trips exist
      fireEvent.click(screen.getByRole('button', { name: /^planning$/i }));
      await waitFor(() => {
        expect(screen.getByText('No Planning trips yet.')).toBeDefined();
      });

      // Switch to ONGOING — no ONGOING trips exist
      fireEvent.click(screen.getByRole('button', { name: /^ongoing$/i }));
      await waitFor(() => {
        expect(screen.getByText('No Ongoing trips yet.')).toBeDefined();
      });
    });

    // ── F: "Show all" resets filter to "ALL" ─────────────────────────────────
    it('(F) "Show all" resets filter to ALL and shows all trips again', async () => {
      // Only PLANNING and ONGOING trips — clicking Completed shows empty filtered state
      api.trips.list.mockResolvedValue({ data: { data: mockTrips } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Japan 2026')).toBeDefined();
      });

      // Trigger empty filtered state
      fireEvent.click(screen.getByRole('button', { name: /^completed$/i }));
      await waitFor(() => {
        expect(screen.getByText('No Completed trips yet.')).toBeDefined();
      });

      // Click "Show all"
      fireEvent.click(screen.getByRole('button', { name: /show all trips/i }));

      // All trips visible again; empty filtered message gone
      await waitFor(() => {
        expect(screen.getByText('Japan 2026')).toBeDefined();
      });
      expect(screen.getByText('California Road Trip')).toBeDefined();
      expect(screen.queryByText('No Completed trips yet.')).toBeNull();
    });

    // ── G: Active pill has aria-pressed=true ─────────────────────────────────
    it('(G) active filter pill has aria-pressed=true; others have aria-pressed=false', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTrips } });

      renderHomePage();

      // Default state: All is active
      await waitFor(() => {
        const allBtn = screen.getByRole('button', { name: /^all$/i });
        expect(allBtn.getAttribute('aria-pressed')).toBe('true');
      });

      const planningBtn = screen.getByRole('button', { name: /^planning$/i });
      expect(planningBtn.getAttribute('aria-pressed')).toBe('false');

      // Click Planning — Planning becomes active
      fireEvent.click(planningBtn);
      await waitFor(() => {
        expect(planningBtn.getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('false');
      });
    });

    // ── Edge cases ───────────────────────────────────────────────────────────

    it('does NOT show empty filtered state when trips.length === 0 (global empty state instead)', async () => {
      // No trips at all in DB
      api.trips.list.mockResolvedValue({ data: { data: [] } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('no trips yet')).toBeDefined();
      });

      // Clicking a filter pill when DB is empty should NOT show "No X trips yet."
      fireEvent.click(screen.getByRole('button', { name: /^planning$/i }));
      // Global empty state still visible — not the empty filtered state
      expect(screen.queryByText('No Planning trips yet.')).toBeNull();
      expect(screen.getByText('no trips yet')).toBeDefined();
    });

    it('StatusFilterTabs renders after initial load completes', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTrips } });

      renderHomePage();

      await waitFor(() => {
        // Pills are present after load
        expect(screen.getByRole('button', { name: /^all$/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /^planning$/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /^ongoing$/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /^completed$/i })).toBeDefined();
      });
    });

    it('no API call is made when filter pill is clicked (client-side only)', async () => {
      api.trips.list.mockResolvedValue({ data: { data: mockTripsAllStatuses } });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Japan 2026')).toBeDefined();
      });

      const callsBefore = api.trips.list.mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: /^planning$/i }));

      // No additional API call
      expect(api.trips.list.mock.calls.length).toBe(callsBefore);
    });
  });
});
