import { validateGpsPayload } from '../src/validators/gpsValidator.js';

describe('validateGpsPayload', () => {
  const valid = {
    vehicle_id: 'VH-001',
    lat: 4.711,
    lng: -74.0721,
    timestamp: '2025-06-01T10:00:00Z',
  };

  test('accepts a valid payload', () => {
    const result = validateGpsPayload(valid);
    expect(result.ok).toBe(true);
    expect(result.data.vehicle_id).toBe('VH-001');
  });

  test('rejects missing vehicle_id', () => {
    const { vehicle_id, ...rest } = valid;
    const result = validateGpsPayload(rest);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/vehicle_id/i);
  });

  test('rejects empty vehicle_id', () => {
    const result = validateGpsPayload({ ...valid, vehicle_id: '  ' });
    expect(result.ok).toBe(false);
  });

  test('rejects lat out of range', () => {
    const result = validateGpsPayload({ ...valid, lat: 95 });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/lat/i);
  });

  test('rejects lng out of range', () => {
    const result = validateGpsPayload({ ...valid, lng: -200 });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/lng/i);
  });

  test('rejects invalid timestamp', () => {
    const result = validateGpsPayload({ ...valid, timestamp: 'not-a-date' });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/timestamp/i);
  });

  test('rejects non-ISO timestamp', () => {
    const result = validateGpsPayload({ ...valid, timestamp: '06/01/2025' });
    expect(result.ok).toBe(false);
  });
});
