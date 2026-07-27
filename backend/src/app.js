import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { applySecurity } from './middleware/security.js';
import { requireAuth } from './middleware/auth.js';
import { query } from './db.js';
import authRouter from './routes/auth.js';
import gpsRouter from './routes/gps.js';
import vehiclesRouter from './routes/vehicles.js';
import eventsRouter from './routes/events.js';

export function createApp() {
  const app = express();

  applySecurity(app);

  const corsOrigin = config.corsOrigin;
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  // Public
  app.get('/health', async (_req, res) => {
    try {
      await query('SELECT 1');
      return res.status(200).json({ status: 'ok', db: 'up' });
    } catch {
      return res.status(503).json({ status: 'degraded', db: 'down' });
    }
  });

  app.use(authRouter);

  // Protected API surface
  app.use(requireAuth, gpsRouter);
  app.use(requireAuth, vehiclesRouter);
  app.use(requireAuth, eventsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload demasiado grande' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}
