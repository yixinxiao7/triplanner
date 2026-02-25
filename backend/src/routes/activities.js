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
    required: false,
    nullable: true,
    type: 'isoTime',
    messages: {
      type: 'Start time must be in HH:MM or HH:MM:SS format',
    },
  },
  end_time: {
    required: false,
    nullable: true,
    type: 'isoTime',
    messages: {
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

/**
 * Validates the linked rule for start_time / end_time on POST:
 *   - Both null/omitted → valid ("all day" activity)
 *   - Both provided → valid (timed activity, end > start already checked by schema)
 *   - Only one provided → 400 validation error on the missing field
 *
 * Returns a middleware function.
 */
function validateLinkedTimes(req, res, next) {
  const startProvided = req.body.start_time !== undefined && req.body.start_time !== null;
  const endProvided = req.body.end_time !== undefined && req.body.end_time !== null;

  if (startProvided && !endProvided) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: {
          end_time: 'Both start time and end time are required, or omit both for an all-day activity',
        },
      },
    });
  }

  if (!startProvided && endProvided) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: {
          start_time: 'Both start time and end time are required, or omit both for an all-day activity',
        },
      },
    });
  }

  next();
}

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
router.post('/', validate(activityValidationSchema), validateLinkedTimes, async (req, res, next) => {
  try {
    const trip = await requireTripOwnership(req, res);
    if (!trip) return;

    const { name, location, activity_date, start_time, end_time } = req.body;

    const activity = await createActivity({
      trip_id: req.params.tripId,
      name,
      location: location ?? null,
      activity_date,
      start_time: start_time ?? null,
      end_time: end_time ?? null,
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

    // Validate activity_date format if provided (and not null)
    if (req.body.activity_date !== undefined) {
      const d = req.body.activity_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) {
        errors.activity_date = 'Activity date must be a valid date in YYYY-MM-DD format';
      }
    }

    // Validate time format if provided (and not null — null is valid to clear times)
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (req.body.start_time !== undefined && req.body.start_time !== null && !timeRegex.test(req.body.start_time)) {
      errors.start_time = 'Start time must be in HH:MM or HH:MM:SS format';
    }
    if (req.body.end_time !== undefined && req.body.end_time !== null && !timeRegex.test(req.body.end_time)) {
      errors.end_time = 'End time must be in HH:MM or HH:MM:SS format';
    }

    // Compute merged values: use new value if provided (including explicit null), else existing
    const mergedStart = req.body.start_time !== undefined ? req.body.start_time : existing.start_time;
    const mergedEnd = req.body.end_time !== undefined ? req.body.end_time : existing.end_time;

    // Linked validation on merged values (T-043):
    //   - Both null → valid ("all day")
    //   - Both non-null → valid (timed), check end > start
    //   - One null, one non-null → invalid
    if (!errors.start_time && !errors.end_time) {
      const startIsNull = mergedStart === null || mergedStart === undefined;
      const endIsNull = mergedEnd === null || mergedEnd === undefined;

      if (startIsNull && !endIsNull) {
        errors.start_time = 'Both start time and end time are required, or set both to null for an all-day activity';
      } else if (!startIsNull && endIsNull) {
        errors.end_time = 'Both start time and end time are required, or set both to null for an all-day activity';
      } else if (!startIsNull && !endIsNull) {
        // Both are non-null — validate end > start
        if (mergedEnd <= mergedStart) {
          errors.end_time = 'End time must be after start time';
        }
      }
      // Both null → valid, no error
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
