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

  it('shows "No dates yet" when no date range available', () => {
    renderCard();
    expect(screen.getByText('No dates yet')).toBeDefined();
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

  it('renders formatted date range when start_date and end_date are set (same month)', () => {
    const tripWithDates = {
      ...mockTrip,
      start_date: '2026-08-07',
      end_date: '2026-08-14',
    };
    renderCard(tripWithDates);
    // formatDateRange("2026-08-07", "2026-08-14") → "Aug 7 – 14, 2026" (same-month abbreviated)
    expect(screen.getByText('Aug 7 \u2013 14, 2026')).toBeDefined();
    // Should NOT show "No dates yet"
    expect(screen.queryByText('No dates yet')).toBeNull();
  });

  it('renders skeleton correctly', () => {
    const { container } = render(<TripCardSkeleton />);
    const skeletonElements = container.querySelectorAll('.skeleton');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  // ── T-104: Trip notes preview on TripCard ────────────────────────────────────
  it('[T-104] shows truncated notes (>100 chars) with trailing ellipsis', () => {
    const longNotes = 'a'.repeat(150);
    const tripWithNotes = { ...mockTrip, notes: longNotes };
    renderCard(tripWithNotes);

    // First 100 chars + unicode ellipsis (\u2026)
    const expected = longNotes.slice(0, 100) + '\u2026';
    expect(screen.getByText(expected)).toBeDefined();
  });

  it('[T-104] shows full notes without ellipsis when notes are 100 chars or fewer', () => {
    const shortNotes = 'Short trip note.';
    const tripWithShortNotes = { ...mockTrip, notes: shortNotes };
    renderCard(tripWithShortNotes);

    // Full notes text shown, no ellipsis appended
    expect(screen.getByText('Short trip note.')).toBeDefined();
    // Should not show an ellipsis after the text
    expect(screen.queryByText('Short trip note.\u2026')).toBeNull();
  });

  it('[T-104] notes section hidden when trip.notes is null', () => {
    const tripNoNotes = { ...mockTrip, notes: null };
    const { container } = renderCard(tripNoNotes);

    // notes preview class should not render any notes element
    const notesPreview = container.querySelector('[class*="notesPreview"]');
    expect(notesPreview).toBeNull();
  });

  it('[T-104] notes section hidden when trip.notes is empty string', () => {
    const tripEmptyNotes = { ...mockTrip, notes: '' };
    const { container } = renderCard(tripEmptyNotes);

    const notesPreview = container.querySelector('[class*="notesPreview"]');
    expect(notesPreview).toBeNull();
  });

  // ── T-164 / Spec 25: Trip Date Range Display ─────────────────────────────

  it('[T-164 25.A] same-year same-month: shows abbreviated "May 1 – 15, 2026"', () => {
    const trip = { ...mockTrip, start_date: '2026-05-01', end_date: '2026-05-15' };
    renderCard(trip);
    // Same month — abbreviated format, month not repeated
    expect(screen.getByText('May 1 \u2013 15, 2026')).toBeDefined();
    // Must NOT repeat the month: "May 1 – May 15, 2026" is wrong
    expect(screen.queryByText(/May 1.*May 15/)).toBeNull();
  });

  it('[T-164 25.B] same-year cross-month: shows "Aug 7 – Sep 2, 2026"', () => {
    const trip = { ...mockTrip, start_date: '2026-08-07', end_date: '2026-09-02' };
    renderCard(trip);
    expect(screen.getByText('Aug 7 \u2013 Sep 2, 2026')).toBeDefined();
  });

  it('[T-164 25.C] cross-year: shows "Dec 28, 2025 – Jan 3, 2026"', () => {
    const trip = { ...mockTrip, start_date: '2025-12-28', end_date: '2026-01-03' };
    renderCard(trip);
    expect(screen.getByText('Dec 28, 2025 \u2013 Jan 3, 2026')).toBeDefined();
  });

  it('[T-164 25.D] both dates null: shows "No dates yet" with datesNotSet class', () => {
    // mockTrip has no start_date/end_date → both null
    const { container } = renderCard();
    const span = container.querySelector('[class*="datesNotSet"]');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('No dates yet');
    // Must NOT show old "dates not set" text
    expect(screen.queryByText('dates not set')).toBeNull();
  });

  it('[T-164 25.E] start date only (no end date): shows "From May 1, 2026"', () => {
    const trip = { ...mockTrip, start_date: '2026-05-01', end_date: null };
    renderCard(trip);
    expect(screen.getByText('From May 1, 2026')).toBeDefined();
  });
});
