import { computeStatus, STATUS } from '../src/services/statusService.js';

function point(lat, lng, iso) {
  return { lat, lng, recorded_at: iso };
}

describe('computeStatus', () => {
  const now = new Date('2025-06-01T10:05:00Z');

  test('Sin señal when last point older than 2 minutes', () => {
    const points = [point(4.71, -74.07, '2025-06-01T10:02:00Z')];
    expect(computeStatus(points, now)).toBe(STATUS.NO_SIGNAL);
  });

  test('Detenido with a single recent point', () => {
    const points = [point(4.71, -74.07, '2025-06-01T10:04:30Z')];
    expect(computeStatus(points, now)).toBe(STATUS.STOPPED);
  });

  test('Detenido when same coordinates for more than 1 minute', () => {
    const points = [
      point(4.71, -74.07, '2025-06-01T10:04:50Z'),
      point(4.71, -74.07, '2025-06-01T10:03:40Z'),
      point(4.71, -74.07, '2025-06-01T10:02:30Z'),
    ];
    expect(computeStatus(points, now)).toBe(STATUS.STOPPED);
  });

  test('En movimiento when coordinates change within last 60 seconds', () => {
    const points = [
      point(4.712, -74.071, '2025-06-01T10:04:50Z'),
      point(4.711, -74.072, '2025-06-01T10:04:20Z'),
    ];
    expect(computeStatus(points, now)).toBe(STATUS.MOVING);
  });

  test('empty history is Sin señal', () => {
    expect(computeStatus([], now)).toBe(STATUS.NO_SIGNAL);
  });
});
