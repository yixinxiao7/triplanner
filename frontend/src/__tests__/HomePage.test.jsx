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
    <MemoryRouter>
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
    fireEvent.change(screen.getByLabelText(/DESTINATIONS/i), {
      target: { value: 'Paris, Rome' },
    });

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
});
