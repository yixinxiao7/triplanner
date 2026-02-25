import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTripDetails } from '../hooks/useTripDetails';

// ── Mock the api module ──────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    trips: { get: vi.fn() },
    flights: { list: vi.fn() },
    stays: { list: vi.fn() },
    activities: { list: vi.fn() },
  },
}));

import { api } from '../utils/api';

// ── Shared test data ─────────────────────────────────────────────────────────
const mockTrip = {
  id: 'trip-001',
  name: 'Japan 2026',
  destinations: ['Tokyo', 'Osaka', 'Kyoto'],
  status: 'PLANNING',
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
    address: '2-7-2 Nishi-Shinjuku, Tokyo',
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
];

// ── Tests ────────────────────────────────────────────────────────────────────
describe('useTripDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: all API calls succeed with empty data
    api.trips.get.mockResolvedValue({ data: { data: mockTrip } });
    api.flights.list.mockResolvedValue({ data: { data: [] } });
    api.stays.list.mockResolvedValue({ data: { data: [] } });
    api.activities.list.mockResolvedValue({ data: { data: [] } });
  });

  // ── 1. Parallel fetch of trip + flights + stays + activities on mount ─────────
  it('calls api for trip, flights, stays, and activities when fetchAll is called', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(api.trips.get).toHaveBeenCalledWith('trip-001');
    expect(api.flights.list).toHaveBeenCalledWith('trip-001');
    expect(api.stays.list).toHaveBeenCalledWith('trip-001');
    expect(api.activities.list).toHaveBeenCalledWith('trip-001');
  });

  it('sets trip data after successful fetch', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.tripLoading).toBe(false);
    expect(result.current.tripError).toBeNull();
  });

  it('sets flights, stays, and activities data after successful fetch', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });
    api.stays.list.mockResolvedValue({ data: { data: mockStays } });
    api.activities.list.mockResolvedValue({ data: { data: mockActivities } });

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.flights).toEqual(mockFlights);
    expect(result.current.stays).toEqual(mockStays);
    expect(result.current.activities).toEqual(mockActivities);
  });

  it('passes the tripId to all sub-resource fetches', async () => {
    const { result } = renderHook(() => useTripDetails('trip-XYZ'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(api.trips.get).toHaveBeenCalledWith('trip-XYZ');
    expect(api.flights.list).toHaveBeenCalledWith('trip-XYZ');
    expect(api.stays.list).toHaveBeenCalledWith('trip-XYZ');
    expect(api.activities.list).toHaveBeenCalledWith('trip-XYZ');
  });

  it('starts with loading states set to true', () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    expect(result.current.tripLoading).toBe(true);
    expect(result.current.flightsLoading).toBe(true);
    expect(result.current.staysLoading).toBe(true);
    expect(result.current.activitiesLoading).toBe(true);
  });

  it('sets all loading states to false after fetchAll completes', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.tripLoading).toBe(false);
    expect(result.current.flightsLoading).toBe(false);
    expect(result.current.staysLoading).toBe(false);
    expect(result.current.activitiesLoading).toBe(false);
  });

  // ── 2. Each sub-resource has independent error state ─────────────────────────
  it('sets flights error independently when flights fetch fails — trip still loads', async () => {
    api.flights.list.mockRejectedValue(new Error('Flights network error'));

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    // Trip loaded correctly
    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.tripError).toBeNull();

    // Only flights has an error
    expect(result.current.flightsError).toBeTruthy();
    expect(result.current.staysError).toBeNull();
    expect(result.current.activitiesError).toBeNull();

    // Flights loading resolved
    expect(result.current.flightsLoading).toBe(false);
  });

  it('sets stays error independently when stays fetch fails — other sections unaffected', async () => {
    api.stays.list.mockRejectedValue(new Error('Stays network error'));

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.tripError).toBeNull();
    expect(result.current.flightsError).toBeNull();
    expect(result.current.staysError).toBeTruthy();
    expect(result.current.activitiesError).toBeNull();
    expect(result.current.staysLoading).toBe(false);
  });

  it('sets activities error independently when activities fetch fails — other sections unaffected', async () => {
    api.activities.list.mockRejectedValue(new Error('Activities network error'));

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.tripError).toBeNull();
    expect(result.current.flightsError).toBeNull();
    expect(result.current.staysError).toBeNull();
    expect(result.current.activitiesError).toBeTruthy();
    expect(result.current.activitiesLoading).toBe(false);
  });

  it('sets all section errors independently when all sub-resources fail', async () => {
    api.flights.list.mockRejectedValue(new Error('Flights error'));
    api.stays.list.mockRejectedValue(new Error('Stays error'));
    api.activities.list.mockRejectedValue(new Error('Activities error'));

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    // Trip still loads
    expect(result.current.trip).toEqual(mockTrip);

    // All sub-resources fail independently
    expect(result.current.flightsError).toBeTruthy();
    expect(result.current.staysError).toBeTruthy();
    expect(result.current.activitiesError).toBeTruthy();
  });

  it('does not fetch sub-resources when trip fetch fails (404)', async () => {
    const notFoundError = new Error('Not found');
    notFoundError.response = { status: 404 };
    api.trips.get.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.tripError).toBeTruthy();
    expect(result.current.tripError.type).toBe('not_found');

    // Sub-resources should NOT have been called
    expect(api.flights.list).not.toHaveBeenCalled();
    expect(api.stays.list).not.toHaveBeenCalled();
    expect(api.activities.list).not.toHaveBeenCalled();

    // Loading states resolved without data
    expect(result.current.flightsLoading).toBe(false);
    expect(result.current.staysLoading).toBe(false);
    expect(result.current.activitiesLoading).toBe(false);
  });

  it('sets network error type when trip fetch fails with non-404', async () => {
    const serverError = new Error('Internal server error');
    serverError.response = { status: 500 };
    api.trips.get.mockRejectedValue(serverError);

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.tripError.type).toBe('network');
  });

  it('does not fetch sub-resources when trip fetch fails (network/other error)', async () => {
    api.trips.get.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(api.flights.list).not.toHaveBeenCalled();
    expect(api.stays.list).not.toHaveBeenCalled();
    expect(api.activities.list).not.toHaveBeenCalled();
  });

  // ── 3. Refetch functions reload only their respective section ─────────────────
  it('refetchFlights only calls api.flights.list — not other endpoints', async () => {
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });

    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    // Clear call counts
    vi.clearAllMocks();
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });

    await act(async () => {
      await result.current.refetchFlights();
    });

    expect(api.flights.list).toHaveBeenCalledTimes(1);
    expect(api.flights.list).toHaveBeenCalledWith('trip-001');
    expect(api.trips.get).not.toHaveBeenCalled();
    expect(api.stays.list).not.toHaveBeenCalled();
    expect(api.activities.list).not.toHaveBeenCalled();
  });

  it('refetchFlights updates flights data', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    // Flights was empty; now refetch returns data
    api.flights.list.mockResolvedValue({ data: { data: mockFlights } });

    await act(async () => {
      await result.current.refetchFlights();
    });

    expect(result.current.flights).toEqual(mockFlights);
    expect(result.current.flightsLoading).toBe(false);
    expect(result.current.flightsError).toBeNull();
  });

  it('refetchStays only calls api.stays.list — not other endpoints', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    vi.clearAllMocks();
    api.stays.list.mockResolvedValue({ data: { data: mockStays } });

    await act(async () => {
      await result.current.refetchStays();
    });

    expect(api.stays.list).toHaveBeenCalledTimes(1);
    expect(api.stays.list).toHaveBeenCalledWith('trip-001');
    expect(api.trips.get).not.toHaveBeenCalled();
    expect(api.flights.list).not.toHaveBeenCalled();
    expect(api.activities.list).not.toHaveBeenCalled();
  });

  it('refetchStays updates stays data', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    api.stays.list.mockResolvedValue({ data: { data: mockStays } });

    await act(async () => {
      await result.current.refetchStays();
    });

    expect(result.current.stays).toEqual(mockStays);
    expect(result.current.staysLoading).toBe(false);
    expect(result.current.staysError).toBeNull();
  });

  it('refetchActivities only calls api.activities.list — not other endpoints', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    vi.clearAllMocks();
    api.activities.list.mockResolvedValue({ data: { data: mockActivities } });

    await act(async () => {
      await result.current.refetchActivities();
    });

    expect(api.activities.list).toHaveBeenCalledTimes(1);
    expect(api.activities.list).toHaveBeenCalledWith('trip-001');
    expect(api.trips.get).not.toHaveBeenCalled();
    expect(api.flights.list).not.toHaveBeenCalled();
    expect(api.stays.list).not.toHaveBeenCalled();
  });

  it('refetchActivities updates activities data', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    api.activities.list.mockResolvedValue({ data: { data: mockActivities } });

    await act(async () => {
      await result.current.refetchActivities();
    });

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.activitiesLoading).toBe(false);
    expect(result.current.activitiesError).toBeNull();
  });

  it('refetchFlights sets error state when retry fails', async () => {
    const { result } = renderHook(() => useTripDetails('trip-001'));

    await act(async () => {
      await result.current.fetchAll();
    });

    vi.clearAllMocks();
    api.flights.list.mockRejectedValue(new Error('Still failing'));

    await act(async () => {
      await result.current.refetchFlights();
    });

    expect(result.current.flightsError).toBeTruthy();
    expect(result.current.flightsLoading).toBe(false);
  });

  it('does not call fetchAll when tripId is empty', async () => {
    const { result } = renderHook(() => useTripDetails(''));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(api.trips.get).not.toHaveBeenCalled();
    expect(api.flights.list).not.toHaveBeenCalled();
  });
});
