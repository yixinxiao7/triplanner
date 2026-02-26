import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptySearchResults from '../components/EmptySearchResults';

describe('EmptySearchResults', () => {
  const defaultProps = {
    search: '',
    status: '',
    onClearFilters: vi.fn(),
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  it('renders the "no trips found" heading', () => {
    render(<EmptySearchResults {...defaultProps} />);
    // Both heading and subtext say "no trips found" when no filters — use role
    expect(screen.getByRole('heading', { name: 'no trips found' })).toBeDefined();
  });

  it('renders a "clear filters" button', () => {
    render(<EmptySearchResults {...defaultProps} />);
    expect(screen.getByLabelText('Clear all filters')).toBeDefined();
    expect(screen.getByText('clear filters')).toBeDefined();
  });

  // ── Dynamic Subtext ─────────────────────────────────────────────────────────
  it('shows search-only subtext when only search is active', () => {
    render(<EmptySearchResults {...defaultProps} search="tokyo" />);
    expect(screen.getByText(/no trips match/)).toBeDefined();
    expect(screen.getByText(/tokyo/)).toBeDefined();
  });

  it('shows status-only subtext when only status is active', () => {
    render(<EmptySearchResults {...defaultProps} status="PLANNING" />);
    expect(screen.getByText('no planning trips')).toBeDefined();
  });

  it('shows combined subtext when both search and status are active', () => {
    render(<EmptySearchResults {...defaultProps} search="tokyo" status="COMPLETED" />);
    expect(screen.getByText(/no completed trips match/)).toBeDefined();
    expect(screen.getByText(/tokyo/)).toBeDefined();
  });

  it('truncates long search terms at 30 characters with ellipsis', () => {
    const longSearch = 'this is a very long search term that exceeds thirty characters';
    render(<EmptySearchResults {...defaultProps} search={longSearch} />);
    // The truncated text should contain "..." (ellipsis character)
    const subtext = screen.getByText(/no trips match/);
    expect(subtext.textContent).toContain('\u2026');
    expect(subtext.textContent.length).toBeLessThan(longSearch.length + 20);
  });

  it('shows fallback text when neither search nor status is active', () => {
    render(<EmptySearchResults {...defaultProps} />);
    // Subtext should still show "no trips found"
    const subtexts = screen.getAllByText('no trips found');
    expect(subtexts.length).toBeGreaterThanOrEqual(1);
  });

  // ── Clear Filters ───────────────────────────────────────────────────────────
  it('calls onClearFilters when clear filters button is clicked', () => {
    const onClear = vi.fn();
    render(<EmptySearchResults {...defaultProps} onClearFilters={onClear} />);

    fireEvent.click(screen.getByText('clear filters'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
