/**
 * Login DTO — strict allowlist.
 */
const ALLOWED = new Set(['email', 'password']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @returns {{ ok: true, data: { email: string, password: string } } | { ok: false, message: string }}
 */
export function parseLoginDto(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: 'El cuerpo de la petición debe ser un objeto JSON' };
  }

  const unknown = Object.keys(body).filter((k) => !ALLOWED.has(k));
  if (unknown.length > 0) {
    return { ok: false, message: `Campos no permitidos: ${unknown.join(', ')}` };
  }

  const { email, password } = body;

  if (email === undefined || email === null) {
    return { ok: false, message: 'Falta el campo obligatorio: email' };
  }
  if (typeof email !== 'string' || email.trim() === '') {
    return { ok: false, message: 'email debe ser un string no vacío' };
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { ok: false, message: 'email tiene un formato inválido' };
  }

  if (password === undefined || password === null) {
    return { ok: false, message: 'Falta el campo obligatorio: password' };
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { ok: false, message: 'password debe tener entre 8 y 128 caracteres' };
  }

  return { ok: true, data: { email: normalizedEmail, password } };
}
