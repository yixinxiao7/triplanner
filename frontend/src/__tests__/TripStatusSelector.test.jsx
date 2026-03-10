/**
 * TripStatusSelector — render and interaction tests
 * Sprint 22 — T-196
 *
 * Tests cover:
 *   - Rendering each status badge correctly
 *   - Opening the dropdown on click
 *   - Checkmark on selected option
 *   - Selecting the same status makes no API call
 *   - Successful status change calls onStatusChange and updates badge
 *   - API error shows toast and reverts to previous status
 *   - Escape key closes dropdown without changes
 *   - Unknown/fallback status renders safely
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TripStatusSelector from '../components/TripStatusSelector';

// Mock the API module
vi.mock('../utils/api', () => ({
  api: {
    trips: {
      update: vi.fn(),
    },
  },
}));

import { api } from '../utils/api';

const TRIP_ID = 'test-trip-uuid-001';

function renderSelector(initialStatus = 'PLANNING', onStatusChange = vi.fn()) {
  return render(
    <TripStatusSelector
      tripId={TRIP_ID}
      initialStatus={initialStatus}
      onStatusChange={onStatusChange}
    />
  );
}

describe('TripStatusSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Render: badge view mode ───────────────────────────────

  it('renders PLANNING badge in view mode', () => {
    renderSelector('PLANNING');
    const badge = screen.getByRole('button', { name: /Trip status: PLANNING/i });
    expect(badge).toBeDefined();
    expect(screen.getByText('PLANNING')).toBeDefined();
  });

  it('renders ONGOING badge in view mode', () => {
    renderSelector('ONGOING');
    const badge = screen.getByRole('button', { name: /Trip status: ONGOING/i });
    expect(badge).toBeDefined();
    expect(screen.getByText('ONGOING')).toBeDefined();
  });

  it('renders COMPLETED badge in view mode', () => {
    renderSelector('COMPLETED');
    const badge = screen.getByRole('button', { name: /Trip status: COMPLETED/i });
    expect(badge).toBeDefined();
    expect(screen.getByText('COMPLETED')).toBeDefined();
  });

  it('renders unknown status text safely (falls back to COMPLETED styles)', () => {
    renderSelector('UNKNOWN_STATUS');
    // Badge renders the raw string
    expect(screen.getByText('UNKNOWN_STATUS')).toBeDefined();
  });

  it('dropdown is not visible initially', () => {
    renderSelector('PLANNING');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  // ── Dropdown open ─────────────────────────────────────────

  it('opens dropdown when badge is clicked', () => {
    renderSelector('PLANNING');
    const badge = screen.getByRole('button', { name: /Trip status: PLANNING/i });
    fireEvent.click(badge);
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('shows all three status options in dropdown', () => {
    renderSelector('PLANNING');
    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts.join(' ')).toMatch(/PLANNING/);
    expect(optionTexts.join(' ')).toMatch(/ONGOING/);
    expect(optionTexts.join(' ')).toMatch(/COMPLETED/);
  });

  it('marks current status option as aria-selected', () => {
    renderSelector('ONGOING');
    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const ongoingOption = options.find((o) => o.textContent.includes('ONGOING'));
    expect(ongoingOption?.getAttribute('aria-selected')).toBe('true');
  });

  it('shows checkmark (✓) only on the currently selected option', () => {
    renderSelector('PLANNING');
    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    // There should be exactly one checkmark in the dropdown
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(1);
  });

  // ── Escape key closes dropdown ────────────────────────────

  it('closes dropdown on Escape key', () => {
    renderSelector('PLANNING');
    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(screen.getByRole('button', { name: /Trip status/i }), {
      key: 'Escape',
      code: 'Escape',
    });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  // ── Same status: no API call ──────────────────────────────

  it('does not call api.trips.update when same status is selected', async () => {
    renderSelector('PLANNING');
    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const planningOption = options.find((o) => o.textContent.includes('PLANNING'));
    fireEvent.click(planningOption);
    expect(api.trips.update).not.toHaveBeenCalled();
  });

  // ── Successful status change ──────────────────────────────

  it('calls api.trips.update with new status on selection', async () => {
    api.trips.update.mockResolvedValueOnce({
      data: { data: { id: TRIP_ID, status: 'ONGOING' } },
    });
    const onStatusChange = vi.fn();
    renderSelector('PLANNING', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const ongoingOption = options.find((o) => o.textContent.includes('ONGOING'));
    fireEvent.click(ongoingOption);

    await waitFor(() => {
      expect(api.trips.update).toHaveBeenCalledWith(TRIP_ID, { status: 'ONGOING' });
    });
  });

  it('invokes onStatusChange callback after successful PATCH', async () => {
    api.trips.update.mockResolvedValueOnce({
      data: { data: { id: TRIP_ID, status: 'COMPLETED' } },
    });
    const onStatusChange = vi.fn();
    renderSelector('PLANNING', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const completedOption = options.find((o) => o.textContent.includes('COMPLETED'));
    fireEvent.click(completedOption);

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('COMPLETED');
    });
  });

  it('optimistically updates badge to new status before API responds', async () => {
    // Slow promise that we resolve manually
    let resolveUpdate;
    api.trips.update.mockReturnValueOnce(
      new Promise((resolve) => { resolveUpdate = resolve; })
    );

    renderSelector('PLANNING');
    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const ongoingOption = options.find((o) => o.textContent.includes('ONGOING'));
    fireEvent.click(ongoingOption);

    // Badge should optimistically show ONGOING before API settles
    expect(screen.getByText('ONGOING')).toBeDefined();

    // Clean up
    await act(async () => {
      resolveUpdate({ data: { data: { id: TRIP_ID, status: 'ONGOING' } } });
    });
  });

  // ── API error: revert + toast ─────────────────────────────

  it('reverts to previous status on API error', async () => {
    api.trips.update.mockRejectedValueOnce(new Error('Network error'));
    renderSelector('PLANNING');

    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const ongoingOption = options.find((o) => o.textContent.includes('ONGOING'));
    fireEvent.click(ongoingOption);

    await waitFor(() => {
      // Should revert back to PLANNING
      expect(screen.getByText('PLANNING')).toBeDefined();
    });
  });

  it('shows error toast when API call fails', async () => {
    api.trips.update.mockRejectedValueOnce(new Error('Server error'));
    renderSelector('PLANNING');

    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const ongoingOption = options.find((o) => o.textContent.includes('ONGOING'));
    fireEvent.click(ongoingOption);

    await waitFor(() => {
      const toast = screen.getByRole('alert');
      expect(toast).toBeDefined();
      expect(toast.textContent).toMatch(/Failed to update trip status/i);
    });
  });

  it('does not call onStatusChange when API call fails', async () => {
    api.trips.update.mockRejectedValueOnce(new Error('Server error'));
    const onStatusChange = vi.fn();
    renderSelector('PLANNING', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: /Trip status/i }));
    const options = screen.getAllByRole('option');
    const ongoingOption = options.find((o) => o.textContent.includes('ONGOING'));
    fireEvent.click(ongoingOption);

    await waitFor(() => {
      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  // ── Accessibility ─────────────────────────────────────────

  it('badge has aria-haspopup="listbox"', () => {
    renderSelector('PLANNING');
    const badge = screen.getByRole('button', { name: /Trip status/i });
    expect(badge.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('badge aria-expanded is false when dropdown closed', () => {
    renderSelector('PLANNING');
    const badge = screen.getByRole('button', { name: /Trip status/i });
    expect(badge.getAttribute('aria-expanded')).toBe('false');
  });

  it('badge aria-expanded is true when dropdown open', () => {
    renderSelector('PLANNING');
    const badge = screen.getByRole('button', { name: /Trip status/i });
    fireEvent.click(badge);
    expect(badge.getAttribute('aria-expanded')).toBe('true');
  });

  it('aria-label includes current status name', () => {
    renderSelector('ONGOING');
    const badge = screen.getByRole('button', { name: /Trip status: ONGOING/i });
    expect(badge).toBeDefined();
  });

  // ── initialStatus sync ────────────────────────────────────

  it('syncs currentStatus when initialStatus prop changes (not loading)', () => {
    const { rerender } = renderSelector('PLANNING');
    expect(screen.getByText('PLANNING')).toBeDefined();

    rerender(
      <TripStatusSelector
        tripId={TRIP_ID}
        initialStatus="COMPLETED"
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.getByText('COMPLETED')).toBeDefined();
  });
});
