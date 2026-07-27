import { verifyAccessToken } from '../services/authService.js';

function extractBearer(req) {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  return null;
}

function extractQueryToken(req) {
  // Only for SSE: EventSource cannot set Authorization headers
  const path = req.path || '';
  const url = req.originalUrl || '';
  if (path !== '/events' && !url.startsWith('/events')) {
    return null;
  }
  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }
  return null;
}

/**
 * Requires a valid JWT (Authorization: Bearer <token>).
 * For GET /events, also accepts ?token= for EventSource clients.
 */
export function requireAuth(req, res, next) {
  const token = extractBearer(req) || extractQueryToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autorizado: falta token Bearer' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}
