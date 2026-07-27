import { Router } from 'express';
import { validateGpsPayload } from '../validators/gpsValidator.js';
import { ingestGps } from '../services/vehicleService.js';
import { publish } from '../events/bus.js';

const router = Router();

router.post('/gps', async (req, res) => {
  const validation = validateGpsPayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.message });
  }

  try {
    const point = await ingestGps(validation.data);
    publish({ type: 'gps', vehicle_id: point.vehicle_id });
    return res.status(201).json({
      message: 'Coordenada almacenada',
      data: {
        vehicle_id: point.vehicle_id,
        lat: Number(point.lat),
        lng: Number(point.lng),
        timestamp: new Date(point.recorded_at).toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /gps error:', error);
    return res.status(500).json({ error: 'Error interno al almacenar la coordenada' });
  }
});

export default router;
