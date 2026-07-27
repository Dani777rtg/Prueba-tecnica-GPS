import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  deleteVehicle,
} from '../services/vehicleService.js';
import { publish } from '../events/bus.js';
import { validateVehicleIdParam } from '../middleware/validate.js';

const router = Router();

router.get('/vehicles', async (_req, res) => {
  try {
    const vehicles = await getVehicles();
    return res.status(200).json(vehicles);
  } catch (error) {
    console.error('GET /vehicles error:', error);
    return res.status(500).json({ error: 'Error interno al consultar vehículos' });
  }
});

router.get('/vehicles/:id', validateVehicleIdParam, async (req, res) => {
  try {
    const vehicle = await getVehicleById(req.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'vehículo no encontrado' });
    }
    return res.status(200).json(vehicle);
  } catch (error) {
    console.error('GET /vehicles/:id error:', error);
    return res.status(500).json({ error: 'Error interno al consultar el vehículo' });
  }
});

router.delete('/vehicles/:id', validateVehicleIdParam, async (req, res) => {
  try {
    const deleted = await deleteVehicle(req.vehicleId);
    if (!deleted) {
      return res.status(404).json({ error: 'vehículo no encontrado' });
    }
    publish({ type: 'delete', vehicle_id: req.vehicleId });
    return res.status(204).send();
  } catch (error) {
    console.error('DELETE /vehicles/:id error:', error);
    return res.status(500).json({ error: 'Error interno al eliminar el vehículo' });
  }
});

export default router;
