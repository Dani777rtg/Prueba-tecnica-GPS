/**
 * GPS ingest DTO — only these fields are accepted (strict allowlist).
 * Controllers never read req.body directly after this parse.
 */
const ALLOWED_KEYS = new Set(['vehicle_id', 'lat', 'lng', 'timestamp']);
const VEHICLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * @typedef {object} GpsIngestDto
 * @property {string} vehicle_id
 * @property {number} lat
 * @property {number} lng
 * @property {string} timestamp ISO-8601 normalized
 */

/**
 * Parses and validates a raw request body into a GpsIngestDto.
 * @returns {{ ok: true, data: GpsIngestDto } | { ok: false, message: string }}
 */
export function parseGpsIngestDto(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: 'El cuerpo de la petición debe ser un objeto JSON' };
  }

  const unknown = Object.keys(body).filter((key) => !ALLOWED_KEYS.has(key));
  if (unknown.length > 0) {
    return {
      ok: false,
      message: `Campos no permitidos: ${unknown.join(', ')}`,
    };
  }

  const { vehicle_id, lat, lng, timestamp } = body;

  if (vehicle_id === undefined || vehicle_id === null) {
    return { ok: false, message: 'Falta el campo obligatorio: vehicle_id' };
  }
  if (typeof vehicle_id !== 'string' || vehicle_id.trim() === '') {
    return { ok: false, message: 'vehicle_id debe ser un string no vacío' };
  }

  const normalizedId = vehicle_id.trim();
  if (!VEHICLE_ID_PATTERN.test(normalizedId)) {
    return {
      ok: false,
      message:
        'vehicle_id debe tener 1–64 caracteres alfanuméricos (permite _ y -)',
    };
  }

  if (lat === undefined || lat === null) {
    return { ok: false, message: 'Falta el campo obligatorio: lat' };
  }
  if (typeof lat !== 'number' || Number.isNaN(lat) || !Number.isFinite(lat)) {
    return { ok: false, message: 'lat debe ser un número' };
  }
  if (lat < -90 || lat > 90) {
    return { ok: false, message: 'lat debe estar entre -90 y 90' };
  }

  if (lng === undefined || lng === null) {
    return { ok: false, message: 'Falta el campo obligatorio: lng' };
  }
  if (typeof lng !== 'number' || Number.isNaN(lng) || !Number.isFinite(lng)) {
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
  if (Number.isNaN(parsed) || !ISO_8601.test(timestamp)) {
    return {
      ok: false,
      message: 'timestamp debe ser una fecha/hora válida en formato ISO 8601',
    };
  }

  /** @type {GpsIngestDto} */
  const data = {
    vehicle_id: normalizedId,
    lat,
    lng,
    timestamp: new Date(parsed).toISOString(),
  };

  return { ok: true, data };
}

/** @deprecated Use parseGpsIngestDto — kept for compatibility with existing tests */
export function validateGpsPayload(body) {
  return parseGpsIngestDto(body);
}
