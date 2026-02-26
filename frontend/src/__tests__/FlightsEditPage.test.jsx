import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import FlightsEditPage from '../pages/FlightsEditPage';

// ── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
    trips: { get: vi.fn() },
    flights: {
      list: vi.fn().mockResolvedValue({ data: { data: [] } }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
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

import { api } from '../utils/api';

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

const mockFlights = [
  {
    id: 'flight-001',
    trip_id: 'trip-001',
    flight_number: 'UA200',
    airline: 'United Airlines',
    from_location: 'SFO',
    to_location: 'NRT',
    departure_at: '2026-08-07T18:00:00.000Z',
    departure_tz: 'America/Los_Angeles',
    arrival_at: '2026-08-08T22:00:00.000Z',
    arrival_tz: 'Asia/Tokyo',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trips/trip-001/edit/flights']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="/trips/:id/edit/flights" element={<FlightsEditPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('FlightsEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.flights.list.mockResolvedValue({ data: { data: [] } });
  });

  it('renders the page title "edit flights"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /edit flights/i })).toBeDefined();
  });

  it('renders the back link to trip details', () => {
    renderPage();
    const backLink = screen.getByRole('link', { name: /back to trip/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute('href')).toBe('/trips/trip-001');
  });

  it('renders the "done editing" button', () => {
    renderPage();
    const buttons = screen.getAllByRole('button', { name: /done editing/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the "add a flight" form section heading', () => {
    renderPage();
    expect(screen.getByText(/add a flight/i)).toBeDefined();
  });

  it('shows loading skeletons initially while flights are being fetched', () => {
    // Keep the promise pending (never resolved) to simulate loading state
    api.flights.list.mockReturnValue(new Promise(() => {}));

    const { container } = renderPage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no flights exist', async () => {
    api.flights.list.mockResolvedValue({ data: { data: [] } });

    renderPage();

    // Wait for the async fetch to complete
    await screen.findByText('no flights added yet.');
  });

  it('shows loaded flights after fetch', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });

    renderPage();

    await screen.findByText('UA200');
    expect(screen.getByText('SFO')).toBeDefined();
    expect(screen.getByText('NRT')).toBeDefined();
  });

  it('renders the flight number and airline for loaded flights', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });

    renderPage();

    await screen.findByText('United Airlines');
    expect(screen.getByText('UA200')).toBeDefined();
  });

  it('shows departure and timezone fields in the form', () => {
    renderPage();

    expect(screen.getByLabelText(/departure date/i)).toBeDefined();
    expect(screen.getByLabelText(/departure timezone/i)).toBeDefined();
  });

  it('shows airline and flight number fields in the form', () => {
    renderPage();

    expect(screen.getByLabelText(/airline/i)).toBeDefined();
    expect(screen.getByLabelText(/flight number/i)).toBeDefined();
  });

  it('shows from and to location fields in the form', () => {
    renderPage();

    expect(screen.getByLabelText(/^from$/i)).toBeDefined();
    expect(screen.getByLabelText(/^to$/i)).toBeDefined();
  });

  it('renders a save flight submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /save flight/i })).toBeDefined();
  });

  // ── T-049: Hardened tests ─────────────────────────────────────

  it('shows validation errors when submitting empty form', async () => {
    renderPage();
    await screen.findByText(/add a flight/i);

    fireEvent.click(screen.getByRole('button', { name: /save flight/i }));

    await waitFor(() => {
      expect(screen.getByText('flight number is required')).toBeDefined();
      expect(screen.getByText('airline is required')).toBeDefined();
      expect(screen.getByText('from location is required')).toBeDefined();
      expect(screen.getByText('to location is required')).toBeDefined();
    });
  });

  it('submits a new flight successfully via POST', async () => {
    const newFlight = {
      id: 'flight-new',
      flight_number: 'DL100',
      airline: 'Delta',
      from_location: 'LAX',
      to_location: 'JFK',
      departure_at: '2026-08-10T08:00:00.000Z',
      departure_tz: 'America/Los_Angeles',
      arrival_at: '2026-08-10T16:00:00.000Z',
      arrival_tz: 'America/New_York',
    };
    api.flights.create.mockResolvedValue({ data: { data: newFlight } });

    renderPage();
    await screen.findByText(/add a flight/i);

    fireEvent.change(screen.getByLabelText(/flight number/i), { target: { value: 'DL100' } });
    fireEvent.change(screen.getByLabelText(/airline/i), { target: { value: 'Delta' } });
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: 'LAX' } });
    fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByLabelText(/departure date/i), { target: { value: '2026-08-10T08:00' } });
    fireEvent.change(screen.getByLabelText(/departure timezone/i), { target: { value: 'America/Los_Angeles' } });
    fireEvent.change(screen.getByLabelText(/arrival date/i), { target: { value: '2026-08-10T16:00' } });
    fireEvent.change(screen.getByLabelText(/arrival timezone/i), { target: { value: 'America/New_York' } });

    fireEvent.click(screen.getByRole('button', { name: /save flight/i }));

    await waitFor(() => {
      expect(api.flights.create).toHaveBeenCalledWith('trip-001', expect.objectContaining({
        flight_number: 'DL100',
        airline: 'Delta',
        from_location: 'LAX',
        to_location: 'JFK',
      }));
    });
  });

  it('pre-populates form when editing an existing flight', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });
    renderPage();

    await screen.findByText('UA200');

    fireEvent.click(screen.getByRole('button', { name: /edit flight ua200/i }));

    await waitFor(() => {
      expect(screen.getByText(/editing flight/i)).toBeDefined();
      expect(screen.getByLabelText(/flight number/i).value).toBe('UA200');
      expect(screen.getByLabelText(/airline/i).value).toBe('United Airlines');
    });
  });

  it('saves edited flight via update API call', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });
    const updatedFlight = { ...mockFlights[0], airline: 'United' };
    api.flights.update.mockResolvedValue({ data: { data: updatedFlight } });

    renderPage();
    await screen.findByText('UA200');

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit flight ua200/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/airline/i).value).toBe('United Airlines');
    });

    // Change airline
    fireEvent.change(screen.getByLabelText(/airline/i), { target: { value: 'United' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.flights.update).toHaveBeenCalledWith('trip-001', 'flight-001', expect.objectContaining({
        airline: 'United',
      }));
    });
  });

  it('shows delete confirmation and deletes flight on confirm', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });
    api.flights.delete.mockResolvedValue({});

    renderPage();
    await screen.findByText('UA200');

    // Click delete icon
    fireEvent.click(screen.getByRole('button', { name: /delete flight ua200/i }));

    // Verify confirmation UI
    expect(screen.getByText('delete this flight?')).toBeDefined();

    // Confirm deletion
    fireEvent.click(screen.getByText('yes, delete'));

    await waitFor(() => {
      expect(api.flights.delete).toHaveBeenCalledWith('trip-001', 'flight-001');
    });
  });

  it('resets form to add mode when cancel edit is clicked', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });
    renderPage();
    await screen.findByText('UA200');

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit flight ua200/i }));
    await waitFor(() => {
      expect(screen.getByText(/editing flight/i)).toBeDefined();
    });

    // Cancel edit
    fireEvent.click(screen.getByText('cancel edit'));

    // Form should return to "add a flight" mode
    await waitFor(() => {
      expect(screen.getByText(/add a flight/i)).toBeDefined();
    });
  });

  it('shows API error message when flight save fails', async () => {
    api.flights.create.mockRejectedValue({
      response: { data: { error: { message: 'server error occurred' } } },
    });

    renderPage();
    await screen.findByText(/add a flight/i);

    fireEvent.change(screen.getByLabelText(/flight number/i), { target: { value: 'DL100' } });
    fireEvent.change(screen.getByLabelText(/airline/i), { target: { value: 'Delta' } });
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: 'LAX' } });
    fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByLabelText(/departure date/i), { target: { value: '2026-08-10T08:00' } });
    fireEvent.change(screen.getByLabelText(/departure timezone/i), { target: { value: 'America/Los_Angeles' } });
    fireEvent.change(screen.getByLabelText(/arrival date/i), { target: { value: '2026-08-10T16:00' } });
    fireEvent.change(screen.getByLabelText(/arrival timezone/i), { target: { value: 'America/New_York' } });

    fireEvent.click(screen.getByRole('button', { name: /save flight/i }));

    await waitFor(() => {
      expect(screen.getByText('server error occurred')).toBeDefined();
    });
  });
});
