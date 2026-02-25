import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import CreateTripModal from '../components/CreateTripModal';

function renderModal(props = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...props,
  };
  return render(<CreateTripModal {...defaults} />);
}

describe('CreateTripModal', () => {
  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the modal dialog when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('new trip')).toBeDefined();
  });

  it('renders trip name and destinations inputs', () => {
    renderModal();
    expect(screen.getByLabelText(/TRIP NAME/i)).toBeDefined();
    expect(screen.getByLabelText(/DESTINATIONS/i)).toBeDefined();
  });

  it('shows validation error when trip name is empty on submit', async () => {
    renderModal();
    const submitBtn = screen.getByRole('button', { name: /create trip/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('trip name is required')).toBeDefined();
    });
  });

  it('shows validation error when destinations is empty on submit', async () => {
    renderModal();
    // Fill in name but not destinations
    fireEvent.change(screen.getByLabelText(/TRIP NAME/i), {
      target: { value: 'My Trip' },
    });
    const submitBtn = screen.getByRole('button', { name: /create trip/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('at least one destination is required')).toBeDefined();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when × button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onSubmit with form data when valid (chip input)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText(/TRIP NAME/i), {
      target: { value: 'Japan 2026' },
    });
    // Add destinations via the chip input (type then Enter)
    const destInput = screen.getByLabelText(/add destination/i);
    fireEvent.change(destInput, { target: { value: 'Tokyo' } });
    fireEvent.keyDown(destInput, { key: 'Enter' });
    fireEvent.change(destInput, { target: { value: 'Osaka' } });
    fireEvent.keyDown(destInput, { key: 'Enter' });

    const submitBtn = screen.getByRole('button', { name: /create trip/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Japan 2026',
        destinations: ['Tokyo', 'Osaka'],
      });
    });
  });

  // ── Sprint 4 T-063: Focus return to trigger on close ──
  it('calls onClose when cancel is clicked (focus return handled externally)', () => {
    const onClose = vi.fn();
    const triggerRef = createRef();
    // Create a fake trigger button
    const triggerButton = document.createElement('button');
    triggerButton.textContent = '+ new trip';
    document.body.appendChild(triggerButton);
    triggerRef.current = triggerButton;

    renderModal({ onClose, triggerRef });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();

    document.body.removeChild(triggerButton);
  });

  it('calls onClose when × close button is clicked with triggerRef', () => {
    const onClose = vi.fn();
    const triggerRef = createRef();
    const triggerButton = document.createElement('button');
    triggerButton.textContent = '+ new trip';
    document.body.appendChild(triggerButton);
    triggerRef.current = triggerButton;

    renderModal({ onClose, triggerRef });
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledOnce();

    document.body.removeChild(triggerButton);
  });

  it('accepts triggerRef prop without error', () => {
    const triggerRef = createRef();
    expect(() => {
      renderModal({ triggerRef });
    }).not.toThrow();
  });
});
