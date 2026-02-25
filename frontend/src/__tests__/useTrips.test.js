import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrips } from '../hooks/useTrips';

// ── Mock the api module ──────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    trips: {
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { api } from '../utils/api';

// ── Shared test data ─────────────────────────────────────────────────────────
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
    name: 'Europe 2026',
    destinations: ['Paris', 'Rome', 'Berlin'],
    status: 'PLANNING',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────
describe('useTrips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. fetchTrips happy path — returns trips array ───────────────────────────
  it('fetches trips and updates state with the returned array', async () => {
    api.trips.list.mockResolvedValue({ data: { data: mockTrips } });

    const { result } = renderHook(() => useTrips());

    // Initially loading is true (from useState default)
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await result.current.fetchTrips();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.trips).toEqual(mockTrips);
    expect(result.current.error).toBeNull();
    expect(api.trips.list).toHaveBeenCalledTimes(1);
  });

  it('handles empty trips array from API', async () => {
    api.trips.list.mockResolvedValue({ data: { data: [] } });

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.fetchTrips();
    });

    expect(result.current.trips).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ── 2. fetchTrips error path — sets error state ──────────────────────────────
  it('sets error state when fetchTrips API call fails', async () => {
    api.trips.list.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.fetchTrips();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.trips).toEqual([]);
  });

  it('uses server error message when available', async () => {
    const apiError = new Error('Server error');
    apiError.response = {
      data: { error: { message: 'Unauthorized' } },
    };
    api.trips.list.mockRejectedValue(apiError);

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.fetchTrips();
    });

    expect(result.current.error).toBe('Unauthorized');
  });

  it('clears error and resets loading on subsequent fetchTrips call', async () => {
    api.trips.list
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({ data: { data: mockTrips } });

    const { result } = renderHook(() => useTrips());

    // First call fails
    await act(async () => {
      await result.current.fetchTrips();
    });
    expect(result.current.error).toBeTruthy();

    // Second call succeeds
    await act(async () => {
      await result.current.fetchTrips();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.trips).toEqual(mockTrips);
  });

  // ── 3. createTrip happy path — returns new trip ───────────────────────────────
  it('creates a trip and returns the new trip object from the API', async () => {
    const newTrip = {
      id: 'new-trip-001',
      name: 'Europe 2026',
      destinations: ['Paris', 'Rome'],
      status: 'PLANNING',
      created_at: '2026-02-24T12:00:00.000Z',
      updated_at: '2026-02-24T12:00:00.000Z',
    };
    api.trips.create.mockResolvedValue({ data: { data: newTrip } });

    const { result } = renderHook(() => useTrips());

    let returnedTrip;
    await act(async () => {
      returnedTrip = await result.current.createTrip({
        name: 'Europe 2026',
        destinations: 'Paris, Rome',
      });
    });

    expect(returnedTrip).toEqual(newTrip);
  });

  it('converts destinations string to array before calling the API', async () => {
    const newTrip = {
      id: 'new-trip-001',
      name: 'Asia Trip',
      destinations: ['Tokyo', 'Seoul', 'Bangkok'],
      status: 'PLANNING',
      created_at: '2026-02-24T12:00:00.000Z',
      updated_at: '2026-02-24T12:00:00.000Z',
    };
    api.trips.create.mockResolvedValue({ data: { data: newTrip } });

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.createTrip({
        name: 'Asia Trip',
        destinations: 'Tokyo, Seoul, Bangkok',
      });
    });

    expect(api.trips.create).toHaveBeenCalledWith({
      name: 'Asia Trip',
      destinations: ['Tokyo', 'Seoul', 'Bangkok'],
    });
  });

  // ── 4. createTrip error path ─────────────────────────────────────────────────
  it('throws when createTrip API call fails', async () => {
    api.trips.create.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useTrips());

    let caughtError = null;
    await act(async () => {
      try {
        await result.current.createTrip({
          name: 'Bad Trip',
          destinations: 'Nowhere',
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeTruthy();
    expect(caughtError.message).toBe('Server error');
  });

  // ── 5. deleteTrip removes entry from local trips list ────────────────────────
  it('removes a trip from the local list after successful deletion', async () => {
    api.trips.list.mockResolvedValue({ data: { data: mockTrips } });
    api.trips.delete.mockResolvedValue({ status: 204 });

    const { result } = renderHook(() => useTrips());

    // First load the trips
    await act(async () => {
      await result.current.fetchTrips();
    });

    expect(result.current.trips).toHaveLength(2);

    // Delete the first trip
    await act(async () => {
      await result.current.deleteTrip('trip-001');
    });

    expect(result.current.trips).toHaveLength(1);
    expect(result.current.trips[0].id).toBe('trip-002');
    expect(api.trips.delete).toHaveBeenCalledWith('trip-001');
  });

  it('keeps trips list intact if the deleted id is not in the list', async () => {
    api.trips.list.mockResolvedValue({ data: { data: mockTrips } });
    api.trips.delete.mockResolvedValue({ status: 204 });

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.fetchTrips();
    });

    await act(async () => {
      await result.current.deleteTrip('nonexistent-id');
    });

    // List unchanged because the id wasn't found
    expect(result.current.trips).toHaveLength(2);
  });

  it('throws when deleteTrip API call fails', async () => {
    api.trips.list.mockResolvedValue({ data: { data: mockTrips } });
    api.trips.delete.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.fetchTrips();
    });

    let caughtError = null;
    await act(async () => {
      try {
        await result.current.deleteTrip('trip-001');
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeTruthy();
    // Trips list should NOT be modified on failure
    expect(result.current.trips).toHaveLength(2);
  });
});
