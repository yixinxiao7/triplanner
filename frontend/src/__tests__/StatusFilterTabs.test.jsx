import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusFilterTabs from '../components/StatusFilterTabs';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render StatusFilterTabs with sensible defaults.
 * activeFilter defaults to "ALL"; onFilterChange defaults to a spy.
 */
function renderTabs({ activeFilter = 'ALL', onFilterChange = vi.fn() } = {}) {
  return {
    onFilterChange,
    ...render(
      <StatusFilterTabs
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    ),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StatusFilterTabs', () => {

  // ── Render ────────────────────────────────────────────────────────────────

  it('renders all four filter pills', () => {
    renderTabs();
    expect(screen.getByRole('button', { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^planning$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^ongoing$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^completed$/i })).toBeDefined();
  });

  it('renders container with role="group" and aria-label', () => {
    const { container } = renderTabs();
    const group = container.querySelector('[role="group"]');
    expect(group).toBeDefined();
    expect(group.getAttribute('aria-label')).toBe('Filter trips by status');
  });

  // ── G: Active pill has aria-pressed=true ──────────────────────────────────

  it('active pill has aria-pressed="true"', () => {
    renderTabs({ activeFilter: 'ALL' });
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('inactive pills have aria-pressed="false"', () => {
    renderTabs({ activeFilter: 'ALL' });
    const planningBtn = screen.getByRole('button', { name: /^planning$/i });
    const ongoingBtn  = screen.getByRole('button', { name: /^ongoing$/i });
    const completedBtn = screen.getByRole('button', { name: /^completed$/i });
    expect(planningBtn.getAttribute('aria-pressed')).toBe('false');
    expect(ongoingBtn.getAttribute('aria-pressed')).toBe('false');
    expect(completedBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates aria-pressed when activeFilter prop changes to PLANNING', () => {
    renderTabs({ activeFilter: 'PLANNING' });
    const planningBtn = screen.getByRole('button', { name: /^planning$/i });
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(planningBtn.getAttribute('aria-pressed')).toBe('true');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates aria-pressed when activeFilter prop is ONGOING', () => {
    renderTabs({ activeFilter: 'ONGOING' });
    expect(screen.getByRole('button', { name: /^ongoing$/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('false');
  });

  it('updates aria-pressed when activeFilter prop is COMPLETED', () => {
    renderTabs({ activeFilter: 'COMPLETED' });
    expect(screen.getByRole('button', { name: /^completed$/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('false');
  });

  // ── Roving tabIndex ───────────────────────────────────────────────────────

  it('active pill has tabIndex=0; others have tabIndex=-1', () => {
    renderTabs({ activeFilter: 'ALL' });
    expect(screen.getByRole('button', { name: /^all$/i }).tabIndex).toBe(0);
    expect(screen.getByRole('button', { name: /^planning$/i }).tabIndex).toBe(-1);
    expect(screen.getByRole('button', { name: /^ongoing$/i }).tabIndex).toBe(-1);
    expect(screen.getByRole('button', { name: /^completed$/i }).tabIndex).toBe(-1);
  });

  it('active pill is the PLANNING pill when activeFilter=PLANNING', () => {
    renderTabs({ activeFilter: 'PLANNING' });
    expect(screen.getByRole('button', { name: /^planning$/i }).tabIndex).toBe(0);
    expect(screen.getByRole('button', { name: /^all$/i }).tabIndex).toBe(-1);
  });

  // ── Click / onFilterChange ────────────────────────────────────────────────

  it('calls onFilterChange("PLANNING") when Planning pill is clicked', () => {
    const { onFilterChange } = renderTabs({ activeFilter: 'ALL' });
    fireEvent.click(screen.getByRole('button', { name: /^planning$/i }));
    expect(onFilterChange).toHaveBeenCalledWith('PLANNING');
  });

  it('calls onFilterChange("ONGOING") when Ongoing pill is clicked', () => {
    const { onFilterChange } = renderTabs({ activeFilter: 'ALL' });
    fireEvent.click(screen.getByRole('button', { name: /^ongoing$/i }));
    expect(onFilterChange).toHaveBeenCalledWith('ONGOING');
  });

  it('calls onFilterChange("COMPLETED") when Completed pill is clicked', () => {
    const { onFilterChange } = renderTabs({ activeFilter: 'ALL' });
    fireEvent.click(screen.getByRole('button', { name: /^completed$/i }));
    expect(onFilterChange).toHaveBeenCalledWith('COMPLETED');
  });

  it('calls onFilterChange("ALL") when All pill is clicked from another filter', () => {
    const { onFilterChange } = renderTabs({ activeFilter: 'PLANNING' });
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));
    expect(onFilterChange).toHaveBeenCalledWith('ALL');
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────

  it('ArrowRight on All pill moves focus to Planning pill', () => {
    renderTabs({ activeFilter: 'ALL' });
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    const planningBtn = screen.getByRole('button', { name: /^planning$/i });

    allBtn.focus();
    fireEvent.keyDown(allBtn, { key: 'ArrowRight' });

    // jsdom tracks focus via document.activeElement
    expect(document.activeElement).toBe(planningBtn);
  });

  it('ArrowRight on Completed pill wraps focus back to All pill', () => {
    renderTabs({ activeFilter: 'COMPLETED' });
    const completedBtn = screen.getByRole('button', { name: /^completed$/i });
    const allBtn = screen.getByRole('button', { name: /^all$/i });

    completedBtn.focus();
    fireEvent.keyDown(completedBtn, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(allBtn);
  });

  it('ArrowLeft on Planning pill moves focus to All pill', () => {
    renderTabs({ activeFilter: 'PLANNING' });
    const planningBtn = screen.getByRole('button', { name: /^planning$/i });
    const allBtn = screen.getByRole('button', { name: /^all$/i });

    planningBtn.focus();
    fireEvent.keyDown(planningBtn, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(allBtn);
  });

  it('ArrowLeft on All pill wraps focus to Completed pill', () => {
    renderTabs({ activeFilter: 'ALL' });
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    const completedBtn = screen.getByRole('button', { name: /^completed$/i });

    allBtn.focus();
    fireEvent.keyDown(allBtn, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(completedBtn);
  });

  it('ArrowRight does not call onFilterChange (only moves focus)', () => {
    const { onFilterChange } = renderTabs({ activeFilter: 'ALL' });
    const allBtn = screen.getByRole('button', { name: /^all$/i });

    allBtn.focus();
    fireEvent.keyDown(allBtn, { key: 'ArrowRight' });

    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('unrelated keys do not move focus or call onFilterChange', () => {
    const { onFilterChange } = renderTabs({ activeFilter: 'ALL' });
    const allBtn = screen.getByRole('button', { name: /^all$/i });

    allBtn.focus();
    fireEvent.keyDown(allBtn, { key: 'Tab' });

    expect(document.activeElement).toBe(allBtn);
    expect(onFilterChange).not.toHaveBeenCalled();
  });
});
