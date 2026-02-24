import { useState, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * useTrips — manages the list of trips for the home page.
 * Handles fetch, create, and delete operations with loading + error states.
 */
export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.trips.list();
      setTrips(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'could not load trips.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTrip = useCallback(async ({ name, destinations }) => {
    // destinations is a comma-separated string from the form
    // convert to array for the API
    const destinationsArray = destinations
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const response = await api.trips.create({ name, destinations: destinationsArray });
    return response.data.data; // returns the new trip object (with id)
  }, []);

  const deleteTrip = useCallback(async (tripId) => {
    await api.trips.delete(tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  }, []);

  return {
    trips,
    isLoading,
    error,
    fetchTrips,
    createTrip,
    deleteTrip,
  };
}
