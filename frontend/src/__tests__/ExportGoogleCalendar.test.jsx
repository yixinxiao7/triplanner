/**
 * Export to Google Calendar — TripDetailsPage button + consent return flow (T-343).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TripDetailsPage from '../pages/TripDetailsPage';

// ── Mock heavy child components ──────────────────────────────────────────────
vi.mock('../components/TripCalendar', () => ({
  default: () => <div data-testid="trip-calendar" />,
}));
vi.mock('../components/PrintCalendarSummary', () => ({
  default: () => <div data-testid="print-calendar-summary" />,
}));

// ── Mock the api module ──────────────────────────────────────────────────────
vi.mock('../utils/api', () => {
  const api = {
    auth: {
      logout: vi.fn().mockResolvedValue({}),
      googleCalendarAuthUrl: vi.fn(),
    },
    trips: { get: vi.fn(), update: vi.fn() },
    flights: { list: vi.fn() },
    stays: { list: vi.fn() },
    activities: { list: vi.fn() },
    land_travel: { list: vi.fn() },
    calendar: { get: vi.fn(), exportToGoogle: vi.fn() },
  };
  return {
    api,
    apiClient: {
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
    configureApiAuth: vi.fn(),
    default: api,
  };
});

// ── Mock useTripDetails hook ─────────────────────────────────────────────────
vi.mock('../hooks/useTripDetails');
import { useTripDetails } from '../hooks/useTripDetails';
import { api } from '../utils/api';

const mockTrip = {
  id: 'trip-001',
  name: "Anaheed Mobaraki's Trip to India",
  destinations: ['Delhi', 'Agra'],
  status: 'PLANNING',
  start_date: null,
  end_date: null,
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

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

const defaultHookValue = {
  trip: mockTrip,
  tripLoading: false,
  tripError: null,
  flights: [],
  flightsLoading: false,
  flightsError: null,
  stays: [],
  staysLoading: false,
  staysError: null,
  activities: [],
  activitiesLoading: false,
  activitiesError: null,
  landTravels: [],
  landTravelsLoading: false,
  landTravelsError: null,
  fetchAll: vi.fn(),
  refetchFlights: vi.fn(),
  refetchStays: vi.fn(),
  refetchActivities: vi.fn(),
  refetchLandTravels: vi.fn(),
};

function renderPage(initialEntry = '/trips/trip-001') {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetailsPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

// jsdom's location.assign is not implemented — replace it with a spy.
const assignMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  useTripDetails.mockReturnValue({ ...defaultHookValue });
  Object.defineProperty(window, 'location', {
    value: { ...window.location, assign: assignMock },
    writable: true,
  });
});

describe('Export to Google Calendar button', () => {
  it('renders the export button next to the print button', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /export to google calendar/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print itinerary/i })).toBeInTheDocument();
  });

  it('exports and shows a success toast with the event count', async () => {
    api.calendar.exportToGoogle.mockResolvedValue({
      data: { data: { calendar_id: 'cal-1', calendar_name: mockTrip.name, events_created: 7 } },
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /export to google calendar/i }));

    await waitFor(() => {
      expect(api.calendar.exportToGoogle).toHaveBeenCalledWith('trip-001');
      expect(
        screen.getByText('exported 7 events to google calendar')
      ).toBeInTheDocument();
    });
  });

  it('redirects to the Google consent URL when calendar access is not granted', async () => {
    api.calendar.exportToGoogle.mockRejectedValue({
      response: { data: { error: { code: 'GOOGLE_CALENDAR_AUTH_REQUIRED' } } },
    });
    api.auth.googleCalendarAuthUrl.mockResolvedValue({
      data: { data: { url: 'https://accounts.google.com/o/oauth2/auth?state=abc' } },
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /export to google calendar/i }));

    await waitFor(() => {
      expect(api.auth.googleCalendarAuthUrl).toHaveBeenCalledWith('trip-001');
      expect(assignMock).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/auth?state=abc'
      );
    });
  });

  it('shows an error toast when the export fails', async () => {
    api.calendar.exportToGoogle.mockRejectedValue({
      response: { status: 500, data: { error: { code: 'INTERNAL' } } },
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /export to google calendar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('export to google calendar failed. please try again.')
      ).toBeInTheDocument();
    });
  });
});

describe('return from Google consent (?gcal=…)', () => {
  it('auto-runs the export when landing with ?gcal=connected', async () => {
    api.calendar.exportToGoogle.mockResolvedValue({
      data: { data: { calendar_id: 'cal-1', calendar_name: mockTrip.name, events_created: 1 } },
    });

    renderPage('/trips/trip-001?gcal=connected');

    await waitFor(() => {
      expect(api.calendar.exportToGoogle).toHaveBeenCalledWith('trip-001');
      expect(
        screen.getByText('exported 1 event to google calendar')
      ).toBeInTheDocument();
    });
  });

  it('shows a declined toast when landing with ?gcal=denied', async () => {
    renderPage('/trips/trip-001?gcal=denied');

    await waitFor(() => {
      expect(
        screen.getByText('google calendar access was declined.')
      ).toBeInTheDocument();
    });
    expect(api.calendar.exportToGoogle).not.toHaveBeenCalled();
  });

  it('shows an error toast when landing with ?gcal=error', async () => {
    renderPage('/trips/trip-001?gcal=error');

    await waitFor(() => {
      expect(
        screen.getByText('could not connect google calendar. please try again.')
      ).toBeInTheDocument();
    });
  });
});
