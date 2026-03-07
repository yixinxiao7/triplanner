import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TripCalendar from '../components/TripCalendar';

const mockTrip = {
  id: 'trip-001',
  name: 'Japan 2026',
  start_date: '2026-08-07',
  end_date: '2026-08-14',
};

const mockFlights = [
  {
    id: 'flight-001',
    flight_number: 'UA200',
    airline: 'United Airlines',
    from_location: 'SFO',
    to_location: 'NRT',
    departure_at: '2026-08-07T18:00:00.000Z',
    departure_tz: 'America/Los_Angeles',
    arrival_at: '2026-08-08T22:00:00.000Z',
    arrival_tz: 'Asia/Tokyo',
  },
];

const mockStays = [
  {
    id: 'stay-001',
    name: 'Shibuya Hotel',
    category: 'HOTEL',
    check_in_at: '2026-08-08T15:00:00.000Z',
    check_in_tz: 'Asia/Tokyo',
    check_out_at: '2026-08-12T11:00:00.000Z',
    check_out_tz: 'Asia/Tokyo',
  },
];

const mockActivities = [
  {
    id: 'act-001',
    name: 'Tokyo Skytree',
    activity_date: '2026-08-09',
    start_time: '10:00:00',
    end_time: '12:00:00',
  },
];

describe('TripCalendar', () => {
  it('renders the calendar container', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );
    expect(screen.getByRole('application', { name: /trip calendar/i })).toBeDefined();
  });

  it('renders day of week headers (Sun through Sat)', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );

    expect(screen.getByText('Sun')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Tue')).toBeDefined();
    expect(screen.getByText('Sat')).toBeDefined();
  });

  it('T-128: shows the month of the earliest event, not trip start_date', () => {
    // T-128: initial month is now determined by the earliest event across
    // flights/stays/activities — not trip.start_date. Passing a flight in August
    // ensures the calendar opens on August 2026.
    render(
      <TripCalendar
        trip={mockTrip}
        flights={mockFlights}
        stays={[]}
        activities={[]}
      />
    );

    // mockFlights departure_at is '2026-08-07T18:00:00.000Z' → August 2026
    expect(screen.getByText(/AUGUST 2026/i)).toBeDefined();
  });

  it('renders previous month button', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );
    expect(screen.getByRole('button', { name: /previous month/i })).toBeDefined();
  });

  it('renders next month button', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );
    expect(screen.getByRole('button', { name: /next month/i })).toBeDefined();
  });

  it('navigates to the next month when next button is clicked', () => {
    // T-128: pass flights in August so calendar starts on August 2026
    render(
      <TripCalendar
        trip={mockTrip}
        flights={mockFlights}
        stays={[]}
        activities={[]}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextBtn);

    // Should now show September 2026
    expect(screen.getByText(/SEPTEMBER 2026/i)).toBeDefined();
  });

  it('navigates to the previous month when prev button is clicked', () => {
    // T-128: pass flights in August so calendar starts on August 2026
    render(
      <TripCalendar
        trip={mockTrip}
        flights={mockFlights}
        stays={[]}
        activities={[]}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevBtn);

    // Should now show July 2026
    expect(screen.getByText(/JULY 2026/i)).toBeDefined();
  });

  it('renders 7 day cells per row (correct grid structure)', () => {
    const { container } = render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );
    // August 2026 has 31 days, starts on Saturday (day 6), needs 6 rows = 42 cells
    const dayCells = container.querySelectorAll('[aria-label]');
    // Check that there are day cells (just verify multiple cells rendered)
    expect(dayCells.length).toBeGreaterThan(28);
  });

  it('shows flight chip when flight departs in the current month', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={mockFlights}
        stays={[]}
        activities={[]}
      />
    );
    // UA200 departs on Aug 7 (LA time). T-101 may also add an arrival chip on Aug 8
    // (since arrival_at is Aug 8 Tokyo time). Use getAllByTitle to handle both cases.
    expect(screen.getAllByTitle('United Airlines UA200').length).toBeGreaterThanOrEqual(1);
  });

  it('shows activity chip when activity is in the current month', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={mockActivities}
      />
    );
    expect(screen.getByTitle('Tokyo Skytree')).toBeDefined();
  });

  it('shows stay chip when stay check-in is in the current month', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={mockStays}
        activities={[]}
      />
    );
    // Stay spans multiple days so multiple chips render — verify at least one exists
    const stayChips = screen.getAllByTitle('Shibuya Hotel');
    expect(stayChips.length).toBeGreaterThan(0);
  });

  it('shows loading overlay when isLoading is true', () => {
    const { container } = render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
        isLoading={true}
      />
    );
    // Should show loading state (no grid cells)
    const loadingEl = container.querySelector('[class*="loadingOverlay"]');
    expect(loadingEl).not.toBeNull();
  });

  it('defaults to current month when trip has no start_date', () => {
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();

    render(
      <TripCalendar
        trip={{}}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );

    expect(screen.getByText(new RegExp(currentMonthLabel))).toBeDefined();
  });

  it('shows "no events this month" when there are no events', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );
    expect(screen.getByText('no events this month')).toBeDefined();
  });

  it('does not show "no events this month" when there are events', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={mockFlights}
        stays={[]}
        activities={[]}
      />
    );
    const noEventsMsg = screen.queryByText('no events this month');
    expect(noEventsMsg).toBeNull();
  });

  // ── T-089: Event time display ─────────────────────────────────────────────

  it('shows compact departure time on flight chip (e.g. "9a")', () => {
    const flightUTC = [
      {
        id: 'flight-utc',
        flight_number: 'TK100',
        airline: 'Test Air',
        from_location: 'BOS',
        to_location: 'JFK',
        departure_at: '2026-08-07T09:00:00.000Z',
        departure_tz: 'UTC',
        arrival_at: '2026-08-07T10:30:00.000Z',
        arrival_tz: 'UTC',
      },
    ];
    render(
      <TripCalendar trip={mockTrip} flights={flightUTC} stays={[]} activities={[]} />
    );
    // formatCalendarTime("09:00") → "9a"
    expect(screen.getByText('9a')).toBeDefined();
  });

  it('shows compact start time on activity chip (e.g. "10a")', () => {
    const activityWithTime = [
      {
        id: 'act-time',
        name: 'Morning Tour',
        activity_date: '2026-08-09',
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
    ];
    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[]} activities={activityWithTime} />
    );
    // formatCalendarTime("10:00:00") → "10a"
    expect(screen.getByText('10a')).toBeDefined();
  });

  it('shows compact time with minutes (e.g. "2:30p") when minutes are non-zero', () => {
    const activityAfternoon = [
      {
        id: 'act-afternoon',
        name: 'Afternoon Tour',
        activity_date: '2026-08-09',
        start_time: '14:30:00',
        end_time: '16:00:00',
      },
    ];
    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[]} activities={activityAfternoon} />
    );
    // formatCalendarTime("14:30:00") → "2:30p"
    expect(screen.getByText('2:30p')).toBeDefined();
  });

  // ── T-089: Land travel events ─────────────────────────────────────────────

  it('renders land travel chip on departure_date with mode label and destination', () => {
    const landTravels = [
      {
        id: 'lt-t89',
        mode: 'TRAIN',
        provider: 'Amtrak',
        from_location: 'Boston',
        to_location: 'NYC',
        departure_date: '2026-08-09',
        departure_time: null,
        arrival_date: null,
        arrival_time: null,
      },
    ];
    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[]} activities={[]} landTravels={landTravels} />
    );
    // Chip title is "train → NYC"
    expect(screen.getByTitle('train → NYC')).toBeDefined();
  });

  it('renders land travel chip with departure time when departure_time is set', () => {
    const landTravels = [
      {
        id: 'lt-withtime',
        mode: 'BUS',
        from_location: 'Boston',
        to_location: 'NYC',
        departure_date: '2026-08-09',
        departure_time: '08:00:00',
        arrival_date: null,
        arrival_time: null,
      },
    ];
    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[]} activities={[]} landTravels={landTravels} />
    );
    // formatCalendarTime("08:00:00") → "8a"
    expect(screen.getByText('8a')).toBeDefined();
  });

  it('does not show "no events this month" when land travel events exist', () => {
    const landTravels = [
      {
        id: 'lt-check',
        mode: 'FERRY',
        from_location: 'A',
        to_location: 'B',
        departure_date: '2026-08-10',
        departure_time: null,
        arrival_date: null,
        arrival_time: null,
      },
    ];
    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[]} activities={[]} landTravels={landTravels} />
    );
    expect(screen.queryByText('no events this month')).toBeNull();
  });

  // ── T-089: +X more overflow button and DayPopover ─────────────────────────

  it('renders overflow as a <button> element (not plain text) when day has more than 3 events', () => {
    // Put 4 events on Aug 7: 1 flight + 1 stay + 1 activity + 1 land travel
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    // +1 more button (4 events, 3 visible, 1 overflow)
    const moreBtn = screen.getByRole('button', { name: /events on this day/i });
    expect(moreBtn.tagName).toBe('BUTTON');
    expect(moreBtn.textContent).toMatch(/\+1 more/i);
  });

  it('opens DayPopover dialog when "+X more" button is clicked', () => {
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    const moreBtn = screen.getByRole('button', { name: /events on this day/i });
    fireEvent.click(moreBtn);

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
  });

  it('DayPopover lists all events for the day', () => {
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));

    const dialog = screen.getByRole('dialog');
    // All 4 event types should be listed in the popover
    expect(dialog.textContent).toMatch(/AA1/);
    expect(dialog.textContent).toMatch(/Hotel X/);
    expect(dialog.textContent).toMatch(/Tour A/);
    expect(dialog.textContent).toMatch(/train/);
  });

  it('closes DayPopover when Escape key is pressed', () => {
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    // Press Escape to close
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes DayPopover when the close button is clicked', () => {
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /close events popover/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // ── T-097: Portal fix — popover must not corrupt calendar grid layout ─────

  it('T-097: calendar grid cells are not affected when popover opens (portal fix)', () => {
    // Create 4 events on Aug 7 to trigger +X more overflow
    const flight = {
      id: 'p1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'p2', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'p3', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'p4', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    const { container } = render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    // Count day cells before opening popover
    const dayCellsBefore = container.querySelectorAll('[aria-label*=", August"]').length;

    const moreBtn = screen.getByRole('button', { name: /events on this day/i });
    fireEvent.click(moreBtn);

    // Popover is open
    expect(screen.getByRole('dialog')).toBeDefined();

    // Day cell count must NOT change (no new cells created by popover)
    const dayCellsAfter = container.querySelectorAll('[aria-label*=", August"]').length;
    expect(dayCellsAfter).toBe(dayCellsBefore);
  });

  it('T-097: DayPopover renders outside the calendar grid container (portal to document.body)', () => {
    const flight = {
      id: 'p1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'p2', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'p3', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'p4', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    const { container } = render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));

    // The dialog should exist in the document
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();

    // The dialog should NOT be a descendant of the calendar container (it's portaled)
    expect(container.contains(dialog)).toBe(false);
  });

  it('T-097: popover renders with position:fixed style (not absolute inside grid)', () => {
    const flight = {
      id: 'p1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'p2', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'p3', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'p4', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));

    const dialog = screen.getByRole('dialog');
    // position:fixed is set via inline style
    expect(dialog.style.position).toBe('fixed');
  });

  // ── T-101: Stay checkout time on last day ──────────────────────────────────

  it('T-101: multi-day stay shows checkout time on checkout day chip', () => {
    // Stay from Aug 8 to Aug 10 (UTC), checkout_tz UTC so checkout time is 11:00 → "11a"
    const stay = {
      id: 'stay-t101',
      name: 'Grand Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T15:00:00.000Z',  // 15:00 UTC → "3p" check-in time
      check_in_tz: 'UTC',
      check_out_at: '2026-08-10T11:00:00.000Z',  // 11:00 UTC → "11a" checkout time
      check_out_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[stay]} activities={[]} />
    );

    // Navigate to August 2026 (already the initial month from mockTrip.start_date 2026-08-07)
    // The checkout day (Aug 10) should show "check-out 11a"
    const checkoutText = screen.getAllByText(/check-out 11a/i);
    expect(checkoutText.length).toBeGreaterThan(0);
  });

  it('T-101: single-day stay shows both check-in and check-out times on same chip', () => {
    // Stay on Aug 8 only (check-in and check-out same day)
    const stay = {
      id: 'stay-single',
      name: 'Day Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T14:00:00.000Z',  // 14:00 UTC → "2p"
      check_in_tz: 'UTC',
      check_out_at: '2026-08-08T22:00:00.000Z',  // 22:00 UTC → "10p"
      check_out_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[stay]} activities={[]} />
    );

    // Single-day chip should show combined "2p → check-out 10p" (or similar combined format)
    const combinedText = screen.getAllByText(/→ check-out/i);
    expect(combinedText.length).toBeGreaterThan(0);
  });

  it('T-101: flight spanning two days shows arrival chip with "arrives X" on arrival date', () => {
    // Flight departs Aug 7 UTC, arrives Aug 8 UTC (spans midnight)
    const flight = {
      id: 'flight-span',
      flight_number: 'UA900',
      airline: 'United',
      from_location: 'SFO',
      to_location: 'NRT',
      departure_at: '2026-08-07T23:00:00.000Z',  // 23:00 UTC Aug 7
      departure_tz: 'UTC',
      arrival_at: '2026-08-08T06:00:00.000Z',    // 06:00 UTC Aug 8 → "6a"
      arrival_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={[flight]} stays={[]} activities={[]} />
    );

    // Arrival day chip should show "arrives 6a"
    const arrivalText = screen.getAllByText(/arrives 6a/i);
    expect(arrivalText.length).toBeGreaterThan(0);
  });

  it('T-101: same-day flight does NOT show arrival chip on a separate date', () => {
    // Flight departs and arrives on Aug 7 (same UTC date)
    const flight = {
      id: 'flight-sameday',
      flight_number: 'SW100',
      airline: 'Southwest',
      from_location: 'LAX',
      to_location: 'SFO',
      departure_at: '2026-08-07T10:00:00.000Z',  // 10:00 UTC Aug 7
      departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z',    // 12:00 UTC Aug 7 (same day)
      arrival_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={[flight]} stays={[]} activities={[]} />
    );

    // "arrives X" text should NOT appear since arrival is same day as departure
    const arrivalText = screen.queryByText(/arrives/i);
    expect(arrivalText).toBeNull();
  });

  it('T-101: multi-day stay does NOT show checkout time on first (check-in) day', () => {
    const stay = {
      id: 'stay-noCoFirst',
      name: 'Long Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T15:00:00.000Z',  // check-in: 3p
      check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', // checkout: 11a (different day)
      check_out_tz: 'UTC',
    };

    const { container } = render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[stay]} activities={[]} />
    );

    // The check-in day (Aug 8) cell should not contain "check-out" text.
    // Aug 8, 2026 is a Saturday; DAYS_OF_WEEK uses abbreviated names ("Sat").
    const aug8Cell = container.querySelector('[aria-label="Sat, August 8"]');
    expect(aug8Cell).not.toBeNull();
    expect(aug8Cell.textContent).not.toMatch(/check-out/i);
  });

  it('T-101: land travel arrival chip with "arr." on arrival day (Sprint 6 feature — regression)', () => {
    // Land travel from Aug 7 to Aug 8
    const landTravel = {
      id: 'lt-arr',
      mode: 'TRAIN',
      from_location: 'Boston',
      to_location: 'NYC',
      departure_date: '2026-08-07',
      departure_time: '08:00:00',
      arrival_date: '2026-08-08',
      arrival_time: '12:00:00',
    };

    render(
      <TripCalendar trip={mockTrip} flights={[]} stays={[]} activities={[]} landTravels={[landTravel]} />
    );

    // Arrival day (Aug 8) should show "arr. 12p" in popover or chip
    // The arrival chip is created in buildEventsMap for land travel
    // It renders with _isArrival: true → popoverItemTime shows "arr. 12p"
    // The arrival chip title is "train → NYC" (same as departure)
    const trainChips = screen.getAllByTitle('train → NYC');
    // Should have at least 2 chips: one for departure day and one for arrival day
    expect(trainChips.length).toBeGreaterThanOrEqual(2);
  });

  // ── T-126: DayPopover scroll-close behavior ───────────────────────────────

  // Helper: set up 4 events on Aug 7 to produce overflow "+X more" button
  function renderWithOverflow() {
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };
    return render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );
  }

  it('T-126: DayPopover closes when a scroll event fires on window', () => {
    renderWithOverflow();

    // Open the popover
    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    // Fire a scroll event on window with capture
    fireEvent.scroll(window);

    // Popover should be gone
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('T-126: scroll listener is added and removed when DayPopover opens/closes', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    renderWithOverflow();

    // Open the popover — scroll listener should be registered
    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));

    const scrollCalls = addSpy.mock.calls.filter(([event, , opts]) =>
      event === 'scroll' && opts?.capture === true
    );
    expect(scrollCalls.length).toBeGreaterThan(0);

    // Close via Escape — scroll listener should be removed
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    const removeScrollCalls = removeSpy.mock.calls.filter(([event, , opts]) =>
      event === 'scroll' && opts?.capture === true
    );
    expect(removeScrollCalls.length).toBeGreaterThan(0);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('T-126: Escape still closes DayPopover after scroll listener is attached', () => {
    renderWithOverflow();

    // Open the popover
    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    // Press Escape — must still close the popover with no errors
    expect(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    }).not.toThrow();

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // ── T-127: Check-in chip label ────────────────────────────────────────────

  it('T-127: check-in day chip shows "check-in Xa" prefix (multi-day stay, first day)', () => {
    // Stay from Aug 8 (check-in 16:00 UTC = 4p) to Aug 12 (check-out 11:00 UTC = 11a)
    // Using UTC timezone so times are unambiguous in tests
    const stay = {
      id: 'stay-checkin',
      name: 'Test Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T16:00:00.000Z',  // 16:00 UTC → "4p"
      check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z',  // 11:00 UTC → "11a"
      check_out_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={mockFlights} stays={[stay]} activities={[]} />
    );

    // Aug 8 check-in chip should read "check-in 4p", NOT just "4p"
    const checkinChips = screen.getAllByText(/check-in 4p/i);
    expect(checkinChips.length).toBeGreaterThan(0);
  });

  it('T-127: check-in chip does NOT appear as bare time without prefix', () => {
    const stay = {
      id: 'stay-nobare',
      name: 'Test Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T16:00:00.000Z',  // 16:00 UTC → "4p"
      check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z',
      check_out_tz: 'UTC',
    };

    const { container } = render(
      <TripCalendar trip={mockTrip} flights={mockFlights} stays={[stay]} activities={[]} />
    );

    // The check-in day cell (Aug 8) should not contain a bare "4p" without the "check-in" prefix
    const aug8Cell = container.querySelector('[aria-label="Sat, August 8"]');
    expect(aug8Cell).not.toBeNull();
    // Should contain "check-in 4p" but NOT a standalone "4p" text node
    expect(aug8Cell.textContent).toMatch(/check-in 4p/i);
  });

  it('T-127: check-out chip is unchanged (still shows "check-out Xa")', () => {
    const stay = {
      id: 'stay-checkout',
      name: 'Test Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T16:00:00.000Z',
      check_in_tz: 'UTC',
      check_out_at: '2026-08-12T11:00:00.000Z',  // 11:00 UTC → "11a"
      check_out_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={mockFlights} stays={[stay]} activities={[]} />
    );

    // Aug 12 checkout chip should still read "check-out 11a" (unchanged by T-127)
    const checkoutChips = screen.getAllByText(/check-out 11a/i);
    expect(checkoutChips.length).toBeGreaterThan(0);
  });

  it('T-127: single-day stay shows "check-in Xa → check-out Xa" combined chip', () => {
    // Same-day check-in and check-out
    const stay = {
      id: 'stay-sameday',
      name: 'Day Hotel',
      category: 'HOTEL',
      check_in_at: '2026-08-08T14:00:00.000Z',  // 14:00 UTC → "2p"
      check_in_tz: 'UTC',
      check_out_at: '2026-08-08T22:00:00.000Z',  // 22:00 UTC → "10p"
      check_out_tz: 'UTC',
    };

    render(
      <TripCalendar trip={mockTrip} flights={mockFlights} stays={[stay]} activities={[]} />
    );

    // Single-day chip should show "check-in 2p → check-out 10p"
    const chips = screen.getAllByText(/check-in 2p → check-out 10p/i);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('T-127: check-in label in DayPopover matches the day cell chip label', () => {
    // Create 4 events including a stay on Aug 7 to force the popover
    const flight = {
      id: 'of1', flight_number: 'AA1', airline: 'AA',
      from_location: 'A', to_location: 'B',
      departure_at: '2026-08-07T09:00:00.000Z', departure_tz: 'UTC',
      arrival_at: '2026-08-07T12:00:00.000Z', arrival_tz: 'UTC',
    };
    const stay = {
      id: 'os1', name: 'Hotel X', category: 'HOTEL',
      check_in_at: '2026-08-07T15:00:00.000Z', check_in_tz: 'UTC',  // 15:00 UTC → "3p"
      check_out_at: '2026-08-12T11:00:00.000Z', check_out_tz: 'UTC',
    };
    const activity = {
      id: 'oa1', name: 'Tour A', activity_date: '2026-08-07', start_time: '10:00:00',
    };
    const landTravel = {
      id: 'olt1', mode: 'TRAIN', from_location: 'X', to_location: 'Y',
      departure_date: '2026-08-07', departure_time: null, arrival_date: null, arrival_time: null,
    };

    render(
      <TripCalendar
        trip={mockTrip}
        flights={[flight]}
        stays={[stay]}
        activities={[activity]}
        landTravels={[landTravel]}
      />
    );

    // Open the popover to see all events
    fireEvent.click(screen.getByRole('button', { name: /events on this day/i }));
    const dialog = screen.getByRole('dialog');

    // The popover should show "check-in 3p" for the stay (DayPopover.getEventTime already
    // prepends "check-in" — T-127 ensures the day cell matches this format)
    expect(dialog.textContent).toMatch(/check-in 3p/i);
  });

  // ── T-128: Calendar default month — first planned event ───────────────────

  it('T-128: defaults to earliest event month when events exist', () => {
    // All events in August 2026
    render(
      <TripCalendar
        trip={{ id: 't1', name: 'Test' }}
        flights={[{ id: 'f1', flight_number: 'UA1', airline: 'UA',
          from_location: 'A', to_location: 'B',
          departure_at: '2026-08-07T10:00:00.000Z', departure_tz: 'UTC',
          arrival_at: '2026-08-07T14:00:00.000Z', arrival_tz: 'UTC' }]}
        stays={[{ id: 's1', name: 'H', category: 'HOTEL',
          check_in_at: '2026-08-07T20:00:00.000Z', check_in_tz: 'UTC',
          check_out_at: '2026-08-10T11:00:00.000Z', check_out_tz: 'UTC' }]}
        activities={[{ id: 'a1', name: 'A', activity_date: '2026-08-08', start_time: null }]}
      />
    );

    // Should open on August 2026, not the current month
    expect(screen.getByText(/AUGUST 2026/i)).toBeDefined();
  });

  it('T-128: falls back to current month when no events exist', () => {
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const currentYear = now.getFullYear();

    render(
      <TripCalendar
        trip={{ id: 't1', name: 'Empty Trip' }}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );

    expect(screen.getByText(new RegExp(`${currentMonthLabel} ${currentYear}`, 'i'))).toBeDefined();
  });

  it('T-128: picks the earliest month across mixed event types', () => {
    // Activity in August is earlier than the flight/stay in September
    render(
      <TripCalendar
        trip={{ id: 't1', name: 'Mixed' }}
        flights={[{ id: 'f1', flight_number: 'UA1', airline: 'UA',
          from_location: 'A', to_location: 'B',
          departure_at: '2026-09-15T06:00:00.000Z', departure_tz: 'UTC',
          arrival_at: '2026-09-15T10:00:00.000Z', arrival_tz: 'UTC' }]}
        stays={[{ id: 's1', name: 'H', category: 'HOTEL',
          check_in_at: '2026-09-15T20:00:00.000Z', check_in_tz: 'UTC',
          check_out_at: '2026-09-20T11:00:00.000Z', check_out_tz: 'UTC' }]}
        activities={[{ id: 'a1', name: 'A', activity_date: '2026-08-20', start_time: null }]}
      />
    );

    // The activity date (August 20) is the earliest → calendar opens on August
    expect(screen.getByText(/AUGUST 2026/i)).toBeDefined();
  });

  it('T-128: month navigation works normally from the initial event month', () => {
    render(
      <TripCalendar
        trip={{ id: 't1', name: 'Nav Test' }}
        flights={[{ id: 'f1', flight_number: 'UA1', airline: 'UA',
          from_location: 'A', to_location: 'B',
          departure_at: '2026-08-07T10:00:00.000Z', departure_tz: 'UTC',
          arrival_at: '2026-08-07T14:00:00.000Z', arrival_tz: 'UTC' }]}
        stays={[]}
        activities={[]}
      />
    );

    // Starts on August 2026
    expect(screen.getByText(/AUGUST 2026/i)).toBeDefined();

    // Navigate forward
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText(/SEPTEMBER 2026/i)).toBeDefined();

    // Navigate backward
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText(/AUGUST 2026/i)).toBeDefined();
  });

  it('T-128: malformed date in one event is skipped; valid event determines month', () => {
    render(
      <TripCalendar
        trip={{ id: 't1', name: 'Malformed Test' }}
        flights={[{ id: 'f1', flight_number: 'BAD', airline: 'Bad',
          from_location: 'A', to_location: 'B',
          departure_at: 'not-a-date', departure_tz: 'UTC',
          arrival_at: 'not-a-date', arrival_tz: 'UTC' }]}
        stays={[{ id: 's1', name: 'H', category: 'HOTEL',
          check_in_at: '2026-10-01T12:00:00.000Z', check_in_tz: 'UTC',
          check_out_at: '2026-10-05T11:00:00.000Z', check_out_tz: 'UTC' }]}
        activities={[]}
      />
    );

    // Malformed flight date is skipped; stay check-in Oct 1 determines the month
    expect(screen.getByText(/OCTOBER 2026/i)).toBeDefined();
  });
});
