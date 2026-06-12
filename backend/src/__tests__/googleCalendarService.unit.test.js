/**
 * Unit tests for googleCalendarService.js event builders (T-343).
 *
 * No mocks needed — the builders are pure functions over DB row shapes and the
 * service does not import config/database.js.
 */
import { describe, it, expect } from 'vitest';
import {
  addDays,
  deriveTripTimezone,
  flightToGoogleEvent,
  stayToGoogleEvent,
  activityToGoogleEvent,
  landTravelToGoogleEvent,
  buildTripEvents,
  isAuthRevokedError,
  isInsufficientScopeError,
  isApiNotEnabledError,
} from '../services/googleCalendarService.js';

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-08-07', 1)).toBe('2026-08-08');
  });

  it('rolls over month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('deriveTripTimezone', () => {
  it('prefers the first stay check-in timezone', () => {
    const tz = deriveTripTimezone(
      [{ check_in_tz: 'Asia/Kolkata' }],
      [{ arrival_tz: 'America/New_York' }],
    );
    expect(tz).toBe('Asia/Kolkata');
  });

  it('falls back to the first flight arrival timezone', () => {
    expect(deriveTripTimezone([], [{ arrival_tz: 'America/New_York' }])).toBe(
      'America/New_York',
    );
  });

  it('falls back to UTC when no stays or flights exist', () => {
    expect(deriveTripTimezone([], [])).toBe('UTC');
  });
});

describe('flightToGoogleEvent', () => {
  const flight = {
    airline: 'Air India',
    flight_number: 'AI 102',
    from_location: 'JFK',
    to_location: 'DEL',
    departure_at: '2026-08-07T14:00:00.000Z',
    departure_tz: 'America/New_York',
    arrival_at: '2026-08-08T04:30:00.000Z',
    arrival_tz: 'Asia/Kolkata',
  };

  it('builds a timed event with per-leg timezones', () => {
    const event = flightToGoogleEvent(flight);
    expect(event.summary).toBe('Flight: Air India AI 102 — JFK → DEL');
    expect(event.start).toEqual({
      dateTime: '2026-08-07T14:00:00.000Z',
      timeZone: 'America/New_York',
    });
    expect(event.end).toEqual({
      dateTime: '2026-08-08T04:30:00.000Z',
      timeZone: 'Asia/Kolkata',
    });
  });
});

describe('stayToGoogleEvent', () => {
  const stay = {
    name: 'Taj Palace',
    address: '2 Sardar Patel Marg, New Delhi',
    check_in_at: '2026-08-08T09:30:00.000Z', // 15:00 IST
    check_in_tz: 'Asia/Kolkata',
    check_out_at: '2026-08-12T05:30:00.000Z', // 11:00 IST
    check_out_tz: 'Asia/Kolkata',
  };

  it('builds an all-day spanning event with EXCLUSIVE end date (+1 day)', () => {
    const event = stayToGoogleEvent(stay);
    expect(event.summary).toBe('Stay: Taj Palace');
    expect(event.start).toEqual({ date: '2026-08-08' });
    expect(event.end).toEqual({ date: '2026-08-13' }); // checkout 08-12, exclusive
    expect(event.location).toBe('2 Sardar Patel Marg, New Delhi');
  });

  it('includes local check-in/check-out times in the description', () => {
    const event = stayToGoogleEvent(stay);
    expect(event.description).toContain('Check-in: 2026-08-08 15:00');
    expect(event.description).toContain('Check-out: 2026-08-12 11:00');
  });

  it('omits location when address is null', () => {
    const event = stayToGoogleEvent({ ...stay, address: null });
    expect(event.location).toBeUndefined();
  });
});

describe('activityToGoogleEvent', () => {
  const TZ = 'Asia/Kolkata';

  it('builds a timed event when start_time and end_time exist', () => {
    const event = activityToGoogleEvent(
      {
        name: 'Taj Mahal visit',
        activity_date: '2026-08-09',
        start_time: '09:00:00',
        end_time: '12:30:00',
        location: 'Agra',
      },
      TZ,
    );
    expect(event.summary).toBe('Taj Mahal visit');
    expect(event.location).toBe('Agra');
    expect(event.start).toEqual({ dateTime: '2026-08-09T09:00:00', timeZone: TZ });
    expect(event.end).toEqual({ dateTime: '2026-08-09T12:30:00', timeZone: TZ });
  });

  it('defaults to a 1-hour duration when end_time is missing', () => {
    const event = activityToGoogleEvent(
      { name: 'Dinner', activity_date: '2026-08-09', start_time: '19:00:00', end_time: null },
      TZ,
    );
    expect(event.end).toEqual({ dateTime: '2026-08-09T20:00:00', timeZone: TZ });
  });

  it('rolls the 1-hour fallback across midnight', () => {
    const event = activityToGoogleEvent(
      { name: 'Night market', activity_date: '2026-08-09', start_time: '23:30:00', end_time: null },
      TZ,
    );
    expect(event.end).toEqual({ dateTime: '2026-08-10T00:30:00', timeZone: TZ });
  });

  it('builds an all-day event when times are missing', () => {
    const event = activityToGoogleEvent(
      { name: 'Free day', activity_date: '2026-08-10', start_time: null, end_time: null },
      TZ,
    );
    expect(event.start).toEqual({ date: '2026-08-10' });
    expect(event.end).toEqual({ date: '2026-08-11' });
  });

  it('includes notes as the description when present', () => {
    const event = activityToGoogleEvent(
      {
        name: 'Museum',
        activity_date: '2026-08-10',
        start_time: null,
        end_time: null,
        notes: 'Buy tickets online',
      },
      TZ,
    );
    expect(event.description).toBe('Buy tickets online');
  });
});

describe('landTravelToGoogleEvent', () => {
  const TZ = 'Asia/Kolkata';

  it('builds a timed event with arrival date/time', () => {
    const event = landTravelToGoogleEvent(
      {
        mode: 'TRAIN',
        from_location: 'Delhi',
        to_location: 'Agra',
        departure_date: '2026-08-09',
        departure_time: '06:00:00',
        arrival_date: '2026-08-09',
        arrival_time: '08:10:00',
        provider: 'Gatimaan Express',
      },
      TZ,
    );
    expect(event.summary).toBe('Train: Delhi → Agra');
    expect(event.start).toEqual({ dateTime: '2026-08-09T06:00:00', timeZone: TZ });
    expect(event.end).toEqual({ dateTime: '2026-08-09T08:10:00', timeZone: TZ });
    expect(event.description).toContain('Provider: Gatimaan Express');
  });

  it('falls back to +1h when arrival is not after departure', () => {
    const event = landTravelToGoogleEvent(
      {
        mode: 'BUS',
        from_location: 'A',
        to_location: 'B',
        departure_date: '2026-08-09',
        departure_time: '10:00:00',
        arrival_date: '2026-08-09',
        arrival_time: '10:00:00',
      },
      TZ,
    );
    expect(event.end).toEqual({ dateTime: '2026-08-09T11:00:00', timeZone: TZ });
  });

  it('builds an all-day spanning event when departure_time is missing', () => {
    const event = landTravelToGoogleEvent(
      {
        mode: 'RENTAL_CAR',
        from_location: 'Delhi',
        to_location: 'Jaipur',
        departure_date: '2026-08-11',
        departure_time: null,
        arrival_date: '2026-08-12',
        arrival_time: null,
      },
      TZ,
    );
    expect(event.summary).toBe('Rental car: Delhi → Jaipur');
    expect(event.start).toEqual({ date: '2026-08-11' });
    expect(event.end).toEqual({ date: '2026-08-13' }); // exclusive end
  });
});

describe('buildTripEvents', () => {
  it('merges all four resource types and derives the trip timezone', () => {
    const { timezone, events } = buildTripEvents({
      flights: [
        {
          airline: 'AI',
          flight_number: '102',
          from_location: 'JFK',
          to_location: 'DEL',
          departure_at: '2026-08-07T14:00:00.000Z',
          departure_tz: 'America/New_York',
          arrival_at: '2026-08-08T04:30:00.000Z',
          arrival_tz: 'Asia/Kolkata',
        },
      ],
      stays: [
        {
          name: 'Taj Palace',
          check_in_at: '2026-08-08T09:30:00.000Z',
          check_in_tz: 'Asia/Kolkata',
          check_out_at: '2026-08-12T05:30:00.000Z',
          check_out_tz: 'Asia/Kolkata',
        },
      ],
      activities: [
        { name: 'Free day', activity_date: '2026-08-10', start_time: null, end_time: null },
      ],
      landTravels: [
        {
          mode: 'TRAIN',
          from_location: 'Delhi',
          to_location: 'Agra',
          departure_date: '2026-08-09',
          departure_time: '06:00:00',
          arrival_date: '2026-08-09',
          arrival_time: '08:10:00',
        },
      ],
    });

    expect(timezone).toBe('Asia/Kolkata');
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.summary)).toEqual([
      'Flight: AI 102 — JFK → DEL',
      'Stay: Taj Palace',
      'Free day',
      'Train: Delhi → Agra',
    ]);
  });

  it('returns an empty list for an empty trip', () => {
    const { events } = buildTripEvents({});
    expect(events).toEqual([]);
  });
});

describe('isAuthRevokedError', () => {
  it('recognizes 401 status codes and invalid_grant messages', () => {
    expect(isAuthRevokedError({ code: 401 })).toBe(true);
    expect(isAuthRevokedError({ response: { status: 401 } })).toBe(true);
    expect(isAuthRevokedError(new Error('invalid_grant: Token revoked'))).toBe(true);
  });

  it('does not flag unrelated errors', () => {
    expect(isAuthRevokedError({ code: 500 })).toBe(false);
    expect(isAuthRevokedError(new Error('network down'))).toBe(false);
  });
});

describe('isInsufficientScopeError', () => {
  it('recognizes insufficientPermissions reason and 403 + "insufficient" message', () => {
    expect(isInsufficientScopeError({ errors: [{ reason: 'insufficientPermissions' }] })).toBe(true);
    const err = new Error('Request had insufficient authentication scopes.');
    err.status = 403;
    expect(isInsufficientScopeError(err)).toBe(true);
  });

  it('does not flag unrelated 403s', () => {
    const err = new Error('Rate limit exceeded');
    err.status = 403;
    expect(isInsufficientScopeError(err)).toBe(false);
  });
});

describe('isApiNotEnabledError (bug-044)', () => {
  it('recognizes accessNotConfigured reason and the "has not been used in project" message', () => {
    expect(isApiNotEnabledError({ errors: [{ reason: 'accessNotConfigured' }] })).toBe(true);
    expect(
      isApiNotEnabledError(
        new Error('Google Calendar API has not been used in project 123 before or it is disabled.'),
      ),
    ).toBe(true);
  });

  it('does not flag unrelated errors', () => {
    expect(isApiNotEnabledError(new Error('invalid_grant'))).toBe(false);
  });
});
