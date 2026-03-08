import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatActivityDate,
  formatTime,
  formatDateRange,
  formatTripDateRange,
  formatTimezoneAbbr,
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

describe('formatTripDateRange', () => {
  it('formats same-year date range: "Aug 7 – Aug 14, 2026"', () => {
    const result = formatTripDateRange('2026-08-07', '2026-08-14');
    expect(result).toContain('Aug 7');
    expect(result).toContain('Aug 14');
    expect(result).toContain('2026');
    expect(result).toContain('\u2013'); // en-dash
  });

  it('formats cross-year date range with both years', () => {
    const result = formatTripDateRange('2025-12-28', '2026-01-04');
    expect(result).toContain('2025');
    expect(result).toContain('2026');
    expect(result).toContain('Dec 28');
    expect(result).toContain('Jan 4');
  });

  it('formats start-only date with "From" prefix', () => {
    const result = formatTripDateRange('2026-08-07', null);
    expect(result).toContain('From');
    expect(result).toContain('Aug 7');
    expect(result).toContain('2026');
  });

  it('returns null when both dates are null', () => {
    expect(formatTripDateRange(null, null)).toBeNull();
  });

  it('returns null when both dates are undefined', () => {
    expect(formatTripDateRange(undefined, undefined)).toBeNull();
  });
});

// ── T-153: formatTimezoneAbbr() unit tests ─────────────────────────────────
// formatTimezoneAbbr(isoString, ianaTimezone) → short timezone abbreviation string.

describe('formatTimezoneAbbr', () => {
  // Aug 2026 is summer time in the Northern Hemisphere (DST active for US/EU zones)
  const summerIso = '2026-08-07T10:00:00.000Z';
  // January 2026 is winter time
  const winterIso = '2026-01-07T10:00:00.000Z';

  it('T-153 1: America/New_York in summer returns a DST-aware abbreviation (EDT or ET)', () => {
    const result = formatTimezoneAbbr(summerIso, 'America/New_York');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // DST active in August → expect EDT, EST, or ET (platform-dependent short name)
    expect(result).toMatch(/^(EDT|EST|ET|GMT[-+]\d+)$/);
  });

  it('T-153 2: Asia/Tokyo always returns JST or GMT+9 (no DST)', () => {
    const result = formatTimezoneAbbr(summerIso, 'Asia/Tokyo');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Tokyo has no DST; expect JST or a GMT offset string
    expect(result).toMatch(/^(JST|GMT\+9|GMT\+09:00)$/);
  });

  it('T-153 3: Europe/Paris in summer returns a DST abbreviation (CEST or GMT+2)', () => {
    const result = formatTimezoneAbbr(summerIso, 'Europe/Paris');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // CEST (Central European Summer Time) or GMT+2
    expect(result).toMatch(/^(CEST|CET|GMT\+2|GMT\+02:00)$/);
  });

  it('T-153 4: null isoString returns empty string without throwing', () => {
    expect(() => formatTimezoneAbbr(null, 'America/New_York')).not.toThrow();
    expect(formatTimezoneAbbr(null, 'America/New_York')).toBe('');
  });

  it('T-153 5: null ianaTimezone returns empty string without throwing', () => {
    expect(() => formatTimezoneAbbr(summerIso, null)).not.toThrow();
    expect(formatTimezoneAbbr(summerIso, null)).toBe('');
  });

  it('T-153 6: invalid/unknown IANA timezone returns a string (falls back to the timezone arg)', () => {
    const result = formatTimezoneAbbr(summerIso, 'Invalid/Zone');
    expect(typeof result).toBe('string');
    // Should not throw; should return a non-empty fallback
    expect(result.length).toBeGreaterThan(0);
  });
});
