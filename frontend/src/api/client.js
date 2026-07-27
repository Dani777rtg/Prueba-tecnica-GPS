import { API_URL } from '../config/env.js';
import { getToken, notifyUnauthorized } from '../auth/tokenStorage.js';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Shared fetch wrapper: JSON, auth header, 401 handling.
 */
export async function apiRequest(path, options = {}) {
  const { auth = true, headers: extraHeaders, ...rest } = options;
  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
  });

  if (response.status === 401 && auth) {
    notifyUnauthorized();
    throw new ApiError('Sesión expirada. Inicia sesión de nuevo.', 401);
  }

  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiRequest(path, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body.error || `Error HTTP ${response.status}`, response.status);
  }

  return body;
}

export { ApiError };
