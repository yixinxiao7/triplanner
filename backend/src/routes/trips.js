import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listTripsByUser,
  findTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} from '../models/tripModel.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ---- GET /api/v1/trips ----
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const { trips, total } = await listTripsByUser(req.user.id, page, limit);

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
  }),
  async (req, res, next) => {
    try {
      const { name, destinations } = req.body;

      const trip = await createTrip({
        user_id: req.user.id,
        name,
        destinations,
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

      const UPDATABLE_FIELDS = ['name', 'destinations', 'status'];
      const updates = {};
      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] !== undefined) {
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
