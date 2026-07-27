import { API_URL } from '../config/env.js';
import { getToken } from '../auth/tokenStorage.js';
import { apiJson, apiRequest } from './client.js';

export async function fetchVehicles() {
  return apiJson('/vehicles');
}

export async function deleteVehicle(id) {
  const response = await apiRequest(`/vehicles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (response.status === 404) {
    throw new Error('Vehículo no encontrado');
  }
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `DELETE falló (${response.status})`);
  }
}

/**
 * SSE subscription. EventSource cannot send Authorization headers,
 * so the JWT goes in the query string (backend only accepts it on /events).
 */
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
      onData(JSON.parse(event.data));
    } catch (err) {
      onError?.(err);
    }
  });

  source.onerror = () => {
    onError?.(new Error('SSE desconectado'));
  };

  return () => source.close();
}
