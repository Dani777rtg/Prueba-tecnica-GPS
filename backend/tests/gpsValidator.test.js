import { parseGpsIngestDto } from '../src/dto/gpsIngest.dto.js';
import { parseVehicleIdParam } from '../src/dto/vehicleId.dto.js';

describe('parseGpsIngestDto', () => {
  const valid = {
    vehicle_id: 'VH-001',
    lat: 4.711,
    lng: -74.0721,
    timestamp: '2025-06-01T10:00:00Z',
  };

  test('accepts a valid payload', () => {
    const result = parseGpsIngestDto(valid);
    expect(result.ok).toBe(true);
    expect(result.data.vehicle_id).toBe('VH-001');
  });

  test('rejects missing vehicle_id', () => {
    const { vehicle_id, ...rest } = valid;
    const result = parseGpsIngestDto(rest);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/vehicle_id/i);
  });

  test('rejects empty vehicle_id', () => {
    const result = parseGpsIngestDto({ ...valid, vehicle_id: '  ' });
    expect(result.ok).toBe(false);
  });

  test('rejects unsafe vehicle_id characters', () => {
    const result = parseGpsIngestDto({ ...valid, vehicle_id: '../etc/passwd' });
    expect(result.ok).toBe(false);
  });

  test('rejects unknown fields (strict DTO)', () => {
    const result = parseGpsIngestDto({ ...valid, admin: true });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/no permitidos/i);
  });

  test('rejects lat out of range', () => {
    const result = parseGpsIngestDto({ ...valid, lat: 95 });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/lat/i);
  });

  test('rejects lng out of range', () => {
    const result = parseGpsIngestDto({ ...valid, lng: -200 });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/lng/i);
  });

  test('rejects invalid timestamp', () => {
    const result = parseGpsIngestDto({ ...valid, timestamp: 'not-a-date' });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/timestamp/i);
  });

  test('rejects non-ISO timestamp', () => {
    const result = parseGpsIngestDto({ ...valid, timestamp: '06/01/2025' });
    expect(result.ok).toBe(false);
  });
});

describe('parseVehicleIdParam', () => {
  test('accepts valid id', () => {
    expect(parseVehicleIdParam('VH-001').ok).toBe(true);
  });

  test('rejects path traversal style id', () => {
    expect(parseVehicleIdParam('../x').ok).toBe(false);
  });
});
