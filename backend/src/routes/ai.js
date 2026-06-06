import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import GeminiService from '../services/geminiService.js';

/**
 * ai.js — AI-assisted routes (T-332). Mounted at /api/v1/ai.
 *
 * POST /ai/import/parse — stateless. Accepts a single PDF (`file` field), sends it
 * to Gemini, and returns the parsed itinerary contract { data: <contract JSON> }.
 * Nothing is written to the database here; the parsed payload is committed later
 * via POST /trips/import after the user reviews it.
 */

const router = Router();

router.use(authenticate);

// 10 MB ceiling, in-memory only (no PDF ever touches disk).
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      // Signal a non-PDF upload; surfaced as a 400 in the route handler below.
      const err = new Error('Only PDF files are accepted');
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  },
});

/**
 * Lazily construct the GeminiService so the module imports cleanly even when
 * GEMINI_API_KEY is unset (e.g., in tests that mock the service).
 */
function getGeminiService() {
  return new GeminiService(process.env.GEMINI_API_KEY);
}

// ---- POST /api/v1/ai/import/parse ----
router.post('/import/parse', (req, res, next) => {
  upload.single('file')(req, res, async (uploadErr) => {
    // ---- Multer / fileFilter errors → 400 ----
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            message: 'PDF must be 10MB or smaller',
            code: 'FILE_TOO_LARGE',
          },
        });
      }
      if (uploadErr.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: {
            message: 'Only PDF files are accepted',
            code: 'INVALID_FILE_TYPE',
          },
        });
      }
      return res.status(400).json({
        error: {
          message: 'Could not read the uploaded file',
          code: 'UPLOAD_ERROR',
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'A PDF file is required',
          code: 'FILE_REQUIRED',
        },
      });
    }

    try {
      const gemini = getGeminiService();
      const data = await gemini.parseItineraryFromPdf(req.file.buffer, req.file.mimetype);
      return res.status(200).json({ data });
    } catch (err) {
      // geminiService throws a generic { status:502, code:'EXTERNAL_SERVICE_ERROR' }.
      next(err);
    }
  });
});

export default router;
