import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ImportReviewPage from '../pages/ImportReviewPage';

// ── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
    trips: { import: vi.fn() },
  },
  apiClient: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  configureApiAuth: vi.fn(),
  default: { auth: { logout: vi.fn().mockResolvedValue({}) } },
}));

// ── Mock useNavigate ─────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

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

const sampleParsed = {
  trip: {
    name: 'Japan 2026',
    destinations: ['Tokyo'],
    start_date: '2026-08-07',
    end_date: '2026-08-20',
    notes: null,
  },
  flights: [
    {
      flight_number: 'UA200',
      airline: 'United Airlines',
      from_location: 'SFO',
      to_location: 'NRT',
      departure_at: '2026-08-07T18:00:00-07:00',
      departure_tz: 'America/Los_Angeles',
      arrival_at: '2026-08-08T22:00:00+09:00',
      arrival_tz: 'Asia/Tokyo',
    },
  ],
  stays: [
    {
      category: 'HOTEL',
      name: 'Park Hyatt Tokyo',
      address: 'Shinjuku',
      check_in_at: '2026-08-08T15:00:00+09:00',
      check_in_tz: 'Asia/Tokyo',
      check_out_at: '2026-08-12T11:00:00+09:00',
      check_out_tz: 'Asia/Tokyo',
    },
  ],
  activities: [
    { name: 'teamLab', location: 'Odaiba', activity_date: '2026-08-09', start_time: '10:00', end_time: '12:00', notes: null },
  ],
  land_travels: [
    { mode: 'TRAIN', provider: 'JR', from_location: 'Tokyo', to_location: 'Kyoto', departure_date: '2026-08-12', departure_time: '09:00', arrival_date: '2026-08-12', arrival_time: '11:30', confirmation_number: 'ABC', notes: null },
  ],
};

function renderPage({ state } = {}) {
  const entries = [{ pathname: '/trips/import/review', state }];
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter initialEntries={entries}>
        <ImportReviewPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ImportReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to / when there is no parsed payload in router state', () => {
    renderPage({ state: undefined });
    // No parsed payload → <Navigate to="/" /> renders nothing of our page
    expect(screen.queryByText('review & save')).toBeNull();
  });

  it('renders parsed trip meta and all sub-resource sections', () => {
    renderPage({ state: { parsed: sampleParsed } });
    expect(screen.getByText('review & save')).toBeDefined();
    expect(screen.getByDisplayValue('Japan 2026')).toBeDefined();
    expect(screen.getByDisplayValue('United Airlines')).toBeDefined();
    expect(screen.getByDisplayValue('Park Hyatt Tokyo')).toBeDefined();
    expect(screen.getByDisplayValue('teamLab')).toBeDefined();
    // Section headers include counts
    expect(screen.getByText(/flights · 1/i)).toBeDefined();
    expect(screen.getByText(/stays · 1/i)).toBeDefined();
  });

  it('edits a flight field and includes the new value in the import payload', async () => {
    api.trips.import.mockResolvedValue({ data: { data: { id: 'trip-999' } } });
    renderPage({ state: { parsed: sampleParsed } });

    const airline = screen.getByDisplayValue('United Airlines');
    fireEvent.change(airline, { target: { value: 'United' } });
    expect(screen.getByDisplayValue('United')).toBeDefined();

    fireEvent.click(screen.getAllByRole('button', { name: /save trip/i })[0]);

    await waitFor(() => {
      expect(api.trips.import).toHaveBeenCalledTimes(1);
    });
    const payload = api.trips.import.mock.calls[0][0];
    expect(payload.flights[0].airline).toBe('United');
    expect(payload.trip.name).toBe('Japan 2026');
  });

  it('navigates to the new trip on successful save', async () => {
    api.trips.import.mockResolvedValue({ data: { data: { id: 'trip-555' } } });
    renderPage({ state: { parsed: sampleParsed } });

    fireEvent.click(screen.getAllByRole('button', { name: /save trip/i })[0]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trips/trip-555', { replace: true });
    });
  });

  it('removes a flight row when its remove button is clicked', () => {
    renderPage({ state: { parsed: sampleParsed } });
    expect(screen.getByDisplayValue('United Airlines')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /remove flight/i }));
    expect(screen.queryByDisplayValue('United Airlines')).toBeNull();
    expect(screen.getByText(/no flights parsed/i)).toBeDefined();
  });

  it('adds a new empty flight row', () => {
    renderPage({ state: { parsed: { ...sampleParsed, flights: [] } } });
    expect(screen.getByText(/no flights parsed/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /add flight/i }));
    // A new flight card now exists with the FLIGHT NUMBER label
    expect(screen.getByText('FLIGHT NUMBER')).toBeDefined();
  });

  it('maps a server VALIDATION_ERROR field path back onto the offending row', async () => {
    api.trips.import.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'validation failed',
            fields: { 'flights[0].departure_tz': 'invalid timezone' },
          },
        },
      },
    });
    renderPage({ state: { parsed: sampleParsed } });

    fireEvent.click(screen.getAllByRole('button', { name: /save trip/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('invalid timezone')).toBeDefined();
    });
    // The error is surfaced via the stable per-field testid keyed to the server path
    expect(screen.getByTestId('error-flights[0].departure_tz')).toBeDefined();
  });

  it('discards and navigates home when reject is confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage({ state: { parsed: sampleParsed } });

    fireEvent.click(screen.getAllByRole('button', { name: /^reject$/i })[0]);
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    confirmSpy.mockRestore();
  });

  it('does not navigate when reject is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage({ state: { parsed: sampleParsed } });

    fireEvent.click(screen.getAllByRole('button', { name: /^reject$/i })[0]);
    expect(mockNavigate).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('blocks save and shows an error when required trip name is empty', async () => {
    renderPage({ state: { parsed: { ...sampleParsed, trip: { ...sampleParsed.trip, name: '' } } } });

    fireEvent.click(screen.getAllByRole('button', { name: /save trip/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('trip name is required')).toBeDefined();
    });
    expect(api.trips.import).not.toHaveBeenCalled();
  });
});
