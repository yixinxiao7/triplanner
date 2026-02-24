import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders PLANNING status', () => {
    render(<StatusBadge status="PLANNING" />);
    expect(screen.getByText('PLANNING')).toBeDefined();
  });

  it('renders ONGOING status', () => {
    render(<StatusBadge status="ONGOING" />);
    expect(screen.getByText('ONGOING')).toBeDefined();
  });

  it('renders COMPLETED status', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('COMPLETED')).toBeDefined();
  });

  it('defaults to PLANNING for unknown status', () => {
    render(<StatusBadge status="UNKNOWN" />);
    expect(screen.getByText('PLANNING')).toBeDefined();
  });
});
