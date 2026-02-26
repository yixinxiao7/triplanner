import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripCard, { TripCardSkeleton } from '../components/TripCard';

const mockTrip = {
  id: 'trip-001',
  name: 'Japan 2026',
  destinations: ['Tokyo', 'Osaka', 'Kyoto'],
  status: 'PLANNING',
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

function renderCard(trip = mockTrip, onDelete = vi.fn()) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TripCard trip={trip} onDelete={onDelete} />
    </MemoryRouter>
  );
}

describe('TripCard', () => {
  it('renders the trip name', () => {
    renderCard();
    expect(screen.getByText('Japan 2026')).toBeDefined();
  });

  it('renders destinations as comma-separated', () => {
    renderCard();
    expect(screen.getByText('Tokyo, Osaka, Kyoto', { exact: false })).toBeDefined();
  });

  it('renders the PLANNING status badge', () => {
    renderCard();
    expect(screen.getByText('PLANNING')).toBeDefined();
  });

  it('shows "dates not set" when no date range available', () => {
    renderCard();
    expect(screen.getByText('dates not set')).toBeDefined();
  });

  it('shows delete confirmation on trash icon click', () => {
    renderCard();
    const deleteBtn = screen.getByRole('button', { name: /delete trip/i });
    fireEvent.click(deleteBtn);
    expect(screen.getByText('delete this trip?')).toBeDefined();
    expect(screen.getByText('yes, delete')).toBeDefined();
    expect(screen.getByText('cancel')).toBeDefined();
  });

  it('restores card on cancel from delete confirmation', () => {
    renderCard();
    const deleteBtn = screen.getByRole('button', { name: /delete trip/i });
    fireEvent.click(deleteBtn);
    const cancelBtn = screen.getByText('cancel');
    fireEvent.click(cancelBtn);
    expect(screen.getByText('Japan 2026')).toBeDefined();
  });

  it('renders formatted date range when start_date and end_date are set', () => {
    const tripWithDates = {
      ...mockTrip,
      start_date: '2026-08-07',
      end_date: '2026-08-14',
    };
    renderCard(tripWithDates);
    // formatTripDateRange("2026-08-07", "2026-08-14") → "Aug 7 – Aug 14, 2026"
    expect(screen.getByText(/Aug 7.*Aug 14.*2026/)).toBeDefined();
    // Should NOT show "dates not set"
    expect(screen.queryByText('dates not set')).toBeNull();
  });

  it('renders skeleton correctly', () => {
    const { container } = render(<TripCardSkeleton />);
    const skeletonElements = container.querySelectorAll('.skeleton');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
