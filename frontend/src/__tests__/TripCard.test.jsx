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
    <MemoryRouter>
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

  it('renders skeleton correctly', () => {
    const { container } = render(<TripCardSkeleton />);
    const skeletonElements = container.querySelectorAll('.skeleton');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
