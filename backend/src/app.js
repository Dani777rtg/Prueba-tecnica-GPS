import express from 'express';
import cors from 'cors';
import gpsRouter from './routes/gps.js';
import vehiclesRouter from './routes/vehicles.js';
import eventsRouter from './routes/events.js';

export function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(gpsRouter);
  app.use(vehiclesRouter);
  app.use(eventsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}
