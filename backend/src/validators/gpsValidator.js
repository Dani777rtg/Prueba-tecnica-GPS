/**
 * Validates POST /gps payload.
 * Returns { ok: true, data } or { ok: false, message }.
 */
export function validateGpsPayload(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: 'El cuerpo de la petición debe ser un objeto JSON' };
  }

  const { vehicle_id, lat, lng, timestamp } = body;

  if (vehicle_id === undefined || vehicle_id === null) {
    return { ok: false, message: 'Falta el campo obligatorio: vehicle_id' };
  }
  if (typeof vehicle_id !== 'string' || vehicle_id.trim() === '') {
    return { ok: false, message: 'vehicle_id debe ser un string no vacío' };
  }

  if (lat === undefined || lat === null) {
    return { ok: false, message: 'Falta el campo obligatorio: lat' };
  }
  if (typeof lat !== 'number' || Number.isNaN(lat)) {
    return { ok: false, message: 'lat debe ser un número' };
  }
  if (lat < -90 || lat > 90) {
    return { ok: false, message: 'lat debe estar entre -90 y 90' };
  }

  if (lng === undefined || lng === null) {
    return { ok: false, message: 'Falta el campo obligatorio: lng' };
  }
  if (typeof lng !== 'number' || Number.isNaN(lng)) {
    return { ok: false, message: 'lng debe ser un número' };
  }
  if (lng < -180 || lng > 180) {
    return { ok: false, message: 'lng debe estar entre -180 y 180' };
  }

  if (timestamp === undefined || timestamp === null) {
    return { ok: false, message: 'Falta el campo obligatorio: timestamp' };
  }
  if (typeof timestamp !== 'string') {
    return { ok: false, message: 'timestamp debe ser un string en formato ISO 8601' };
  }

  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return { ok: false, message: 'timestamp debe ser una fecha/hora válida en formato ISO 8601' };
  }

  // Reject clearly non-ISO strings that Date.parse still accepts loosely (e.g. "06/01/2025")
  const isoLike =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(timestamp);
  if (!isoLike) {
    return {
      ok: false,
      message: 'timestamp debe ser una fecha/hora válida en formato ISO 8601',
    };
  }

  return {
    ok: true,
    data: {
      vehicle_id: vehicle_id.trim(),
      lat,
      lng,
      timestamp: new Date(parsed).toISOString(),
    },
  };
}
