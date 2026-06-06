import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateFields } from '../middleware/validate.js';
import { sanitizeHtml } from '../middleware/sanitize.js';
import { importTrip } from '../models/importModel.js';
import { tripCreateSchema } from './trips.js';
import { flightValidationSchema } from './flights.js';
import { stayValidationSchema } from './stays.js';
import { activityValidationSchema } from './activities.js';
import { createLandTravelSchema } from './landTravel.js';

/**
 * import.js — atomic PDF-import commit endpoint (T-332).
 * Mounted at /api/v1/trips/import (BEFORE /api/v1/trips so "import" is not parsed
 * as a trip :id UUID).
 *
 * POST /trips/import validates the full reviewed payload — reusing the same
 * per-resource validation schemas as the individual create endpoints, applied to
 * each array element — then commits everything in a single transaction via
 * importModel.importTrip. On any element failure it returns the standard
 * VALIDATION_ERROR shape with an indexed field path (e.g. "flights[0].departure_at").
 */

const router = Router();

router.use(authenticate);

// Per-array sanitization config: which string fields to strip HTML from, mirroring
// the sanitizeFields config used by each resource's POST route.
const SANITIZE_CONFIG = {
  trip: { name: 'string', destinations: 'array', notes: 'string' },
  flights: { flight_number: 'string', airline: 'string', from_location: 'string', to_location: 'string' },
  stays: { name: 'string', address: 'string' },
  activities: { name: 'string', location: 'string', notes: 'string' },
  land_travels: { provider: 'string', from_location: 'string', to_location: 'string', confirmation_number: 'string', notes: 'string' },
};

/** Sanitize the string fields of a single object in place per a field config. */
function sanitizeObject(obj, fieldConfig) {
  if (!obj || typeof obj !== 'object') return;
  for (const [field, type] of Object.entries(fieldConfig)) {
    const value = obj[field];
    if (value === undefined || value === null) continue;
    if (type === 'string' && typeof value === 'string') {
      obj[field] = sanitizeHtml(value);
    } else if (type === 'array' && Array.isArray(value)) {
      obj[field] = value.map((item) => (typeof item === 'string' ? sanitizeHtml(item) : item));
    }
  }
}

/** Normalize a stay/land-travel enum field to uppercase before validation. */
function upperField(obj, field) {
  if (obj && typeof obj[field] === 'string') obj[field] = obj[field].toUpperCase();
}

// ---- POST /api/v1/trips/import ----
router.post('/', async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const trip = body.trip;

    if (!trip || typeof trip !== 'object') {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields: { trip: 'Trip data is required' },
        },
      });
    }

    // Coerce child collections to arrays; reject non-array values explicitly.
    const fieldErrors = {};
    for (const key of ['flights', 'stays', 'activities', 'land_travels']) {
      if (body[key] !== undefined && !Array.isArray(body[key])) {
        fieldErrors[key] = `${key} must be an array`;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: fieldErrors },
      });
    }

    const flights = Array.isArray(body.flights) ? body.flights : [];
    const stays = Array.isArray(body.stays) ? body.stays : [];
    const activities = Array.isArray(body.activities) ? body.activities : [];
    const landTravels = Array.isArray(body.land_travels) ? body.land_travels : [];

    // ---- Sanitize all string fields BEFORE validation (T-272 / T-278 parity) ----
    sanitizeObject(trip, SANITIZE_CONFIG.trip);
    flights.forEach((f) => sanitizeObject(f, SANITIZE_CONFIG.flights));
    stays.forEach((s) => { sanitizeObject(s, SANITIZE_CONFIG.stays); upperField(s, 'category'); });
    activities.forEach((a) => sanitizeObject(a, SANITIZE_CONFIG.activities));
    landTravels.forEach((l) => { sanitizeObject(l, SANITIZE_CONFIG.land_travels); upperField(l, 'mode'); });

    // ---- Validate trip meta ----
    const errors = {};
    const tripErrors = validateFields(tripCreateSchema, trip);
    for (const [field, msg] of Object.entries(tripErrors)) {
      errors[`trip.${field}`] = msg;
    }

    // ---- Validate each array element against its per-resource schema ----
    const sections = [
      ['flights', flights, flightValidationSchema],
      ['stays', stays, stayValidationSchema],
      ['activities', activities, activityValidationSchema],
      ['land_travels', landTravels, createLandTravelSchema],
    ];

    for (const [name, list, schema] of sections) {
      list.forEach((item, idx) => {
        const itemErrors = validateFields(schema, item);
        for (const [field, msg] of Object.entries(itemErrors)) {
          errors[`${name}[${idx}].${field}`] = msg;
        }
      });
    }

    // ---- Activities: linked start_time/end_time rule (both or neither) ----
    activities.forEach((a, idx) => {
      const startProvided = a.start_time !== undefined && a.start_time !== null;
      const endProvided = a.end_time !== undefined && a.end_time !== null;
      if (startProvided && !endProvided) {
        errors[`activities[${idx}].end_time`] =
          'Both start time and end time are required, or omit both for an all-day activity';
      } else if (!startProvided && endProvided) {
        errors[`activities[${idx}].start_time`] =
          'Both start time and end time are required, or omit both for an all-day activity';
      }
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors },
      });
    }

    // ---- Commit atomically ----
    const payload = {
      trip,
      flights,
      stays,
      activities,
      land_travels: landTravels,
    };

    const created = await importTrip(req.user.id, payload);
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
