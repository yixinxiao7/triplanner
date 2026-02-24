import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatActivityDate,
  formatTime,
  formatDateRange,
} from '../utils/formatDate';

describe('formatTime', () => {
  it('formats 24-hour time to 12-hour AM/PM', () => {
    expect(formatTime('09:00:00')).toMatch(/9:00 AM/i);
    expect(formatTime('14:00:00')).toMatch(/2:00 PM/i);
    expect(formatTime('00:00:00')).toMatch(/12:00 AM/i);
  });

  it('returns empty string for empty input', () => {
    expect(formatTime('')).toBe('');
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
  });
});

describe('formatActivityDate', () => {
  it('formats YYYY-MM-DD to a readable date', () => {
    const result = formatActivityDate('2026-08-08');
    expect(result).toContain('2026');
    expect(result).toContain('Aug');
    expect(result).toContain('8');
  });

  it('includes the day of week', () => {
    const result = formatActivityDate('2026-08-08');
    // Aug 8, 2026 is a Saturday
    expect(result.toLowerCase()).toContain('saturday');
  });

  it('returns empty string for empty input', () => {
    expect(formatActivityDate('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats UTC ISO string to readable date', () => {
    const result = formatDate('2026-08-07T10:00:00.000Z', 'UTC');
    expect(result).toContain('2026');
    expect(result).toContain('Aug');
  });

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});

describe('formatDateRange', () => {
  it('formats a date range with em dash', () => {
    const result = formatDateRange(
      '2026-08-07T10:00:00.000Z',
      '2026-08-14T10:00:00.000Z'
    );
    expect(result).toContain('—');
    expect(result).toContain('2026');
  });

  it('returns null when both dates are missing', () => {
    expect(formatDateRange(null, null)).toBeNull();
    expect(formatDateRange(undefined, undefined)).toBeNull();
  });
});
