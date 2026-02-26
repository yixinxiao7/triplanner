import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import {
  listTripsByUser,
  findTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  VALID_SORT_BY,
  VALID_SORT_ORDER,
  VALID_STATUS_FILTER,
} from '../models/tripModel.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ---- UUID validation for :id param (T-027 / B-009) ----
// Fires before any route handler that includes `:id` in its path.
router.param('id', uuidParamHandler);

// ---- GET /api/v1/trips ----
// T-072: Added search, filter, and sort query parameters
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    // ---- Validate new query params (T-072) ----
    const fieldErrors = {};

    // search: any string is valid; empty/whitespace treated as "no search"
    const search = req.query.search ? req.query.search.trim() : undefined;

    // status: must be one of PLANNING, ONGOING, COMPLETED
    const statusFilter = req.query.status || undefined;
    if (statusFilter && !VALID_STATUS_FILTER.includes(statusFilter)) {
      fieldErrors.status = 'Status filter must be one of: PLANNING, ONGOING, COMPLETED';
    }

    // sort_by: must be one of name, created_at, start_date
    const sortBy = req.query.sort_by || 'created_at';
    if (req.query.sort_by && !VALID_SORT_BY.includes(req.query.sort_by)) {
      fieldErrors.sort_by = 'Sort field must be one of: name, created_at, start_date';
    }

    // sort_order: must be one of asc, desc
    const sortOrder = req.query.sort_order || 'desc';
    if (req.query.sort_order && !VALID_SORT_ORDER.includes(req.query.sort_order)) {
      fieldErrors.sort_order = 'Sort order must be one of: asc, desc';
    }

    // Return validation errors if any
    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields: fieldErrors,
        },
      });
    }

    const { trips, total } = await listTripsByUser(req.user.id, {
      page,
      limit,
      search: search || undefined,
      status: statusFilter,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      data: trips,
      pagination: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/v1/trips ----
router.post(
  '/',
  validate({
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 255,
      messages: { required: 'Trip name is required' },
    },
    destinations: {
      required: true,
      type: 'array',
      minItems: 1,
      maxItems: 50,
      messages: { required: 'At least one destination is required' },
    },
    // start_date and end_date are optional; validated as dateString when provided (T-029)
    start_date: {
      required: false,
      nullable: true,
      type: 'dateString',
      messages: {
        type: 'Start date must be a valid date in YYYY-MM-DD format',
      },
    },
    end_date: {
      required: false,
      nullable: true,
      type: 'dateString',
      messages: {
        type: 'End date must be a valid date in YYYY-MM-DD format',
      },
      custom: (value, body) => {
        // Cross-field: if both start_date and end_date are non-null, end_date >= start_date
        if (value && body.start_date && value < body.start_date) {
          return 'End date must be on or after start date';
        }
        return null;
      },
    },
  }),
  async (req, res, next) => {
    try {
      const { name, destinations, start_date, end_date } = req.body;

      const trip = await createTrip({
        user_id: req.user.id,
        name,
        destinations,
        start_date: start_date ?? null,
        end_date: end_date ?? null,
      });

      return res.status(201).json({ data: trip });
    } catch (err) {
      next(err);
    }
  },
);

// ---- GET /api/v1/trips/:id ----
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await findTripById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        error: { message: 'Trip not found', code: 'NOT_FOUND' },
      });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You do not have access to this trip', code: 'FORBIDDEN' },
      });
    }

    return res.status(200).json({ data: trip });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /api/v1/trips/:id ----
router.patch(
  '/:id',
  validate({
    name: {
      required: false,
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    destinations: {
      required: false,
      type: 'array',
      minItems: 1,
    },
    status: {
      required: false,
      type: 'string',
      enum: ['PLANNING', 'ONGOING', 'COMPLETED'],
      messages: { enum: 'Status must be one of: PLANNING, ONGOING, COMPLETED' },
    },
    // start_date and end_date can be a YYYY-MM-DD string OR explicitly null (to clear) (T-029)
    start_date: {
      required: false,
      nullable: true,
      type: 'dateString',
      messages: {
        type: 'Start date must be a valid date in YYYY-MM-DD format',
      },
    },
    end_date: {
      required: false,
      nullable: true,
      type: 'dateString',
      messages: {
        type: 'End date must be a valid date in YYYY-MM-DD format',
      },
    },
  }),
  async (req, res, next) => {
    try {
      const trip = await findTripById(req.params.id);

      if (!trip) {
        return res.status(404).json({
          error: { message: 'Trip not found', code: 'NOT_FOUND' },
        });
      }

      if (trip.user_id !== req.user.id) {
        return res.status(403).json({
          error: { message: 'You do not have access to this trip', code: 'FORBIDDEN' },
        });
      }

      const UPDATABLE_FIELDS = ['name', 'destinations', 'status', 'start_date', 'end_date'];
      const updates = {};
      for (const field of UPDATABLE_FIELDS) {
        // Include the field if it was explicitly provided (including null to clear)
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: {
            message: 'No updatable fields provided',
            code: 'NO_UPDATABLE_FIELDS',
          },
        });
      }

      // Cross-field date validation: end_date >= start_date (T-029)
      // Uses merged values (provided value OR existing DB value) for the comparison
      const mergedStartDate =
        Object.prototype.hasOwnProperty.call(req.body, 'start_date')
          ? req.body.start_date
          : trip.start_date;
      const mergedEndDate =
        Object.prototype.hasOwnProperty.call(req.body, 'end_date')
          ? req.body.end_date
          : trip.end_date;

      if (mergedStartDate && mergedEndDate && mergedEndDate < mergedStartDate) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            fields: {
              end_date: 'End date must be on or after start date',
            },
          },
        });
      }

      const updated = await updateTrip(req.params.id, updates);
      return res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ---- DELETE /api/v1/trips/:id ----
router.delete('/:id', async (req, res, next) => {
  try {
    const trip = await findTripById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        error: { message: 'Trip not found', code: 'NOT_FOUND' },
      });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You do not have access to this trip', code: 'FORBIDDEN' },
      });
    }

    await deleteTrip(req.params.id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
