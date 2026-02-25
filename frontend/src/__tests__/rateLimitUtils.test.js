import { describe, it, expect } from 'vitest';
import { parseRetryAfterMinutes } from '../utils/rateLimitUtils';

describe('parseRetryAfterMinutes', () => {
  it('parses Retry-After seconds into minutes (rounded up)', () => {
    expect(parseRetryAfterMinutes('840')).toBe(14);
  });

  it('rounds up partial minutes', () => {
    expect(parseRetryAfterMinutes('61')).toBe(2);
    expect(parseRetryAfterMinutes('59')).toBe(1);
    expect(parseRetryAfterMinutes('1')).toBe(1);
  });

  it('returns 1 for exactly 60 seconds', () => {
    expect(parseRetryAfterMinutes('60')).toBe(1);
  });

  it('returns null for null/undefined input', () => {
    expect(parseRetryAfterMinutes(null)).toBeNull();
    expect(parseRetryAfterMinutes(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseRetryAfterMinutes('')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(parseRetryAfterMinutes('abc')).toBeNull();
    expect(parseRetryAfterMinutes('not-a-number')).toBeNull();
  });

  it('returns null for zero seconds', () => {
    expect(parseRetryAfterMinutes('0')).toBeNull();
  });

  it('returns null for negative seconds', () => {
    expect(parseRetryAfterMinutes('-100')).toBeNull();
  });

  it('handles large values correctly', () => {
    expect(parseRetryAfterMinutes('900')).toBe(15);
    expect(parseRetryAfterMinutes('3600')).toBe(60);
  });
});
