import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TripDetailsPage from '../pages/TripDetailsPage';

// ── Mock TripCalendar (avoid full calendar render in unit tests) ───────────
vi.mock('../components/TripCalendar', () => ({
  default: () => <div data-testid="trip-calendar" />,
}));

// ── Mock the api module ──────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    auth: {
      logout: vi.fn().mockResolvedValue({}),
    },
    trips: {
      get: vi.fn(),
      update: vi.fn().mockResolvedValue({ data: { data: { id: 'trip-001', start_date: '2026-08-07', end_date: '2026-08-14' } } }),
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

// ── Mock useTripDetails hook ─────────────────────────────────────────────────
vi.mock('../hooks/useTripDetails');
import { useTripDetails } from '../hooks/useTripDetails';

// ── Shared data ──────────────────────────────────────────────────────────────
const mockTrip = {
  id: 'trip-001',
  name: 'Japan 2026',
  destinations: ['Tokyo', 'Osaka', 'Kyoto'],
  status: 'PLANNING',
  start_date: null,
  end_date: null,
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

const mockFlights = [
  {
    id: 'flight-001',
    trip_id: 'trip-001',
    flight_number: 'AA100',
    airline: 'American Airlines',
    from_location: 'JFK',
    to_location: 'LAX',
    departure_at: '2026-08-07T10:00:00.000Z',
    departure_tz: 'America/New_York',
    arrival_at: '2026-08-07T16:00:00.000Z',
    arrival_tz: 'America/Los_Angeles',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

const mockStays = [
  {
    id: 'stay-001',
    trip_id: 'trip-001',
    category: 'HOTEL',
    name: 'Hyatt Regency Tokyo',
    address: '2-7-2 Nishi-Shinjuku, Shinjuku-ku, Tokyo',
    check_in_at: '2026-08-07T11:00:00.000Z',
    check_in_tz: 'Asia/Tokyo',
    check_out_at: '2026-08-10T02:00:00.000Z',
    check_out_tz: 'Asia/Tokyo',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

const mockActivities = [
  {
    id: 'act-001',
    trip_id: 'trip-001',
    name: "Fisherman's Wharf",
    location: "Fisherman's Wharf, San Francisco, CA",
    activity_date: '2026-08-08',
    start_time: '09:00:00',
    end_time: '14:00:00',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
  {
    id: 'act-002',
    trip_id: 'trip-001',
    name: 'Golden Gate Bridge',
    location: 'Golden Gate Bridge, San Francisco, CA',
    activity_date: '2026-08-08',
    start_time: '15:00:00',
    end_time: '17:00:00',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
  {
    id: 'act-003',
    trip_id: 'trip-001',
    name: 'Alcatraz Island Tour',
    location: 'Alcatraz Island, San Francisco, CA',
    activity_date: '2026-08-09',
    start_time: '10:00:00',
    end_time: '12:00:00',
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
  fetchAll: vi.fn(),
  refetchFlights: vi.fn(),
  refetchStays: vi.fn(),
  refetchActivities: vi.fn(),
};

function renderTripDetailsPage() {
  return render(
    <MemoryRouter initialEntries={['/trips/trip-001']}>
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetailsPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('TripDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTripDetails.mockReturnValue({ ...defaultHookValue });
  });

  // ── 1. Flight cards render with airline, flight_number, from/to, times ──────
  it('renders flight card with airline, flight number, departure and arrival locations', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flights: mockFlights,
    });

    renderTripDetailsPage();

    expect(screen.getByText('American Airlines')).toBeDefined();
    expect(screen.getByText('AA100')).toBeDefined();
    expect(screen.getByText('JFK')).toBeDefined();
    expect(screen.getByText('LAX')).toBeDefined();
  });

  it('flight card has correct aria-label for accessibility', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flights: mockFlights,
    });

    renderTripDetailsPage();

    const flightArticle = screen.getByRole('article', {
      name: /Flight AA100: JFK to LAX/i,
    });
    expect(flightArticle).toBeDefined();
  });

  it('renders departure and arrival times using the IANA timezone', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flights: mockFlights,
    });

    renderTripDetailsPage();

    const flightCard = screen.getByRole('article', {
      name: /Flight AA100: JFK to LAX/i,
    });
    expect(flightCard.textContent).toContain('Aug');
    expect(flightCard.textContent).toContain('2026');
  });

  // ── 2. Stay cards ─────────────────────────────────────────────────────────
  it('renders stay card with category badge, name, address, and check-in/out labels', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      stays: mockStays,
    });

    renderTripDetailsPage();

    expect(screen.getByText('Hyatt Regency Tokyo')).toBeDefined();
    expect(screen.getByText('HOTEL')).toBeDefined();
    expect(screen.getByText('2-7-2 Nishi-Shinjuku, Shinjuku-ku, Tokyo')).toBeDefined();
    expect(screen.getByText('CHECK IN')).toBeDefined();
    expect(screen.getByText('CHECK OUT')).toBeDefined();
  });

  it('stay card shows "address not provided" when address is null', () => {
    const stayWithoutAddress = { ...mockStays[0], address: null };
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      stays: [stayWithoutAddress],
    });

    renderTripDetailsPage();

    expect(screen.getByText('address not provided')).toBeDefined();
  });

  it('stay card has correct aria-label', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      stays: mockStays,
    });

    renderTripDetailsPage();

    expect(screen.getByRole('article', { name: /Stay: Hyatt Regency Tokyo/i })).toBeDefined();
  });

  // ── 3. Activities ─────────────────────────────────────────────────────────
  it('renders all activity names', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: mockActivities,
    });

    renderTripDetailsPage();

    expect(screen.getByText("Fisherman's Wharf")).toBeDefined();
    expect(screen.getByText('Golden Gate Bridge')).toBeDefined();
    expect(screen.getByText('Alcatraz Island Tour')).toBeDefined();
  });

  it('activities are sorted by start_time within the same day', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: mockActivities,
    });

    renderTripDetailsPage();

    const articles = screen.getAllByRole('article');
    const texts = articles.map((el) => el.textContent);

    const fishermansIdx = texts.findIndex((t) => t.includes("Fisherman's Wharf"));
    const goldenGateIdx = texts.findIndex((t) => t.includes('Golden Gate Bridge'));
    const alcatrazIdx = texts.findIndex((t) => t.includes('Alcatraz Island Tour'));

    expect(fishermansIdx).toBeLessThan(goldenGateIdx);
    expect(goldenGateIdx).toBeLessThan(alcatrazIdx);
  });

  it('activities are grouped by date with a day header per group', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: mockActivities,
    });

    renderTripDetailsPage();

    const dayGroups = screen.getAllByRole('region', {
      name: /Activities for/i,
    });
    expect(dayGroups).toHaveLength(2);
  });

  // ── 4. Trip Calendar rendered ─────────────────────────────────────────────
  it('renders the TripCalendar component', () => {
    renderTripDetailsPage();
    expect(screen.getByTestId('trip-calendar')).toBeDefined();
  });

  // ── 5. Trip date range section ────────────────────────────────────────────
  it('shows "trip dates not set" when trip has no start_date or end_date', () => {
    renderTripDetailsPage();
    expect(screen.getByText('trip dates not set')).toBeDefined();
  });

  it('shows "set dates" button when trip has no dates', () => {
    renderTripDetailsPage();
    expect(screen.getByRole('button', { name: /set trip dates/i })).toBeDefined();
  });

  it('shows date range in display mode when trip has start and end dates', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, start_date: '2026-08-07', end_date: '2026-08-14' },
    });

    renderTripDetailsPage();

    // Should show formatted date range (Aug 7 — Aug 14, 2026)
    expect(screen.getByText(/Aug 7/)).toBeDefined();
    expect(screen.getByText(/Aug 14/)).toBeDefined();
  });

  it('shows edit dates button in display mode', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, start_date: '2026-08-07', end_date: '2026-08-14' },
    });

    renderTripDetailsPage();

    expect(screen.getByRole('button', { name: /edit trip dates/i })).toBeDefined();
  });

  it('clicking set dates reveals date inputs', () => {
    renderTripDetailsPage();

    const setDatesBtn = screen.getByRole('button', { name: /set trip dates/i });
    fireEvent.click(setDatesBtn);

    expect(screen.getByLabelText('TRIP START')).toBeDefined();
    expect(screen.getByLabelText('TRIP END')).toBeDefined();
  });

  // ── 6. Section edit links (Sprint 2 — activated) ──────────────────────────
  it('renders "edit flights" as an active link (not disabled button)', () => {
    renderTripDetailsPage();

    const editFlightsLink = screen.getByRole('link', { name: /edit flights/i });
    expect(editFlightsLink).toBeDefined();
    expect(editFlightsLink.getAttribute('href')).toBe('/trips/trip-001/edit/flights');
  });

  it('renders "edit stays" as an active link', () => {
    renderTripDetailsPage();

    const editStaysLink = screen.getByRole('link', { name: /edit stays/i });
    expect(editStaysLink).toBeDefined();
    expect(editStaysLink.getAttribute('href')).toBe('/trips/trip-001/edit/stays');
  });

  it('renders "edit activities" as an active link', () => {
    renderTripDetailsPage();

    const editActivitiesLink = screen.getByRole('link', { name: /edit activities/i });
    expect(editActivitiesLink).toBeDefined();
    expect(editActivitiesLink.getAttribute('href')).toBe('/trips/trip-001/edit/activities');
  });

  // ── 7. Skeleton loading ───────────────────────────────────────────────────
  it('shows skeleton elements when all sections are loading', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      tripLoading: true,
      flightsLoading: true,
      staysLoading: true,
      activitiesLoading: true,
    });

    const { container } = renderTripDetailsPage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows skeleton when only flights section is loading', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flightsLoading: true,
    });

    const { container } = renderTripDetailsPage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows skeleton when trip data is loading', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: null,
      tripLoading: true,
    });

    const { container } = renderTripDetailsPage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ── 8. Error states ───────────────────────────────────────────────────────
  it('shows error state for flights section with retry button', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flightsError: 'could not load flights.',
    });

    renderTripDetailsPage();

    expect(screen.getByText('could not load flights.')).toBeDefined();
    expect(screen.getAllByText('try again').length).toBeGreaterThan(0);
  });

  it('retry button for flights calls refetchFlights', () => {
    const mockRefetchFlights = vi.fn();
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flightsError: 'could not load flights.',
      refetchFlights: mockRefetchFlights,
    });

    renderTripDetailsPage();

    fireEvent.click(screen.getByText('try again'));
    expect(mockRefetchFlights).toHaveBeenCalledTimes(1);
  });

  it('shows errors in multiple sections independently', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flightsError: 'could not load flights.',
      staysError: 'could not load stays.',
      activitiesError: 'could not load activities.',
    });

    renderTripDetailsPage();

    expect(screen.getByText('could not load flights.')).toBeDefined();
    expect(screen.getByText('could not load stays.')).toBeDefined();
    expect(screen.getByText('could not load activities.')).toBeDefined();
    expect(screen.getAllByText('try again')).toHaveLength(3);
  });

  // ── 9. Navigation ─────────────────────────────────────────────────────────
  it('renders back navigation link to home', () => {
    renderTripDetailsPage();

    const backLink = screen.getByRole('link', { name: /back to my trips/i });
    expect(backLink).toBeDefined();
  });

  it('back link points to the home page (/)', () => {
    renderTripDetailsPage();

    const backLink = screen.getByRole('link', { name: /back to my trips/i });
    expect(backLink.getAttribute('href')).toBe('/');
  });

  // ── 10. Header and general ────────────────────────────────────────────────
  it('renders trip name and dot-separated destinations in header', () => {
    renderTripDetailsPage();

    expect(screen.getByText('Japan 2026')).toBeDefined();
    expect(screen.getByText('Tokyo · Osaka · Kyoto')).toBeDefined();
  });

  it('shows flights empty state when no flights exist', () => {
    renderTripDetailsPage();
    expect(screen.getByText('no flights added yet.')).toBeDefined();
  });

  it('shows stays empty state when no stays exist', () => {
    renderTripDetailsPage();
    expect(screen.getByText('no stays added yet.')).toBeDefined();
  });

  it('shows activities empty state when no activities exist', () => {
    renderTripDetailsPage();
    expect(screen.getByText('no activities planned yet.')).toBeDefined();
  });

  it('shows full-page error state when the trip itself cannot be loaded', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: null,
      tripLoading: false,
      tripError: { type: 'not_found', message: 'trip not found.' },
    });

    renderTripDetailsPage();

    expect(screen.getByText('trip not found.')).toBeDefined();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeDefined();
  });

  it('shows network error state when trip fetch fails', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: null,
      tripLoading: false,
      tripError: { type: 'network', message: 'could not load trip.' },
    });

    renderTripDetailsPage();

    expect(screen.getByText('could not load trip.')).toBeDefined();
  });

  it('renders all three section headers', () => {
    renderTripDetailsPage();

    expect(screen.getByText('flights')).toBeDefined();
    expect(screen.getByText('stays')).toBeDefined();
    expect(screen.getByText('activities')).toBeDefined();
  });

  it('calls fetchAll on mount', () => {
    const mockFetchAll = vi.fn();
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      fetchAll: mockFetchAll,
    });

    renderTripDetailsPage();

    expect(mockFetchAll).toHaveBeenCalledTimes(1);
  });
});
