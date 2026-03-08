import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TripDetailsPage from '../pages/TripDetailsPage';
import { formatTimezoneAbbr } from '../utils/formatDate';

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
    land_travel: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
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
  landTravels: [],
  landTravelsLoading: false,
  landTravelsError: null,
  fetchAll: vi.fn(),
  refetchFlights: vi.fn(),
  refetchStays: vi.fn(),
  refetchActivities: vi.fn(),
  refetchLandTravels: vi.fn(),
};

function renderTripDetailsPage() {
  return render(
    <MemoryRouter initialEntries={['/trips/trip-001']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

    // formatDateRange same-month output: "Aug 7 – 14, 2026" (no repeated month per spec)
    expect(screen.getByText(/Aug 7/)).toBeDefined();
    expect(screen.getByText(/14, 2026/)).toBeDefined();
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
  it('renders trip name and destination chips in header', () => {
    renderTripDetailsPage();

    expect(screen.getByText('Japan 2026')).toBeDefined();
    // Destinations now render as individual chips
    expect(screen.getByText('Tokyo')).toBeDefined();
    expect(screen.getByText('Osaka')).toBeDefined();
    expect(screen.getByText('Kyoto')).toBeDefined();
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

  // ── 11. Editable destinations (Sprint 3 T-046) ───────────────────────────
  it('shows "edit" link next to destination chips', () => {
    renderTripDetailsPage();
    expect(screen.getByRole('button', { name: /edit destinations/i })).toBeDefined();
  });

  it('clicking "edit" shows DestinationChipInput for editing', () => {
    renderTripDetailsPage();
    const editBtn = screen.getByRole('button', { name: /edit destinations/i });
    fireEvent.click(editBtn);
    expect(screen.getByLabelText(/add destination/i)).toBeDefined();
    expect(screen.getByText('DESTINATIONS')).toBeDefined();
  });

  // ── 12. All-day activity display (Sprint 3 T-047) ────────────────────────
  it('shows "all day" badge for activities without start_time/end_time', () => {
    const allDayActivity = {
      id: 'act-allday',
      trip_id: 'trip-001',
      name: 'Free exploration',
      location: 'Downtown',
      activity_date: '2026-08-08',
      start_time: null,
      end_time: null,
      created_at: '2026-02-24T12:00:00.000Z',
      updated_at: '2026-02-24T12:00:00.000Z',
    };

    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: [allDayActivity],
    });

    renderTripDetailsPage();

    expect(screen.getByText('all day')).toBeDefined();
    expect(screen.getByRole('article', { name: /Free exploration, all day/i })).toBeDefined();
  });

  it('all-day activities sort before timed activities within same day (T-100)', () => {
    const mixedActivities = [
      {
        id: 'act-timed',
        trip_id: 'trip-001',
        name: 'Morning Hike',
        location: 'Trail',
        activity_date: '2026-08-08',
        start_time: '08:00:00',
        end_time: '10:00:00',
        created_at: '2026-02-24T12:00:00.000Z',
        updated_at: '2026-02-24T12:00:00.000Z',
      },
      {
        id: 'act-allday',
        trip_id: 'trip-001',
        name: 'Free Day',
        location: null,
        activity_date: '2026-08-08',
        start_time: null,
        end_time: null,
        created_at: '2026-02-24T12:00:00.000Z',
        updated_at: '2026-02-24T12:00:00.000Z',
      },
    ];

    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: mixedActivities,
    });

    renderTripDetailsPage();

    const articles = screen.getAllByRole('article');
    const texts = articles.map((el) => el.textContent);

    const hikeIdx = texts.findIndex((t) => t.includes('Morning Hike'));
    const freeDayIdx = texts.findIndex((t) => t.includes('Free Day'));

    // All-day activities ("Free Day") must appear BEFORE timed activities ("Morning Hike")
    expect(freeDayIdx).toBeLessThan(hikeIdx);
  });

  // ── 13. Land Travel Section (Sprint 6 T-088) ─────────────────────────────
  it('renders "land travel" section header', () => {
    renderTripDetailsPage();
    expect(screen.getByText('land travel')).toBeDefined();
  });

  it('shows "no land travel added yet." empty state when landTravels is empty', () => {
    renderTripDetailsPage();
    expect(screen.getByText('no land travel added yet.')).toBeDefined();
  });

  it('renders "edit land travel" link to the land travel edit route', () => {
    renderTripDetailsPage();
    const editLTLink = screen.getByRole('link', { name: /edit land travel/i });
    expect(editLTLink).toBeDefined();
    expect(editLTLink.getAttribute('href')).toBe('/trips/trip-001/land-travel/edit');
  });

  it('renders land travel cards with mode badge, provider, from → to route', () => {
    const mockLandTravels = [
      {
        id: 'lt-001',
        trip_id: 'trip-001',
        mode: 'TRAIN',
        provider: 'Amtrak',
        from_location: 'New York',
        to_location: 'Washington DC',
        departure_date: '2026-08-07',
        departure_time: '09:00:00',
        arrival_date: '2026-08-07',
        arrival_time: '12:30:00',
        confirmation_number: 'AMT123',
        notes: null,
        created_at: '2026-02-27T12:00:00.000Z',
        updated_at: '2026-02-27T12:00:00.000Z',
      },
    ];

    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      landTravels: mockLandTravels,
    });

    renderTripDetailsPage();

    expect(screen.getByText('train')).toBeDefined();
    expect(screen.getByText('Amtrak')).toBeDefined();
    expect(screen.getByText('New York')).toBeDefined();
    expect(screen.getByText('Washington DC')).toBeDefined();
  });

  it('land travel card has correct aria-label with mode and route', () => {
    const mockLandTravels = [
      {
        id: 'lt-001',
        trip_id: 'trip-001',
        mode: 'TRAIN',
        provider: 'Amtrak',
        from_location: 'New York',
        to_location: 'Washington DC',
        departure_date: '2026-08-07',
        departure_time: null,
        arrival_date: null,
        arrival_time: null,
        confirmation_number: null,
        notes: null,
        created_at: '2026-02-27T12:00:00.000Z',
        updated_at: '2026-02-27T12:00:00.000Z',
      },
    ];

    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      landTravels: mockLandTravels,
    });

    renderTripDetailsPage();

    expect(screen.getByRole('article', { name: /train: New York to Washington DC/i })).toBeDefined();
  });

  it('shows loading skeleton for land travel section', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      landTravelsLoading: true,
    });

    const { container } = renderTripDetailsPage();
    // Skeleton bars present
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state for land travel section with retry button', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      landTravelsError: 'could not load land travel.',
    });

    renderTripDetailsPage();

    expect(screen.getByText('could not load land travel.')).toBeDefined();
    expect(screen.getAllByText('try again').length).toBeGreaterThan(0);
  });

  it('retry button for land travel calls refetchLandTravels', () => {
    const mockRefetchLandTravels = vi.fn();
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      landTravelsError: 'could not load land travel.',
      refetchLandTravels: mockRefetchLandTravels,
    });

    renderTripDetailsPage();

    fireEvent.click(screen.getByText('try again'));
    expect(mockRefetchLandTravels).toHaveBeenCalledTimes(1);
  });

  // ── 14. Section Order (Sprint 7 T-099) ───────────────────────────────────
  it('renders main sections in order: flights → land travel → stays → activities (T-099)', () => {
    renderTripDetailsPage();

    const headings = screen.getAllByRole('heading', { level: 2 });
    const headingTexts = headings.map((h) => h.textContent.toLowerCase().trim());

    const flightsIdx = headingTexts.indexOf('flights');
    const landTravelIdx = headingTexts.indexOf('land travel');
    const staysIdx = headingTexts.indexOf('stays');
    const activitiesIdx = headingTexts.indexOf('activities');

    // All four headings must be present
    expect(flightsIdx).toBeGreaterThanOrEqual(0);
    expect(landTravelIdx).toBeGreaterThanOrEqual(0);
    expect(staysIdx).toBeGreaterThanOrEqual(0);
    expect(activitiesIdx).toBeGreaterThanOrEqual(0);

    // Correct ordering: flights < land travel < stays < activities
    expect(flightsIdx).toBeLessThan(landTravelIdx);
    expect(landTravelIdx).toBeLessThan(staysIdx);
    expect(staysIdx).toBeLessThan(activitiesIdx);
  });

  it('renders confirmation number in land travel card when present', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      landTravels: [
        {
          id: 'lt-001',
          trip_id: 'trip-001',
          mode: 'RENTAL_CAR',
          provider: 'Enterprise',
          from_location: 'Airport',
          to_location: 'Hotel',
          departure_date: '2026-08-07',
          departure_time: null,
          arrival_date: null,
          arrival_time: null,
          confirmation_number: 'ENT-XYZ99',
          notes: null,
          created_at: '2026-02-27T12:00:00.000Z',
          updated_at: '2026-02-27T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    expect(screen.getByText('ENT-XYZ99')).toBeDefined();
    expect(screen.getByText('CONF #')).toBeDefined();
  });

  // ── 15. T-098: Stay UTC conversion display test ──────────────────────────────
  it('[T-098] stay check_in_at renders correct local time using check_in_tz (not raw UTC)', () => {
    // 2026-08-07T20:00:00.000Z in America/New_York (EDT, UTC-4 in August) → 4:00 PM
    // If the bug were still present (naive UTC display), it would show "8:00 PM" (UTC time)
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      stays: [
        {
          id: 'stay-utc-test',
          trip_id: 'trip-001',
          category: 'HOTEL',
          name: 'New York Hotel',
          address: '123 Fifth Ave',
          check_in_at: '2026-08-07T20:00:00.000Z',
          check_in_tz: 'America/New_York',
          check_out_at: '2026-08-10T16:00:00.000Z',
          check_out_tz: 'America/New_York',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // formatDateTime('2026-08-07T20:00:00.000Z', 'America/New_York') → "Aug 7, 2026 · 4:00 PM"
    // The time "4:00 PM" should be visible — NOT "8:00 PM" (raw UTC) which would be the bug
    expect(screen.getByText(/4:00 PM/)).toBeDefined();
    // Should NOT show the raw UTC time "8:00 PM"
    expect(screen.queryByText(/8:00 PM/)).toBeNull();

    // T-113: Timezone abbreviation should also be shown for check-in
    // America/New_York in August = EDT
    expect(screen.getAllByText('EDT').length).toBeGreaterThanOrEqual(1);
  });

  // ── 16. T-104: Trip Notes feature tests ──────────────────────────────────────
  it('[T-104] renders notes text when trip.notes is non-null', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: 'Bring sunscreen and comfortable walking shoes.' },
    });

    renderTripDetailsPage();

    expect(screen.getByText('Bring sunscreen and comfortable walking shoes.')).toBeDefined();
  });

  it('[T-104] renders "no notes yet" muted placeholder when trip.notes is null', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: null },
    });

    renderTripDetailsPage();

    expect(screen.getByText('no notes yet')).toBeDefined();
  });

  it('[T-104] clicking pencil icon enters edit mode — textarea visible, pencil hidden', async () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: 'Existing notes.' },
    });

    renderTripDetailsPage();

    // Initially in display mode — pencil button present
    const pencilBtn = screen.getByRole('button', { name: /edit trip notes/i });
    expect(pencilBtn).toBeDefined();

    // Click the pencil
    fireEvent.click(pencilBtn);

    // Edit mode: textarea should be visible with existing notes pre-filled
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    expect(textarea).toBeDefined();
    expect(textarea.value).toBe('Existing notes.');

    // Pencil button should be gone
    expect(screen.queryByRole('button', { name: /edit trip notes/i })).toBeNull();
  });

  it('[T-104] char count shown when notesDraft length >= 1800', async () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: null },
    });

    renderTripDetailsPage();

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));

    // Type 1850 characters (>= 1800 threshold)
    const longText = 'a'.repeat(1850);
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: longText } });

    // Char count warning should appear
    expect(screen.getByText(/1,850 \/ 2,000/)).toBeDefined();
  });

  it('[T-104] Save button calls api.trips.update with correct notes payload', async () => {
    const { api } = await import('../utils/api');
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: null },
    });

    renderTripDetailsPage();

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));

    // Type new notes
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: 'Pack light for Tokyo.' } });

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save trip notes/i }));

    await waitFor(() => {
      expect(api.trips.update).toHaveBeenCalledWith(
        'trip-001',
        expect.objectContaining({ notes: 'Pack light for Tokyo.' })
      );
    });
  });

  it('[T-104] Cancel button restores previous notes without making any API call', async () => {
    const { api } = await import('../utils/api');
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: 'Original notes.' },
    });

    renderTripDetailsPage();

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));

    // Modify the textarea
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: 'Changed notes.' } });

    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel notes editing/i }));

    // Should return to display mode with original notes
    expect(screen.getByText('Original notes.')).toBeDefined();

    // api.trips.update should NOT have been called
    expect(api.trips.update).not.toHaveBeenCalled();
  });

  it('[T-104] submitting empty textarea sends null (not empty string)', async () => {
    const { api } = await import('../utils/api');
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: { ...mockTrip, notes: 'Some existing notes.' },
    });

    renderTripDetailsPage();

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));

    // Clear the textarea (empty string)
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: '' } });

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save trip notes/i }));

    await waitFor(() => {
      expect(api.trips.update).toHaveBeenCalledWith(
        'trip-001',
        expect.objectContaining({ notes: null })
      );
    });
  });

  // ── 17. T-113: Timezone abbreviation display on detail cards ──────────────────
  it('[T-113] flight departure shows EDT for America/New_York in summer', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flights: [
        {
          id: 'flight-tz-test',
          trip_id: 'trip-001',
          flight_number: 'UA200',
          airline: 'United',
          from_location: 'JFK',
          to_location: 'NRT',
          departure_at: '2026-08-07T10:00:00.000Z', // UTC → 6:00 AM EDT
          departure_tz: 'America/New_York',
          arrival_at: '2026-08-08T00:00:00.000Z',   // UTC → 9:00 AM JST
          arrival_tz: 'Asia/Tokyo',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // Departure timezone abbreviation: America/New_York in August = EDT
    expect(screen.getByText('EDT')).toBeDefined();
    // Arrival timezone abbreviation: Asia/Tokyo (JST or GMT+9 depending on Node.js ICU data)
    const expectedArrTz = formatTimezoneAbbr('2026-08-08T00:00:00.000Z', 'Asia/Tokyo');
    expect(screen.getAllByText(expectedArrTz).length).toBeGreaterThanOrEqual(1);
  });

  it('[T-113] stay check-in shows correct timezone abbreviation (JST for Asia/Tokyo)', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      stays: [
        {
          id: 'stay-tz-test',
          trip_id: 'trip-001',
          category: 'HOTEL',
          name: 'Tokyo Hotel',
          address: '1-1 Shinjuku',
          check_in_at: '2026-08-07T06:00:00.000Z', // UTC → 3:00 PM JST
          check_in_tz: 'Asia/Tokyo',
          check_out_at: '2026-08-10T02:00:00.000Z', // UTC → 11:00 AM JST
          check_out_tz: 'Asia/Tokyo',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // Asia/Tokyo abbreviation (JST or GMT+9 depending on Node.js ICU data)
    const expectedTokyoTz = formatTimezoneAbbr('2026-08-07T06:00:00.000Z', 'Asia/Tokyo');
    const tzElements = screen.getAllByText(expectedTokyoTz);
    // Both check-in and check-out should have the same timezone abbreviation
    expect(tzElements.length).toBeGreaterThanOrEqual(2);
  });

  it('[T-113] flight departure shows EST for America/New_York in winter', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flights: [
        {
          id: 'flight-winter-test',
          trip_id: 'trip-001',
          flight_number: 'AA001',
          airline: 'American',
          from_location: 'JFK',
          to_location: 'LAX',
          departure_at: '2026-01-10T15:00:00.000Z', // UTC → 10:00 AM EST (UTC-5 in winter)
          departure_tz: 'America/New_York',
          arrival_at: '2026-01-10T18:00:00.000Z',
          arrival_tz: 'America/Los_Angeles',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // America/New_York in January = EST
    expect(screen.getByText('EST')).toBeDefined();
  });

  it('[T-113] no timezone span rendered when *_tz field is missing', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      flights: [
        {
          id: 'flight-no-tz',
          trip_id: 'trip-001',
          flight_number: 'XX000',
          airline: 'Test Air',
          from_location: 'AAA',
          to_location: 'BBB',
          departure_at: '2026-08-07T10:00:00.000Z',
          departure_tz: null,  // missing timezone
          arrival_at: '2026-08-07T16:00:00.000Z',
          arrival_tz: null,    // missing timezone
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    const { container } = renderTripDetailsPage();

    // When timezone is null, no tzAbbr span should be rendered
    // The flight card should still render without crashing
    expect(screen.getByText('XX000')).toBeDefined();
    // No timezone abbreviation spans in the flight section
    const flightCard = container.querySelector('[aria-label*="Flight XX000"]');
    expect(flightCard).toBeDefined();
  });

  it('[T-113] stay check-in shows CEST for Europe/Paris in summer', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      stays: [
        {
          id: 'stay-paris',
          trip_id: 'trip-001',
          category: 'HOTEL',
          name: 'Paris Hotel',
          address: '1 Rue de Rivoli',
          check_in_at: '2026-07-15T11:00:00.000Z', // UTC → 1:00 PM CEST (UTC+2 in summer)
          check_in_tz: 'Europe/Paris',
          check_out_at: '2026-07-17T09:00:00.000Z',
          check_out_tz: 'Europe/Paris',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // Europe/Paris in July abbreviation (CEST or GMT+2 depending on Node.js ICU data)
    const expectedParisTz = formatTimezoneAbbr('2026-07-15T11:00:00.000Z', 'Europe/Paris');
    const parisElements = screen.getAllByText(expectedParisTz);
    expect(parisElements.length).toBeGreaterThanOrEqual(1);
  });

  // ── 18. T-114: Activity location URL detection tests ─────────────────────────
  it('[T-114] renders activity location with URL as a clickable hyperlink', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: [
        {
          id: 'act-url',
          trip_id: 'trip-001',
          name: 'Map View',
          location: 'Meet at https://maps.google.com/place/xyz',
          activity_date: '2026-08-08',
          start_time: '10:00:00',
          end_time: '11:00:00',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // The URL should be a link
    const link = screen.getByRole('link', { name: /https:\/\/maps\.google\.com\/place\/xyz/i });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('https://maps.google.com/place/xyz');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('[T-114] renders plain text location without any links', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: [
        {
          id: 'act-plain',
          trip_id: 'trip-001',
          name: 'Walk in Park',
          location: 'Golden Gate Park, San Francisco',
          activity_date: '2026-08-08',
          start_time: '09:00:00',
          end_time: '10:00:00',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    const { container } = renderTripDetailsPage();

    // Plain text location rendered correctly
    expect(screen.getByText(/Golden Gate Park, San Francisco/)).toBeDefined();

    // No links should be present inside the activity location div
    const activityLocation = container.querySelector('[class*="activityLocation"]');
    const links = activityLocation ? activityLocation.querySelectorAll('a') : [];
    expect(links.length).toBe(0);
  });

  it('[T-114] javascript: scheme in location renders as plain text (NOT a link)', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: [
        {
          id: 'act-xss',
          trip_id: 'trip-001',
          name: 'XSS Test',
          location: 'javascript:alert(1)',
          activity_date: '2026-08-08',
          start_time: '10:00:00',
          end_time: '11:00:00',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    const { container } = renderTripDetailsPage();

    // The dangerous URI should be rendered as plain text, no link
    const activityLocation = container.querySelector('[class*="activityLocation"]');
    const links = activityLocation ? activityLocation.querySelectorAll('a') : [];
    expect(links.length).toBe(0);

    // It should render as text somewhere in the document
    expect(screen.getByText(/javascript:alert\(1\)/)).toBeDefined();
  });

  it('[T-114] mixed text+URL splits correctly: plain text + link', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: [
        {
          id: 'act-mixed',
          trip_id: 'trip-001',
          name: 'Lunch',
          location: 'Lunch at https://www.yelp.com/biz/xyz near the park',
          activity_date: '2026-08-09',
          start_time: '12:00:00',
          end_time: '13:00:00',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    renderTripDetailsPage();

    // URL part is a link
    const link = screen.getByRole('link', { name: /https:\/\/www\.yelp\.com\/biz\/xyz/i });
    expect(link).toBeDefined();
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');

    // Plain text parts are visible
    expect(screen.getByText(/Lunch at/)).toBeDefined();
  });

  it('[T-114] no link rendered when activity location is null', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      activities: [
        {
          id: 'act-null-loc',
          trip_id: 'trip-001',
          name: 'Unnamed Activity',
          location: null,
          activity_date: '2026-08-08',
          start_time: '10:00:00',
          end_time: '11:00:00',
          created_at: '2026-02-24T12:00:00.000Z',
          updated_at: '2026-02-24T12:00:00.000Z',
        },
      ],
    });

    const { container } = renderTripDetailsPage();

    // No activityLocation div when location is null
    const activityLocation = container.querySelector('[class*="activityLocation"]');
    expect(activityLocation).toBeNull();
  });

  // ── 19. T-122 / T-172: Trip Print / Export ────────────────────────────────

  it('[T-172-A] renders "Print itinerary" button on TripDetailsPage', () => {
    useTripDetails.mockReturnValue({ ...defaultHookValue });

    renderTripDetailsPage();

    const printBtn = screen.getByRole('button', { name: /print itinerary/i });
    expect(printBtn).toBeDefined();
  });

  it('[T-172-B] clicking "Print itinerary" button calls window.print() exactly once', () => {
    useTripDetails.mockReturnValue({ ...defaultHookValue });

    const mockPrint = vi.fn();
    const originalPrint = window.print;
    window.print = mockPrint;

    renderTripDetailsPage();

    const printBtn = screen.getByRole('button', { name: /print itinerary/i });
    fireEvent.click(printBtn);

    expect(mockPrint).toHaveBeenCalledTimes(1);

    window.print = originalPrint;
  });

  it('[T-172-C] "Print itinerary" button has correct aria-label="Print itinerary"', () => {
    useTripDetails.mockReturnValue({ ...defaultHookValue });

    renderTripDetailsPage();

    const printBtn = screen.getByRole('button', { name: /print itinerary/i });
    expect(printBtn.getAttribute('aria-label')).toBe('Print itinerary');
  });

  it('[T-172-D] Print button is NOT rendered in the trip error state', () => {
    useTripDetails.mockReturnValue({
      ...defaultHookValue,
      trip: null,
      tripLoading: false,
      tripError: { type: 'not_found', message: 'trip not found.' },
    });

    renderTripDetailsPage();

    // Error state renders — no print button
    expect(screen.queryByRole('button', { name: /print itinerary/i })).toBeNull();
    // Error message is visible instead
    expect(screen.getByText('trip not found.')).toBeDefined();
  });
});
