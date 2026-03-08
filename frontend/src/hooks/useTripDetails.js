import { useState, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * useTripDetails — fetches all data for a single trip details page.
 * Fetches trip, flights, stays, activities, and land travel in parallel.
 * Each sub-resource has its own loading/error state so sections render independently.
 */
export function useTripDetails(tripId) {
  const [trip, setTrip] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError, setTripError] = useState(null);

  const [flights, setFlights] = useState([]);
  const [flightsLoading, setFlightsLoading] = useState(true);
  const [flightsError, setFlightsError] = useState(null);

  const [stays, setStays] = useState([]);
  const [staysLoading, setStaysLoading] = useState(true);
  const [staysError, setStaysError] = useState(null);

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  const [landTravels, setLandTravels] = useState([]);
  const [landTravelsLoading, setLandTravelsLoading] = useState(true);
  const [landTravelsError, setLandTravelsError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!tripId) return;

    // Reset loading states
    setTripLoading(true);
    setFlightsLoading(true);
    setStaysLoading(true);
    setActivitiesLoading(true);
    setLandTravelsLoading(true);
    setTripError(null);
    setFlightsError(null);
    setStaysError(null);
    setActivitiesError(null);
    setLandTravelsError(null);

    // Fetch trip first — if it fails (404/403), don't bother with sub-resources
    try {
      const tripRes = await api.trips.get(tripId);
      setTrip(tripRes.data.data);
      setTripLoading(false);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setTripError({ type: 'not_found', message: 'trip not found.' });
      } else {
        setTripError({ type: 'network', message: 'could not load trip.' });
      }
      setTripLoading(false);
      // Stop loading sub-resources if the trip itself isn't accessible
      setFlightsLoading(false);
      setStaysLoading(false);
      setActivitiesLoading(false);
      setLandTravelsLoading(false);
      return;
    }

    // Fetch sub-resources in parallel, each independently
    const [flightsResult, staysResult, activitiesResult, landTravelsResult] = await Promise.allSettled([
      api.flights.list(tripId),
      api.stays.list(tripId),
      api.activities.list(tripId),
      api.land_travel.list(tripId),
    ]);

    if (flightsResult.status === 'fulfilled') {
      setFlights(flightsResult.value.data.data || []);
    } else {
      setFlightsError('could not load flights.');
    }
    setFlightsLoading(false);

    if (staysResult.status === 'fulfilled') {
      setStays(staysResult.value.data.data || []);
    } else {
      setStaysError('could not load stays.');
    }
    setStaysLoading(false);

    if (activitiesResult.status === 'fulfilled') {
      setActivities(activitiesResult.value.data.data || []);
    } else {
      setActivitiesError('could not load activities.');
    }
    setActivitiesLoading(false);

    if (landTravelsResult.status === 'fulfilled') {
      setLandTravels(landTravelsResult.value.data.data || []);
    } else {
      // Graceful fallback — land travel API may not be deployed yet during rollout
      setLandTravels([]);
      const ltStatus = landTravelsResult.reason?.response?.status;
      // Only surface error if it's not a 404 (missing endpoint is OK during rollout)
      if (ltStatus && ltStatus !== 404) {
        setLandTravelsError('could not load land travel.');
      }
    }
    setLandTravelsLoading(false);
  }, [tripId]);

  const refetchFlights = useCallback(async () => {
    setFlightsLoading(true);
    setFlightsError(null);
    try {
      const res = await api.flights.list(tripId);
      setFlights(res.data.data || []);
    } catch {
      setFlightsError('could not load flights.');
    } finally {
      setFlightsLoading(false);
    }
  }, [tripId]);

  const refetchStays = useCallback(async () => {
    setStaysLoading(true);
    setStaysError(null);
    try {
      const res = await api.stays.list(tripId);
      setStays(res.data.data || []);
    } catch {
      setStaysError('could not load stays.');
    } finally {
      setStaysLoading(false);
    }
  }, [tripId]);

  const refetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const res = await api.activities.list(tripId);
      setActivities(res.data.data || []);
    } catch {
      setActivitiesError('could not load activities.');
    } finally {
      setActivitiesLoading(false);
    }
  }, [tripId]);

  const refetchLandTravels = useCallback(async () => {
    setLandTravelsLoading(true);
    setLandTravelsError(null);
    try {
      const res = await api.land_travel.list(tripId);
      setLandTravels(res.data.data || []);
    } catch (err) {
      const status = err.response?.status;
      if (status !== 404) {
        setLandTravelsError('could not load land travel.');
      }
    } finally {
      setLandTravelsLoading(false);
    }
  }, [tripId]);

  return {
    trip,
    tripLoading,
    tripError,
    flights,
    flightsLoading,
    flightsError,
    stays,
    staysLoading,
    staysError,
    activities,
    activitiesLoading,
    activitiesError,
    landTravels,
    landTravelsLoading,
    landTravelsError,
    fetchAll,
    refetchFlights,
    refetchStays,
    refetchActivities,
    refetchLandTravels,
  };
}
