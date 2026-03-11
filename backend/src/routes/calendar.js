import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import { findTripById } from '../models/tripModel.js';
import { getCalendarEvents } from '../models/calendarModel.js';

// mergeParams so we can access :tripId from the parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

// ---- UUID validation for :tripId (inherited via mergeParams) ----
router.param('tripId', uuidParamHandler);

// ---- GET /api/v1/trips/:tripId/calendar ----
router.get('/', async (req, res, next) => {
  try {
    const trip = await findTripById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        error: { message: 'Trip not found.', code: 'NOT_FOUND' },
      });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You do not have access to this trip.', code: 'FORBIDDEN' },
      });
    }

    const events = await getCalendarEvents(req.params.tripId);

    return res.status(200).json({
      data: {
        trip_id: req.params.tripId,
        events,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
