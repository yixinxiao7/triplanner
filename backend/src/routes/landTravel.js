import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sanitizeFields, sanitizeHtml } from '../middleware/sanitize.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import { findTripById } from '../models/tripModel.js';
import {
  VALID_LAND_TRAVEL_MODES,
  listLandTravelsByTrip,
  findLandTravelById,
  createLandTravel,
  updateLandTravel,
  deleteLandTravel,
} from '../models/landTravelModel.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// ---- UUID validation for path params (consistent with other sub-resource routers) ----
router.param('tripId', uuidParamHandler);
router.param('ltId', uuidParamHandler);

/**
 * Verify the authenticated user owns the trip identified by :tripId.
 * Returns the trip on success, or sends a 404/403 response and returns null.
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

/** Validation schema used for POST (create). All required fields present. */
const createLandTravelSchema = {
  mode: {
    required: true,
    type: 'string',
    enum: VALID_LAND_TRAVEL_MODES,
    messages: {
      required: 'Travel mode is required',
      enum: `mode must be one of: ${VALID_LAND_TRAVEL_MODES.join(', ')}`,
    },
  },
  provider: {
    required: false,
    nullable: true,
    type: 'string',
    maxLength: 255,
  },
  from_location: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 500,
    messages: { required: 'Origin location is required' },
  },
  to_location: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 500,
    messages: { required: 'Destination location is required' },
  },
  departure_date: {
    required: true,
    type: 'dateString',
    messages: {
      required: 'Departure date is required',
      type: 'Departure date must be a valid date in YYYY-MM-DD format',
    },
  },
  departure_time: {
    required: false,
    nullable: true,
    type: 'isoTime',
    messages: {
      type: 'Departure time must be in HH:MM or HH:MM:SS format',
    },
  },
  arrival_date: {
    required: false,
    nullable: true,
    type: 'dateString',
    messages: {
      type: 'Arrival date must be a valid date in YYYY-MM-DD format',
    },
    custom: (value, body) => {
      if (value && body.departure_date) {
        if (value < body.departure_date) {
          return 'Arrival date cannot be before departure date';
        }
      }
      return null;
    },
  },
  arrival_time: {
    required: false,
    nullable: true,
    type: 'isoTime',
    messages: {
      type: 'Arrival time must be in HH:MM or HH:MM:SS format',
    },
    custom: (value, body) => {
      // arrival_time requires arrival_date to be set
      if (value && !body.arrival_date) {
        return 'Arrival time requires an arrival date to be set';
      }
      // Same-day rule: when arrival_date == departure_date, arrival_time must be > departure_time
      // (T-086 code review fix — Manager required 2026-02-27)
      if (
        value &&
        body.arrival_date &&
        body.departure_date &&
        body.arrival_date === body.departure_date &&
        body.departure_time &&
        value <= body.departure_time
      ) {
        return 'Arrival time must be after departure time when arriving on the same day';
      }
      return null;
    },
  },
  confirmation_number: {
    required: false,
    nullable: true,
    type: 'string',
    maxLength: 255,
  },
  notes: {
    required: false,
    nullable: true,
    type: 'string',
    maxLength: 2000,
  },
};

// ---- GET /api/v1/trips/:tripId/land-travel ----
router.get('/', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const entries = await listLandTravelsByTrip(req.params.tripId);
    return res.status(200).json({ data: entries });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/v1/trips/:tripId/land-travel ----
const landTravelSanitizeConfig = { provider: 'string', from_location: 'string', to_location: 'string' };

router.post('/', sanitizeFields(landTravelSanitizeConfig), validate(createLandTravelSchema), async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const {
      mode,
      provider,
      from_location,
      to_location,
      departure_date,
      departure_time,
      arrival_date,
      arrival_time,
      confirmation_number,
      notes,
    } = req.body;

    const entry = await createLandTravel({
      trip_id: req.params.tripId,
      mode,
      provider: provider ?? null,
      from_location,
      to_location,
      departure_date,
      departure_time: departure_time ?? null,
      arrival_date: arrival_date ?? null,
      arrival_time: arrival_time ?? null,
      confirmation_number: confirmation_number ?? null,
      notes: notes ?? null,
    });

    return res.status(201).json({ data: entry });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/v1/trips/:tripId/land-travel/:ltId ----
router.get('/:ltId', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const entry = await findLandTravelById(req.params.ltId, req.params.tripId);
    if (!entry) {
      return res.status(404).json({ error: { message: 'Land travel entry not found', code: 'NOT_FOUND' } });
    }

    return res.status(200).json({ data: entry });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /api/v1/trips/:tripId/land-travel/:ltId ----
router.patch('/:ltId', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const existing = await findLandTravelById(req.params.ltId, req.params.tripId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Land travel entry not found', code: 'NOT_FOUND' } });
    }

    const UPDATABLE = [
      'mode',
      'provider',
      'from_location',
      'to_location',
      'departure_date',
      'departure_time',
      'arrival_date',
      'arrival_time',
      'confirmation_number',
      'notes',
    ];

    // T-278: Sanitize text fields BEFORE validation so all-HTML values become empty
    const SANITIZE_FIELDS_PATCH = ['provider', 'from_location', 'to_location'];
    for (const field of SANITIZE_FIELDS_PATCH) {
      if (req.body[field] !== undefined && typeof req.body[field] === 'string') {
        req.body[field] = sanitizeHtml(req.body[field]);
      }
    }

    // Require at least one updatable field
    const hasUpdates = UPDATABLE.some((f) => req.body[f] !== undefined);
    if (!hasUpdates) {
      return res.status(400).json({
        error: {
          message: 'At least one updatable field must be provided',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const errors = {};

    // T-278: Reject empty required text fields after sanitization (minLength 1)
    const REQUIRED_TEXT_FIELDS = ['from_location', 'to_location'];
    for (const field of REQUIRED_TEXT_FIELDS) {
      if (req.body[field] !== undefined && typeof req.body[field] === 'string') {
        const trimmed = req.body[field].trim();
        if (trimmed.length < 1) {
          errors[field] = createLandTravelSchema[field]?.messages?.required || `${field} is required`;
        }
      }
    }

    // Validate mode if provided
    if (req.body.mode !== undefined) {
      if (!VALID_LAND_TRAVEL_MODES.includes(req.body.mode)) {
        errors.mode = `mode must be one of: ${VALID_LAND_TRAVEL_MODES.join(', ')}`;
      }
    }

    // Validate departure_date format if provided (non-null)
    if (req.body.departure_date !== undefined && req.body.departure_date !== null) {
      const d = req.body.departure_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) {
        errors.departure_date = 'Departure date must be a valid date in YYYY-MM-DD format';
      }
    }

    // Validate arrival_date format if provided (non-null)
    if (req.body.arrival_date !== undefined && req.body.arrival_date !== null) {
      const d = req.body.arrival_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) {
        errors.arrival_date = 'Arrival date must be a valid date in YYYY-MM-DD format';
      }
    }

    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    // Validate departure_time if provided (non-null)
    if (req.body.departure_time !== undefined && req.body.departure_time !== null) {
      if (!timeRegex.test(req.body.departure_time)) {
        errors.departure_time = 'Departure time must be in HH:MM or HH:MM:SS format';
      }
    }

    // Validate arrival_time if provided (non-null)
    if (req.body.arrival_time !== undefined && req.body.arrival_time !== null) {
      if (!timeRegex.test(req.body.arrival_time)) {
        errors.arrival_time = 'Arrival time must be in HH:MM or HH:MM:SS format';
      }
    }

    // Compute merged values for cross-field validation
    const mergedDepartureDate =
      req.body.departure_date !== undefined ? req.body.departure_date : existing.departure_date;
    const mergedArrivalDate =
      req.body.arrival_date !== undefined ? req.body.arrival_date : existing.arrival_date;
    const mergedArrivalTime =
      req.body.arrival_time !== undefined ? req.body.arrival_time : existing.arrival_time;
    const mergedDepartureTime =
      req.body.departure_time !== undefined ? req.body.departure_time : existing.departure_time;

    // Cross-field: arrival_date >= departure_date
    if (
      !errors.departure_date &&
      !errors.arrival_date &&
      mergedArrivalDate !== null &&
      mergedArrivalDate !== undefined &&
      mergedDepartureDate !== null &&
      mergedDepartureDate !== undefined
    ) {
      if (mergedArrivalDate < mergedDepartureDate) {
        errors.arrival_date = 'Arrival date cannot be before departure date';
      }
    }

    // Cross-field: arrival_time requires arrival_date
    if (
      !errors.arrival_time &&
      (mergedArrivalTime !== null && mergedArrivalTime !== undefined) &&
      (mergedArrivalDate === null || mergedArrivalDate === undefined)
    ) {
      errors.arrival_time = 'Arrival time requires an arrival date to be set';
    }

    // Cross-field: same-day rule — arrival_time must be > departure_time when
    // arrival_date == departure_date (T-086 code review fix — Manager required 2026-02-27)
    if (
      !errors.arrival_time &&
      !errors.departure_time &&
      !errors.arrival_date &&
      !errors.departure_date &&
      mergedArrivalDate !== null &&
      mergedArrivalDate !== undefined &&
      mergedDepartureDate !== null &&
      mergedDepartureDate !== undefined &&
      mergedArrivalDate === mergedDepartureDate &&
      mergedArrivalTime !== null &&
      mergedArrivalTime !== undefined &&
      mergedDepartureTime !== null &&
      mergedDepartureTime !== undefined &&
      mergedArrivalTime <= mergedDepartureTime
    ) {
      errors.arrival_time = 'Arrival time must be after departure time when arriving on the same day';
    }

    // Validate string lengths for text fields
    const textLengths = {
      from_location: 500,
      to_location: 500,
      provider: 255,
      confirmation_number: 255,
      notes: 2000,
    };
    for (const [field, maxLen] of Object.entries(textLengths)) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        if (typeof req.body[field] !== 'string') {
          errors[field] = `${field} must be a string`;
        } else if (req.body[field].length > maxLen) {
          errors[field] = `${field} must be at most ${maxLen} characters`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors },
      });
    }

    // T-278: Sanitization already applied above (before validation). Just collect.
    const updates = {};
    for (const field of UPDATABLE) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await updateLandTravel(req.params.ltId, updates);
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/v1/trips/:tripId/land-travel/:ltId ----
router.delete('/:ltId', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const entry = await findLandTravelById(req.params.ltId, req.params.tripId);
    if (!entry) {
      return res.status(404).json({ error: { message: 'Land travel entry not found', code: 'NOT_FOUND' } });
    }

    await deleteLandTravel(req.params.ltId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
