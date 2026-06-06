/**
 * geminiService.js — PDF itinerary parsing via the Google Gemini API.
 *
 * ESM port of the proven plant_guardians GeminiService pattern:
 *   - GoogleGenerativeAI client
 *   - 429 model fallback chain (walks to the next model on rate-limit)
 *   - structured JSON output (responseMimeType + responseSchema) for reliability
 *   - a defensive parser fallback that coerces missing arrays to [] and nulls optionals
 *   - a generic, user-safe error on any failure (never leaks Gemini internals)
 *
 * Input is a PDF (inlineData part, mimeType 'application/pdf') and the output maps
 * 1:1 to Triplanner's trip + sub-resource contract (see the approved plan).
 *
 * Biggest risk — timezones: flights/stays use TIMESTAMPTZ columns and the existing
 * validators reject naive datetimes. The prompt below REQUIRES offset-aware ISO 8601
 * datetimes (Z or ±HH:MM) AND a matching IANA tz string for every flight/stay datetime.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Model fallback chain for 429 rate-limit responses.
 * On 429, _generateWithFallback walks to the next model.
 */
export const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

/**
 * Generic user-safe error thrown on any Gemini failure. Shape matches
 * errorHandler.js (reads err.status / err.code / err.message).
 */
function externalServiceError() {
  const err = new Error('Could not read the itinerary. Please try again.');
  err.status = 502;
  err.code = 'EXTERNAL_SERVICE_ERROR';
  return err;
}

/**
 * Detect whether an error is a 429 rate-limit error.
 */
export function isRateLimitError(err) {
  if (err && err.status === 429) return true;
  if (err && typeof err.message === 'string' && err.message.includes('429')) return true;
  return false;
}

/**
 * The structured-output schema handed to Gemini (generationConfig.responseSchema).
 * Mirrors the contract; arrays default to [], optional fields are nullable.
 *
 * Note: Gemini's responseSchema is a subset of OpenAPI 3.0. It does not support
 * format/pattern constraints, so the prompt carries the offset/tz rules and the
 * defensive parser + downstream validators enforce them.
 */
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    trip: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        destinations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        start_date: { type: SchemaType.STRING, nullable: true },
        end_date: { type: SchemaType.STRING, nullable: true },
        notes: { type: SchemaType.STRING, nullable: true },
      },
      required: ['name', 'destinations'],
    },
    flights: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          flight_number: { type: SchemaType.STRING },
          airline: { type: SchemaType.STRING },
          from_location: { type: SchemaType.STRING },
          to_location: { type: SchemaType.STRING },
          departure_at: { type: SchemaType.STRING },
          departure_tz: { type: SchemaType.STRING },
          arrival_at: { type: SchemaType.STRING },
          arrival_tz: { type: SchemaType.STRING },
        },
        required: [
          'flight_number', 'airline', 'from_location', 'to_location',
          'departure_at', 'departure_tz', 'arrival_at', 'arrival_tz',
        ],
      },
    },
    stays: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING, nullable: true },
          check_in_at: { type: SchemaType.STRING },
          check_in_tz: { type: SchemaType.STRING },
          check_out_at: { type: SchemaType.STRING },
          check_out_tz: { type: SchemaType.STRING },
        },
        required: [
          'category', 'name', 'check_in_at', 'check_in_tz', 'check_out_at', 'check_out_tz',
        ],
      },
    },
    activities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          location: { type: SchemaType.STRING, nullable: true },
          activity_date: { type: SchemaType.STRING },
          start_time: { type: SchemaType.STRING, nullable: true },
          end_time: { type: SchemaType.STRING, nullable: true },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ['name', 'activity_date'],
      },
    },
    land_travels: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          mode: { type: SchemaType.STRING },
          provider: { type: SchemaType.STRING, nullable: true },
          from_location: { type: SchemaType.STRING },
          to_location: { type: SchemaType.STRING },
          departure_date: { type: SchemaType.STRING },
          departure_time: { type: SchemaType.STRING, nullable: true },
          arrival_date: { type: SchemaType.STRING, nullable: true },
          arrival_time: { type: SchemaType.STRING, nullable: true },
          confirmation_number: { type: SchemaType.STRING, nullable: true },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ['mode', 'from_location', 'to_location', 'departure_date'],
      },
    },
  },
  required: ['trip', 'flights', 'stays', 'activities', 'land_travels'],
};

/**
 * The prompt. Explicit about the offset-aware datetime + IANA tz requirement
 * for flights/stays (the highest-error-rate fields), and about emitting empty
 * arrays / nulls rather than guessing.
 */
export const PROMPT = `You are a travel-itinerary parser. The attached PDF is a travel itinerary
(it may contain flights, hotel/lodging stays, activities, and ground transportation).
Extract everything you can into the JSON structure described below. Do NOT invent data:
if a section has no entries, return an empty array for it. If an optional field is
unknown, return null for it (never a placeholder string).

CRITICAL — datetimes and timezones:
- For every flight (departure_at, arrival_at) and every stay (check_in_at, check_out_at),
  emit a full ISO 8601 datetime that INCLUDES a UTC offset (a "Z" suffix or a "+HH:MM" /
  "-HH:MM" offset). Example: "2026-08-07T06:50:00-04:00". A naive datetime without an
  offset (e.g. "2026-08-07T06:50:00") is INVALID and will be rejected.
- The offset MUST correspond to the local time at that location, and you MUST also provide
  the matching IANA timezone string in the *_tz field (e.g. "America/New_York", "Asia/Tokyo").
- Departure/check-in offsets reflect the origin location; arrival/check-out offsets reflect
  the destination location.

CRITICAL — one entry per real-world booking (do NOT split by day):
- A multi-night stay at the same lodging is ONE stays[] entry: set check_in_at to the
  arrival date/time and check_out_at to the departure date/time, spanning the entire range.
  Many itineraries repeat the hotel under each day in a day-by-day layout — even so, emit a
  SINGLE stay for the continuous booking. NEVER create one stay entry per night.
- Likewise, a continuous multi-day booking of the same ground transport (e.g. a rental car
  held across several days) is ONE land_travels[] entry spanning pickup to drop-off — not one
  entry per day.
- Only create separate entries for genuinely distinct bookings: a different lodging, a
  check-out and later re-check-in, or a different vehicle/rental.

Field rules:
- trip.name: a concise trip title (1-255 chars). If none is stated, synthesize one from the
  primary destination(s).
- trip.destinations: an array of one or more place names (cities/regions), each <=100 chars.
- trip.start_date / trip.end_date: "YYYY-MM-DD" or null.
- trip.notes: optional free text or null.
- flights[]: capture EVERY flight the document mentions, INCLUDING ones written in prose
  inside a day's narrative — e.g. "You have a Flight from Delhi - Hyderabad :: IndiGo ::
  Dep 10:45 Hrs - Arr 12:55 Hrs", or a "Flight Home :: Dep 06:15 Hrs". Do NOT drop a flight
  just because some details are missing; fill best-effort values:
  • flight_number: the stated code (e.g. "6E-123"); if NONE is given, set it to "TBD"
    (this is the one allowed placeholder — never omit the flight for a missing number).
  • airline: the stated carrier (e.g. "IndiGo"); "TBD" if truly absent.
  • from_location / to_location: the route endpoints (city or airport).
  • departure_at / arrival_at: take the date from the day/section heading the flight appears
    under, combine it with the stated local times, and apply the timezone offset of the
    departure/arrival CITY. Deriving the offset from a known city is NOT inventing data —
    e.g. Indian cities are Asia/Kolkata (+05:30), so the day "06-Jul-2026" + "Dep 10:45 Hrs"
    in Delhi → "2026-07-06T10:45:00+05:30". If an arrival time lacks its own date and is
    earlier than departure, assume it lands the next day.
  • departure_tz / arrival_tz: the IANA zone for those cities (e.g. "Asia/Kolkata").
- stays[].category: one of "HOTEL", "AIRBNB", or "VRBO" (default to "HOTEL" if it is clearly
  a hotel but the brand is unclear). One entry per continuous stay spanning check-in to
  check-out (see the consolidation rule above) — do NOT create one stay per night.
- activities[].activity_date: "YYYY-MM-DD". start_time/end_time: "HH:MM" (24-hour) or null.
- land_travels[].mode: one of "RENTAL_CAR", "BUS", "TRAIN", "RIDESHARE", "FERRY", "OTHER".
  departure_date/arrival_date: "YYYY-MM-DD" (arrival_date may be null).
  departure_time/arrival_time: "HH:MM" or null.

Respond ONLY with the JSON object — no prose, no markdown code fences.`;

/**
 * Coerce a raw parsed object into the contract shape:
 *   - top-level arrays default to []
 *   - optional fields default to null
 * Returns null if the object is fundamentally unusable (no parseable trip).
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic safety net for bug-024: day-structured itinerary PDFs repeat the
 * same lodging under each day, so the model can emit one stays[] entry per night
 * even with the prompt's consolidation rule. This merges entries that are clearly
 * one continuous booking back into a single stay — independent of model behaviour.
 *
 * Merge criteria (conservative, to avoid collapsing genuinely separate bookings):
 *   - same lodging identity (case-insensitive name + category), AND
 *   - chronologically adjacent: the next check-in is on/before the current
 *     check-out, or within one day of it (covers single-day-per-night splits).
 * A real check-out and later re-check-in (multi-day gap) is NOT merged.
 *
 * The merged entry spans the earliest check-in to the latest check-out, keeping
 * the check-in tz from the first segment and check-out tz from the last.
 *
 * @param {Array} stays - normalized stays from parseItineraryResponse
 * @returns {Array} consolidated stays
 */
export function consolidateStays(stays) {
  if (!Array.isArray(stays) || stays.length < 2) return stays;

  const identity = (s) => `${(s.name || '').trim().toLowerCase()}|${(s.category || '').toUpperCase()}`;
  const ms = (v) => {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  };

  // Group by lodging identity, preserving first-seen order.
  const order = [];
  const groups = new Map();
  for (const s of stays) {
    const key = identity(s);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(s);
  }

  const merged = [];
  for (const key of order) {
    const group = groups.get(key);
    // Sort by check-in; unparseable check-ins sort last and never merge.
    group.sort((a, b) => (ms(a.check_in_at) ?? Infinity) - (ms(b.check_in_at) ?? Infinity));

    let cur = null;
    for (const s of group) {
      if (!cur) {
        cur = { ...s };
        continue;
      }
      const curOut = ms(cur.check_out_at);
      const nextIn = ms(s.check_in_at);
      const adjacent = curOut !== null && nextIn !== null && nextIn - curOut <= ONE_DAY_MS;

      if (adjacent) {
        // Extend the window to the later check-out.
        const curOutVal = curOut ?? -Infinity;
        const sOut = ms(s.check_out_at);
        if (sOut !== null && sOut > curOutVal) {
          cur.check_out_at = s.check_out_at;
          cur.check_out_tz = s.check_out_tz || cur.check_out_tz;
        }
        if (!cur.address && s.address) cur.address = s.address;
      } else {
        merged.push(cur);
        cur = { ...s };
      }
    }
    if (cur) merged.push(cur);
  }

  // Return in chronological order (stable for equal/unparseable check-ins).
  return merged
    .map((s, i) => ({ s, i }))
    .sort((a, b) => ((ms(a.s.check_in_at) ?? Infinity) - (ms(b.s.check_in_at) ?? Infinity)) || (a.i - b.i))
    .map(({ s }) => s);
}

export function parseItineraryResponse(text) {
  try {
    // Extract the JSON object even if wrapped in stray text / code fences.
    const jsonMatch = typeof text === 'string' ? text.match(/\{[\s\S]*\}/) : null;
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== 'object') return null;

    const rawTrip = parsed.trip;
    if (!rawTrip || typeof rawTrip !== 'object') return null;

    const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v : null);
    const arr = (v) => (Array.isArray(v) ? v : []);

    const trip = {
      name: typeof rawTrip.name === 'string' ? rawTrip.name : '',
      destinations: arr(rawTrip.destinations).filter((d) => typeof d === 'string' && d.trim() !== ''),
      start_date: str(rawTrip.start_date),
      end_date: str(rawTrip.end_date),
      notes: str(rawTrip.notes),
    };

    const flights = arr(parsed.flights).map((f) => ({
      flight_number: typeof f?.flight_number === 'string' ? f.flight_number : '',
      airline: typeof f?.airline === 'string' ? f.airline : '',
      from_location: typeof f?.from_location === 'string' ? f.from_location : '',
      to_location: typeof f?.to_location === 'string' ? f.to_location : '',
      departure_at: typeof f?.departure_at === 'string' ? f.departure_at : '',
      departure_tz: typeof f?.departure_tz === 'string' ? f.departure_tz : '',
      arrival_at: typeof f?.arrival_at === 'string' ? f.arrival_at : '',
      arrival_tz: typeof f?.arrival_tz === 'string' ? f.arrival_tz : '',
    }));

    const stays = arr(parsed.stays).map((s) => ({
      category: typeof s?.category === 'string' ? s.category.toUpperCase() : '',
      name: typeof s?.name === 'string' ? s.name : '',
      address: str(s?.address),
      check_in_at: typeof s?.check_in_at === 'string' ? s.check_in_at : '',
      check_in_tz: typeof s?.check_in_tz === 'string' ? s.check_in_tz : '',
      check_out_at: typeof s?.check_out_at === 'string' ? s.check_out_at : '',
      check_out_tz: typeof s?.check_out_tz === 'string' ? s.check_out_tz : '',
    }));

    const activities = arr(parsed.activities).map((a) => ({
      name: typeof a?.name === 'string' ? a.name : '',
      location: str(a?.location),
      activity_date: typeof a?.activity_date === 'string' ? a.activity_date : '',
      start_time: str(a?.start_time),
      end_time: str(a?.end_time),
      notes: str(a?.notes),
    }));

    const land_travels = arr(parsed.land_travels).map((l) => ({
      mode: typeof l?.mode === 'string' ? l.mode.toUpperCase() : '',
      provider: str(l?.provider),
      from_location: typeof l?.from_location === 'string' ? l.from_location : '',
      to_location: typeof l?.to_location === 'string' ? l.to_location : '',
      departure_date: typeof l?.departure_date === 'string' ? l.departure_date : '',
      departure_time: str(l?.departure_time),
      arrival_date: str(l?.arrival_date),
      arrival_time: str(l?.arrival_time),
      confirmation_number: str(l?.confirmation_number),
      notes: str(l?.notes),
    }));

    return { trip, flights, stays: consolidateStays(stays), activities, land_travels };
  } catch {
    return null;
  }
}

class GeminiService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Try generating content with the model fallback chain.
   * On 429, falls through to the next model. Non-429 errors throw immediately.
   * If all models return 429, the last 429 propagates.
   */
  async _generateWithFallback(parts) {
    for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
      const modelName = MODEL_FALLBACK_CHAIN[i];
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });
        const response = await model.generateContent(parts);
        return response.response.text();
      } catch (err) {
        if (isRateLimitError(err) && i < MODEL_FALLBACK_CHAIN.length - 1) {
          console.warn(`Gemini model ${modelName} returned 429, falling back to next model.`);
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Parse a PDF itinerary into the Triplanner import contract.
   * @param {Buffer} buffer   - raw PDF file contents
   * @param {string} mimeType - should be 'application/pdf'
   * @returns {Promise<Object>} contract JSON { trip, flights, stays, activities, land_travels }
   * @throws  generic { status:502, code:'EXTERNAL_SERVICE_ERROR' } on any failure
   */
  async parseItineraryFromPdf(buffer, mimeType) {
    const pdfPart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };

    let text;
    try {
      text = await this._generateWithFallback([PROMPT, pdfPart]);
    } catch (err) {
      console.error('Gemini API error (PDF itinerary parse):', err.message);
      throw externalServiceError();
    }

    const result = parseItineraryResponse(text);
    if (!result) {
      console.error('Gemini returned unparseable itinerary output.');
      throw externalServiceError();
    }

    return result;
  }
}

export default GeminiService;
