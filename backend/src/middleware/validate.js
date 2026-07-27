import { parseGpsIngestDto } from '../dto/gpsIngest.dto.js';
import { parseVehicleIdParam } from '../dto/vehicleId.dto.js';

/**
 * Validates POST /gps body into req.dto (GpsIngestDto).
 */
export function validateGpsIngest(req, res, next) {
  const result = parseGpsIngestDto(req.body);
  if (!result.ok) {
    return res.status(400).json({ error: result.message });
  }
  req.dto = result.data;
  return next();
}

/**
 * Validates :id route param into req.vehicleId.
 */
export function validateVehicleIdParam(req, res, next) {
  const result = parseVehicleIdParam(req.params.id);
  if (!result.ok) {
    return res.status(400).json({ error: result.message });
  }
  req.vehicleId = result.id;
  return next();
}
