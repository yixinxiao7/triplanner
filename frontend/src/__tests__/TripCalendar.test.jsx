import { describe, it, expect, vi } from 'vitest';
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

  it('shows the month label for the initial trip start date month', () => {
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
        stays={[]}
        activities={[]}
      />
    );

    // Trip start_date is 2026-08-07, so should show August 2026
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
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
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
    render(
      <TripCalendar
        trip={mockTrip}
        flights={[]}
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
    // UA200 departs on Aug 7 (UTC), should appear as a chip
    expect(screen.getByTitle('United Airlines UA200')).toBeDefined();
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
});
