import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { findTripById } from '../models/tripModel.js';
import {
  listFlightsByTrip,
  findFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
} from '../models/flightModel.js';

// Merge params so we can access :tripId from the parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * Verify that the trip exists and belongs to the authenticated user.
 */
async function requireTripOwnership(req, res) {
  const trip = await findTripById(req.params.tripId);
  if (!trip) {
    res.status(404).json({ error: { message: 'Trip not found', code: 'NOT_FOUND' } });
    return null;
  }
  if (trip.user_id !== req.user.id) {
    res.status(403).json({ error: { message: 'You do not have access to this trip', code: 'FORBIDDEN' } });
    return null;
  }
  return trip;
}

const flightValidationSchema = {
  flight_number: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 20,
    messages: { required: 'Flight number is required' },
  },
  airline: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    messages: { required: 'Airline is required' },
  },
  from_location: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    messages: { required: 'Departure location is required' },
  },
  to_location: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    messages: { required: 'Arrival location is required' },
  },
  departure_at: {
    required: true,
    type: 'isoDate',
    messages: {
      required: 'Departure time is required',
      type: 'Departure time must be a valid ISO 8601 datetime',
    },
  },
  departure_tz: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    messages: { required: 'Departure timezone is required' },
  },
  arrival_at: {
    required: true,
    type: 'isoDate',
    messages: {
      required: 'Arrival time is required',
      type: 'Arrival time must be a valid ISO 8601 datetime',
    },
    custom: (value, body) => {
      if (body.departure_at && value) {
        if (new Date(value) <= new Date(body.departure_at)) {
          return 'Arrival time must be after departure time';
        }
      }
      return null;
    },
  },
  arrival_tz: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    messages: { required: 'Arrival timezone is required' },
  },
};

// ---- GET /api/v1/trips/:tripId/flights ----
router.get('/', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const flights = await listFlightsByTrip(req.params.tripId);
    return res.status(200).json({ data: flights });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/v1/trips/:tripId/flights ----
router.post('/', validate(flightValidationSchema), async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const { flight_number, airline, from_location, to_location, departure_at, departure_tz, arrival_at, arrival_tz } = req.body;

    const flight = await createFlight({
      trip_id: req.params.tripId,
      flight_number,
      airline,
      from_location,
      to_location,
      departure_at,
      departure_tz,
      arrival_at,
      arrival_tz,
    });

    return res.status(201).json({ data: flight });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/v1/trips/:tripId/flights/:id ----
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const flight = await findFlightById(req.params.id, req.params.tripId);
    if (!flight) {
      return res.status(404).json({ error: { message: 'Flight not found', code: 'NOT_FOUND' } });
    }

    return res.status(200).json({ data: flight });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /api/v1/trips/:tripId/flights/:id ----
router.patch('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const existing = await findFlightById(req.params.id, req.params.tripId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Flight not found', code: 'NOT_FOUND' } });
    }

    // Build partial schema — only validate fields that are present in the request
    const UPDATABLE = ['flight_number', 'airline', 'from_location', 'to_location', 'departure_at', 'departure_tz', 'arrival_at', 'arrival_tz'];
    const partialSchema = {};
    for (const field of UPDATABLE) {
      if (req.body[field] !== undefined) {
        partialSchema[field] = { ...flightValidationSchema[field], required: false };
      }
    }

    // Run validation manually for the partial schema
    const errors = {};
    for (const [field, rules] of Object.entries(partialSchema)) {
      let value = req.body[field];
      if (typeof value === 'string') value = value.trim();
      if (rules.type === 'isoDate' && typeof value === 'string' && isNaN(Date.parse(value))) {
        errors[field] = rules.messages?.type || `${field} must be a valid ISO 8601 datetime`;
      }
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      }
    }

    // Validate arrival_at > departure_at using merged values
    const mergedDepartureAt = req.body.departure_at ?? existing.departure_at;
    const mergedArrivalAt = req.body.arrival_at ?? existing.arrival_at;
    if (mergedDepartureAt && mergedArrivalAt && new Date(mergedArrivalAt) <= new Date(mergedDepartureAt)) {
      errors.arrival_at = 'Arrival time must be after departure time';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors },
      });
    }

    const updates = {};
    for (const field of UPDATABLE) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    }

    const updated = await updateFlight(req.params.id, updates);
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/v1/trips/:tripId/flights/:id ----
router.delete('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const flight = await findFlightById(req.params.id, req.params.tripId);
    if (!flight) {
      return res.status(404).json({ error: { message: 'Flight not found', code: 'NOT_FOUND' } });
    }

    await deleteFlight(req.params.id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
