import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Centralized configuration — fail fast if secrets are missing in production.
 */
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 3001,
  databaseUrl: required('DATABASE_URL'),
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    (process.env.DATABASE_URL || '').includes('render.com'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        if (isProduction) {
          throw new Error('JWT_SECRET is required in production');
        }
        return 'dev-only-jwt-secret-change-me-32chars!!';
      }
      if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
      }
      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@fleet.local',
    password: process.env.ADMIN_PASSWORD || 'FleetAdmin123!',
  },
};
