const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const TOKEN_KEY = 'fleet_gps_token';
const UNAUTH_EVENT = 'fleet:unauthorized';

export function getApiUrl() {
  return API_URL;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function notifyUnauthorized() {
  clearToken();
  window.dispatchEvent(new Event(UNAUTH_EVENT));
}

export function onUnauthorized(handler) {
  window.addEventListener(UNAUTH_EVENT, handler);
  return () => window.removeEventListener(UNAUTH_EVENT, handler);
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Login falló (${response.status})`);
  }

  setToken(body.access_token);
  return body;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    notifyUnauthorized();
    return null;
  }
  if (!response.ok) {
    throw new Error(`No se pudo validar la sesión (${response.status})`);
  }
  return response.json();
}

export async function fetchVehicles() {
  const response = await fetch(`${API_URL}/vehicles`, {
    headers: authHeaders(),
  });
  if (response.status === 401) {
    notifyUnauthorized();
    throw new Error('Sesión expirada. Inicia sesión de nuevo.');
  }
  if (!response.ok) {
    throw new Error(`GET /vehicles falló (${response.status})`);
  }
  return response.json();
}

export async function deleteVehicle(id) {
  const response = await fetch(`${API_URL}/vehicles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (response.status === 401) {
    notifyUnauthorized();
    throw new Error('Sesión expirada. Inicia sesión de nuevo.');
  }
  if (response.status === 404) {
    throw new Error('Vehículo no encontrado');
  }
  if (!response.ok && response.status !== 204) {
    throw new Error(`DELETE falló (${response.status})`);
  }
}

export function subscribeVehicles(onData, onError) {
  const token = getToken();
  if (!token) {
    onError?.(new Error('Sin token'));
    return () => {};
  }

  const url = `${API_URL}/events?token=${encodeURIComponent(token)}`;
  const source = new EventSource(url);

  source.addEventListener('vehicles', (event) => {
    try {
      const data = JSON.parse(event.data);
      onData(data);
    } catch (err) {
      onError?.(err);
    }
  });

  source.onerror = () => {
    // EventSource doesn't expose status; fall back to polling which will detect 401
    onError?.(new Error('SSE desconectado'));
  };

  return () => source.close();
}
