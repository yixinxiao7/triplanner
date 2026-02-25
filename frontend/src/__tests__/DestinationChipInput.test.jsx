import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DestinationChipInput from '../components/DestinationChipInput';

function renderChipInput(props = {}) {
  const defaults = {
    destinations: [],
    onChange: vi.fn(),
    disabled: false,
    error: null,
    ...props,
  };
  return { ...render(<DestinationChipInput {...defaults} />), onChange: defaults.onChange };
}

describe('DestinationChipInput', () => {
  it('renders with placeholder when no destinations', () => {
    renderChipInput({ placeholder: 'Add a destination...' });
    expect(screen.getByPlaceholderText('Add a destination...')).toBeDefined();
  });

  it('renders destination chips', () => {
    renderChipInput({ destinations: ['Tokyo', 'Osaka'] });
    expect(screen.getByText('Tokyo')).toBeDefined();
    expect(screen.getByText('Osaka')).toBeDefined();
  });

  it('calls onChange when Enter is pressed with text', () => {
    const { onChange } = renderChipInput({ destinations: ['Tokyo'] });
    const input = screen.getByLabelText(/add destination/i);
    fireEvent.change(input, { target: { value: 'Kyoto' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Tokyo', 'Kyoto']);
  });

  it('calls onChange when comma is pressed with text', () => {
    const { onChange } = renderChipInput({ destinations: [] });
    const input = screen.getByLabelText(/add destination/i);
    fireEvent.change(input, { target: { value: 'Paris' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['Paris']);
  });

  it('does not add duplicate destinations (case-insensitive)', () => {
    const { onChange } = renderChipInput({ destinations: ['Tokyo'] });
    const input = screen.getByLabelText(/add destination/i);
    fireEvent.change(input, { target: { value: 'tokyo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add empty destinations', () => {
    const { onChange } = renderChipInput({ destinations: [] });
    const input = screen.getByLabelText(/add destination/i);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes last destination on Backspace when input is empty', () => {
    const { onChange } = renderChipInput({ destinations: ['Tokyo', 'Osaka'] });
    const input = screen.getByLabelText(/add destination/i);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['Tokyo']);
  });

  it('renders remove button for each chip when not disabled', () => {
    renderChipInput({ destinations: ['Tokyo', 'Osaka'] });
    expect(screen.getByLabelText('Remove Tokyo')).toBeDefined();
    expect(screen.getByLabelText('Remove Osaka')).toBeDefined();
  });

  it('calls onChange when chip remove button is clicked', () => {
    const { onChange } = renderChipInput({ destinations: ['Tokyo', 'Osaka'] });
    fireEvent.click(screen.getByLabelText('Remove Tokyo'));
    expect(onChange).toHaveBeenCalledWith(['Osaka']);
  });

  it('does not render remove buttons when disabled', () => {
    renderChipInput({ destinations: ['Tokyo'], disabled: true });
    expect(screen.queryByLabelText('Remove Tokyo')).toBeNull();
  });

  it('shows error message when error prop is set', () => {
    renderChipInput({ error: 'at least one destination is required' });
    expect(screen.getByText('at least one destination is required')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('clears input on Escape key', () => {
    renderChipInput();
    const input = screen.getByLabelText(/add destination/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });

  it('has destinations group with aria-label', () => {
    renderChipInput({ destinations: ['Tokyo'] });
    expect(screen.getByRole('group', { name: /destinations/i })).toBeDefined();
  });

  // ── Sprint 4 T-061: ARIA role hierarchy fix ──
  it('chips do not have role="option" (T-061 ARIA fix)', () => {
    const { container } = renderChipInput({ destinations: ['Tokyo', 'Osaka'] });
    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(0);
  });

  it('container has role="group" (not role="listbox")', () => {
    renderChipInput({ destinations: ['Tokyo'] });
    const group = screen.getByRole('group', { name: /destinations/i });
    expect(group).toBeDefined();
  });

  // ── Sprint 4 T-062: dest-chip-hint element exists ──
  it('renders hint element with id="dest-chip-hint"', () => {
    const { container } = renderChipInput();
    const hint = container.querySelector('#dest-chip-hint');
    expect(hint).not.toBeNull();
    expect(hint.textContent).toBe('type a destination and press enter');
  });

  it('input has aria-describedby pointing to dest-chip-hint when no error', () => {
    renderChipInput();
    const input = screen.getByLabelText(/add destination/i);
    expect(input.getAttribute('aria-describedby')).toBe('dest-chip-hint');
  });

  it('input has aria-describedby pointing to dest-chip-error when error is set', () => {
    renderChipInput({ error: 'error message' });
    const input = screen.getByLabelText(/add destination/i);
    expect(input.getAttribute('aria-describedby')).toBe('dest-chip-error');
  });
});
