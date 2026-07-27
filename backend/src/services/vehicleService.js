import { query } from '../db.js';
import { computeStatus } from './statusService.js';

/**
 * Inserts a GPS point. Creates the vehicle if it does not exist.
 */
export async function ingestGps({ vehicle_id, lat, lng, timestamp }) {
  await query(
    `INSERT INTO vehicles (id)
     VALUES ($1)
     ON CONFLICT (id) DO NOTHING`,
    [vehicle_id],
  );

  const result = await query(
    `INSERT INTO gps_points (vehicle_id, lat, lng, recorded_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, vehicle_id, lat, lng, recorded_at`,
    [vehicle_id, lat, lng, timestamp],
  );

  return result.rows[0];
}

/**
 * Returns current state for all vehicles (or one if vehicleId provided).
 */
export async function getVehicles(vehicleId = null) {
  const vehiclesResult = vehicleId
    ? await query(`SELECT id FROM vehicles WHERE id = $1`, [vehicleId])
    : await query(`SELECT id FROM vehicles ORDER BY id`);

  if (vehicleId && vehiclesResult.rows.length === 0) {
    return null;
  }

  const vehicles = [];

  for (const row of vehiclesResult.rows) {
    const pointsResult = await query(
      `SELECT lat, lng, recorded_at
       FROM gps_points
       WHERE vehicle_id = $1
       ORDER BY recorded_at DESC
       LIMIT 50`,
      [row.id],
    );

    const points = pointsResult.rows;
    if (points.length === 0) {
      vehicles.push({
        vehicle_id: row.id,
        last_lat: null,
        last_lng: null,
        last_seen: null,
        status: 'Sin señal',
      });
      continue;
    }

    const latest = points[0];
    vehicles.push({
      vehicle_id: row.id,
      last_lat: Number(latest.lat),
      last_lng: Number(latest.lng),
      last_seen: new Date(latest.recorded_at).toISOString(),
      status: computeStatus(points),
    });
  }

  return vehicles;
}

export async function getVehicleById(id) {
  const vehicles = await getVehicles(id);
  if (vehicles === null) return null;
  return vehicles[0] ?? null;
}

export async function deleteVehicle(id) {
  const result = await query(`DELETE FROM vehicles WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount > 0;
}
