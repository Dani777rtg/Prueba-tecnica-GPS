import { Router } from 'express';
import { getVehicles } from '../services/vehicleService.js';
import { subscribe } from '../events/bus.js';

const router = Router();
const HEARTBEAT_MS = 5000;

router.get('/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const sendSnapshot = async () => {
    try {
      const vehicles = await getVehicles();
      res.write(`event: vehicles\ndata: ${JSON.stringify(vehicles)}\n\n`);
    } catch (error) {
      console.error('SSE snapshot error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'snapshot_failed' })}\n\n`);
    }
  };

  // Initial snapshot
  await sendSnapshot();

  const onEvent = () => {
    sendSnapshot();
  };
  const unsubscribe = subscribe(onEvent);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
    // Also refresh so status timers (Sin señal / Detenido) advance without new GPS
    sendSnapshot();
  }, HEARTBEAT_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

export default router;
