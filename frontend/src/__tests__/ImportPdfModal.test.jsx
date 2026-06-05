import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportPdfModal from '../components/ImportPdfModal';

function renderModal(props = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...props,
  };
  return render(<ImportPdfModal {...defaults} />);
}

/** Build a File whose `.size` reports `bytes` without allocating that much memory. */
function makeFile(name, type, bytes) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

describe('ImportPdfModal', () => {
  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the modal dialog when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('import from PDF')).toBeDefined();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the × button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps submit disabled until a valid PDF is chosen', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /parse itinerary/i }).disabled).toBe(true);
  });

  it('accepts a valid PDF and enables submit', () => {
    renderModal();
    const input = screen.getByLabelText(/ITINERARY PDF/i);
    fireEvent.change(input, {
      target: { files: [makeFile('trip.pdf', 'application/pdf', 1024)] },
    });
    expect(screen.getByText('trip.pdf')).toBeDefined();
    expect(screen.getByRole('button', { name: /parse itinerary/i }).disabled).toBe(false);
  });

  it('rejects a non-PDF file with an error and keeps submit disabled', () => {
    renderModal();
    const input = screen.getByLabelText(/ITINERARY PDF/i);
    fireEvent.change(input, {
      target: { files: [makeFile('photo.png', 'image/png', 1024)] },
    });
    expect(screen.getByText(/please choose a PDF file/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /parse itinerary/i }).disabled).toBe(true);
  });

  it('rejects a PDF larger than 10MB', () => {
    renderModal();
    const input = screen.getByLabelText(/ITINERARY PDF/i);
    fireEvent.change(input, {
      target: { files: [makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024)] },
    });
    expect(screen.getByText(/too large/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /parse itinerary/i }).disabled).toBe(true);
  });

  it('calls onSubmit with the file when submitted with a valid PDF', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });
    const file = makeFile('trip.pdf', 'application/pdf', 2048);
    fireEvent.change(screen.getByLabelText(/ITINERARY PDF/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: /parse itinerary/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(file);
    });
  });

  it('shows a generic error banner when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText(/ITINERARY PDF/i), {
      target: { files: [makeFile('trip.pdf', 'application/pdf', 2048)] },
    });
    fireEvent.click(screen.getByRole('button', { name: /parse itinerary/i }));
    await waitFor(() => {
      expect(screen.getByText(/could not read the itinerary/i)).toBeDefined();
    });
  });
});
