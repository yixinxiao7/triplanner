import { useState, useCallback, useRef } from 'react';
import { api } from '../utils/api';

/**
 * useTrips — manages the list of trips for the home page.
 * Handles fetch (with optional search/filter/sort params), create, and delete
 * operations with loading + error states.
 *
 * The hook tracks request identity via a counter to handle stale responses:
 * if a newer fetchTrips call is made before a previous one finishes,
 * the stale response is discarded.
 */
export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const requestIdRef = useRef(0);

  /**
   * Fetch trips with optional filter/sort params.
   * @param {Object} [filterParams] - Optional query parameters
   * @param {string} [filterParams.search] - Search text (name or destination)
   * @param {string} [filterParams.status] - Status filter (PLANNING|ONGOING|COMPLETED)
   * @param {string} [filterParams.sort_by] - Sort field (name|created_at|start_date)
   * @param {string} [filterParams.sort_order] - Sort direction (asc|desc)
   */
  const fetchTrips = useCallback(async (filterParams = {}) => {
    // Increment request counter — this becomes the identity of this request
    const currentRequestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // Build clean params — omit empty/undefined values
      const params = {};
      if (filterParams.search) params.search = filterParams.search;
      if (filterParams.status) params.status = filterParams.status;
      if (filterParams.sort_by) params.sort_by = filterParams.sort_by;
      if (filterParams.sort_order) params.sort_order = filterParams.sort_order;

      const response = await api.trips.list(params);

      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setTrips(response.data.data || []);
        setTotalCount(response.data.pagination?.total ?? response.data.data?.length ?? 0);
      }
    } catch (err) {
      // Only set error if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setError(err.response?.data?.error?.message || 'could not load trips.');
      }
    } finally {
      // Only clear loading if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const createTrip = useCallback(async ({ name, destinations }) => {
    // destinations may be a string[] (chip input) or a comma-separated string (legacy)
    const destinationsArray = Array.isArray(destinations)
      ? destinations
      : destinations.split(',').map((d) => d.trim()).filter(Boolean);

    const response = await api.trips.create({ name, destinations: destinationsArray });
    return response.data.data; // returns the new trip object (with id)
  }, []);

  const deleteTrip = useCallback(async (tripId) => {
    await api.trips.delete(tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    setTotalCount((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    trips,
    isLoading,
    error,
    totalCount,
    fetchTrips,
    createTrip,
    deleteTrip,
  };
}
