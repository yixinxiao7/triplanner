import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateFields } from '../middleware/validate.js';
import { sanitizeHtml } from '../middleware/sanitize.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import { findTripById } from '../models/tripModel.js';
import { appendImportToTrip } from '../models/importModel.js';
import { flightValidationSchema } from './flights.js';
import { stayValidationSchema } from './stays.js';
import { activityValidationSchema } from './activities.js';
import { createLandTravelSchema } from './landTravel.js';

/**
 * tripImport.js — atomic "import PDF into EXISTING trip" commit endpoint.
 *
 * POST /api/v1/trips/:tripId/import appends parsed itinerary sub-resources
 * (flights, stays, activities, land_travels) onto an already-existing trip.
 * It does NOT create or modify the trip row — there is no trip meta in the body.
 *
 * It is a sibling of routes/import.js (POST /trips/import, create-new-trip) and
 * deliberately reuses the SAME per-resource validation schemas, sanitization, and
 * enum-uppercasing so a child row lands identically no matter which import path
 * produced it. On any element failure it returns the standard VALIDATION_ERROR
 * shape with an indexed field path (e.g. "flights[0].departure_tz").
 *
 * Mounting note: this is mounted at the app level at
 * /api/v1/trips/:tripId/import — AFTER the literal /api/v1/trips/import mount
 * (create-new-trip), so the literal "import" path is never shadowed, and the
 * app-level `app.param('tripId', uuidParamHandler)` validates the UUID. We use a
 * dedicated router (rather than folding into routes/import.js) because that router
 * has no :tripId param and is mounted on a non-parameterized path; keeping the two
 * separate is the lowest-risk way to avoid changing the existing create-new-trip
 * mount order or its routing semantics.
 */

const router = Router({ mergeParams: true });

router.use(authenticate);

// :tripId is inherited from the parent mount path via mergeParams; validate it
// here too (defence in depth — app.param already covers app-level mounts).
router.param('tripId', uuidParamHandler);

// Per-array sanitization config — mirrors routes/import.js (which mirrors each
// resource's POST route). No `trip` entry: this endpoint never touches the trip row.
const SANITIZE_CONFIG = {
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
    }
  }
}

/** Normalize a stay/land-travel enum field to uppercase before validation. */
function upperField(obj, field) {
  if (obj && typeof obj[field] === 'string') obj[field] = obj[field].toUpperCase();
}

// ---- POST /api/v1/trips/:tripId/import ----
router.post('/', async (req, res, next) => {
  try {
    // ---- Ownership: trip must exist and belong to the authenticated user ----
    const trip = await findTripById(req.params.tripId);
    if (!trip || trip.user_id !== req.user.id) {
      return res.status(404).json({ error: { message: 'Trip not found', code: 'NOT_FOUND' } });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};

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

    // ---- Empty payload (nothing to import) → 400 EMPTY_IMPORT ----
    if (flights.length + stays.length + activities.length + landTravels.length === 0) {
      return res.status(400).json({
        error: { code: 'EMPTY_IMPORT', message: 'No items to import' },
      });
    }

    // ---- Sanitize all string fields BEFORE validation (T-272 / T-278 parity) ----
    flights.forEach((f) => sanitizeObject(f, SANITIZE_CONFIG.flights));
    stays.forEach((s) => { sanitizeObject(s, SANITIZE_CONFIG.stays); upperField(s, 'category'); });
    activities.forEach((a) => sanitizeObject(a, SANITIZE_CONFIG.activities));
    landTravels.forEach((l) => { sanitizeObject(l, SANITIZE_CONFIG.land_travels); upperField(l, 'mode'); });

    // ---- Validate each array element against its per-resource schema ----
    const errors = {};
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

    // ---- Commit atomically onto the existing trip ----
    const created = await appendImportToTrip(req.params.tripId, {
      flights,
      stays,
      activities,
      land_travels: landTravels,
    });

    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
