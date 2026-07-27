import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from '../config.js';

/**
 * Security + observability middleware stack.
 */
export function applySecurity(app) {
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    morgan(config.isProduction ? 'combined' : 'dev', {
      skip: (req) => req.path === '/health',
    }),
  );

  const gpsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes a /gps. Intenta de nuevo en un minuto.' },
  });

  app.use('/gps', gpsLimiter);

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
  });

  app.use(apiLimiter);
}
