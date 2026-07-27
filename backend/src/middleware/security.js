import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Security middleware stack for the Express app.
 * Keep this lean and explainable in the sustentación video.
 */
export function applySecurity(app) {
  // Render / reverse proxies: needed so rate-limit sees the real client IP
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // SPA on another origin (Render static) consumes this API
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Protect ingest endpoint from abuse / accidental floods
  const gpsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes a /gps. Intenta de nuevo en un minuto.' },
  });

  app.use('/gps', gpsLimiter);
}
