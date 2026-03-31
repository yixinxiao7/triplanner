import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrintCalendarSummary from '../components/PrintCalendarSummary';

// ── Shared test data ─────────────────────────────────────────────

const baseTripWithDates = {
  id: 'trip-001',
  name: 'Japan 2026',
  start_date: '2026-08-07',
  end_date: '2026-08-09',
};

const baseTripNoDates = {
  id: 'trip-002',
  name: 'Open Trip',
  start_date: null,
  end_date: null,
};

const mockFlight = {
  id: 'flight-001',
  flight_number: 'DL006',
  airline: 'Delta',
  from_location: 'JFK',
  to_location: 'NRT',
  departure_at: '2026-08-07T15:00:00.000Z',
  departure_tz: 'America/New_York',
  arrival_at: '2026-08-08T06:15:00.000Z',
  arrival_tz: 'Asia/Tokyo',
};

const mockStay = {
  id: 'stay-001',
  name: 'Hyatt Regency Tokyo',
  category: 'hotel',
  address: '2-7-2 Nishi-Shinjuku',
  check_in_at: '2026-08-07T07:00:00.000Z',
  check_in_tz: 'Asia/Tokyo',
  check_out_at: '2026-08-09T02:00:00.000Z',
  check_out_tz: 'Asia/Tokyo',
};

const mockActivity1 = {
  id: 'act-001',
  name: 'Golden Gate Bridge',
  location: 'San Francisco, CA',
  activity_date: '2026-08-08',
  start_time: '15:00:00',
  end_time: '19:00:00',
};

const mockActivity2 = {
  id: 'act-002',
  name: "Fisherman's Wharf",
  location: 'San Francisco, CA',
  activity_date: '2026-08-08',
  start_time: '09:00:00',
  end_time: '14:00:00',
};

const mockLandTravel = {
  id: 'lt-001',
  mode: 'TRAIN',
  from_location: 'Tokyo',
  to_location: 'Osaka',
  departure_date: '2026-08-08',
  departure_time: '08:30:00',
  arrival_date: '2026-08-08',
  arrival_time: '11:00:00',
  provider: 'JR',
  confirmation_number: null,
  notes: null,
};

// ── Tests ────────────────────────────────────────────────────────

describe('PrintCalendarSummary', () => {
  it('Test 1 — renders with valid trip and flight data, wrapper has correct class', () => {
    const { container } = render(
      <PrintCalendarSummary
        trip={baseTripWithDates}
        flights={[mockFlight]}
        stays={[]}
        activities={[]}
        landTravel={[]}
      />
    );

    // Component renders content (not null)
    expect(container.firstChild).not.toBeNull();

    // Wrapper has the CSS module class
    const wrapper = container.firstChild;
    expect(wrapper.className).toMatch(/wrapper/);
  });

  it('Test 2 — generates correct day rows for date range with mixed events', () => {
    render(
      <PrintCalendarSummary
        trip={baseTripWithDates}
        flights={[mockFlight]}
        stays={[]}
        activities={[mockActivity1]}
        landTravel={[]}
      />
    );

    // 3 days: Aug 7, Aug 8, Aug 9
    const rows = screen.getAllByRole('row');
    // Header row (sr-only) + 3 day rows = 4
    expect(rows.length).toBe(4);

    // Aug 7 should have FLT label
    expect(rows[1].textContent).toContain('FLT');

    // Aug 8 should have ACT label
    expect(rows[2].textContent).toContain('ACT');

    // Aug 9 should have em-dash (no events)
    expect(rows[3].textContent).toContain('—');
  });

  it('Test 3 — returns null for empty trip with no data', () => {
    const { container } = render(
      <PrintCalendarSummary
        trip={baseTripNoDates}
        flights={[]}
        stays={[]}
        activities={[]}
        landTravel={[]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('Test 4 — stay check-in and checkout appear on correct days', () => {
    render(
      <PrintCalendarSummary
        trip={baseTripWithDates}
        flights={[]}
        stays={[mockStay]}
        activities={[]}
        landTravel={[]}
      />
    );

    const rows = screen.getAllByRole('row');
    // Header + 3 days = 4 rows

    // Aug 7: STAY IN
    expect(rows[1].textContent).toContain('STAY IN');
    expect(rows[1].textContent).toContain('Hyatt Regency Tokyo');

    // Aug 9: STAY OUT
    expect(rows[3].textContent).toContain('STAY OUT');
    expect(rows[3].textContent).toContain('Hyatt Regency Tokyo');
  });

  it('Test 5 — events are sorted by time within a day', () => {
    render(
      <PrintCalendarSummary
        trip={baseTripWithDates}
        flights={[]}
        stays={[]}
        activities={[mockActivity1, mockActivity2]}
        landTravel={[]}
      />
    );

    const rows = screen.getAllByRole('row');
    // Aug 8 row (index 2) should have both activities

    const aug8Content = rows[2].textContent;
    const wharf = aug8Content.indexOf("Fisherman's Wharf");
    const bridge = aug8Content.indexOf('Golden Gate Bridge');

    // 9:00a (Fisherman's Wharf) should come before 3:00p (Golden Gate Bridge)
    expect(wharf).toBeLessThan(bridge);
  });

  it('Test 6 — date range derived from data when trip has no dates', () => {
    const flightAug7 = {
      ...mockFlight,
      departure_at: '2026-08-07T15:00:00.000Z',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-07T20:00:00.000Z',
      arrival_tz: 'America/New_York',
    };

    const actAug10 = {
      id: 'act-010',
      name: 'Museum Visit',
      location: 'Ueno',
      activity_date: '2026-08-10',
      start_time: '10:00:00',
      end_time: '12:00:00',
    };

    render(
      <PrintCalendarSummary
        trip={baseTripNoDates}
        flights={[flightAug7]}
        stays={[]}
        activities={[actAug10]}
        landTravel={[]}
      />
    );

    const rows = screen.getAllByRole('row');
    // Header + 4 days (Aug 7, 8, 9, 10) = 5 rows
    expect(rows.length).toBe(5);

    // First day row: Aug 7 with FLT
    expect(rows[1].textContent).toContain('Aug 7');
    expect(rows[1].textContent).toContain('FLT');

    // Last day row: Aug 10 with ACT
    expect(rows[4].textContent).toContain('Aug 10');
    expect(rows[4].textContent).toContain('ACT');
  });
});
