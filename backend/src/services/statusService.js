export const STATUS = {
  MOVING: 'En movimiento',
  STOPPED: 'Detenido',
  NO_SIGNAL: 'Sin señal',
};

const ONE_MINUTE_MS = 60 * 1000;
const TWO_MINUTES_MS = 2 * 60 * 1000;

/**
 * Computes vehicle status from GPS history using payload timestamps.
 *
 * Priority:
 * 1. Sin señal — last point older than 2 minutes
 * 2. Detenido — same lat/lng for more than 1 minute (or single point < 2 min)
 * 3. En movimiento — different coordinates within the last 60 seconds
 *
 * @param {Array<{ lat: number, lng: number, recorded_at: Date|string }>} points
 *   Points ordered by recorded_at DESC (newest first).
 * @param {Date} [now=new Date()]
 */
export function computeStatus(points, now = new Date()) {
  if (!points || points.length === 0) {
    return STATUS.NO_SIGNAL;
  }

  const nowMs = now.getTime();
  const newest = normalizePoint(points[0]);
  const ageMs = nowMs - newest.recordedAtMs;

  if (ageMs > TWO_MINUTES_MS) {
    return STATUS.NO_SIGNAL;
  }

  if (points.length === 1) {
    return STATUS.STOPPED;
  }

  // Find how long the vehicle has been at the current exact coordinates
  let sameCoordSinceMs = newest.recordedAtMs;
  for (let i = 1; i < points.length; i += 1) {
    const p = normalizePoint(points[i]);
    if (p.lat === newest.lat && p.lng === newest.lng) {
      sameCoordSinceMs = p.recordedAtMs;
    } else {
      break;
    }
  }

  const stationaryForMs = newest.recordedAtMs - sameCoordSinceMs;
  if (stationaryForMs > ONE_MINUTE_MS) {
    return STATUS.STOPPED;
  }

  // Different coordinates received within the last 60 seconds?
  const windowStart = nowMs - ONE_MINUTE_MS;
  const pointsInWindow = points
    .map(normalizePoint)
    .filter((p) => p.recordedAtMs >= windowStart);

  if (pointsInWindow.length >= 2) {
    const first = pointsInWindow[0];
    const hasDifferent = pointsInWindow.some(
      (p) => p.lat !== first.lat || p.lng !== first.lng,
    );
    if (hasDifferent) {
      return STATUS.MOVING;
    }
  }

  // Same coords but not yet > 1 minute stationary
  return STATUS.STOPPED;
}

function normalizePoint(point) {
  const recordedAtMs = new Date(point.recorded_at).getTime();
  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
    recordedAtMs,
  };
}
