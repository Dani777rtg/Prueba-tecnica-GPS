import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';

const SALT_ROUNDS = 12;

export async function ensureAdminUser() {
  const email = config.admin.email.toLowerCase();
  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rowCount > 0) return;

  const passwordHash = await bcrypt.hash(config.admin.password, SALT_ROUNDS);
  await query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
    [email, passwordHash, 'admin'],
  );
  console.log(`Admin user seeded: ${email}`);
}

export async function authenticateUser(email, password) {
  const result = await query(
    `SELECT id, email, password_hash, role FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return null;
  }

  const token = jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      issuer: 'fleet-gps-api',
      audience: 'fleet-gps-clients',
    },
  );

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: config.jwt.expiresIn,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'fleet-gps-api',
    audience: 'fleet-gps-clients',
  });
}
