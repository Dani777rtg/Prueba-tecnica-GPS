import { parseLoginDto } from '../src/dto/login.dto.js';

describe('parseLoginDto', () => {
  test('accepts valid credentials', () => {
    const result = parseLoginDto({
      email: 'Admin@Fleet.Local',
      password: 'FleetAdmin123!',
    });
    expect(result.ok).toBe(true);
    expect(result.data.email).toBe('admin@fleet.local');
  });

  test('rejects short password', () => {
    const result = parseLoginDto({ email: 'a@b.co', password: 'short' });
    expect(result.ok).toBe(false);
  });

  test('rejects unknown fields', () => {
    const result = parseLoginDto({
      email: 'a@b.co',
      password: 'FleetAdmin123!',
      role: 'admin',
    });
    expect(result.ok).toBe(false);
  });

  test('rejects invalid email', () => {
    const result = parseLoginDto({ email: 'not-an-email', password: 'FleetAdmin123!' });
    expect(result.ok).toBe(false);
  });
});
