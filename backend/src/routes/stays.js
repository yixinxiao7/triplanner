import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import { findTripById } from '../models/tripModel.js';
import {
  listStaysByTrip,
  findStayById,
  createStay,
  updateStay,
  deleteStay,
} from '../models/stayModel.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// ---- UUID validation for path params (T-027 / B-009) ----
router.param('tripId', uuidParamHandler);
router.param('id', uuidParamHandler);

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

const stayValidationSchema = {
  category: {
    required: true,
    type: 'string',
    enum: ['HOTEL', 'AIRBNB', 'VRBO'],
    messages: {
      required: 'Category is required',
      enum: 'Category must be one of: HOTEL, AIRBNB, VRBO',
    },
  },
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    messages: { required: 'Name is required' },
  },
  address: {
    required: false,
    nullable: true,
    type: 'string',
    maxLength: 500,
  },
  check_in_at: {
    required: true,
    type: 'isoDate',
    messages: {
      required: 'Check-in time is required',
      type: 'Check-in time must be a valid ISO 8601 datetime',
    },
  },
  check_in_tz: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    messages: { required: 'Check-in timezone is required' },
  },
  check_out_at: {
    required: true,
    type: 'isoDate',
    messages: {
      required: 'Check-out time is required',
      type: 'Check-out time must be a valid ISO 8601 datetime',
    },
    custom: (value, body) => {
      if (body.check_in_at && value) {
        if (new Date(value) <= new Date(body.check_in_at)) {
          return 'Check-out time must be after check-in time';
        }
      }
      return null;
    },
  },
  check_out_tz: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    messages: { required: 'Check-out timezone is required' },
  },
};

// ---- GET /api/v1/trips/:tripId/stays ----
router.get('/', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const stays = await listStaysByTrip(req.params.tripId);
    return res.status(200).json({ data: stays });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/v1/trips/:tripId/stays ----
router.post('/', validate(stayValidationSchema), async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const { category, name, address, check_in_at, check_in_tz, check_out_at, check_out_tz } = req.body;

    const stay = await createStay({
      trip_id: req.params.tripId,
      category,
      name,
      address: address ?? null,
      check_in_at,
      check_in_tz,
      check_out_at,
      check_out_tz,
    });

    return res.status(201).json({ data: stay });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/v1/trips/:tripId/stays/:id ----
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const stay = await findStayById(req.params.id, req.params.tripId);
    if (!stay) {
      return res.status(404).json({ error: { message: 'Stay not found', code: 'NOT_FOUND' } });
    }

    return res.status(200).json({ data: stay });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /api/v1/trips/:tripId/stays/:id ----
router.patch('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const existing = await findStayById(req.params.id, req.params.tripId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Stay not found', code: 'NOT_FOUND' } });
    }

    const UPDATABLE = ['category', 'name', 'address', 'check_in_at', 'check_in_tz', 'check_out_at', 'check_out_tz'];
    const errors = {};

    if (req.body.category !== undefined && !['HOTEL', 'AIRBNB', 'VRBO'].includes(req.body.category)) {
      errors.category = 'Category must be one of: HOTEL, AIRBNB, VRBO';
    }

    // Validate check_out > check_in using merged values
    const mergedCheckIn = req.body.check_in_at ?? existing.check_in_at;
    const mergedCheckOut = req.body.check_out_at ?? existing.check_out_at;
    if (mergedCheckIn && mergedCheckOut && new Date(mergedCheckOut) <= new Date(mergedCheckIn)) {
      errors.check_out_at = 'Check-out time must be after check-in time';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors },
      });
    }

    const updates = {};
    for (const field of UPDATABLE) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await updateStay(req.params.id, updates);
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/v1/trips/:tripId/stays/:id ----
router.delete('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const stay = await findStayById(req.params.id, req.params.tripId);
    if (!stay) {
      return res.status(404).json({ error: { message: 'Stay not found', code: 'NOT_FOUND' } });
    }

    await deleteStay(req.params.id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
