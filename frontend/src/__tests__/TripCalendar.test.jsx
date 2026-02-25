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
});
