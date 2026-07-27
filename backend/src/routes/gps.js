import { Router } from 'express';
import { validateGpsIngest } from '../middleware/validate.js';
import { ingestGps } from '../services/vehicleService.js';
import { publish } from '../events/bus.js';

const router = Router();

router.post('/gps', validateGpsIngest, async (req, res) => {
  try {
    const point = await ingestGps(req.dto);
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
