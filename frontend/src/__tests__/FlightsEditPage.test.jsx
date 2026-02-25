import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    <MemoryRouter initialEntries={['/trips/trip-001/edit/flights']}>
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
});
