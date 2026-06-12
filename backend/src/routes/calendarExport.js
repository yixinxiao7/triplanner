/**
 * calendarExport.js — Google Calendar export endpoint (T-343).
 * Mounted at /api/v1/trips/:tripId/export.
 *
 * POST /google-calendar
 *   Exports the trip's flights, stays, activities, and land travels to a
 *   dedicated Google calendar named after the trip. Re-export deletes the
 *   previously created calendar and recreates it (no duplicates).
 *
 *   409 GOOGLE_CALENDAR_AUTH_REQUIRED — the user hasn't granted the calendar
 *   scope (or the grant was revoked). The frontend should fetch
 *   GET /auth/google/calendar/url and redirect the browser to it.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import {
  findTripById,
  getGoogleCalendarId,
  setGoogleCalendarId,
} from '../models/tripModel.js';
import {
  getGoogleCalendarTokens,
  saveGoogleCalendarTokens,
  clearGoogleCalendarTokens,
} from '../models/userModel.js';
import { listFlightsByTrip } from '../models/flightModel.js';
import { listStaysByTrip } from '../models/stayModel.js';
import { listActivitiesByTrip } from '../models/activityModel.js';
import { listLandTravelsByTrip } from '../models/landTravelModel.js';
import {
  isGoogleCalendarConfigured,
  exportTripToCalendar,
  isAuthRevokedError,
  isInsufficientScopeError,
  isApiNotEnabledError,
} from '../services/googleCalendarService.js';

// mergeParams so we can access :tripId from the parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

router.param('tripId', uuidParamHandler);

// ---- POST /api/v1/trips/:tripId/export/google-calendar ----
router.post('/google-calendar', async (req, res, next) => {
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

    if (!isGoogleCalendarConfigured()) {
      return res.status(503).json({
        error: {
          message: 'Google Calendar export is not available.',
          code: 'GOOGLE_CALENDAR_UNAVAILABLE',
        },
      });
    }

    const tokens = await getGoogleCalendarTokens(req.user.id);
    if (!tokens?.google_calendar_refresh_token) {
      return res.status(409).json({
        error: {
          message: 'Google Calendar access has not been granted.',
          code: 'GOOGLE_CALENDAR_AUTH_REQUIRED',
        },
      });
    }

    const [flights, stays, activities, landTravels] = await Promise.all([
      listFlightsByTrip(req.params.tripId),
      listStaysByTrip(req.params.tripId),
      listActivitiesByTrip(req.params.tripId),
      listLandTravelsByTrip(req.params.tripId),
    ]);

    const existingCalendarId = await getGoogleCalendarId(req.params.tripId);

    let result;
    try {
      result = await exportTripToCalendar({
        tokens,
        existingCalendarId,
        tripName: trip.name,
        data: { flights, stays, activities, landTravels },
        onTokensRefreshed: (refreshed) =>
          saveGoogleCalendarTokens(req.user.id, refreshed),
      });
    } catch (err) {
      if (isAuthRevokedError(err) || isInsufficientScopeError(err)) {
        // Grant revoked, or the calendar permission was unchecked on Google's
        // granular consent screen — clear stale tokens so the frontend
        // restarts the consent flow.
        await clearGoogleCalendarTokens(req.user.id);
        return res.status(409).json({
          error: {
            message: 'Google Calendar access has expired. Please reconnect.',
            code: 'GOOGLE_CALENDAR_AUTH_REQUIRED',
          },
        });
      }

      // App-configuration problem (bug-044): the Calendar API is disabled in
      // the OAuth client's Google Cloud project. Surface an actionable message.
      if (isApiNotEnabledError(err)) {
        console.error('[GoogleCalendarExport] Calendar API disabled:', err.message);
        return res.status(502).json({
          error: {
            message:
              'The Google Calendar API is disabled in this app’s Google Cloud project. Enable it in Google Cloud Console, wait a few minutes, and try again.',
            code: 'GOOGLE_CALENDAR_API_DISABLED',
          },
        });
      }

      // Any other Google-side failure: googleapis errors carry their own
      // `status`, which errorHandler would otherwise pass through verbatim
      // (a Google 403 masquerading as OUR FORBIDDEN — bug-044). Map to 502.
      const googleStatus = err?.status ?? err?.code;
      if (typeof googleStatus === 'number') {
        console.error('[GoogleCalendarExport] Google API error:', err.message);
        return res.status(502).json({
          error: {
            message: 'Google Calendar rejected the export. Please try again.',
            code: 'GOOGLE_CALENDAR_API_ERROR',
          },
        });
      }

      throw err;
    }

    await setGoogleCalendarId(req.params.tripId, result.calendarId);

    return res.status(200).json({
      data: {
        calendar_id: result.calendarId,
        calendar_name: trip.name,
        events_created: result.eventsCreated,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
