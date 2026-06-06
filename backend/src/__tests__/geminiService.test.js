import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock @google/generative-ai ───────────────────────────────────────────────
// generateContent is a per-test programmable mock. getGenerativeModel records the
// model name passed so we can assert the 429 fallback chain walks in order.
const generateContent = vi.fn();
const getGenerativeModel = vi.fn(() => ({ generateContent }));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(function () {
    this.getGenerativeModel = getGenerativeModel;
  }),
  // The service references SchemaType for its responseSchema; provide a stub.
  SchemaType: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
  },
}));

import GeminiService, {
  MODEL_FALLBACK_CHAIN,
  isRateLimitError,
  parseItineraryResponse,
  consolidateStays,
  PROMPT,
} from '../services/geminiService.js';

/** Build a fake Gemini SDK response whose .response.text() returns `text`. */
function modelResponse(text) {
  return { response: { text: () => text } };
}

const VALID_CONTRACT = JSON.stringify({
  trip: {
    name: 'Japan 2026',
    destinations: ['Tokyo', 'Osaka'],
    start_date: '2026-08-07',
    end_date: '2026-08-14',
    notes: null,
  },
  flights: [
    {
      flight_number: 'AA100',
      airline: 'American',
      from_location: 'JFK',
      to_location: 'HND',
      departure_at: '2026-08-07T06:50:00-04:00',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-08T11:00:00+09:00',
      arrival_tz: 'Asia/Tokyo',
    },
  ],
  stays: [],
  activities: [],
  land_travels: [],
});

const PDF_BUFFER = Buffer.from('%PDF-1.4 fake');

describe('geminiService — isRateLimitError', () => {
  it('detects err.status === 429', () => {
    expect(isRateLimitError({ status: 429 })).toBe(true);
  });
  it('detects "429" in message', () => {
    expect(isRateLimitError(new Error('Got 429 Too Many Requests'))).toBe(true);
  });
  it('returns false for other errors', () => {
    expect(isRateLimitError(new Error('boom'))).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});

describe('geminiService — PROMPT', () => {
  // Regression for bug-024: a 6/3–6/5 hotel stay was parsed into 3 per-day entries
  // because the prompt never told the model to consolidate continuous bookings.
  it('instructs the model to consolidate multi-day stays into one entry', () => {
    expect(PROMPT).toMatch(/do NOT split by day/i);
    expect(PROMPT).toMatch(/NEVER create one stay entry per night/i);
  });

  it('instructs the model to consolidate continuous multi-day ground transport', () => {
    expect(PROMPT).toMatch(/rental car/i);
    expect(PROMPT).toMatch(/not one\s+entry per day/i);
  });

  // Regression for bug-025: prose flights with no flight number / tz were dropped
  // because required fields couldn't be satisfied under the "don't invent" rule.
  it('instructs the model to capture prose flights and not drop them for missing fields', () => {
    expect(PROMPT).toMatch(/narrative\/prose/i);
    expect(PROMPT).toMatch(/Do NOT drop a flight/i);
    expect(PROMPT).toMatch(/set it to "TBD"/i);
    expect(PROMPT).toMatch(/date from the day\/section heading/i);
  });

  // Guards against region overfitting: the city->timezone guidance must show
  // multiple regions (not India-only) so the model reads it as a general rule.
  it('uses multi-region timezone examples, not a single locale', () => {
    expect(PROMPT).toMatch(/Asia\/Tokyo/);
    expect(PROMPT).toMatch(/America\/New_York/);
    expect(PROMPT).toMatch(/Asia\/Kolkata/);
  });
});

describe('geminiService — consolidateStays (bug-024 safety net)', () => {
  const stay = (over) => ({
    category: 'HOTEL', name: 'Hotel Nikko', address: null,
    check_in_at: '', check_in_tz: 'Asia/Tokyo',
    check_out_at: '', check_out_tz: 'Asia/Tokyo', ...over,
  });

  it('merges a per-night split of the same hotel into one spanning stay', () => {
    // The reported case: 6/3–6/5 emitted as 3 single-day entries.
    const split = [
      stay({ check_in_at: '2026-06-03T15:00:00+09:00', check_out_at: '2026-06-04T11:00:00+09:00' }),
      stay({ check_in_at: '2026-06-04T15:00:00+09:00', check_out_at: '2026-06-05T11:00:00+09:00' }),
      stay({ check_in_at: '2026-06-05T15:00:00+09:00', check_out_at: '2026-06-06T11:00:00+09:00' }),
    ];
    const result = consolidateStays(split);
    expect(result).toHaveLength(1);
    expect(result[0].check_in_at).toBe('2026-06-03T15:00:00+09:00');
    expect(result[0].check_out_at).toBe('2026-06-06T11:00:00+09:00');
  });

  it('merges single-day-per-night entries (check_in == check_out per day)', () => {
    const split = [
      stay({ check_in_at: '2026-06-03T00:00:00+09:00', check_out_at: '2026-06-03T00:00:00+09:00' }),
      stay({ check_in_at: '2026-06-04T00:00:00+09:00', check_out_at: '2026-06-04T00:00:00+09:00' }),
      stay({ check_in_at: '2026-06-05T00:00:00+09:00', check_out_at: '2026-06-05T00:00:00+09:00' }),
    ];
    const result = consolidateStays(split);
    expect(result).toHaveLength(1);
    expect(result[0].check_out_at).toBe('2026-06-05T00:00:00+09:00');
  });

  it('does NOT merge two different hotels', () => {
    const result = consolidateStays([
      stay({ name: 'Hotel A', check_in_at: '2026-06-03T15:00:00+09:00', check_out_at: '2026-06-04T11:00:00+09:00' }),
      stay({ name: 'Hotel B', check_in_at: '2026-06-04T15:00:00+09:00', check_out_at: '2026-06-05T11:00:00+09:00' }),
    ]);
    expect(result).toHaveLength(2);
  });

  it('does NOT merge same hotel with a multi-day gap (separate bookings)', () => {
    const result = consolidateStays([
      stay({ check_in_at: '2026-06-03T15:00:00+09:00', check_out_at: '2026-06-04T11:00:00+09:00' }),
      stay({ check_in_at: '2026-06-10T15:00:00+09:00', check_out_at: '2026-06-12T11:00:00+09:00' }),
    ]);
    expect(result).toHaveLength(2);
  });

  it('passes through 0/1-entry lists unchanged', () => {
    expect(consolidateStays([])).toEqual([]);
    const one = [stay({ check_in_at: '2026-06-03T15:00:00+09:00', check_out_at: '2026-06-05T11:00:00+09:00' })];
    expect(consolidateStays(one)).toHaveLength(1);
  });
});

describe('geminiService — parseItineraryResponse (defensive parser)', () => {
  it('coerces missing arrays to [] and nulls missing optionals', () => {
    const result = parseItineraryResponse(JSON.stringify({ trip: { name: 'T', destinations: ['X'] } }));
    expect(result.flights).toEqual([]);
    expect(result.stays).toEqual([]);
    expect(result.activities).toEqual([]);
    expect(result.land_travels).toEqual([]);
    expect(result.trip.start_date).toBeNull();
    expect(result.trip.notes).toBeNull();
  });

  it('extracts JSON wrapped in markdown fences / stray prose', () => {
    const wrapped = 'Here you go:\n```json\n' + VALID_CONTRACT + '\n```';
    const result = parseItineraryResponse(wrapped);
    expect(result.trip.name).toBe('Japan 2026');
    expect(result.flights).toHaveLength(1);
  });

  it('returns null when there is no trip object', () => {
    expect(parseItineraryResponse(JSON.stringify({ flights: [] }))).toBeNull();
  });

  it('returns null for non-JSON garbage', () => {
    expect(parseItineraryResponse('not json at all')).toBeNull();
  });
});

describe('geminiService — parseItineraryFromPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valid output → returns the contract shape', async () => {
    generateContent.mockResolvedValue(modelResponse(VALID_CONTRACT));

    const svc = new GeminiService('fake-key');
    const result = await svc.parseItineraryFromPdf(PDF_BUFFER, 'application/pdf');

    expect(result.trip.name).toBe('Japan 2026');
    expect(result.flights[0].flight_number).toBe('AA100');
    expect(result.stays).toEqual([]);
    // Sends the PDF as an inlineData base64 part.
    const sentParts = generateContent.mock.calls[0][0];
    expect(sentParts[1].inlineData.mimeType).toBe('application/pdf');
    expect(sentParts[1].inlineData.data).toBe(PDF_BUFFER.toString('base64'));
  });

  it('429 fallback: walks the chain to the next model and succeeds', async () => {
    // First model 429s, second succeeds.
    generateContent
      .mockRejectedValueOnce({ status: 429, message: '429 rate limited' })
      .mockResolvedValueOnce(modelResponse(VALID_CONTRACT));

    const svc = new GeminiService('fake-key');
    const result = await svc.parseItineraryFromPdf(PDF_BUFFER, 'application/pdf');

    expect(result.trip.name).toBe('Japan 2026');
    // Two models were tried, in chain order.
    expect(getGenerativeModel).toHaveBeenCalledTimes(2);
    expect(getGenerativeModel.mock.calls[0][0].model).toBe(MODEL_FALLBACK_CHAIN[0]);
    expect(getGenerativeModel.mock.calls[1][0].model).toBe(MODEL_FALLBACK_CHAIN[1]);
  });

  it('429 on every model → generic 502 error', async () => {
    generateContent.mockRejectedValue({ status: 429, message: '429' });

    const svc = new GeminiService('fake-key');
    await expect(svc.parseItineraryFromPdf(PDF_BUFFER, 'application/pdf')).rejects.toMatchObject({
      status: 502,
      code: 'EXTERNAL_SERVICE_ERROR',
    });
    expect(getGenerativeModel).toHaveBeenCalledTimes(MODEL_FALLBACK_CHAIN.length);
  });

  it('non-429 error → throws immediately as generic 502 (no fallback)', async () => {
    generateContent.mockRejectedValue(new Error('network down'));

    const svc = new GeminiService('fake-key');
    await expect(svc.parseItineraryFromPdf(PDF_BUFFER, 'application/pdf')).rejects.toMatchObject({
      status: 502,
      code: 'EXTERNAL_SERVICE_ERROR',
    });
    // Only the first model was attempted.
    expect(getGenerativeModel).toHaveBeenCalledTimes(1);
  });

  it('malformed model output → generic 502 error', async () => {
    generateContent.mockResolvedValue(modelResponse('totally not json'));

    const svc = new GeminiService('fake-key');
    await expect(svc.parseItineraryFromPdf(PDF_BUFFER, 'application/pdf')).rejects.toMatchObject({
      status: 502,
      code: 'EXTERNAL_SERVICE_ERROR',
    });
  });
});
