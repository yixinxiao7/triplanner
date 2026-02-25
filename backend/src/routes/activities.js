import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import { findTripById } from '../models/tripModel.js';
import {
  listActivitiesByTrip,
  findActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../models/activityModel.js';

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

const activityValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    messages: { required: 'Activity name is required' },
  },
  location: {
    required: false,
    nullable: true,
    type: 'string',
    maxLength: 500,
  },
  activity_date: {
    required: true,
    type: 'dateString',
    messages: {
      required: 'Activity date is required',
      type: 'Activity date must be a valid date in YYYY-MM-DD format',
    },
  },
  start_time: {
    required: true,
    type: 'isoTime',
    messages: {
      required: 'Start time is required',
      type: 'Start time must be in HH:MM or HH:MM:SS format',
    },
  },
  end_time: {
    required: true,
    type: 'isoTime',
    messages: {
      required: 'End time is required',
      type: 'End time must be in HH:MM or HH:MM:SS format',
    },
    custom: (value, body) => {
      if (body.start_time && value) {
        if (value <= body.start_time) {
          return 'End time must be after start time';
        }
      }
      return null;
    },
  },
};

// ---- GET /api/v1/trips/:tripId/activities ----
router.get('/', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const activities = await listActivitiesByTrip(req.params.tripId);
    return res.status(200).json({ data: activities });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/v1/trips/:tripId/activities ----
router.post('/', validate(activityValidationSchema), async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const { name, location, activity_date, start_time, end_time } = req.body;

    const activity = await createActivity({
      trip_id: req.params.tripId,
      name,
      location: location ?? null,
      activity_date,
      start_time,
      end_time,
    });

    return res.status(201).json({ data: activity });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/v1/trips/:tripId/activities/:id ----
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const activity = await findActivityById(req.params.id, req.params.tripId);
    if (!activity) {
      return res.status(404).json({ error: { message: 'Activity not found', code: 'NOT_FOUND' } });
    }

    return res.status(200).json({ data: activity });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /api/v1/trips/:tripId/activities/:id ----
router.patch('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const existing = await findActivityById(req.params.id, req.params.tripId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Activity not found', code: 'NOT_FOUND' } });
    }

    const UPDATABLE = ['name', 'location', 'activity_date', 'start_time', 'end_time'];
    const errors = {};

    // Validate activity_date format if provided
    if (req.body.activity_date !== undefined) {
      const d = req.body.activity_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) {
        errors.activity_date = 'Activity date must be a valid date in YYYY-MM-DD format';
      }
    }

    // Validate time format if provided
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (req.body.start_time !== undefined && !timeRegex.test(req.body.start_time)) {
      errors.start_time = 'Start time must be in HH:MM or HH:MM:SS format';
    }
    if (req.body.end_time !== undefined && !timeRegex.test(req.body.end_time)) {
      errors.end_time = 'End time must be in HH:MM or HH:MM:SS format';
    }

    // Validate end_time > start_time using merged values
    const mergedStart = req.body.start_time ?? existing.start_time;
    const mergedEnd = req.body.end_time ?? existing.end_time;
    if (mergedStart && mergedEnd && !errors.start_time && !errors.end_time) {
      if (mergedEnd <= mergedStart) {
        errors.end_time = 'End time must be after start time';
      }
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

    const updated = await updateActivity(req.params.id, updates);
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/v1/trips/:tripId/activities/:id ----
router.delete('/:id', async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const activity = await findActivityById(req.params.id, req.params.tripId);
    if (!activity) {
      return res.status(404).json({ error: { message: 'Activity not found', code: 'NOT_FOUND' } });
    }

    await deleteActivity(req.params.id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
