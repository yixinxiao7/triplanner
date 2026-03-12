import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TripNotesSection from '../components/TripNotesSection';

// ── Mock the api module ──────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    trips: {
      update: vi.fn(),
    },
  },
}));
import { api } from '../utils/api';

function renderNotes(props = {}) {
  const defaults = {
    tripId: 'trip-001',
    initialNotes: null,
    onSaveSuccess: vi.fn(),
    isLoading: false,
  };
  return render(<TripNotesSection {...defaults} {...props} />);
}

describe('TripNotesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // A. Renders empty state placeholder when notes null
  it('renders empty state placeholder when initialNotes is null', () => {
    renderNotes({ initialNotes: null });
    expect(screen.getByText('Add notes about this trip…')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  // B. Renders existing note text in view mode
  it('renders existing note text in view mode when initialNotes is set', () => {
    renderNotes({ initialNotes: 'Bring sunscreen and extra cash' });
    expect(screen.getByText('Bring sunscreen and extra cash')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  // C. Clicking "Edit notes" button enters edit mode
  it('clicking "Edit notes" pencil button enters edit mode', () => {
    renderNotes({ initialNotes: null });
    const pencilBtn = screen.getByRole('button', { name: /edit trip notes/i });
    fireEvent.click(pencilBtn);
    expect(screen.getByRole('textbox', { name: /trip notes/i })).toBeInTheDocument();
  });

  // D. Textarea pre-filled with current notes in edit mode
  it('textarea is pre-filled with current notes when entering edit mode', () => {
    renderNotes({ initialNotes: 'My existing note' });
    // Use getByTitle to uniquely target the pencil button (notes text also has role="button")
    const pencilBtn = screen.getByTitle('Edit trip notes');
    fireEvent.click(pencilBtn);
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    expect(textarea.value).toBe('My existing note');
  });

  // E. Character count updates as user types
  it('character count updates as user types', () => {
    renderNotes({ initialNotes: null });
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(screen.getByText('11 / 2000')).toBeInTheDocument();
  });

  // F. Save button calls api.trips.update with correct notes value
  it('clicking Save calls api.trips.update with the trimmed notes value', async () => {
    api.trips.update.mockResolvedValue({ data: { data: { id: 'trip-001' } } });
    const onSaveSuccess = vi.fn();
    renderNotes({ initialNotes: null, onSaveSuccess });
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: 'Bring sunscreen' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(api.trips.update).toHaveBeenCalledWith('trip-001', { notes: 'Bring sunscreen' });
    });
    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalled();
    });
  });

  // G. Cancel returns to view mode without saving
  it('clicking Cancel returns to view mode without calling the API', () => {
    renderNotes({ initialNotes: 'Original note' });
    fireEvent.click(screen.getByTitle('Edit trip notes'));
    expect(screen.getByRole('textbox', { name: /trip notes/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(api.trips.update).not.toHaveBeenCalled();
    // Original note still shown
    expect(screen.getByText('Original note')).toBeInTheDocument();
  });

  // H. Clearing all text and saving sets notes to null
  it('saving empty textarea calls api.trips.update with null', async () => {
    api.trips.update.mockResolvedValue({ data: { data: { id: 'trip-001' } } });
    renderNotes({ initialNotes: 'Old note' });
    fireEvent.click(screen.getByTitle('Edit trip notes'));
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(api.trips.update).toHaveBeenCalledWith('trip-001', { notes: null });
    });
  });

  // I. Error state shown when save fails
  it('shows error message when save fails', async () => {
    api.trips.update.mockRejectedValue(new Error('Network error'));
    renderNotes({ initialNotes: null });
    fireEvent.click(screen.getByRole('button', { name: /edit trip notes/i }));
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.change(textarea, { target: { value: 'New note' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/failed to save notes/i)).toBeInTheDocument();
    // Edit mode still open
    expect(screen.getByRole('textbox', { name: /trip notes/i })).toBeInTheDocument();
  });

  // J. Loading state shows skeleton, not content
  it('renders loading skeleton when isLoading is true', () => {
    renderNotes({ isLoading: true });
    expect(screen.queryByText('Add notes about this trip…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit trip notes/i })).not.toBeInTheDocument();
  });

  // K. Escape key cancels edit mode
  it('pressing Escape while in edit mode cancels without saving', () => {
    renderNotes({ initialNotes: 'Note text' });
    fireEvent.click(screen.getByTitle('Edit trip notes'));
    const textarea = screen.getByRole('textbox', { name: /trip notes/i });
    fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(api.trips.update).not.toHaveBeenCalled();
  });

  // L. Clicking placeholder text enters edit mode
  it('clicking placeholder text enters edit mode', () => {
    renderNotes({ initialNotes: null });
    const placeholder = screen.getByText('Add notes about this trip…');
    fireEvent.click(placeholder);
    expect(screen.getByRole('textbox', { name: /trip notes/i })).toBeInTheDocument();
  });

  // M. Section header label shown
  it('renders NOTES section header label', () => {
    renderNotes();
    expect(screen.getByText('NOTES')).toBeInTheDocument();
  });
});
