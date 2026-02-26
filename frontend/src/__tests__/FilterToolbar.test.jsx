import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FilterToolbar from '../components/FilterToolbar';

describe('FilterToolbar', () => {
  const defaultProps = {
    search: '',
    status: '',
    sort: 'created_at:desc',
    onSearchChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSortChange: vi.fn(),
    onClearFilters: vi.fn(),
    hasActiveFilters: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  it('renders search input, status filter, and sort selector', () => {
    render(<FilterToolbar {...defaultProps} />);

    expect(screen.getByLabelText('Search trips by name or destination')).toBeDefined();
    expect(screen.getByLabelText('Filter by status')).toBeDefined();
    expect(screen.getByLabelText('Sort trips')).toBeDefined();
  });

  it('has role="search" on the toolbar container', () => {
    render(<FilterToolbar {...defaultProps} />);
    expect(screen.getByRole('search')).toBeDefined();
  });

  it('renders sr-only search hint', () => {
    render(<FilterToolbar {...defaultProps} />);
    expect(document.getElementById('search-hint')).toBeDefined();
    expect(document.getElementById('search-hint').textContent).toBe('results update as you type');
  });

  // ── Search Input ────────────────────────────────────────────────────────────
  it('calls onSearchChange after 300ms debounce when typing', () => {
    render(<FilterToolbar {...defaultProps} />);

    const input = screen.getByLabelText('Search trips by name or destination');
    fireEvent.change(input, { target: { value: 'tokyo' } });

    // Not called yet (debounce pending)
    expect(defaultProps.onSearchChange).not.toHaveBeenCalled();

    // Advance 300ms
    act(() => vi.advanceTimersByTime(300));

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('tokyo');
  });

  it('calls onSearchChange immediately when input is cleared', () => {
    render(<FilterToolbar {...defaultProps} search="tokyo" />);

    const input = screen.getByLabelText('Search trips by name or destination');
    fireEvent.change(input, { target: { value: '' } });

    // Called immediately — no debounce for clearing
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('shows clear search button when input has text', () => {
    render(<FilterToolbar {...defaultProps} search="tokyo" />);

    const clearBtn = screen.getByLabelText('Clear search');
    expect(clearBtn).toBeDefined();
  });

  it('hides clear search button when input is empty', () => {
    render(<FilterToolbar {...defaultProps} search="" />);

    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('clears search input when clear button is clicked', () => {
    render(<FilterToolbar {...defaultProps} search="tokyo" />);

    fireEvent.click(screen.getByLabelText('Clear search'));

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('clears search on Escape key', () => {
    render(<FilterToolbar {...defaultProps} search="test" />);

    const input = screen.getByLabelText('Search trips by name or destination');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('trims whitespace from search input before calling onSearchChange', () => {
    render(<FilterToolbar {...defaultProps} />);

    const input = screen.getByLabelText('Search trips by name or destination');
    fireEvent.change(input, { target: { value: '  tokyo  ' } });

    act(() => vi.advanceTimersByTime(300));

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('tokyo');
  });

  // ── Status Filter ───────────────────────────────────────────────────────────
  it('calls onStatusChange when status dropdown changes', () => {
    render(<FilterToolbar {...defaultProps} />);

    const select = screen.getByLabelText('Filter by status');
    fireEvent.change(select, { target: { value: 'PLANNING' } });

    expect(defaultProps.onStatusChange).toHaveBeenCalledWith('PLANNING');
  });

  it('has all four status options', () => {
    render(<FilterToolbar {...defaultProps} />);

    const select = screen.getByLabelText('Filter by status');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(4);
    expect(options[0].textContent).toBe('all statuses');
    expect(options[1].textContent).toBe('planning');
    expect(options[2].textContent).toBe('ongoing');
    expect(options[3].textContent).toBe('completed');
  });

  // ── Sort Selector ───────────────────────────────────────────────────────────
  it('calls onSortChange when sort dropdown changes', () => {
    render(<FilterToolbar {...defaultProps} />);

    const select = screen.getByLabelText('Sort trips');
    fireEvent.change(select, { target: { value: 'name:asc' } });

    expect(defaultProps.onSortChange).toHaveBeenCalledWith('name:asc');
  });

  it('has six sort options', () => {
    render(<FilterToolbar {...defaultProps} />);

    const select = screen.getByLabelText('Sort trips');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(6);
    expect(options[0].textContent).toBe('newest first');
    expect(options[2].textContent).toContain('name A');
  });

  // ── Clear Filters Button ────────────────────────────────────────────────────
  it('shows clear filters button when hasActiveFilters is true', () => {
    render(<FilterToolbar {...defaultProps} hasActiveFilters={true} />);

    expect(screen.getByLabelText('Clear all filters and sorting')).toBeDefined();
    expect(screen.getByText('clear filters')).toBeDefined();
  });

  it('hides clear filters button when hasActiveFilters is false', () => {
    render(<FilterToolbar {...defaultProps} hasActiveFilters={false} />);

    expect(screen.queryByText('clear filters')).toBeNull();
  });

  it('calls onClearFilters when clear filters button is clicked', () => {
    render(<FilterToolbar {...defaultProps} hasActiveFilters={true} />);

    fireEvent.click(screen.getByText('clear filters'));

    expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
  });
});
